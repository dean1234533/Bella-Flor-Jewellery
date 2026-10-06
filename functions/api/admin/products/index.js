// GET  /api/admin/products  → every product (including hidden)
// POST /api/admin/products  → add a product
import { db, getCatalog, json, CATEGORIES } from "../../../_lib/db.js";
import { cleanProduct } from "../../../_lib/product-validate.js";

export async function onRequestGet({ env }) {
  await db(env);
  return json({ products: await getCatalog(env, { includeHidden: true }), categories: CATEGORIES });
}

export async function onRequestPost({ request, env }) {
  const DB = await db(env);
  const { error, value } = cleanProduct(await request.json().catch(() => ({})));
  if (error) return json({ error }, 400);

  const top = await DB.prepare("SELECT COALESCE(MAX(sort), 0) AS m FROM products").first();
  const res = await DB.prepare(
    `INSERT INTO products (name, category, price, material, description, tag, color, image, stock, active, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(value.name, value.category, value.price, value.material, value.description, value.tag,
         value.color, value.image, value.stock, value.active, top.m + 1).run();
  return json({ ok: true, id: res.meta.last_row_id }, 201);
}
