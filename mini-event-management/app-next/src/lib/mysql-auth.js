import "server-only";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getMysqlPool } from "@/lib/mysql";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "mem_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  const [scheme, salt, expectedHex] = String(encoded || "").split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function registerUser(email, password) {
  const pool = getMysqlPool();
  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existing.length) return { ok: false, reason: "email_exists" };

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  await pool.execute(
    "INSERT INTO users (id, email, password_hash, email_verified_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))",
    [id, normalizedEmail, passwordHash]
  );
  await createUserSession(id);
  return { ok: true, user: { id, email: normalizedEmail } };
}

export async function loginUser(email, password) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { ok: false, reason: "invalid_credentials" };
  }
  await createUserSession(user.id);
  return { ok: true, user: { id: user.id, email: user.email } };
}

async function createUserSession(userId) {
  const pool = getMysqlPool();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await pool.execute(
    "INSERT INTO auth_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [randomUUID(), userId, hashToken(token), expiresAt]
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return null;

  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, m.id AS member_id, m.group_id AS member_group_id,
            m.full_name, m.contact
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN members m ON m.auth_user_id = u.id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP(3)
      LIMIT 1`,
    [hashToken(token)]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    member: row.member_id ? {
      id: row.member_id,
      group_id: row.member_group_id,
      full_name: row.full_name,
      contact: row.contact,
    } : null,
  };
}

export async function destroyUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
    await getMysqlPool().execute("DELETE FROM auth_sessions WHERE token_hash = ?", [hashToken(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}
