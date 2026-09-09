const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { pool, poolConfig, initializeDatabase, assembleState, syncStateToDb, rowToStudent, rowToFaculty } = require("./server/db");
const { createSessionToken, authenticate, optionalAuthenticate, requireRole } = require("./server/middleware/auth");
const { authLimiter, aiLimiter, uploadLimiter } = require("./server/middleware/rateLimit");
const { estimateImpact, recordImpact, getImpactSummary, getStudentImpact } = require("./server/services/impactEngine");
const { createNotification, getNotifications, markNotificationRead, markAllNotificationsRead } = require("./server/services/notifications");
const { getFacultyAnalytics } = require("./server/services/analytics");
const { buildPortfolio, issueCredential, verifyCredential } = require("./server/services/portfolio");

const app = express();
const port = Number(process.env.PORT || 3000);
const root = __dirname;
const uploadsDir = path.join(root, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image uploads are allowed"));
  }
});

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

async function findCollegeByCode(code) {
  const result = await pool.query("SELECT * FROM colleges WHERE UPPER(join_code) = UPPER($1)", [String(code || "").trim()]);
  return result.rows[0] || null;
}

async function findClassByCode(collegeId, code) {
  const result = await pool.query(
    "SELECT * FROM classes WHERE college_id = $1 AND UPPER(join_code) = UPPER($2)",
    [collegeId, String(code || "").trim()]
  );
  return result.rows[0] || null;
}

async function getUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (result.rowCount === 0) return null;
  return result.rows[0].role === "student" ? rowToStudent(result.rows[0]) : rowToFaculty(result.rows[0]);
}

async function buildAuthResponse(userRow, role, college, activeClass) {
  const scoped = await assembleState(college.id, activeClass?.id || null);
  const currentUser = publicUser(userRow.role === "student" ? rowToStudent(userRow) : rowToFaculty(userRow));
  return {
    success: true,
    token: createSessionToken({ id: userRow.id, role, collegeId: college.id, classId: activeClass?.id || null }),
    user: currentUser,
    college: { id: college.id, name: college.name, joinCode: college.join_code },
    activeClass: activeClass ? { id: activeClass.id, name: activeClass.name, section: activeClass.section, joinCode: activeClass.join_code, collegeId: activeClass.college_id, facultyId: activeClass.faculty_id } : null,
    state: { ...scoped, students: scoped.students.map(publicUser), faculty: scoped.faculty.map(publicUser) }
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected", version: "2.0" });
  } catch (_error) {
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

// ─── State (backward compatible) ──────────────────────────────────────────────
app.get("/api/state", optionalAuthenticate, async (req, res) => {
  try {
    const collegeId = req.auth?.collegeId || "college-demo";
    const classId = req.auth?.classId || null;
    const state = await assembleState(collegeId, classId);
    const currentUser = req.auth ? await getUserById(req.auth.id) : null;
    const collegeRes = await pool.query("SELECT * FROM colleges WHERE id = $1", [collegeId]);
    const classRes = classId ? await pool.query("SELECT * FROM classes WHERE id = $1", [classId]) : { rows: [] };
    const notifications = req.auth ? await getNotifications(req.auth.id) : [];
    const impact = await getImpactSummary(collegeId, classId);
    const studentImpact = req.auth?.role === "student" ? await getStudentImpact(req.auth.id) : null;

    res.json({
      ...state,
      currentUser: publicUser(currentUser),
      userRole: currentUser ? req.auth.role : "guest",
      students: state.students.map(publicUser),
      faculty: state.faculty.map(publicUser),
      college: collegeRes.rows[0] ? { id: collegeRes.rows[0].id, name: collegeRes.rows[0].name, joinCode: collegeRes.rows[0].join_code } : null,
      activeClass: classRes.rows[0] ? { id: classRes.rows[0].id, name: classRes.rows[0].name, joinCode: classRes.rows[0].join_code, section: classRes.rows[0].section } : null,
      notifications,
      impactSummary: impact,
      studentImpact
    });
  } catch (error) {
    console.error("State load error:", error.message);
    res.status(500).json({ message: "Could not load application state" });
  }
});

app.put("/api/state", authenticate, async (req, res) => {
  try {
    const incoming = req.body || {};
    if (!Array.isArray(incoming.students) || !Array.isArray(incoming.faculty) || !Array.isArray(incoming.activities) || !Array.isArray(incoming.submissions) || !Array.isArray(incoming.quizzes)) {
      return res.status(400).json({ message: "Invalid state payload" });
    }
    if (incoming.currentUser && incoming.currentUser.id !== req.auth.id) {
      return res.status(403).json({ message: "Cannot update another user session" });
    }
    const current = await assembleState(req.auth.collegeId, req.auth.classId || null);
    if (req.auth.role === "student") {
      incoming.activities = current.activities;
      incoming.quizzes = current.quizzes;
      incoming.faculty = current.faculty;
      incoming.students = current.students.map(student =>
        student.id === req.auth.id ? (incoming.students || []).find(c => c.id === req.auth.id) || student : student
      );
      incoming.submissions = [
        ...current.submissions.filter(s => s.studentId !== req.auth.id),
        ...(incoming.submissions || []).filter(s => s.studentId === req.auth.id)
      ];
    }
    await syncStateToDb(incoming, req.auth);
    res.json({ success: true, revision: Date.now() });
  } catch (error) {
    console.error("State sync error:", error.message);
    res.status(500).json({ message: "Could not save application state" });
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { role, identifier, password, collegeCode, classCode } = req.body || {};
  try {
    const collegeRow = collegeCode ? await findCollegeByCode(collegeCode) : (await pool.query("SELECT * FROM colleges WHERE id = 'college-demo'")).rows[0];
    if (!collegeRow) return res.status(404).json({ message: "College not found" });

    const usersRes = await pool.query(
      "SELECT * FROM users WHERE college_id = $1 AND role = $2",
      [collegeRow.id, role]
    );
    const user = usersRes.rows.find(row => role === "faculty"
      ? row.email.toLowerCase() === String(identifier).toLowerCase()
      : (row.profile?.usn || "").toLowerCase() === String(identifier).toLowerCase() || row.email.toLowerCase() === String(identifier).toLowerCase());

    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let activeClass = classCode ? await findClassByCode(collegeRow.id, classCode) : null;
    if (!activeClass && user.class_id) {
      activeClass = (await pool.query("SELECT * FROM classes WHERE id = $1", [user.class_id])).rows[0] || null;
    }
    if (classCode && !activeClass) return res.status(404).json({ message: "Class not found. You can join one after logging in." });
    if (role === "student" && activeClass && user.class_id && user.class_id !== activeClass.id) {
      return res.status(403).json({ message: "This student is not registered in that class" });
    }

    res.json(await buildAuthResponse(user, role, collegeRow, activeClass));
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  const { role, formData, collegeCode, classCode, createCollege } = req.body || {};
  try {
    const isFaculty = role === "faculty";
    let collegeRow = await findCollegeByCode(collegeCode);

    if (isFaculty && createCollege) {
      collegeRow = {
        id: `college-${Date.now()}`,
        name: String(formData.collegeName || "New SDG College").trim(),
        join_code: String(formData.joinCode || `SDG${Date.now().toString().slice(-6)}`).trim().toUpperCase()
      };
      await pool.query("INSERT INTO colleges (id, name, join_code) VALUES ($1,$2,$3)", [collegeRow.id, collegeRow.name, collegeRow.join_code]);
    }
    if (!collegeRow) return res.status(404).json({ message: "Enter a valid college join code" });

    let activeClass = await findClassByCode(collegeRow.id, classCode);
    if (!activeClass && isFaculty && createCollege && formData.classCode) {
      activeClass = {
        id: `class-${Date.now()}`,
        college_id: collegeRow.id,
        name: String(formData.className || "Sustainability Class").trim(),
        section: String(formData.classSection || "A").trim(),
        join_code: String(formData.classCode || `CLASS${Date.now().toString().slice(-6)}`).trim().toUpperCase()
      };
      await pool.query(
        "INSERT INTO classes (id, college_id, name, section, join_code) VALUES ($1,$2,$3,$4,$5)",
        [activeClass.id, activeClass.college_id, activeClass.name, activeClass.section, activeClass.join_code]
      );
    }
    if (classCode && !activeClass) return res.status(404).json({ message: "Class not found. You can join one after registering." });

    const dupCheck = await pool.query(
      "SELECT id FROM users WHERE college_id = $1 AND (LOWER(email) = LOWER($2) OR ($3::text IS NOT NULL AND profile->>'usn' = $3))",
      [collegeRow.id, formData.email, isFaculty ? null : String(formData.usn).toUpperCase()]
    );
    if (dupCheck.rowCount > 0) return res.status(409).json({ message: "An account with these details already exists" });

    const userId = isFaculty ? `FAC-${Date.now()}` : `STU-${Date.now()}`;
    const passwordHash = await bcrypt.hash(formData.password, 10);
    const profile = isFaculty
      ? { designation: formData.designation || "Assistant Professor" }
      : {
          usn: String(formData.usn).toUpperCase(),
          skills: formData.skills ? formData.skills.split(",").map(v => v.trim()).filter(Boolean) : [],
          interests: formData.interests ? formData.interests.split(",").map(v => v.trim()).filter(Boolean) : [],
          points: 100, tasksCompletedCount: 0, ongoingTasksCount: 0,
          sdgCoverage: {}, badges: ["New Changemaker"]
        };

    await pool.query(
      `INSERT INTO users (id, role, college_id, class_id, email, password_hash, name, department, phone, avatar, profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        userId, role, collegeRow.id, activeClass?.id || null,
        isFaculty ? formData.email : String(formData.email || `${formData.usn.toLowerCase()}@student.local`).trim(),
        passwordHash, formData.name, formData.department, formData.phone, "",
        JSON.stringify(profile)
      ]
    );

    const user = (await pool.query("SELECT * FROM users WHERE id = $1", [userId])).rows[0];
    res.status(201).json(await buildAuthResponse(user, role, collegeRow, activeClass));
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Signup failed" });
  }
});

// ─── Classes ──────────────────────────────────────────────────────────────────
app.post("/api/classes", authenticate, requireRole("faculty"), async (req, res) => {
  try {
    const className = String(req.body?.name || "Sustainability Class").trim();
    const joinCode = String(req.body?.joinCode || `CLASS${Date.now().toString().slice(-6)}`).trim().toUpperCase();
    if (!className || !joinCode) return res.status(400).json({ message: "Class name and join code are required" });

    const dup = await pool.query("SELECT id FROM classes WHERE college_id = $1 AND join_code = $2", [req.auth.collegeId, joinCode]);
    if (dup.rowCount > 0) return res.status(409).json({ message: "That class join code already exists" });

    const newClass = {
      id: `class-${Date.now()}`,
      collegeId: req.auth.collegeId,
      name: className,
      section: String(req.body?.section || "A").trim(),
      joinCode,
      facultyId: req.auth.id,
      createdAt: new Date().toISOString()
    };
    await pool.query(
      "INSERT INTO classes (id, college_id, name, section, join_code, faculty_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [newClass.id, newClass.collegeId, newClass.name, newClass.section, newClass.joinCode, newClass.facultyId]
    );
    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ message: "Could not create class" });
  }
});

app.post("/api/classes/select", authenticate, async (req, res) => {
  try {
    const selected = (await pool.query("SELECT * FROM classes WHERE id = $1 AND college_id = $2", [req.body?.classId, req.auth.collegeId])).rows[0];
    if (!selected) return res.status(404).json({ message: "Class not found" });
    if (req.auth.role === "faculty" && selected.faculty_id && selected.faculty_id !== req.auth.id) {
      return res.status(403).json({ message: "You do not manage this class" });
    }
    if (req.auth.role === "student" && selected.id !== req.auth.classId) {
      return res.status(403).json({ message: "You are not enrolled in this class" });
    }
    res.json({
      success: true,
      token: createSessionToken({ ...req.auth, classId: selected.id }),
      activeClass: { id: selected.id, name: selected.name, joinCode: selected.join_code, section: selected.section, collegeId: selected.college_id, facultyId: selected.faculty_id }
    });
  } catch (_error) {
    res.status(500).json({ message: "Could not select class" });
  }
});

app.post("/api/classes/join", authenticate, requireRole("student"), async (req, res) => {
  try {
    const joinedClass = await findClassByCode(req.auth.collegeId, req.body?.joinCode);
    if (!joinedClass) return res.status(404).json({ message: "Class join code not found" });
    await pool.query("UPDATE users SET class_id = $1 WHERE id = $2", [joinedClass.id, req.auth.id]);
    res.json({
      success: true,
      token: createSessionToken({ ...req.auth, classId: joinedClass.id }),
      activeClass: { id: joinedClass.id, name: joinedClass.name, joinCode: joinedClass.join_code, section: joinedClass.section, collegeId: joinedClass.college_id }
    });
  } catch (_error) {
    res.status(500).json({ message: "Could not join class" });
  }
});

// ─── File uploads ─────────────────────────────────────────────────────────────
app.post("/api/uploads", authenticate, uploadLimiter, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const hash = crypto.createHash("sha256").update(fs.readFileSync(req.file.path)).digest("hex");
    await pool.query(
      "INSERT INTO uploads (user_id, original_name, stored_name, mime_type, size_bytes, file_hash) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.auth.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, hash]
    );
    res.status(201).json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      hash,
      originalName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Upload failed" });
  }
});

// ─── Submissions (granular) ───────────────────────────────────────────────────
app.post("/api/submissions", authenticate, requireRole("student"), async (req, res) => {
  try {
    const data = req.body || {};
    const taskRes = await pool.query("SELECT * FROM activities WHERE id = $1", [data.taskId]);
    if (taskRes.rowCount === 0) return res.status(404).json({ message: "Task not found" });
    const task = taskRes.rows[0];
    const id = data.id || (task.task_type === "technical_dl_project" ? `SUB-DL-${Date.now()}` : `SUB-${Date.now()}`);
    const verification = data.verification || { status: "Needs Review", aiConfidence: 0 };
    const impactMetrics = estimateImpact(task.task_type, task.goal_id, task.points);

    await pool.query(
      `INSERT INTO submissions (id, college_id, class_id, task_id, student_id, task_title, sdg_goal_id, task_type, milestone_index, impact_summary, location, image_url, file_path, github_repo_url, colab_notebook_url, training_loss_plot_url, model_metrics, live_demo_url, verification, points_awarded, impact_metrics)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        id, req.auth.collegeId, req.auth.classId, data.taskId, req.auth.id, task.title, task.goal_id,
        task.task_type, data.milestoneIndex || 1, data.impactSummary, data.location,
        data.imageUrl, data.filePath || null, data.githubRepoUrl, data.colabNotebookUrl,
        data.trainingLossPlotUrl || data.imageUrl, JSON.stringify(data.modelMetricsSummary || {}),
        data.liveDemoUrl, JSON.stringify(verification), verification.status === "Verified" ? task.points : 0,
        JSON.stringify(impactMetrics)
      ]
    );

    if (verification.status === "Verified") {
      await recordImpact({ collegeId: req.auth.collegeId, classId: req.auth.classId, studentId: req.auth.id, submissionId: id, sdgGoalId: task.goal_id, taskType: task.task_type, points: task.points });
    }

    const facultyRes = await pool.query("SELECT id FROM users WHERE college_id = $1 AND role = 'faculty'", [req.auth.collegeId]);
    for (const fac of facultyRes.rows) {
      await createNotification(fac.id, "submission", "New submission to review", `${data.impactSummary || "A student submitted new evidence."}`, "/faculty-dashboard.html");
    }

    res.status(201).json({ success: true, id, impactMetrics });
  } catch (error) {
    console.error("Submission error:", error.message);
    res.status(500).json({ message: "Could not save submission" });
  }
});

app.post("/api/submissions/:id/review", authenticate, requireRole("faculty"), async (req, res) => {
  try {
    const { decision, feedback, awardedPoints } = req.body || {};
    const subRes = await pool.query("SELECT s.*, a.points AS max_points, a.task_type, a.goal_id FROM submissions s JOIN activities a ON a.id = s.task_id WHERE s.id = $1", [req.params.id]);
    if (subRes.rowCount === 0) return res.status(404).json({ message: "Submission not found" });
    const sub = subRes.rows[0];
    const status = decision === "approve" ? "Verified" : (decision === "reject" ? "Rejected" : "Needs Review");
    const points = decision === "approve" ? Math.max(0, Math.min(sub.max_points, Number(awardedPoints ?? sub.max_points))) : 0;
    const verification = { ...(sub.verification || {}), status, facultyFeedback: feedback || "", reviewedBy: req.auth.id, reviewTimestamp: new Date().toISOString() };

    await pool.query("UPDATE submissions SET verification = $1, points_awarded = $2 WHERE id = $3", [JSON.stringify(verification), points, req.params.id]);

    if (decision === "approve") {
      const userRes = await pool.query("SELECT profile FROM users WHERE id = $1", [sub.student_id]);
      const profile = userRes.rows[0].profile || {};
      profile.points = (profile.points || 0) + points;
      profile.tasksCompletedCount = (profile.tasksCompletedCount || 0) + 1;
      profile.sdgCoverage = profile.sdgCoverage || {};
      profile.sdgCoverage[sub.goal_id] = (profile.sdgCoverage[sub.goal_id] || 0) + 1;
      if (!profile.badges.includes("Deep Learning Changemaker")) profile.badges.push("Deep Learning Changemaker");
      await pool.query("UPDATE users SET profile = $1 WHERE id = $2", [JSON.stringify(profile), sub.student_id]);
      await pool.query("INSERT INTO points_ledger (student_id, college_id, submission_id, points, reason, sdg_goal_id) VALUES ($1,$2,$3,$4,$5,$6)", [sub.student_id, req.auth.collegeId, req.params.id, points, "Faculty approved submission", sub.goal_id]);
      await recordImpact({ collegeId: req.auth.collegeId, classId: sub.class_id, studentId: sub.student_id, submissionId: req.params.id, sdgGoalId: sub.goal_id, taskType: sub.task_type, points });
      await issueCredential(sub.student_id, req.auth.collegeId, `Verified SDG ${sub.goal_id} Achievement`, [sub.goal_id]);
      await createNotification(sub.student_id, "approval", "Submission approved", `You earned ${points} SDG points!`, "/student-dashboard.html");
    } else if (decision === "reject") {
      await createNotification(sub.student_id, "revision", "Revision requested", feedback || "Please revise and resubmit.", "/student-dashboard.html");
    }

    res.json({ success: true, pointsAwarded: points, status });
  } catch (error) {
    console.error("Review error:", error.message);
    res.status(500).json({ message: "Could not review submission" });
  }
});

// ─── Analytics & Impact ───────────────────────────────────────────────────────
app.get("/api/analytics/faculty", authenticate, requireRole("faculty"), async (req, res) => {
  try {
    res.json(await getFacultyAnalytics(req.auth.collegeId, req.auth.classId || null));
  } catch (_error) {
    res.status(500).json({ message: "Could not load analytics" });
  }
});

app.get("/api/impact", optionalAuthenticate, async (req, res) => {
  try {
    const collegeId = req.auth?.collegeId || "college-demo";
    res.json(await getImpactSummary(collegeId, req.auth?.classId || null));
  } catch (_error) {
    res.status(500).json({ message: "Could not load impact data" });
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────
app.get("/api/notifications", authenticate, async (req, res) => {
  res.json(await getNotifications(req.auth.id));
});

app.post("/api/notifications/:id/read", authenticate, async (req, res) => {
  await markNotificationRead(req.auth.id, req.params.id);
  res.json({ success: true });
});

app.post("/api/notifications/read-all", authenticate, async (req, res) => {
  await markAllNotificationsRead(req.auth.id);
  res.json({ success: true });
});

// ─── Portfolio & Credentials ──────────────────────────────────────────────────
app.get("/api/portfolio", authenticate, requireRole("student"), async (req, res) => {
  try {
    res.json(await buildPortfolio(req.auth.id));
  } catch (_error) {
    res.status(500).json({ message: "Could not build portfolio" });
  }
});

app.get("/api/portfolio/export", authenticate, requireRole("student"), async (req, res) => {
  try {
    const portfolio = await buildPortfolio(req.auth.id);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="sdg-portfolio-${portfolio.student.usn || req.auth.id}.json"`);
    res.send(JSON.stringify(portfolio, null, 2));
  } catch (_error) {
    res.status(500).json({ message: "Could not export portfolio" });
  }
});

app.get("/api/credentials/verify/:code", async (req, res) => {
  const result = await verifyCredential(req.params.code);
  if (!result) return res.status(404).json({ valid: false, message: "Credential not found" });
  res.json(result);
});

// ─── AI ───────────────────────────────────────────────────────────────────────
app.post("/api/ai/task-suggestion", authenticate, aiLimiter, async (req, res) => {
  const { student, goals } = req.body || {};
  if (req.auth.role === "student" && student?.id && student.id !== req.auth.id) return res.status(403).json({ message: "Cannot generate a task for another student" });
  if (!student || !Array.isArray(goals)) return res.status(400).json({ message: "Student profile and SDG goals are required" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ message: "Vision LLM is not configured" });

  const prompt = `Create one personalized campus sustainability task for this student.\nStudent: ${JSON.stringify({
    department: student.department, skills: student.skills || [], interests: student.interests || [], sdgCoverage: student.sdgCoverage || {}
  })}\nSDG catalogue: ${JSON.stringify(goals.map(goal => ({ id: goal.id, name: goal.name, tagline: goal.tagline })))}\nReturn JSON only with: title, goalId, taskType (field_activity or technical_dl_project), points (100-300), difficulty, matchedSkills (array), description, verificationRules, and milestones (array).`;

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
        system: "You are a campus sustainability project designer.",
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

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(root));
app.use(express.static(path.join(root, "html")));
app.get("/", (_req, res) => res.sendFile(path.join(root, "html", "index.html")));
app.get("/verify/:code", (_req, res) => res.sendFile(path.join(root, "html", "verify-credential.html")));

initializeDatabase().then(() => {
  app.listen(port, () => console.log(`SDG Connect v2 running at http://localhost:${port}`));
}).catch(error => {
  if (/client password must be a string/i.test(error.message)) {
    console.error("Database initialization failed: PostgreSQL password is missing or invalid.");
    console.error("Set DATABASE_URL or PGPASSWORD in .env");
  } else if (/password authentication failed/i.test(error.message)) {
    console.error("Database initialization failed: PostgreSQL rejected the password.");
    console.error("Update .env with your postgres password.");
  } else if (/ECONNREFUSED/i.test(error.message)) {
    console.error("Database initialization failed: PostgreSQL is not running.");
  } else {
    console.error("Database initialization failed:", error.message);
  }
  process.exitCode = 1;
});
