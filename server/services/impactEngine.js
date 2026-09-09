const { pool } = require("../db");

const IMPACT_RULES = {
  field_activity: [
    { metricType: "waste_diverted_kg", unit: "kg", base: 2.5 },
    { metricType: "trees_planted", unit: "trees", base: 2 },
    { metricType: "water_saved_liters", unit: "L", base: 50 },
    { metricType: "co2_avoided_kg", unit: "kg CO2e", base: 5 }
  ],
  technical_dl_project: [
    { metricType: "automation_hours_saved", unit: "hours", base: 12 },
    { metricType: "co2_avoided_kg", unit: "kg CO2e", base: 8 },
    { metricType: "data_points_analyzed", unit: "records", base: 500 }
  ]
};

function estimateImpact(taskType, goalId, points = 150) {
  const rules = IMPACT_RULES[taskType] || IMPACT_RULES.field_activity;
  const multiplier = Math.max(1, points / 150);
  const metrics = {};
  for (const rule of rules) {
    metrics[rule.metricType] = {
      value: Number((rule.base * multiplier).toFixed(2)),
      unit: rule.unit
    };
  }
  return { sdgGoalId: goalId, metrics, estimatedAt: new Date().toISOString() };
}

async function recordImpact({ collegeId, classId, studentId, submissionId, sdgGoalId, taskType, points }) {
  const impact = estimateImpact(taskType, sdgGoalId, points);
  for (const [metricType, data] of Object.entries(impact.metrics)) {
    await pool.query(
      `INSERT INTO impact_records (college_id, class_id, student_id, submission_id, sdg_goal_id, metric_type, metric_value, unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [collegeId, classId, studentId, submissionId, sdgGoalId, metricType, data.value, data.unit]
    );
  }
  return impact;
}

async function getImpactSummary(collegeId, classId = null) {
  const result = await pool.query(
    `SELECT metric_type, unit, SUM(metric_value) AS total
     FROM impact_records
     WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2)
     GROUP BY metric_type, unit
     ORDER BY total DESC`,
    [collegeId, classId]
  );
  const bySdg = await pool.query(
    `SELECT sdg_goal_id, COUNT(*)::int AS submissions, SUM(metric_value) AS impact_score
     FROM impact_records
     WHERE college_id = $1 AND ($2::text IS NULL OR class_id = $2) AND sdg_goal_id IS NOT NULL
     GROUP BY sdg_goal_id
     ORDER BY sdg_goal_id`,
    [collegeId, classId]
  );
  return {
    totals: result.rows.map(r => ({ metricType: r.metric_type, unit: r.unit, total: Number(r.total) })),
    bySdg: bySdg.rows.map(r => ({ goalId: r.sdg_goal_id, submissions: r.submissions, impactScore: Number(r.impact_score) }))
  };
}

async function getStudentImpact(studentId) {
  const result = await pool.query(
    `SELECT metric_type, unit, SUM(metric_value) AS total
     FROM impact_records WHERE student_id = $1 GROUP BY metric_type, unit`,
    [studentId]
  );
  return result.rows.map(r => ({ metricType: r.metric_type, unit: r.unit, total: Number(r.total) }));
}

module.exports = { estimateImpact, recordImpact, getImpactSummary, getStudentImpact };
