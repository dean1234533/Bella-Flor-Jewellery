// GET /api/admin/me — lets the dashboard check it's still signed in.
import { json } from "../../_lib/db.js";

export async function onRequestGet() {
  return json({ ok: true });
}
