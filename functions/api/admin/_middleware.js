// Guards everything under /api/admin/* except the login endpoint.
import { isAuthed, sameOrigin } from "../../_lib/auth.js";
import { json, hasDb } from "../../_lib/db.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;

  if (!env.ADMIN_PASSWORD) {
    return json({ error: "Admin is not set up yet: add the ADMIN_PASSWORD environment variable." }, 503);
  }

  if (!hasDb(env)) {
    return json({ error: "Admin database isn't connected yet: add a D1 binding named DB (see ADMIN-SETUP.md)." }, 503);
  }

  const mutating = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (mutating && !sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  if (path === "/api/admin/login") return next();
  if (!(await isAuthed(request, env))) return json({ error: "Not signed in." }, 401);
  return next();
}
