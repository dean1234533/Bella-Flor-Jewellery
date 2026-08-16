// =============================================================
// script/cart.js — site-wide shopping basket
// -------------------------------------------------------------
// Loaded as a module (`<script type="module">`) on every page, right
// after nav.js. Cart state lives in localStorage; product data is
// always read fresh from products.js (the single source of truth) so
// names/prices/images shown here can never drift from the site or
// from what the server will actually charge.
//
// Injects a cart icon + badge into the header and a slide-out drawer
// into <body> via DOM, rather than editing the header markup in all
// 16 pages — the same approach nav.js already uses for the cookie
// consent banner.
// =============================================================

import PRODUCTS from "./products.js";

const STORAGE_KEY = "bf-cart";
const MAX_QTY = 20;

// ── State ────────────────────────────────────────────────────────
export function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((l) => l && Number.isFinite(l.id) && Number.isFinite(l.qty) && l.qty > 0);
  } catch {
    return [];
  }
}

function setCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  renderCart();
}

export function addToCart(id, qty = 1) {
  id = Number(id);
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;

  const items = getCart();
  const line = items.find((l) => l.id === id);
  if (line) {
    line.qty = Math.min(MAX_QTY, line.qty + qty);
  } else {
    items.push({ id, qty: Math.min(MAX_QTY, qty) });
  }
  setCart(items);
}

export function updateQty(id, qty) {
  id = Number(id);
  qty = Math.max(0, Math.min(MAX_QTY, Number(qty) || 0));
  let items = getCart();
  if (qty === 0) {
    items = items.filter((l) => l.id !== id);
  } else {
    const line = items.find((l) => l.id === id);
    if (line) line.qty = qty;
  }
  setCart(items);
}

export function removeFromCart(id) {
  updateQty(id, 0);
}

export function clearCart() {
  setCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, l) => sum + l.qty, 0);
}

function getCartLinesWithProducts() {
  return getCart()
    .map((l) => ({ ...l, product: PRODUCTS.find((p) => p.id === l.id) }))
    .filter((l) => l.product);
}

function getCartTotal() {
  return getCartLinesWithProducts().reduce((sum, l) => sum + l.product.price * l.qty, 0);
}

function money(n) {
  return `£${n.toFixed(2)}`;
}

// ── UI injection ─────────────────────────────────────────────────
let drawerEl, backdropEl, itemsEl, subtotalEl, checkoutBtn, lastFocused;

function cartIconSvg() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    <path d="M6 8h12l-1.2 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"/>
    <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
  </svg>`;
}

function buildToggleButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cart-toggle";
  btn.setAttribute("aria-label", "Open cart, 0 items");
  btn.innerHTML = `${cartIconSvg()}<span class="cart-badge" id="cart-badge-${Math.random().toString(36).slice(2)}" hidden>0</span>`;
  btn.addEventListener("click", openDrawer);
  return btn;
}

function injectToggleButtons() {
  const navBar = document.querySelector(".navBar");
  const hamburger = navBar && navBar.querySelector(".btn");
  if (navBar && hamburger && !navBar.querySelector(".cart-toggle")) {
    navBar.insertBefore(buildToggleButton(), hamburger);
  }

  const desktopContainer = document.querySelector(".nav-desktop-container");
  if (desktopContainer && !desktopContainer.querySelector(".cart-toggle")) {
    desktopContainer.appendChild(buildToggleButton());
  }
}

function injectDrawer() {
  backdropEl = document.createElement("div");
  backdropEl.className = "cart-drawer-backdrop";
  backdropEl.addEventListener("click", closeDrawer);

  drawerEl = document.createElement("aside");
  drawerEl.className = "cart-drawer";
  drawerEl.setAttribute("role", "dialog");
  drawerEl.setAttribute("aria-modal", "true");
  drawerEl.setAttribute("aria-label", "Shopping cart");
  drawerEl.innerHTML = `
    <div class="cart-drawer-header">
      <h2>Your Basket</h2>
      <button type="button" class="cart-drawer-close" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-drawer-items"></div>
    <div class="cart-drawer-footer">
      <div class="cart-drawer-subtotal">
        <span>Subtotal</span>
        <span class="cart-drawer-subtotal-value">£0.00</span>
      </div>
      <button type="button" class="cart-drawer-checkout">Checkout</button>
      <p class="cart-drawer-note">Free UK delivery on every order.</p>
    </div>`;

  document.body.appendChild(backdropEl);
  document.body.appendChild(drawerEl);

  itemsEl = drawerEl.querySelector(".cart-drawer-items");
  subtotalEl = drawerEl.querySelector(".cart-drawer-subtotal-value");
  checkoutBtn = drawerEl.querySelector(".cart-drawer-checkout");

  drawerEl.querySelector(".cart-drawer-close").addEventListener("click", closeDrawer);
  checkoutBtn.addEventListener("click", checkout);

  // Delegated qty/remove handlers — rows are re-rendered on every change.
  itemsEl.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;
    const id = Number(row.dataset.id);

    if (e.target.closest(".cart-item-remove")) {
      removeFromCart(id);
      return;
    }
    const stepBtn = e.target.closest(".cart-qty-btn");
    if (stepBtn) {
      const current = getCart().find((l) => l.id === id);
      if (!current) return;
      const delta = stepBtn.dataset.action === "inc" ? 1 : -1;
      updateQty(id, current.qty + delta);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawerEl.classList.contains("open")) closeDrawer();
  });
}

function openDrawer() {
  lastFocused = document.activeElement;
  drawerEl.classList.add("open");
  backdropEl.classList.add("open");
  drawerEl.querySelector(".cart-drawer-close").focus();
}

function closeDrawer() {
  drawerEl.classList.remove("open");
  backdropEl.classList.remove("open");
  if (lastFocused) lastFocused.focus();
}

function renderCart() {
  const lines = getCartLinesWithProducts();
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  document.querySelectorAll(".cart-toggle").forEach((btn) => {
    const badge = btn.querySelector(".cart-badge");
    badge.textContent = String(count);
    badge.hidden = count === 0;
    btn.setAttribute("aria-label", `Open cart, ${count} item${count === 1 ? "" : "s"}`);
  });

  if (!itemsEl) return; // drawer not injected yet

  if (lines.length === 0) {
    itemsEl.innerHTML = `<p class="cart-empty">Your basket is empty. <a href="/collection">Browse the collection</a></p>`;
    checkoutBtn.disabled = true;
  } else {
    itemsEl.innerHTML = lines
      .map(
        (l) => `
      <div class="cart-item" data-id="${l.id}">
        <img class="cart-item-img" src="${l.product.image}" alt="${l.product.name}" width="64" height="64" loading="lazy">
        <div class="cart-item-body">
          <p class="cart-item-name">${l.product.name}</p>
          <p class="cart-item-price">${money(l.product.price)}</p>
          <div class="cart-item-qty">
            <button type="button" class="cart-qty-btn" data-action="dec" aria-label="Decrease quantity">&minus;</button>
            <span class="cart-qty-value">${l.qty}</span>
            <button type="button" class="cart-qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="cart-item-remove" aria-label="Remove ${l.product.name} from cart">&times;</button>
      </div>`
      )
      .join("");
    checkoutBtn.disabled = false;
  }

  subtotalEl.textContent = money(getCartTotal());
}

// ── Checkout ─────────────────────────────────────────────────────
async function checkout() {
  const items = getCart();
  if (items.length === 0) return;

  const original = checkoutBtn.textContent;
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Loading…";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error(data.error || "Checkout failed");
  } catch (err) {
    console.error(err);
    alert("Sorry, we couldn't start checkout. Please try again.");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = original;
  }
}

// ── Init ─────────────────────────────────────────────────────────
function init() {
  injectToggleButtons();
  injectDrawer();
  renderCart();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
