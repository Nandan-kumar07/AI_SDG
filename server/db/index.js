const fs = require("fs");
const path = require("path");
const vm = require("vm");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const { pool, poolConfig } = require("./pool");

function loadSeedData() {
  const source = fs.readFileSync(path.join(__dirname, "..", "..", "js", "data.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SDG_DATA;
}

function rowToStudent(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    collegeId: row.college_id,
    classId: row.class_id,
    name: row.name,
    usn: profile.usn || "",
    department: row.department,
    email: row.email,
    phone: row.phone,
    skills: profile.skills || [],
    interests: profile.interests || [],
    points: profile.points || 0,
    tasksCompletedCount: profile.tasksCompletedCount || 0,
    ongoingTasksCount: profile.ongoingTasksCount || 0,
    avatar: row.avatar || "",
    sdgCoverage: profile.sdgCoverage || {},
    badges: profile.badges || []
  };
}

function rowToFaculty(row) {
  const profile = row.profile || {};
  return {
    id: row.id,
    collegeId: row.college_id,
    classId: row.class_id,
    name: row.name,
    department: row.department,
    email: row.email,
    phone: row.phone,
    designation: profile.designation || "Faculty",
    avatar: row.avatar || ""
  };
}

function rowToActivity(row) {
  return {
    id: row.id,
    collegeId: row.college_id,
    classId: row.class_id,
    title: row.title,
    goalId: row.goal_id,
    department: row.department,
    points: row.points,
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : null,
    status: row.status,
    difficulty: row.difficulty,
    taskType: row.task_type,
    aiAssigned: row.ai_assigned,
    matchedSkills: row.matched_skills || [],
    description: row.description,
    verificationRules: row.verification_rules,
    milestones: row.milestones || [],
    participantsCount: row.participants_count || 0,
    createdBy: row.created_by,
    ...(row.data || {})
  };
}

function rowToSubmission(row) {
  return {
    id: row.id,
    collegeId: row.college_id,
    classId: row.class_id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    sdgGoalId: row.sdg_goal_id,
    studentId: row.student_id,
    studentName: row.student_name,
    usn: row.usn,
    department: row.department,
    taskType: row.task_type,
    milestoneIndex: row.milestone_index,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString().replace("T", " ").substring(0, 19) : null,
    impactSummary: row.impact_summary,
    location: row.location,
    imageUrl: row.image_url,
    filePath: row.file_path,
    githubRepoUrl: row.github_repo_url,
    colabNotebookUrl: row.colab_notebook_url,
    trainingLossPlotUrl: row.training_loss_plot_url,
    modelMetricsSummary: row.model_metrics || {},
    liveDemoUrl: row.live_demo_url,
    verification: row.verification || {},
    pointsAwarded: row.points_awarded || 0,
    impactMetrics: row.impact_metrics || {}
  };
}

function rowToQuiz(row) {
  return {
    id: row.id,
    topicId: row.topic_id,
    goalId: row.goal_id,
    title: row.title,
    badge: row.badge,
    icon: row.icon,
    color: row.color,
    timeLimitSeconds: row.time_limit_seconds,
    questions: row.questions || [],
    collegeId: row.college_id,
    classId: row.class_id
  };
}

async function assembleState(collegeId, classId = null) {
  const [collegesRes, classesRes, usersRes, activitiesRes, submissionsRes, quizzesRes, ongoingRes] = await Promise.all([
    pool.query("SELECT * FROM colleges ORDER BY created_at"),
    pool.query("SELECT * FROM classes WHERE college_id = $1 ORDER BY created_at", [collegeId]),
    pool.query("SELECT * FROM users WHERE college_id = $1", [collegeId]),
    pool.query(
      "SELECT * FROM activities WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2 OR class_id IS NULL) ORDER BY created_at DESC",
      [collegeId, classId]
    ),
    pool.query(
      `SELECT s.*, u.name AS student_name, u.department, u.profile->>'usn' AS usn
       FROM submissions s JOIN users u ON u.id = s.student_id
       WHERE s.college_id = $1 AND ($2::text IS NULL OR s.class_id = $2)
       ORDER BY s.submitted_at DESC`,
      [collegeId, classId]
    ),
    pool.query(
      "SELECT * FROM quizzes WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2 OR class_id IS NULL) ORDER BY created_at DESC",
      [collegeId, classId]
    ),
    pool.query(
      "SELECT * FROM ongoing_tasks WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2) ORDER BY assigned_at DESC",
      [collegeId, classId]
    )
  ]);

  const students = usersRes.rows.filter(u => u.role === "student").map(rowToStudent);
  const faculty = usersRes.rows.filter(u => u.role === "faculty").map(rowToFaculty);
  const scopedStudents = classId ? students.filter(s => s.classId === classId) : students;
  const scopedFaculty = classId ? faculty.filter(f => f.classId === classId) : faculty;

  return {
    colleges: collegesRes.rows.map(r => ({ id: r.id, name: r.name, joinCode: r.join_code, createdAt: r.created_at })),
    classes: classesRes.rows.map(r => ({
      id: r.id, collegeId: r.college_id, name: r.name, section: r.section,
      joinCode: r.join_code, facultyId: r.faculty_id, createdAt: r.created_at
    })),
    students: scopedStudents,
    faculty: scopedFaculty,
    activities: activitiesRes.rows.map(rowToActivity),
    submissions: submissionsRes.rows.map(rowToSubmission),
    quizzes: quizzesRes.rows.map(rowToQuiz),
    studentOngoingTasks: ongoingRes.rows.map(r => ({
      taskId: r.task_id,
      assignedAt: r.assigned_at ? String(r.assigned_at).slice(0, 10) : null,
      status: r.status,
      currentMilestoneIndex: r.current_milestone_index,
      progressPct: r.progress_pct,
      assignedBy: r.assigned_by,
      aiMatchRationale: r.ai_match_rationale,
      collegeId: r.college_id,
      classId: r.class_id
    })),
    collegeId,
    classId,
    chatHistory: [],
    gameScores: {},
    theme: "light",
    notifications: [],
    revision: 0
  };
}

async function syncStateToDb(incoming, auth) {
  const collegeId = auth.collegeId;
  const classId = auth.classId || null;

  for (const student of incoming.students || []) {
    if (student.collegeId !== collegeId) continue;
    await pool.query(
      `UPDATE users SET class_id = $1, department = $2, phone = $3, avatar = $4, profile = $5
       WHERE id = $6 AND college_id = $7 AND role = 'student'`,
      [
        student.classId || null, student.department, student.phone, student.avatar || "",
        JSON.stringify({
          usn: student.usn,
          skills: student.skills || [],
          interests: student.interests || [],
          points: student.points || 0,
          tasksCompletedCount: student.tasksCompletedCount || 0,
          ongoingTasksCount: student.ongoingTasksCount || 0,
          sdgCoverage: student.sdgCoverage || {},
          badges: student.badges || []
        }),
        student.id, collegeId
      ]
    );
  }

  for (const fac of incoming.faculty || []) {
    if (fac.collegeId !== collegeId) continue;
    await pool.query(
      `UPDATE users SET department = $1, phone = $2, avatar = $3, profile = $4
       WHERE id = $5 AND college_id = $6 AND role = 'faculty'`,
      [fac.department, fac.phone, fac.avatar || "", JSON.stringify({ designation: fac.designation || "Faculty" }), fac.id, collegeId]
    );
  }

  for (const activity of incoming.activities || []) {
    if (activity.collegeId !== collegeId) continue;
    await pool.query(
      `INSERT INTO activities (id, college_id, class_id, title, goal_id, department, points, deadline, status, difficulty, task_type, ai_assigned, matched_skills, description, verification_rules, milestones, participants_count, created_by, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO UPDATE SET title=$4, goal_id=$5, department=$6, points=$7, deadline=$8, status=$9, difficulty=$10, task_type=$11, matched_skills=$13, description=$14, verification_rules=$15, milestones=$16, participants_count=$17, created_by=$18, data=$19`,
      [
        activity.id, collegeId, activity.classId || classId, activity.title, activity.goalId, activity.department,
        activity.points, activity.deadline || null, activity.status || "Active", activity.difficulty || "Intermediate",
        activity.taskType || "field_activity", Boolean(activity.aiAssigned), JSON.stringify(activity.matchedSkills || []),
        activity.description, activity.verificationRules, JSON.stringify(activity.milestones || []),
        activity.participantsCount || 0, activity.createdBy || "Faculty", JSON.stringify({ isAiGenerated: activity.isAiGenerated || false })
      ]
    );
  }

  for (const quiz of incoming.quizzes || []) {
    if (quiz.collegeId && quiz.collegeId !== collegeId) continue;
    const quizId = quiz.id || quiz.topicId;
    await pool.query(
      `INSERT INTO quizzes (id, college_id, class_id, topic_id, goal_id, title, badge, icon, color, time_limit_seconds, questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET title=$6, badge=$7, icon=$8, color=$9, time_limit_seconds=$10, questions=$11`,
      [quizId, collegeId, quiz.classId || classId, quiz.topicId, quiz.goalId, quiz.title, quiz.badge, quiz.icon, quiz.color, quiz.timeLimitSeconds || 120, JSON.stringify(quiz.questions || [])]
    );
  }

  for (const sub of incoming.submissions || []) {
    if (sub.collegeId !== collegeId) continue;
    await pool.query(
      `INSERT INTO submissions (id, college_id, class_id, task_id, student_id, task_title, sdg_goal_id, task_type, milestone_index, impact_summary, location, image_url, github_repo_url, colab_notebook_url, training_loss_plot_url, model_metrics, live_demo_url, verification, points_awarded, impact_metrics, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (id) DO UPDATE SET verification=$18, points_awarded=$19, impact_summary=$10, image_url=$12, github_repo_url=$13, colab_notebook_url=$14, training_loss_plot_url=$15, model_metrics=$16, live_demo_url=$17, impact_metrics=$20`,
      [
        sub.id, collegeId, sub.classId || classId, sub.taskId, sub.studentId, sub.taskTitle, sub.sdgGoalId,
        sub.taskType, sub.milestoneIndex || 1, sub.impactSummary, sub.location, sub.imageUrl,
        sub.githubRepoUrl, sub.colabNotebookUrl, sub.trainingLossPlotUrl, JSON.stringify(sub.modelMetricsSummary || {}),
        sub.liveDemoUrl, JSON.stringify(sub.verification || {}), sub.pointsAwarded || 0,
        JSON.stringify(sub.impactMetrics || {}), sub.submittedAt ? new Date(sub.submittedAt) : new Date()
      ]
    );
  }

  await pool.query("DELETE FROM ongoing_tasks WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2) AND ($3::text IS NULL OR student_id = $3)", [collegeId, classId, auth.role === "student" ? auth.id : null]);
  if (auth.role === "student") {
    for (const task of incoming.studentOngoingTasks || []) {
      await pool.query(
        `INSERT INTO ongoing_tasks (student_id, task_id, college_id, class_id, assigned_at, status, current_milestone_index, progress_pct, assigned_by, ai_match_rationale)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (student_id, task_id) DO UPDATE SET status=$6, current_milestone_index=$7, progress_pct=$8`,
        [auth.id, task.taskId, collegeId, classId, task.assignedAt || new Date(), task.status || "in-progress", task.currentMilestoneIndex || 1, task.progressPct || 10, task.assignedBy || "manual", task.aiMatchRationale || ""]
      );
    }
  }
}

async function seedDatabase() {
  const seed = loadSeedData();
  const collegeId = "college-demo";
  const classId = "class-demo-cse";
  const passwordHash = await bcrypt.hash("password123", 10);

  await pool.query(
    "INSERT INTO colleges (id, name, join_code) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
    [collegeId, "SDG Campus Demo College", "CAMPUS001"]
  );
  await pool.query(
    "INSERT INTO classes (id, college_id, name, section, join_code, faculty_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
    [classId, collegeId, "Sustainability & AI - CSE", "A", "CLASS001", "FAC-101"]
  );

  for (const student of seed.students || []) {
    await pool.query(
      `INSERT INTO users (id, role, college_id, class_id, email, password_hash, name, department, phone, avatar, profile)
       VALUES ($1,'student',$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        student.id, collegeId, classId, student.email, passwordHash, student.name, student.department, student.phone,
        student.avatar || "",
        JSON.stringify({
          usn: student.usn, skills: student.skills || [], interests: student.interests || [],
          points: student.points || 0, tasksCompletedCount: student.tasksCompletedCount || 0,
          ongoingTasksCount: student.ongoingTasksCount || 0, sdgCoverage: student.sdgCoverage || {},
          badges: student.badges || []
        })
      ]
    );
  }

  for (const fac of seed.faculty || []) {
    await pool.query(
      `INSERT INTO users (id, role, college_id, class_id, email, password_hash, name, department, phone, avatar, profile)
       VALUES ($1,'faculty',$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        fac.id, collegeId, classId, fac.email, passwordHash, fac.name, fac.department, fac.phone,
        fac.avatar || "", JSON.stringify({ designation: fac.designation || "Faculty" })
      ]
    );
  }

  for (const activity of seed.activities || []) {
    await pool.query(
      `INSERT INTO activities (id, college_id, class_id, title, goal_id, department, points, deadline, status, difficulty, task_type, ai_assigned, matched_skills, description, verification_rules, milestones, participants_count, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO NOTHING`,
      [
        activity.id, collegeId, classId, activity.title, activity.goalId, activity.department, activity.points,
        activity.deadline, activity.status, activity.difficulty, activity.taskType, Boolean(activity.aiAssigned),
        JSON.stringify(activity.matchedSkills || []), activity.description, activity.verificationRules,
        JSON.stringify(activity.milestones || []), activity.participantsCount || 0, activity.createdBy
      ]
    );
  }

  for (const quiz of seed.quizzes || []) {
    await pool.query(
      `INSERT INTO quizzes (id, college_id, class_id, topic_id, goal_id, title, badge, icon, color, time_limit_seconds, questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      [quiz.topicId, collegeId, classId, quiz.topicId, quiz.goalId, quiz.title, quiz.badge, quiz.icon, quiz.color, quiz.timeLimitSeconds, JSON.stringify(quiz.questions || [])]
    );
  }

  for (const sub of seed.submissions || []) {
    await pool.query(
      `INSERT INTO submissions (id, college_id, class_id, task_id, student_id, task_title, sdg_goal_id, task_type, milestone_index, impact_summary, location, image_url, github_repo_url, colab_notebook_url, training_loss_plot_url, model_metrics, live_demo_url, verification, points_awarded, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT (id) DO NOTHING`,
      [
        sub.id, collegeId, classId, sub.taskId, sub.studentId, sub.taskTitle, sub.sdgGoalId, sub.taskType,
        sub.milestoneIndex || 1, sub.impactSummary, sub.location, sub.imageUrl, sub.githubRepoUrl,
        sub.colabNotebookUrl, sub.trainingLossPlotUrl, JSON.stringify(sub.modelMetricsSummary || {}),
        sub.liveDemoUrl, JSON.stringify(sub.verification || {}), sub.pointsAwarded || 0,
        sub.submittedAt ? new Date(sub.submittedAt) : new Date()
      ]
    );
  }
}

async function migrateFromLegacyJson(client) {
  const legacy = await client.query("SELECT state FROM app_state WHERE id = 1");
  if (legacy.rowCount === 0) return false;
  const state = legacy.rows[0].state;
  const passwordHash = await bcrypt.hash("password123", 10);

  for (const college of state.colleges || []) {
    await client.query(
      "INSERT INTO colleges (id, name, join_code, created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
      [college.id, college.name, college.joinCode, college.createdAt || new Date()]
    );
  }
  for (const cls of state.classes || []) {
    await client.query(
      "INSERT INTO classes (id, college_id, name, section, join_code, faculty_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING",
      [cls.id, cls.collegeId, cls.name, cls.section || "A", cls.joinCode, cls.facultyId || null, cls.createdAt || new Date()]
    );
  }
  for (const student of state.students || []) {
    await client.query(
      `INSERT INTO users (id, role, college_id, class_id, email, password_hash, name, department, phone, avatar, profile)
       VALUES ($1,'student',$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        student.id, student.collegeId, student.classId || null, student.email,
        student.passwordHash || passwordHash, student.name, student.department, student.phone, student.avatar || "",
        JSON.stringify({
          usn: student.usn, skills: student.skills || [], interests: student.interests || [],
          points: student.points || 0, tasksCompletedCount: student.tasksCompletedCount || 0,
          ongoingTasksCount: student.ongoingTasksCount || 0, sdgCoverage: student.sdgCoverage || {},
          badges: student.badges || []
        })
      ]
    );
  }
  for (const fac of state.faculty || []) {
    await client.query(
      `INSERT INTO users (id, role, college_id, class_id, email, password_hash, name, department, phone, avatar, profile)
       VALUES ($1,'faculty',$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [
        fac.id, fac.collegeId, fac.classId || null, fac.email, fac.passwordHash || passwordHash,
        fac.name, fac.department, fac.phone, fac.avatar || "", JSON.stringify({ designation: fac.designation || "Faculty" })
      ]
    );
  }
  for (const activity of state.activities || []) {
    await client.query(
      `INSERT INTO activities (id, college_id, class_id, title, goal_id, department, points, deadline, status, difficulty, task_type, ai_assigned, matched_skills, description, verification_rules, milestones, participants_count, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT (id) DO NOTHING`,
      [
        activity.id, activity.collegeId, activity.classId || null, activity.title, activity.goalId,
        activity.department, activity.points, activity.deadline, activity.status, activity.difficulty,
        activity.taskType, Boolean(activity.aiAssigned), JSON.stringify(activity.matchedSkills || []),
        activity.description, activity.verificationRules, JSON.stringify(activity.milestones || []),
        activity.participantsCount || 0, activity.createdBy
      ]
    );
  }
  for (const quiz of state.quizzes || []) {
    const quizId = quiz.id || quiz.topicId;
    await client.query(
      `INSERT INTO quizzes (id, college_id, class_id, topic_id, goal_id, title, badge, icon, color, time_limit_seconds, questions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
      [quizId, quiz.collegeId || state.collegeId, quiz.classId || null, quiz.topicId, quiz.goalId, quiz.title, quiz.badge, quiz.icon, quiz.color, quiz.timeLimitSeconds, JSON.stringify(quiz.questions || [])]
    );
  }
  for (const sub of state.submissions || []) {
    await client.query(
      `INSERT INTO submissions (id, college_id, class_id, task_id, student_id, task_title, sdg_goal_id, task_type, milestone_index, impact_summary, location, image_url, github_repo_url, colab_notebook_url, training_loss_plot_url, model_metrics, live_demo_url, verification, points_awarded, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT (id) DO NOTHING`,
      [
        sub.id, sub.collegeId || state.collegeId, sub.classId || null, sub.taskId, sub.studentId, sub.taskTitle,
        sub.sdgGoalId, sub.taskType, sub.milestoneIndex || 1, sub.impactSummary, sub.location, sub.imageUrl,
        sub.githubRepoUrl, sub.colabNotebookUrl, sub.trainingLossPlotUrl, JSON.stringify(sub.modelMetricsSummary || {}),
        sub.liveDemoUrl, JSON.stringify(sub.verification || {}), sub.pointsAwarded || 0,
        sub.submittedAt ? new Date(sub.submittedAt) : new Date()
      ]
    );
  }
  for (const task of state.studentOngoingTasks || []) {
    const taskExists = await client.query("SELECT id FROM activities WHERE id = $1", [task.taskId]);
    if (taskExists.rowCount === 0) continue;
    const student = (state.students || []).find(s => (s.ongoingTasksCount || 0) > 0) || state.students?.[0];
    if (!student) continue;
    await client.query(
      `INSERT INTO ongoing_tasks (student_id, task_id, college_id, class_id, assigned_at, status, current_milestone_index, progress_pct, assigned_by, ai_match_rationale)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (student_id, task_id) DO NOTHING`,
      [student.id, task.taskId, student.collegeId || state.collegeId, student.classId || null, task.assignedAt || new Date(), task.status || "in-progress", task.currentMilestoneIndex || 1, task.progressPct || 10, task.assignedBy || "manual", task.aiMatchRationale || ""]
    );
  }
  return true;
}

async function initializeDatabase() {
  const adminPool = new Pool({ ...poolConfig, database: "postgres" });
  try {
    await adminPool.query("CREATE DATABASE sdg_connect");
  } catch (error) {
    if (error.code !== "42P04") throw error;
  } finally {
    await adminPool.end();
  }

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const collegeCount = await pool.query("SELECT COUNT(*)::int AS count FROM colleges");
  if (collegeCount.rows[0].count === 0) {
    try {
      const migrated = await migrateFromLegacyJson(pool);
      if (!migrated) await seedDatabase();
    } catch (error) {
      console.warn("Legacy migration skipped:", error.message);
      await seedDatabase();
    }
  }
}

module.exports = {
  pool,
  initializeDatabase,
  assembleState,
  syncStateToDb,
  rowToStudent,
  rowToFaculty,
  seedDatabase
};
