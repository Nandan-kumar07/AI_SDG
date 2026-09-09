const { pool } = require("../db");

async function createNotification(userId, type, title, message, link = null) {
  await pool.query(
    "INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1,$2,$3,$4,$5)",
    [userId, type, title, message, link]
  );
}

async function getNotifications(userId, limit = 20) {
  const result = await pool.query(
    "SELECT id, type, title, message, link, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit]
  );
  return result.rows.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    read: r.read,
    createdAt: r.created_at
  }));
}

async function markNotificationRead(userId, notificationId) {
  await pool.query("UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2", [notificationId, userId]);
}

async function markAllNotificationsRead(userId) {
  await pool.query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [userId]);
}

module.exports = { createNotification, getNotifications, markNotificationRead, markAllNotificationsRead };
