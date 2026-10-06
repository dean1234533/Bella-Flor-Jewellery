// PATCH /api/admin/orders/:id  { status: "new" | "packed" | "shipped" }
import { db, json } from "../../../_lib/db.js";

const STATUSES = ["new", "packed", "shipped"];

export async function onRequestPatch({ request, env, params }) {
  const DB = await db(env);
  const { status } = await request.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return json({ error: "Invalid status." }, 400);
  await DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, Number(params.id)).run();
  return json({ ok: true });
}
