// GET /api/admin/summary → cheap counts + the newest order/enquiry.
// The dashboard polls this, and the service worker calls it when a
// push arrives so it can say what's new.
import { db, json } from "../../_lib/db.js";

export async function onRequestGet({ env }) {
  const DB = await db(env);
  const [newOrders, newEnquiries, latestOrder, latestEnquiry, lowStock, soldOutCount, ping] = await Promise.all([
    DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").first(),
    DB.prepare("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'").first(),
    DB.prepare("SELECT id, ref, customer_name, total_pence, created_at FROM orders ORDER BY id DESC LIMIT 1").first(),
    DB.prepare("SELECT id, name, source, created_at FROM enquiries ORDER BY id DESC LIMIT 1").first(),
    DB.prepare("SELECT COUNT(*) AS n FROM products WHERE stock IS NOT NULL AND stock > 0 AND stock <= 3").first(),
    DB.prepare("SELECT COUNT(*) AS n FROM products WHERE stock IS NOT NULL AND stock <= 0").first(),
    DB.prepare("SELECT v FROM meta WHERE k = 'test_ping'").first(),
  ]);
  return json({
    newOrders: newOrders.n,
    newEnquiries: newEnquiries.n,
    lowStock: lowStock.n,
    soldOut: soldOutCount.n,
    latestOrder: latestOrder || null,
    latestEnquiry: latestEnquiry || null,
    // true for a minute after "Send test" so the service worker words it as a test
    test: !!ping && Date.now() - Number(ping.v) < 60000,
  });
}
