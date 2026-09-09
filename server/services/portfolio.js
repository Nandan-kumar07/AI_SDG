const crypto = require("crypto");
const { pool } = require("../db");
const { getStudentImpact } = require("./impactEngine");

async function buildPortfolio(studentId) {
  const userRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'student'", [studentId]);
  if (userRes.rowCount === 0) throw new Error("Student not found");
  const user = userRes.rows[0];
  const profile = user.profile || {};

  const [subsRes, credsRes, impact] = await Promise.all([
    pool.query(
      `SELECT s.* FROM submissions s
       WHERE s.student_id = $1 AND s.verification->>'status' = 'Verified'
       ORDER BY s.submitted_at DESC`,
      [studentId]
    ),
    pool.query("SELECT * FROM credentials WHERE student_id = $1 ORDER BY issued_at DESC", [studentId]),
    getStudentImpact(studentId)
  ]);

  return {
    student: {
      id: user.id,
      name: user.name,
      usn: profile.usn,
      department: user.department,
      email: user.email,
      points: profile.points || 0,
      badges: profile.badges || [],
      sdgCoverage: profile.sdgCoverage || {}
    },
    verifiedSubmissions: subsRes.rows.map(r => ({
      id: r.id,
      taskTitle: r.task_title,
      sdgGoalId: r.sdg_goal_id,
      pointsAwarded: r.points_awarded,
      submittedAt: r.submitted_at,
      impactSummary: r.impact_summary
    })),
    credentials: credsRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      sdgGoals: r.sdg_goals,
      verificationCode: r.verification_code,
      issuedAt: r.issued_at
    })),
    impact,
    generatedAt: new Date().toISOString()
  };
}

async function issueCredential(studentId, collegeId, title, sdgGoals = []) {
  const id = `CRED-${Date.now()}`;
  const verificationCode = crypto.randomBytes(6).toString("hex").toUpperCase();
  await pool.query(
    "INSERT INTO credentials (id, student_id, college_id, title, sdg_goals, verification_code) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, studentId, collegeId, title, JSON.stringify(sdgGoals), verificationCode]
  );
  return { id, verificationCode };
}

async function verifyCredential(code) {
  const result = await pool.query(
    `SELECT c.*, u.name AS student_name, u.department
     FROM credentials c JOIN users u ON u.id = c.student_id
     WHERE c.verification_code = $1`,
    [code.toUpperCase()]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    valid: true,
    studentName: row.student_name,
    department: row.department,
    title: row.title,
    sdgGoals: row.sdg_goals,
    issuedAt: row.issued_at
  };
}

module.exports = { buildPortfolio, issueCredential, verifyCredential };
