// POST /api/admin/login  { password }  → sets the session cookie.
import { sessionCookie, safeEqual } from "../../_lib/auth.js";
import { db, json, sha256Hex } from "../../_lib/db.js";

const MAX_FAILS = 8;       // per visitor…
const WINDOW_SECS = 900;   // …per 15 minutes

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const DB = await db(env);
  const ip = (await sha256Hex(request.headers.get("CF-Connecting-IP") || "unknown")).slice(0, 16);
  const now = Math.floor(Date.now() / 1000);

  await DB.prepare("DELETE FROM login_attempts WHERE at < ?").bind(now - WINDOW_SECS).run();
  const fails = await DB.prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?").bind(ip).first();
  if (fails && fails.n >= MAX_FAILS) return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);

  if (!(await safeEqual(body.password || "", env.ADMIN_PASSWORD))) {
    await DB.prepare("INSERT INTO login_attempts (ip, at) VALUES (?, ?)").bind(ip, now).run();
    return json({ error: "Wrong password." }, 401);
  }

  await DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  return json({ ok: true }, 200, { "Set-Cookie": await sessionCookie(env) });
}
