// Generates the VAPID key used for admin push notifications.
//   node admin-keys.mjs
// Copy the printed VAPID_PRIVATE_JWK line into:
//   • .dev.vars                                  (local testing)
//   • Cloudflare → Pages project → Settings → Variables and Secrets (live site, as a Secret)
// Keep it private — anyone holding it can send notifications to your devices.
import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = privateKey.export({ format: "jwk" });
console.log("VAPID_PRIVATE_JWK=" + JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }));
