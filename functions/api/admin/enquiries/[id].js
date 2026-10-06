// PATCH  /api/admin/enquiries/:id  { status: "new" | "read" | "done" }
// DELETE /api/admin/enquiries/:id
import { db, json } from "../../../_lib/db.js";

const STATUSES = ["new", "read", "done"];

export async function onRequestPatch({ request, env, params }) {
  const DB = await db(env);
  const { status } = await request.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return json({ error: "Invalid status." }, 400);
  await DB.prepare("UPDATE enquiries SET status = ? WHERE id = ?").bind(status, Number(params.id)).run();
  return json({ ok: true });
}

export async function onRequestDelete({ env, params }) {
  const DB = await db(env);
  await DB.prepare("DELETE FROM enquiries WHERE id = ?").bind(Number(params.id)).run();
  return json({ ok: true });
}
