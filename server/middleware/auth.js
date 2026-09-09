const crypto = require("crypto");

const sessionSecret = process.env.SESSION_SECRET || "change-this-session-secret";

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    role: user.role,
    collegeId: user.collegeId || null,
    classId: user.classId || null,
    exp: Date.now() + 8 * 60 * 60 * 1000
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function parseSession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.id || session.exp < Date.now()) return null;
    return session;
  } catch (_error) {
    return null;
  }
}

function authenticate(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = parseSession(token);
  if (!session) return res.status(401).json({ message: "Authentication required" });
  req.auth = session;
  next();
}

function optionalAuthenticate(req, _res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  req.auth = parseSession(token) || undefined;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { createSessionToken, authenticate, optionalAuthenticate, requireRole, parseSession };
