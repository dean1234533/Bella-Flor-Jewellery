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
    const id = Number(body.id);

    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return json({ error: "Product not found." }, 400);

    // Absolute https URL for the product image so Stripe can display it.
    const origin = new URL(request.url).origin;
    const imageUrl = `${origin}/${product.image}`;

    // Stripe's API takes form-encoded params with bracket notation.
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/collection?checkout=success&item=${product.id}`);
    params.set("cancel_url", `${origin}/collection?checkout=cancel`);
    params.set("shipping_address_collection[allowed_countries][0]", "GB");
    // Store the product id so the webhook can rebuild the order for the email.
    params.set("metadata[product_id]", String(product.id));
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", product.currency || "gbp");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(product.price * 100)));
    params.set("line_items[0][price_data][product_data][name]", product.name);
    params.set("line_items[0][price_data][product_data][description]", product.material);
    params.set("line_items[0][price_data][product_data][images][0]", imageUrl);

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
