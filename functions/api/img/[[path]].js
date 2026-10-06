// GET /api/img/<key> — serves product photos uploaded from the admin
// dashboard, from the R2 bucket (binding IMAGES) or the D1 images table.
import { db, hasDb } from "../../_lib/db.js";

const headersFor = (type) => ({
  "Content-Type": type || "image/webp",
  // Keys are unique per upload, so they can be cached forever.
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
});

export async function onRequestGet({ params, env }) {
  const key = (Array.isArray(params.path) ? params.path.join("/") : params.path || "");
  if (!/^products\/[A-Za-z0-9-]+\.(webp|jpg|png)$/.test(key)) return new Response("Not found", { status: 404 });

  if (env.IMAGES) {
    const obj = await env.IMAGES.get(key);
    if (obj) return new Response(obj.body, { headers: headersFor(obj.httpMetadata?.contentType) });
  }

  if (hasDb(env)) {
    try {
      const DB = await db(env);
      const row = await DB.prepare("SELECT type, data FROM images WHERE key = ?").bind(key).first();
      if (row) {
        const bin = atob(row.data);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        return new Response(bytes, { headers: headersFor(row.type) });
      }
    } catch (err) {
      console.error("image lookup failed:", err);
    }
  }
  return new Response("Not found", { status: 404 });
}
