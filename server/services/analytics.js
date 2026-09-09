const { pool } = require("../db");

async function getFacultyAnalytics(collegeId, classId = null) {
  const [students, submissions, pending, sdgCoverage, topStudents] = await Promise.all([
    pool.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE college_id = $1 AND role = 'student' AND ($2::text IS NULL OR class_id = $2)",
      [collegeId, classId]
    ),
    pool.query(
      "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE verification->>'status' = 'Verified')::int AS verified, COUNT(*) FILTER (WHERE verification->>'status' = 'Needs Review')::int AS pending FROM submissions WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2)",
      [collegeId, classId]
    ),
    pool.query(
      "SELECT COUNT(*)::int AS count FROM submissions WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2) AND verification->>'status' = 'Needs Review'",
      [collegeId, classId]
    ),
    pool.query(
      `SELECT sdg_goal_id, COUNT(*)::int AS count
       FROM submissions WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2) AND sdg_goal_id IS NOT NULL
       GROUP BY sdg_goal_id ORDER BY count DESC`,
      [collegeId, classId]
    ),
    pool.query(
      `SELECT u.id, u.name, u.profile->>'usn' AS usn, COALESCE((u.profile->>'points')::int, 0) AS points,
              COALESCE((u.profile->>'tasksCompletedCount')::int, 0) AS tasks_completed
       FROM users u
       WHERE u.college_id = $1 AND u.role = 'student' AND ($2::text IS NULL OR u.class_id = $2)
       ORDER BY points DESC LIMIT 5`,
      [collegeId, classId]
    )
  ]);

  return {
    studentCount: students.rows[0].count,
    submissions: submissions.rows[0],
    pendingReviews: pending.rows[0].count,
    sdgHeatmap: sdgCoverage.rows.map(r => ({ goalId: r.sdg_goal_id, count: r.count })),
    topStudents: topStudents.rows
  };
}

module.exports = { getFacultyAnalytics };
