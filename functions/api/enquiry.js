// POST /api/enquiry — stores a contact/enquiry form submission so it
// shows up in the admin dashboard, and pings the admin's devices.
// The website still sends its EmailJS email as before; this runs
// alongside it and never blocks the customer's form.
import { db, json, sha256Hex } from "../_lib/db.js";
import { notifyAdmin } from "../_lib/push.js";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot — real visitors never fill this in.
  if (body.website) return json({ ok: true });

  const name = clip(body.name, 120);
  const email = clip(body.email, 200);
  const phone = clip(body.phone, 40);
  const message = clip(body.message, 4000);
  const source = clip(body.source, 20) === "home" ? "home" : "contact";
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "Please fill in your name, a valid email and a message." }, 400);
  }

  try {
    const DB = await db(env);
    const ipHash = (await sha256Hex(request.headers.get("CF-Connecting-IP") || "unknown")).slice(0, 16);

    // Basic spam brake: max 5 enquiries per visitor per 10 minutes.
    const recent = await DB.prepare(
      "SELECT COUNT(*) AS n FROM enquiries WHERE ip_hash = ? AND created_at > datetime('now', '-10 minutes')"
    ).bind(ipHash).first();
    if (recent && recent.n >= 5) return json({ error: "Too many messages, please try again shortly." }, 429);

    await DB.prepare(
      "INSERT INTO enquiries (name, email, phone, message, source, ip_hash) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(name, email, phone, message, source, ipHash).run();

    const ping = notifyAdmin(env);
    if (typeof context.waitUntil === "function") context.waitUntil(ping);
    else await ping;
    return json({ ok: true });
  } catch (err) {
    console.error("enquiry error:", err);
    return json({ error: "Could not save enquiry." }, 500);
  }
}
