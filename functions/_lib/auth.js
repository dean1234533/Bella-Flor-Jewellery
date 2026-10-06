// =============================================================
// functions/_lib/auth.js — admin login session
// -------------------------------------------------------------
// One shared admin password (env ADMIN_PASSWORD). Logging in sets
// an HttpOnly, Secure, SameSite=Strict cookie holding an expiry
// plus an HMAC signature keyed from the password, so it can't be
// forged and every session ends if the password is changed.
// =============================================================

const COOKIE = "bf_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const enc = new TextEncoder();

function b64url(buf) {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(`${secret}|bf-session-v1`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

// Constant-time string comparison (hash first so lengths are equal).
export async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b))),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function sessionCookie(env) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const value = `${exp}.${await sign(env.ADMIN_PASSWORD, exp)}`;
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(env.ADMIN_PASSWORD, exp));
}

// State-changing requests must come from this site (belt and braces on
// top of SameSite=Strict).
export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !!origin && origin === new URL(request.url).origin;
}
