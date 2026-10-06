// =============================================================
// catalog.js — the live product list for the public shop
// -------------------------------------------------------------
// Products are managed in the admin dashboard and served from
// /api/products. PRODUCTS starts as the static list in products.js
// and is swapped in place for the live one as soon as it loads, so
// if the API is ever unreachable the shop still works.
//
// `catalogReady` resolves once the live list has loaded (or failed).
// =============================================================

import STATIC_PRODUCTS from "./products.js";

export const PRODUCTS = [...STATIC_PRODUCTS];

export const catalogReady = (async () => {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("/api/products", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.products)) PRODUCTS.splice(0, PRODUCTS.length, ...data.products);
  } catch {
    /* keep the static catalog */
  }
})();
