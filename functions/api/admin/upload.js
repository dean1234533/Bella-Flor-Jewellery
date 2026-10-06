// POST /api/admin/upload  (multipart: file) → stores a product photo and
// returns the path to save on the product. Uses the R2 bucket (binding
// IMAGES) when there is one, otherwise keeps the photo in the D1 database.
// The dashboard resizes photos in the browser first, so files are small.
import { db, json } from "../../_lib/db.js";

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_DB_BYTES = 1024 * 1024; // D1 rows are capped at 2MB (base64 adds a third)

function sniff(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { ext: "jpg", type: "image/jpeg" };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png", type: "image/png" };
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { ext: "webp", type: "image/webp" };
  return null;
}

export async function onRequestPost({ request, env }) {
  const form = await request.formData().catch(() => null);
  const file = form && form.get("file");
  if (!file || typeof file === "string") return json({ error: "No file received." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Image is too large (6MB max)." }, 413);

  const buf = await file.arrayBuffer();
  const kind = sniff(new Uint8Array(buf.slice(0, 12)));
  if (!kind) return json({ error: "Please upload a JPG, PNG or WebP image." }, 415);

  const key = `products/${crypto.randomUUID()}.${kind.ext}`;
  if (env.IMAGES) {
    await env.IMAGES.put(key, buf, { httpMetadata: { contentType: kind.type } });
  } else {
    if (buf.byteLength > MAX_DB_BYTES) return json({ error: "Photo is too large. Try a smaller one." }, 413);
    const DB = await db(env);
    await DB.prepare("INSERT INTO images (key, type, data) VALUES (?, ?, ?)").bind(key, kind.type, toBase64(buf)).run();
  }
  return json({ ok: true, image: `/api/img/${key}` });
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
