// =============================================================
// functions/api/checkout.js  —  Cloudflare Pages Function
// Route: POST /api/checkout
// -------------------------------------------------------------
// Creates a Stripe Checkout Session on the fly from the SAME
// catalog the website uses (script/products.js). Price, name and
// image are read at checkout time, so Stripe ALWAYS charges and
// shows exactly what the site shows. Change products.js once and
// both update together.
//
// Runs on the Cloudflare Workers runtime (not Node), so it calls
// the Stripe REST API directly with fetch — no Node SDK, no
// node_modules, no nodejs_compat flag required.
//
// Set STRIPE_SECRET_KEY in:
//   Cloudflare dashboard → your Pages project → Settings →
//   Environment variables (use a TEST key first: sk_test_...).
// =============================================================

import PRODUCTS from "../../script/products.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("STRIPE_SECRET_KEY is not set in the environment.");
    return json({ error: "Payment is not configured yet." }, 500);
  }

  try {
    const body = await request.json().catch(() => ({}));

    // Accept either the new basket shape ({ items: [{id, qty}, ...] }) or
    // the old single-item shape ({ id }) so nothing breaks mid-deploy.
    const rawItems = Array.isArray(body.items)
      ? body.items
      : body.id != null
        ? [{ id: body.id, qty: 1 }]
        : [];

    // Server-side validation — never trust client-sent ids/quantities/prices.
    // Every price is re-read from products.js below, so a tampered request
    // body can at most change WHICH products are bought, never their price.
    const MAX_QTY = 20;
    const cartLines = [];
    for (const raw of rawItems) {
      const id = Number(raw && raw.id);
      const product = PRODUCTS.find((p) => p.id === id);
      if (!product) continue; // unknown/removed product — skip it
      const qty = Math.max(1, Math.min(MAX_QTY, Math.round(Number(raw.qty)) || 1));
      const existing = cartLines.find((l) => l.product.id === id);
      if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
      else cartLines.push({ product, qty });
    }

    if (cartLines.length === 0) return json({ error: "Your basket is empty." }, 400);

    const origin = new URL(request.url).origin;

    // Stripe's API takes form-encoded params with bracket notation.
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/collection?checkout=success`);
    params.set("cancel_url", `${origin}/collection?checkout=cancel`);
    params.set("shipping_address_collection[allowed_countries][0]", "GB");
    // Store a compact [id, qty] list so the webhook can rebuild the full
    // order for the confirmation email.
    params.set("metadata[cart]", JSON.stringify(cartLines.map((l) => [l.product.id, l.qty])));

    cartLines.forEach((line, i) => {
      const imageUrl = `${origin}/${line.product.image}`;
      params.set(`line_items[${i}][quantity]`, String(line.qty));
      params.set(`line_items[${i}][price_data][currency]`, line.product.currency || "gbp");
      params.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(line.product.price * 100)));
      params.set(`line_items[${i}][price_data][product_data][name]`, line.product.name);
      params.set(`line_items[${i}][price_data][product_data][description]`, line.product.material);
      params.set(`line_items[${i}][price_data][product_data][images][0]`, imageUrl);
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return json({ error: "Could not start checkout. Please try again." }, 500);
    }

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error("Checkout error:", err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
}

// Friendly response if someone opens /api/checkout in a browser (GET).
export async function onRequestGet() {
  return json({ error: "Send a POST request with a product id." }, 405);
}
