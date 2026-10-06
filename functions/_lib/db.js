// =============================================================
// functions/_lib/db.js — shared database helpers
// -------------------------------------------------------------
// D1 (binding "DB") holds products, orders, enquiries, push
// subscriptions and (unless an R2 bucket is bound) product photos. The schema is created automatically the first
// time any function runs, and the catalog is seeded once from
// script/products.js so the shop looks identical on day one.
//
// If D1 is not bound (or errors), getCatalog() falls back to the
// static catalog so the public shop and checkout keep working.
// =============================================================

import STATIC_PRODUCTS from "../../script/products.js";

export const CATEGORIES = ["Two-tone", "Chunky", "Slim"];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Two-tone',
    price REAL NOT NULL,
    material TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#F5ECD9',
    image TEXT NOT NULL DEFAULT '',
    stock INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'contact',
    status TEXT NOT NULL DEFAULT 'new',
    ip_hash TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_session TEXT NOT NULL UNIQUE,
    ref TEXT NOT NULL,
    customer_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    total_pence INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'gbp',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    key TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS push_subs (
    endpoint TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`,
];

let ready = null;

export function hasDb(env) {
  return !!(env && env.DB);
}

// Returns the D1 binding once the schema exists and the catalog is seeded.
export async function db(env) {
  if (!hasDb(env)) throw new Error("D1 database (binding DB) is not configured.");
  if (!ready) {
    ready = setup(env.DB).catch((err) => {
      ready = null; // retry next request
      throw err;
    });
  }
  await ready;
  return env.DB;
}

async function setup(DB) {
  await DB.batch(SCHEMA.map((sql) => DB.prepare(sql)));
  const seeded = await DB.prepare("SELECT v FROM meta WHERE k = 'seeded'").first();
  if (seeded) return;
  const stmts = STATIC_PRODUCTS.map((p, i) =>
    DB.prepare(
      `INSERT OR IGNORE INTO products (id, name, category, price, material, description, tag, color, image, stock, active, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?)`
    ).bind(p.id, p.name, p.category, p.price, p.material, p.description, p.tag, p.color, p.image, i + 1)
  );
  stmts.push(DB.prepare("INSERT OR REPLACE INTO meta (k, v) VALUES ('seeded', '1')"));
  await DB.batch(stmts);
}

// ── Products ─────────────────────────────────────────────────────
export function soldOut(p) {
  return p.stock !== null && p.stock !== undefined && p.stock <= 0;
}

function rowToProduct(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: r.price,
    currency: "gbp",
    material: r.material,
    description: r.description,
    tag: r.tag,
    color: r.color,
    image: r.image,
    stock: r.stock === null || r.stock === undefined ? null : Number(r.stock),
    active: !!r.active,
    sort: r.sort,
  };
}

function staticCatalog() {
  return STATIC_PRODUCTS.map((p, i) => ({ ...p, currency: "gbp", stock: null, active: true, sort: i + 1 }));
}

// includeHidden=true is for admin screens and for looking up products on
// already-paid orders (a hidden product can still appear on an old order).
export async function getCatalog(env, { includeHidden = false } = {}) {
  if (!hasDb(env)) return staticCatalog();
  try {
    const DB = await db(env);
    const { results } = await DB.prepare(
      `SELECT * FROM products ${includeHidden ? "" : "WHERE active = 1"} ORDER BY sort ASC, id ASC`
    ).all();
    return results.map(rowToProduct);
  } catch (err) {
    console.error("getCatalog failed, using static catalog:", err);
    return staticCatalog();
  }
}

// ── Misc ─────────────────────────────────────────────────────────
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

// Product images may be a site-relative path ("images/x.webp") or an
// absolute path served by the image function ("/api/img/...").
export function absUrl(origin, path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}/${String(path).replace(/^\/+/, "")}`;
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
