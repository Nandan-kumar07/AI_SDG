const express = require("express");
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres@localhost:5432/sdg_connect";
const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});
const root = __dirname;
const sessionSecret = process.env.SESSION_SECRET || "change-this-session-secret";

app.use(express.json({ limit: "2mb" }));

const aiRequestTimes = new Map();
function limitAiRequests(req, res, next) {
  const now = Date.now();
  const previous = aiRequestTimes.get(req.auth.id) || 0;
  if (now - previous < 15000) return res.status(429).json({ message: "Please wait before requesting another AI task" });
  aiRequestTimes.set(req.auth.id, now);
  next();
}

function loadSeedState() {
  const source = fs.readFileSync(path.join(root, "js", "data.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const collegeId = "college-demo";
  const seed = {
    id: collegeId,
    name: "SDG Campus Demo College",
    joinCode: "CAMPUS001",
    createdAt: new Date().toISOString()
  };
  const classSeed = {
    id: "class-demo-cse",
    collegeId,
    name: "Sustainability & AI - CSE",
    section: "A",
    joinCode: "CLASS001",
    facultyId: "FAC-001",
    createdAt: new Date().toISOString()
  };
  return {
    currentUser: null, userRole: "guest", studentSubPage: "progress", facultySubPage: "student-progress",
    colleges: [seed],
    classes: [classSeed],
    activities: context.window.SDG_DATA.activities || [], submissions: context.window.SDG_DATA.submissions || [],
    students: context.window.SDG_DATA.students || [], faculty: context.window.SDG_DATA.faculty || [], quizzes: context.window.SDG_DATA.quizzes || [],
    studentOngoingTasks: [], chatHistory: [], gameScores: {}, theme: "light", notifications: [], collegeId, classId: classSeed.id
  };
}

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeCollegeState(state) {
  state.colleges = state.colleges || [{ id: "college-demo", name: "SDG Campus Demo College", joinCode: "CAMPUS001", createdAt: new Date().toISOString() }];
  state.classes = state.classes || [{ id: "class-demo-cse", collegeId: state.colleges[0].id, name: "Sustainability & AI - CSE", section: "A", joinCode: "CLASS001", createdAt: new Date().toISOString() }];
  const collegeId = state.collegeId || state.colleges[0].id;
  const classId = state.classId || null;
  state.collegeId = collegeId;
  state.classId = classId;
  state.classes = state.classes.map(item => ({ ...item, collegeId: item.collegeId || collegeId }));
  state.students = (state.students || []).map(user => ({ ...user, collegeId: user.collegeId || collegeId, classId: user.classId || classId }));
  state.faculty = (state.faculty || []).map(user => ({ ...user, collegeId: user.collegeId || collegeId, classId: user.classId || classId }));
  ["activities", "submissions", "quizzes", "studentOngoingTasks"].forEach(collection => {
    state[collection] = (state[collection] || []).map(item => ({ ...item, collegeId: item.collegeId || collegeId, classId: item.classId || classId }));
  });
  return state;
}

function collegeState(state, collegeId, classId) {
  const scoped = normalizeCollegeState({ ...state });
  scoped.collegeId = collegeId;
  scoped.classId = classId || null;
  scoped.students = scoped.students.filter(user => user.collegeId === collegeId);
  scoped.faculty = scoped.faculty.filter(user => user.collegeId === collegeId);
  scoped.classes = scoped.classes.filter(item => item.collegeId === collegeId);
  ["activities", "submissions", "quizzes", "studentOngoingTasks"].forEach(collection => {
    scoped[collection] = scoped[collection].filter(item => item.collegeId === collegeId && (!classId || item.classId === classId));
  });
  scoped.students = scoped.students.filter(user => !classId || user.classId === classId);
  scoped.faculty = scoped.faculty.filter(user => !classId || user.classId === classId);
  return scoped;
}

function findCollege(state, code) {
  return (state.colleges || []).find(college => college.joinCode.toUpperCase() === String(code || "").trim().toUpperCase());
}

function findClass(state, collegeId, code) {
  return (state.classes || []).find(item => item.collegeId === collegeId && item.joinCode.toUpperCase() === String(code || "").trim().toUpperCase());
}

function mergeTenantCollection(currentItems, incomingItems, collegeId) {
  return currentItems.filter(item => item.collegeId !== collegeId).concat(incomingItems.map(item => ({ ...item, collegeId })));
}

function mergeClassCollection(currentItems, incomingItems, collegeId, classId) {
  return currentItems.filter(item => !(item.collegeId === collegeId && item.classId === classId)).concat(incomingItems.map(item => ({ ...item, collegeId, classId })));
}

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, collegeId: user.collegeId || null, classId: user.classId || null, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function authenticate(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return res.status(401).json({ message: "Authentication required" });
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ message: "Invalid session" });
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.id || session.exp < Date.now()) return res.status(401).json({ message: "Session expired" });
    req.auth = session;
    next();
  } catch (_error) { res.status(401).json({ message: "Invalid session" }); }
}

function optionalAuthenticate(req, _res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [payload, signature] = token.split(".");
  if (payload && signature) {
    const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
    if (signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (session.exp >= Date.now()) req.auth = session;
      } catch (_error) { return next(); }
    }
  }
  next();
}

async function readState() {
  const result = await pool.query("SELECT state, revision FROM app_state WHERE id = 1");
  return { ...result.rows[0].state, revision: result.rows[0].revision };
}

async function writeState(state, expectedRevision = null) {
  const revision = Number.isInteger(Number(expectedRevision)) ? Number(expectedRevision) : null;
  const result = revision === null
    ? await pool.query("UPDATE app_state SET state = $1, revision = revision + 1, updated_at = NOW() WHERE id = 1 RETURNING revision", [state])
    : await pool.query("UPDATE app_state SET state = $1, revision = revision + 1, updated_at = NOW() WHERE id = 1 AND revision = $2 RETURNING revision", [state, revision]);
  if (result.rowCount === 0) throw new Error("STATE_CONFLICT");
  return result.rows[0].revision;
}

async function initializeDatabase() {
  const adminPool = new Pool({ connectionString: databaseUrl.replace(/\/[^/?]+(\?.*)?$/, "/postgres$1") });
  try {
    await adminPool.query("CREATE DATABASE sdg_connect");
  } catch (error) {
    if (error.code !== "42P04") throw error;
  } finally {
    await adminPool.end();
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, state JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query("ALTER TABLE app_state ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 0");
  const existing = await pool.query("SELECT id FROM app_state WHERE id = 1");
  if (existing.rowCount === 0) {
    const state = loadSeedState();
    state.students = await Promise.all(state.students.map(async student => ({ ...student, passwordHash: await bcrypt.hash("password123", 10) })));
    state.faculty = await Promise.all(state.faculty.map(async faculty => ({ ...faculty, passwordHash: await bcrypt.hash("password123", 10) })));
    await pool.query("INSERT INTO app_state (id, state, revision) VALUES (1, $1, 0)", [state]);
  } else {
    const state = await readState();
    const normalized = normalizeCollegeState(state);
    await pool.query("UPDATE app_state SET state = $1 WHERE id = 1", [normalized]);
  }
}

app.get("/api/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true, database: "connected" }); }
  catch (_error) { res.status(503).json({ ok: false, database: "unavailable" }); }
});

app.get("/api/state", optionalAuthenticate, async (req, res) => {
  try {
    const state = await readState();
    const activeCollegeId = req.auth?.collegeId || state.collegeId || state.colleges[0].id;
    const activeClassId = req.auth?.classId || state.classId || state.classes.find(item => item.collegeId === activeCollegeId)?.id;
    const scopedState = collegeState(state, activeCollegeId, activeClassId);
    const currentUser = req.auth
      ? [...scopedState.students, ...scopedState.faculty].find(user => user.id === req.auth.id)
      : null;
    res.json({ ...scopedState, currentUser: publicUser(currentUser), userRole: currentUser ? req.auth.role : "guest", students: scopedState.students.map(publicUser), faculty: scopedState.faculty.map(publicUser), college: state.colleges.find(college => college.id === activeCollegeId), activeClass: scopedState.classes.find(item => item.id === activeClassId) });
  } catch (_error) { res.status(500).json({ message: "Could not load application state" }); }
});

app.post("/api/ai/task-suggestion", authenticate, limitAiRequests, async (req, res) => {
  const { student, goals } = req.body || {};
  if (req.auth.role === "student" && student?.id && student.id !== req.auth.id) return res.status(403).json({ message: "Cannot generate a task for another student" });
  if (!student || !Array.isArray(goals)) return res.status(400).json({ message: "Student profile and SDG goals are required" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: "Vision LLM is not configured" });

  const prompt = `Create one personalized campus sustainability task for this student.\nStudent: ${JSON.stringify({
    department: student.department, skills: student.skills || [], interests: student.interests || [], sdgCoverage: student.sdgCoverage || {}
  })}\nSDG catalogue: ${JSON.stringify(goals.map(goal => ({ id: goal.id, name: goal.name, tagline: goal.tagline })))}\nReturn JSON only with: title, goalId, taskType (field_activity or technical_dl_project), points (100-300), difficulty, matchedSkills (array), description, verificationRules, and milestones (array). Choose neglected SDGs when reasonable and make the task achievable on a campus.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 1200,
        temperature: 0.3,
        system: "You are a campus sustainability project designer. Never invent credentials or claim that evidence is verified.",
        messages: [{ role: "user", content: prompt }]
      })
    });
    clearTimeout(timeout);
    if (!response.ok) return res.status(502).json({ message: "Vision LLM task suggestion failed" });
    const result = await response.json();
    const text = (result.content || []).find(item => item.type === "text")?.text || "";
    const task = JSON.parse(text.replace(/^```json\s*/i, "").replace(/\s*```$/i, ""));
    if (!task.title || !Number.isInteger(Number(task.goalId)) || !Array.isArray(task.matchedSkills)) throw new Error("Invalid task response");
    res.json({ task: { ...task, goalId: Number(task.goalId), points: Math.max(100, Math.min(300, Number(task.points) || 150)), isAiGenerated: true, createdBy: "Claude Vision LLM" } });
  } catch (error) {
    console.error("Task suggestion error:", error.message);
    res.status(502).json({ message: "Could not parse Vision LLM task suggestion" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { role, identifier, password, collegeCode, classCode } = req.body || {};
  try {
    const state = await readState();
    const college = collegeCode ? findCollege(state, collegeCode) : state.colleges.find(item => item.id === "college-demo");
    if (!college) return res.status(404).json({ message: "College not found" });
    const collection = (role === "faculty" ? state.faculty : state.students).filter(item => item.collegeId === college.id);
    const user = collection.find(item => role === "faculty"
      ? item.email.toLowerCase() === String(identifier).toLowerCase()
      : item.usn.toLowerCase() === String(identifier).toLowerCase() || item.email.toLowerCase() === String(identifier).toLowerCase());
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash || ""))) return res.status(401).json({ message: "Invalid credentials" });
    const activeClass = classCode
      ? findClass(state, college.id, classCode)
      : state.classes.find(item => item.id === user.classId && item.collegeId === college.id) || null;
    if (classCode && !activeClass) return res.status(404).json({ message: "Class not found. You can join one after logging in." });
    if (role === "student" && activeClass && user.classId && user.classId !== activeClass.id) return res.status(403).json({ message: "This student is not registered in that class" });
    const expectedRevision = state.revision;
    delete state.revision;
    state.currentUser = publicUser(user); state.userRole = role; state.collegeId = college.id; state.classId = activeClass?.id || null; const revision = await writeState(state, expectedRevision); state.revision = revision;
    const scoped = collegeState(state, college.id, activeClass?.id || null);
    res.json({ success: true, token: createSessionToken({ ...user, role, collegeId: college.id, classId: activeClass.id }), user: state.currentUser, college, activeClass, state: { ...scoped, students: scoped.students.map(publicUser), faculty: scoped.faculty.map(publicUser) } });
  } catch (_error) { res.status(500).json({ message: "Login failed" }); }
});

app.post("/api/auth/signup", async (req, res) => {
  const { role, formData, collegeCode, classCode, createCollege } = req.body || {};
  try {
    const state = await readState();
    const isFaculty = role === "faculty";
    let college = findCollege(state, collegeCode);
    if (isFaculty && createCollege) {
      college = { id: `college-${Date.now()}`, name: String(formData.collegeName || "New SDG College").trim(), joinCode: String(formData.joinCode || `SDG${Date.now().toString().slice(-6)}`).trim().toUpperCase(), createdAt: new Date().toISOString() };
      if (state.colleges.some(item => item.joinCode === college.joinCode)) return res.status(409).json({ message: "That college join code already exists" });
      state.colleges.push(college);
    }
    if (!college) return res.status(404).json({ message: "Enter a valid college join code" });
    let activeClass = findClass(state, college.id, classCode);
    if (!activeClass && isFaculty && createCollege && formData.classCode) {
      activeClass = { id: `class-${Date.now()}`, collegeId: college.id, name: String(formData.className || "Sustainability Class").trim(), section: String(formData.classSection || "A").trim(), joinCode: String(formData.classCode || `CLASS${Date.now().toString().slice(-6)}`).trim().toUpperCase(), createdAt: new Date().toISOString() };
      if (state.classes.some(item => item.joinCode === activeClass.joinCode)) return res.status(409).json({ message: "That class join code already exists" });
      state.classes.push(activeClass);
    }
    if (classCode && !activeClass) return res.status(404).json({ message: "Class not found. You can join one after registering." });
    const collection = isFaculty ? state.faculty : state.students;
    const collegeCollection = collection.filter(item => item.collegeId === college.id);
    if (collegeCollection.some(item => item.email.toLowerCase() === String(formData.email).toLowerCase()) || (!isFaculty && collegeCollection.some(item => item.usn.toLowerCase() === String(formData.usn).toLowerCase()))) return res.status(409).json({ message: "An account with these details already exists" });
    const user = isFaculty ? {
      id: `FAC-${Date.now()}`, collegeId: college.id, classId: activeClass?.id || null, name: formData.name, department: formData.department, phone: formData.phone, email: formData.email,
      designation: formData.designation || "Assistant Professor", passwordHash: await bcrypt.hash(formData.password, 10)
    } : {
      id: `STU-${Date.now()}`, collegeId: college.id, classId: activeClass?.id || null, name: formData.name, usn: formData.usn.toUpperCase(), department: formData.department,
      skills: formData.skills ? formData.skills.split(",").map(value => value.trim()).filter(Boolean) : [],
      interests: formData.interests ? formData.interests.split(",").map(value => value.trim()).filter(Boolean) : [], phone: formData.phone,
      email: String(formData.email || `${formData.usn.toLowerCase()}@student.local`).trim(), points: 100, tasksCompletedCount: 0, ongoingTasksCount: 0, avatar: "", sdgCoverage: {}, badges: ["New Changemaker"],
      passwordHash: await bcrypt.hash(formData.password, 10)
    };
    const expectedRevision = state.revision;
    delete state.revision;
    collection.unshift(user); state.currentUser = publicUser(user); state.userRole = role; state.collegeId = college.id; state.classId = activeClass?.id || null; const revision = await writeState(state, expectedRevision); state.revision = revision;
    const scoped = collegeState(state, college.id, activeClass?.id || null);
    res.status(201).json({ success: true, token: createSessionToken({ ...user, role, collegeId: college.id, classId: activeClass?.id || null }), user: state.currentUser, college, activeClass, state: { ...scoped, students: scoped.students.map(publicUser), faculty: scoped.faculty.map(publicUser) } });
  } catch (_error) { res.status(500).json({ message: "Signup failed" }); }
});

app.post("/api/classes", authenticate, async (req, res) => {
  if (req.auth.role !== "faculty") return res.status(403).json({ message: "Only faculty can create classes" });
  try {
    const state = await readState();
    const className = String(req.body?.name || "Sustainability Class").trim();
    const joinCode = String(req.body?.joinCode || `CLASS${Date.now().toString().slice(-6)}`).trim().toUpperCase();
    if (!className || !joinCode) return res.status(400).json({ message: "Class name and join code are required" });
    if (state.classes.some(item => item.collegeId === req.auth.collegeId && item.joinCode === joinCode)) return res.status(409).json({ message: "That class join code already exists" });
    const newClass = { id: `class-${Date.now()}`, collegeId: req.auth.collegeId, name: className, section: String(req.body?.section || "A").trim(), joinCode, facultyId: req.auth.id, createdAt: new Date().toISOString() };
    state.classes.push(newClass);
    const revision = await writeState(state, state.revision);
    res.status(201).json({ success: true, class: newClass, revision });
  } catch (error) {
    res.status(error.message === "STATE_CONFLICT" ? 409 : 500).json({ message: error.message === "STATE_CONFLICT" ? "State changed; refresh and try again" : "Could not create class" });
  }
});

app.post("/api/classes/select", authenticate, async (req, res) => {
  try {
    const state = await readState();
    const selectedClass = state.classes.find(item => item.id === req.body?.classId && item.collegeId === req.auth.collegeId);
    if (!selectedClass) return res.status(404).json({ message: "Class not found" });
    if (req.auth.role === "faculty" && selectedClass.facultyId && selectedClass.facultyId !== req.auth.id) return res.status(403).json({ message: "You do not manage this class" });
    if (req.auth.role === "student" && selectedClass.id !== req.auth.classId) return res.status(403).json({ message: "You are not enrolled in this class" });
    res.json({ success: true, token: createSessionToken({ id: req.auth.id, role: req.auth.role, collegeId: req.auth.collegeId, classId: selectedClass.id }), activeClass: selectedClass });
  } catch (_error) { res.status(500).json({ message: "Could not select class" }); }
});

app.post("/api/classes/join", authenticate, async (req, res) => {
  if (req.auth.role !== "student") return res.status(403).json({ message: "Only students can join classes" });
  try {
    const state = await readState();
    const joinedClass = findClass(state, req.auth.collegeId, req.body?.joinCode);
    if (!joinedClass) return res.status(404).json({ message: "Class join code not found" });
    const student = state.students.find(item => item.id === req.auth.id);
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    student.classId = joinedClass.id;
    const revision = await writeState(state, state.revision);
    res.json({ success: true, token: createSessionToken({ ...req.auth, classId: joinedClass.id }), activeClass: joinedClass, revision });
  } catch (error) {
    res.status(error.message === "STATE_CONFLICT" ? 409 : 500).json({ message: error.message === "STATE_CONFLICT" ? "State changed; try again" : "Could not join class" });
  }
});

app.put("/api/state", authenticate, async (req, res) => {
  try {
    const state = { ...(req.body || {}) }; const expectedRevision = state.revision; delete state.revision;
    if (!Array.isArray(state.students) || !Array.isArray(state.faculty) || !Array.isArray(state.activities) || !Array.isArray(state.submissions) || !Array.isArray(state.quizzes)) {
      return res.status(400).json({ message: "Invalid state payload" });
    }
    const current = await readState();
    if (state.currentUser && state.currentUser.id !== req.auth.id) return res.status(403).json({ message: "Cannot update another user session" });
    if (req.auth.role === "student") {
      state.activities = current.activities;
      state.quizzes = current.quizzes;
      state.faculty = current.faculty;
      state.students = current.students.map(student => student.id === req.auth.id ? (state.students || []).find(candidate => candidate.id === req.auth.id) || student : student);
      state.submissions = [...current.submissions.filter(submission => submission.studentId !== req.auth.id), ...(state.submissions || []).filter(submission => submission.studentId === req.auth.id)];
    }
    const collegeId = req.auth.collegeId;
    const classId = req.auth.classId;
    state.colleges = current.colleges;
    state.classes = current.classes;
    state.students = mergeClassCollection(current.students, state.students, collegeId, classId).map(student => ({ ...student, passwordHash: current.students.find(item => item.id === student.id)?.passwordHash }));
    state.faculty = mergeClassCollection(current.faculty, state.faculty, collegeId, classId).map(faculty => ({ ...faculty, passwordHash: current.faculty.find(item => item.id === faculty.id)?.passwordHash }));
    state.activities = mergeClassCollection(current.activities, state.activities, collegeId, classId);
    state.submissions = mergeClassCollection(current.submissions, state.submissions, collegeId, classId);
    state.quizzes = mergeClassCollection(current.quizzes, state.quizzes, collegeId, classId);
    state.studentOngoingTasks = mergeClassCollection(current.studentOngoingTasks, state.studentOngoingTasks, collegeId, classId);
    const revision = await writeState({ ...current, ...state }, expectedRevision);
    res.json({ success: true, revision });
  } catch (error) {
    if (error.message === "STATE_CONFLICT") return res.status(409).json({ message: "State changed by another user; refresh and try again" });
    res.status(500).json({ message: "Could not save application state" });
  }
});

app.use(express.static(root));
app.use(express.static(path.join(root, "html")));
app.get("/", (_req, res) => res.sendFile(path.join(root, "html", "index.html")));

initializeDatabase().then(() => app.listen(port, () => console.log(`SDG Connect running at http://localhost:${port}`))).catch(error => {
  console.error("Database initialization failed:", error.message); process.exitCode = 1;
});

app.post("/api/classes/join", authenticate, async (req, res) => {
  if (req.auth.role !== "student") return res.status(403).json({ message: "Only students can join classes" });
  try {
    const state = await readState();
    const joinedClass = findClass(state, req.auth.collegeId, req.body?.joinCode);
    if (!joinedClass) return res.status(404).json({ message: "Class join code not found" });
    const student = state.students.find(item => item.id === req.auth.id);
    if (!student) return res.status(404).json({ message: "Student profile not found" });
    student.classId = joinedClass.id;
    const revision = await writeState(state, state.revision);
    res.json({ success: true, token: createSessionToken({ ...req.auth, classId: joinedClass.id }), activeClass: joinedClass, revision });
  } catch (error) {
    res.status(error.message === "STATE_CONFLICT" ? 409 : 500).json({ message: error.message === "STATE_CONFLICT" ? "State changed; try again" : "Could not join class" });
  }
});