// =============================================================
// functions/_lib/push.js — Web Push (VAPID) to the admin's devices
// -------------------------------------------------------------
// Sends a payload-less push. The service worker (admin/sw.js) wakes
// up, asks /api/admin/summary what's new and shows the notification.
// That avoids implementing payload encryption and still works on
// Android, desktop and iOS (installed PWA, iOS 16.4+).
//
// Needs env VAPID_PRIVATE_JWK (generate with: node admin-keys.mjs).
// The public key is derived from it, so there is only one secret.
// =============================================================

import { db } from "./db.js";

const enc = new TextEncoder();

function b64urlBytes(bytes) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function parseJwk(env) {
  try {
    return env.VAPID_PRIVATE_JWK ? JSON.parse(env.VAPID_PRIVATE_JWK) : null;
  } catch {
    return null;
  }
}

// Uncompressed P-256 public key (what the browser needs to subscribe).
export function vapidPublicKey(env) {
  const jwk = parseJwk(env);
  if (!jwk) return null;
  const bytes = new Uint8Array([4, ...fromB64url(jwk.x), ...fromB64url(jwk.y)]);
  return b64urlBytes(bytes);
}

async function vapidHeader(endpoint, env) {
  const jwk = parseJwk(env);
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = b64urlBytes(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlBytes(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.STORE_EMAIL ? `mailto:${env.STORE_EMAIL}` : "mailto:admin@bellaflorjewellery.co.uk",
  })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64urlBytes(new Uint8Array(sig))}, k=${vapidPublicKey(env)}`;
}

// Fire-and-forget friendly: never throws.
export async function notifyAdmin(env) {
  try {
    if (!parseJwk(env)) return;
    const DB = await db(env);
    const { results } = await DB.prepare("SELECT endpoint FROM push_subs").all();
    await Promise.all(results.map(async ({ endpoint }) => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: await vapidHeader(endpoint, env), TTL: "86400", Urgency: "high" },
        });
        if (res.status === 404 || res.status === 410) {
          await DB.prepare("DELETE FROM push_subs WHERE endpoint = ?").bind(endpoint).run();
        } else if (!res.ok) {
          console.error("Push failed", res.status, await res.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Push error:", err);
      }
    }));
  } catch (err) {
    console.error("notifyAdmin error:", err);
  }
}
