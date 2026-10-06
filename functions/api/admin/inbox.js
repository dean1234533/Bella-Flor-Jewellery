// GET /api/admin/inbox → recent orders and enquiries for the dashboard.
import { db, json } from "../../_lib/db.js";

export async function onRequestGet({ env }) {
  const DB = await db(env);
  const [orders, enquiries] = await Promise.all([
    DB.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all(),
    DB.prepare("SELECT id, name, email, phone, message, source, status, created_at FROM enquiries ORDER BY id DESC LIMIT 100").all(),
  ]);
  return json({
    orders: orders.results.map((o) => ({ ...o, items: safeParse(o.items, []) })),
    enquiries: enquiries.results,
  });
}

function safeParse(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}
