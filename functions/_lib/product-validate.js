import { CATEGORIES } from "./db.js";

const clip = (v, n) => String(v ?? "").trim().slice(0, n);

// Validates and normalises product fields from the admin form.
export function cleanProduct(b) {
  const name = clip(b.name, 120);
  const price = Math.round(Number(b.price) * 100) / 100;
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(price) || price <= 0 || price > 10000) return { error: "Enter a price above £0." };

  const category = CATEGORIES.includes(b.category) ? b.category : CATEGORIES[0];
  const color = /^#[0-9a-fA-F]{6}$/.test(b.color || "") ? b.color : "#F5ECD9";

  // Stock: blank = not tracked (always available), otherwise a whole number ≥ 0.
  let stock = null;
  if (b.stock !== null && b.stock !== undefined && String(b.stock).trim() !== "") {
    stock = Math.round(Number(b.stock));
    if (!Number.isFinite(stock) || stock < 0 || stock > 100000) return { error: "Stock must be 0 or more (or left blank)." };
  }

  // Only accept images from this site's own folders.
  const image = clip(b.image, 300);
  if (image && !/^(images\/[\w.\- ]+|\/api\/img\/products\/[A-Za-z0-9-]+\.(webp|jpg|png))$/.test(image)) {
    return { error: "Invalid image." };
  }

  return {
    value: {
      name, price, category, color, stock, image,
      material: clip(b.material, 160),
      description: clip(b.description, 1000),
      tag: clip(b.tag, 30),
      active: b.active === false || b.active === 0 ? 0 : 1,
    },
  };
}
