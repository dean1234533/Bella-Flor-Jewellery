// POST /api/admin/push-test → sends a test notification to every
// subscribed device (the service worker recognises it via /summary).
import { db, json } from "../../_lib/db.js";
import { notifyAdmin } from "../../_lib/push.js";

export async function onRequestPost({ env }) {
  const DB = await db(env);
  await DB.prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('test_ping', ?)").bind(String(Date.now())).run();
  await notifyAdmin(env);
  return json({ ok: true });
}
