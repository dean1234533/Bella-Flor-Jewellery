// PUT    /api/admin/products/:id  → edit a product
// DELETE /api/admin/products/:id  → delete a product (and its uploaded photo)
import { db, json } from "../../../_lib/db.js";
import { cleanProduct } from "../../../_lib/product-validate.js";

export async function onRequestPut({ request, env, params }) {
  const DB = await db(env);
  const { error, value } = cleanProduct(await request.json().catch(() => ({})));
  if (error) return json({ error }, 400);

  const old = await DB.prepare("SELECT image FROM products WHERE id = ?").bind(Number(params.id)).first();
  const res = await DB.prepare(
    `UPDATE products SET name=?, category=?, price=?, material=?, description=?, tag=?, color=?,
       image=?, stock=?, active=?, updated_at=datetime('now') WHERE id=?`
  ).bind(value.name, value.category, value.price, value.material, value.description, value.tag,
         value.color, value.image, value.stock, value.active, Number(params.id)).run();
  if (!res.meta.changes) return json({ error: "Product not found." }, 404);
  if (old && old.image !== value.image) await deleteUploaded(env, old.image);
  return json({ ok: true });
}

// Removes a photo from storage only if it was uploaded via the admin.
async function deleteUploaded(env, image) {
  const m = /^\/api\/img\/(products\/[A-Za-z0-9-]+\.(?:webp|jpg|png))$/.exec(image || "");
  if (!m) return;
  if (env.IMAGES) await env.IMAGES.delete(m[1]).catch(() => {});
  const DB = await db(env);
  await DB.prepare("DELETE FROM images WHERE key = ?").bind(m[1]).run().catch(() => {});
}

export async function onRequestDelete({ env, params }) {
  const DB = await db(env);
  const id = Number(params.id);
  const row = await DB.prepare("SELECT image FROM products WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Product not found." }, 404);
  await DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  await deleteUploaded(env, row.image);
  return json({ ok: true });
}
