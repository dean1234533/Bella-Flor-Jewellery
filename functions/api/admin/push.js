// GET    /api/admin/push  → { publicKey } so the browser can subscribe
// POST   /api/admin/push  { endpoint } → remember this device
// DELETE /api/admin/push  { endpoint } → forget this device
import { db, json } from "../../_lib/db.js";
import { vapidPublicKey } from "../../_lib/push.js";

export async function onRequestGet({ env }) {
  const publicKey = vapidPublicKey(env);
  if (!publicKey) return json({ error: "Push notifications are not set up yet (missing VAPID_PRIVATE_JWK)." }, 503);
  return json({ publicKey });
}

export async function onRequestPost({ request, env }) {
  const DB = await db(env);
  const { endpoint } = await request.json().catch(() => ({}));
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) {
    return json({ error: "Invalid subscription." }, 400);
  }
  await DB.prepare("INSERT OR IGNORE INTO push_subs (endpoint) VALUES (?)").bind(endpoint).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const DB = await db(env);
  const { endpoint } = await request.json().catch(() => ({}));
  if (typeof endpoint === "string") await DB.prepare("DELETE FROM push_subs WHERE endpoint = ?").bind(endpoint).run();
  return json({ ok: true });
}
