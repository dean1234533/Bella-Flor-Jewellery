// GET /api/products — the live catalog for the public shop.
// Hidden products are left out; exact stock counts are never exposed.
import { getCatalog, json, soldOut } from "../_lib/db.js";

export async function onRequestGet({ env }) {
  const products = (await getCatalog(env)).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    currency: p.currency,
    material: p.material,
    description: p.description,
    tag: p.tag,
    color: p.color,
    image: p.image,
    soldOut: soldOut(p),
  }));
  return json({ products }, 200, { "Cache-Control": "public, max-age=10" });
}
