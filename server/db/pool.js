const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD ?? "";
  const host = process.env.PGHOST || "localhost";
  const portNumber = process.env.PGPORT || "5432";
  const database = process.env.PGDATABASE || "sdg_connect";
  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);
  return `postgresql://${auth}@${host}:${portNumber}/${database}`;
}

function parsePoolConfig(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname || "localhost",
      port: Number(url.port || 5432),
      database: url.pathname.replace(/^\//, "") || "postgres",
      user: decodeURIComponent(url.username || "postgres"),
      password: url.password ? decodeURIComponent(url.password) : "",
      max: Number(process.env.DB_POOL_MAX || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };
  } catch (_error) {
    return {
      connectionString,
      password: "",
      max: Number(process.env.DB_POOL_MAX || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };
  }
}

const databaseUrl = resolveDatabaseUrl();
const poolConfig = parsePoolConfig(databaseUrl);
const pool = new Pool(poolConfig);

module.exports = { pool, poolConfig, databaseUrl };
