// =============================================================
// functions/api/webhook.js  —  Cloudflare Pages Function
// Route: POST /api/webhook   (set this URL in Stripe → Webhooks)
// -------------------------------------------------------------
// Stripe calls this after a payment. We verify the request really
// came from Stripe, then email the customer a branded order
// confirmation that shows exactly what they bought, the price and
// the total, with a product image they can click to view full size.
//
// Email is sent via Resend (https://resend.com) using fetch — no
// Node dependencies, works on the Cloudflare Workers runtime.
//
// Environment variables required (Pages → Settings → Environment):
//   STRIPE_SECRET_KEY      sk_test_... (already set for checkout)
//   STRIPE_WEBHOOK_SECRET  whsec_...   (from the Stripe webhook you create)
//   RESEND_API_KEY         re_...      (from your Resend dashboard)
//   FROM_EMAIL  (optional) e.g. "Bella Flor Jewellery <orders@bellaflorjewellery.co.uk>"
//   STORE_EMAIL (optional) your own address — gets BCC'd a copy of every order
// =============================================================

import PRODUCTS from "../../script/products.js";

const DEFAULT_FROM = "Bella Flor Jewellery <onboarding@resend.dev>";

export async function onRequestPost(context) {
  const { request, env } = context;

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  // 1. Verify the event genuinely came from Stripe.
  const verified = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!verified) {
    console.error("Webhook signature verification failed.");
    return new Response("Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // 2. Only act on a completed, paid checkout.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await sendOrderEmail(session, env, new URL(request.url).origin);
      } catch (err) {
        console.error("Failed to send order email:", err);
        // Still return 200 so Stripe doesn't retry forever; the payment is fine.
      }
    }
  }

  return new Response("ok", { status: 200 });
}

// ── Build and send the confirmation email via Resend ──────────────
async function sendOrderEmail(session, env, origin) {
  const items = parseCartMetadata(session.metadata);

  const customer = session.customer_details || {};
  const to = customer.email;
  if (!to) {
    console.error("No customer email on session; cannot send confirmation.");
    return;
  }

  const currency = (session.currency || "gbp").toUpperCase();
  const total = formatMoney(session.amount_total, currency);
  const orderRef = (session.id || "").replace("cs_", "").slice(0, 12).toUpperCase();
  const shipping = formatAddress(session.shipping_details || session.customer_details);

  const subjectName = items.length === 1
    ? items[0].product.name
    : `${items.length} items`;

  const html = orderEmailHtml({
    customerName: customer.name || "there",
    items, currency, total, orderRef, shipping, origin,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || DEFAULT_FROM,
      to: [to],
      ...(env.STORE_EMAIL ? { bcc: [env.STORE_EMAIL] } : {}),
      subject: `Your Bella Flor order is confirmed — ${subjectName}`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${detail}`);
  }
}

// Rebuilds the basket from checkout.js's compact metadata[cart] = "[[id,qty],...]".
// Falls back to the old single-item metadata[product_id] for any in-flight
// sessions created just before this deploy.
function parseCartMetadata(metadata) {
  metadata = metadata || {};
  let pairs = [];
  if (metadata.cart) {
    try {
      pairs = JSON.parse(metadata.cart);
    } catch {
      pairs = [];
    }
  } else if (metadata.product_id) {
    pairs = [[Number(metadata.product_id), 1]];
  }

  return pairs
    .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty: Number(qty) || 1 }))
    .filter((line) => line.product);
}

// ── Branded HTML email. Each item's image links to the full-size file,
//    so tapping/clicking it opens the photo big in the browser. ──
function orderEmailHtml({ customerName, items, currency, total, orderRef, shipping, origin }) {
  const rows = items.map(({ product, qty }) => {
    const imageUrl = `${origin}/${product.image}`;
    const lineTotal = formatMoney(Math.round(product.price * qty * 100), currency);
    return `
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe6d6;border-radius:14px;overflow:hidden;margin-bottom:14px;">
            <tr>
              <td width="112" style="padding:14px;vertical-align:top;">
                <a href="${imageUrl}" target="_blank" style="display:block;text-decoration:none;">
                  <img src="${imageUrl}" width="84" alt="${escapeHtml(product.name)}" style="display:block;width:84px;height:84px;object-fit:cover;border-radius:10px;border:1px solid #efe6d6;" />
                </a>
              </td>
              <td style="padding:14px 14px 14px 0;vertical-align:top;">
                <div style="font-size:15px;font-weight:600;color:#3a2f1d;">${escapeHtml(product.name)}</div>
                <div style="font-size:12px;color:#9C917E;margin-top:2px;">${escapeHtml(product.material)}</div>
                <div style="font-size:12px;color:#6f6552;margin-top:8px;">Quantity: ${qty}</div>
                <div style="font-size:14px;color:#7A5D2F;font-weight:600;margin-top:4px;">${lineTotal}</div>
              </td>
            </tr>
          </table>
        </td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fbf6ef;font-family:'Helvetica Neue',Arial,sans-serif;color:#3a2f1d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf6ef;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(122,93,47,.12);">

        <tr><td style="background:#7A5D2F;padding:26px 32px;text-align:center;">
          <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px;">Bella Flor Jewellery</div>
          <div style="color:#e8dcc8;font-size:12px;margin-top:4px;">Handcrafted cord bracelets · Made with love</div>
        </td></tr>

        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0 0 6px;font-size:21px;color:#3a2f1d;">Thank you, ${escapeHtml(customerName)}!</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#6f6552;">Your order is confirmed and being lovingly prepared. Here's a full copy of what you ordered.</p>
          <p style="margin:14px 0 0;font-size:12px;color:#9C917E;">Order reference: <strong style="color:#7A5D2F;">#${escapeHtml(orderRef)}</strong></p>
        </td></tr>

        <tr><td style="height:20px;"></td></tr>
        ${rows}

        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;border-top:1px solid #efe6d6;font-size:14px;color:#6f6552;">Total paid</td>
              <td style="padding:10px 0;border-top:1px solid #efe6d6;font-size:18px;font-weight:700;color:#3a2f1d;text-align:right;">${total}</td>
            </tr>
          </table>
        </td></tr>

        ${shipping ? `
        <tr><td style="padding:18px 32px 4px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#a89a82;margin-bottom:6px;">Shipping to</div>
          <div style="font-size:14px;line-height:1.6;color:#6f6552;">${shipping}</div>
        </td></tr>` : ""}

        <tr><td style="padding:26px 32px 34px;text-align:center;">
          <a href="${origin}/collection" style="display:inline-block;background:#7A5D2F;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:12px 28px;border-radius:30px;">Continue shopping</a>
          <p style="margin:22px 0 0;font-size:11px;color:#b8ab97;line-height:1.6;">If you have any questions about your order, just reply to this email.<br/>Bella Flor Jewellery · United Kingdom</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────
function formatMoney(amountInMinor, currency) {
  const value = (Number(amountInMinor) || 0) / 100;
  const symbol = currency === "GBP" ? "£" : "";
  return `${symbol}${value.toFixed(2)}`;
}

function formatAddress(details) {
  if (!details) return "";
  const a = details.address || {};
  const lines = [
    details.name,
    a.line1,
    a.line2,
    [a.city, a.postal_code].filter(Boolean).join(", "),
    a.country,
  ].filter(Boolean).map(escapeHtml);
  return lines.join("<br/>");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// ── Verify Stripe's webhook signature using Web Crypto (HMAC-SHA256). ──
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;

  const parts = {};
  sigHeader.split(",").forEach((kv) => {
    const [k, v] = kv.split("=");
    parts[k] = v;
  });
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

  // Reject events older than 5 minutes (replay protection).
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${rawBody}`));
  const computed = [...new Uint8Array(signatureBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison.
  if (computed.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0;
}
