import { clearCookie } from "../../_lib/auth.js";
import { json } from "../../_lib/db.js";

export async function onRequestPost() {
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
}
