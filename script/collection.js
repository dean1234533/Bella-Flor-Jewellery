// =============================================
// COLLECTION PAGE JS — collection.js
// =============================================

import PRODUCTS from "./products.js";
import { addToCart, clearCart } from "./cart.js";

(function () {
  // Products come from the single source of truth: script/products.js
  // Edit prices / images / names there once and both the site and the
  // Stripe checkout update together.
  const pieces = PRODUCTS;

  let currentFilter     = "All";
  let currentIndex      = 0;
  let isAnimating       = false;
  let lastViewportWidth = window.innerWidth; // track WIDTH only — not height

  function getFiltered() {
    if (currentFilter === "All") return pieces;
    return pieces.filter(p => p.category === currentFilter);
  }

  function initials(name) {
    return name.split(" ").slice(0, 2).map(w => w[0]).join("");
  }

  // ── Add to Cart → add the piece to the site-wide basket (script/cart.js). ──
  function addToCartHandler(id, btn) {
    const original = btn.textContent;
    addToCart(id, 1);
    btn.textContent = "Added ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  }

  function buildCard(piece, position) {
    const isMain = position === 0;
    const card   = document.createElement("div");
    card.className = "bracelet-card" + (isMain ? " main" : "");
    card.innerHTML = `
      <div class="card-image" style="background:${piece.color}"${piece.image
        ? ` data-expandable tabindex="0" role="button" aria-label="Expand image of ${piece.name}"`
        : ""}>
        ${piece.image
          ? `<img src="${piece.image}" class="card-img-content" alt="${piece.name}" loading="lazy">`
          : `<div class="card-initials">${initials(piece.name)}</div>`}
        <div class="card-tag-flag">${piece.tag}</div>
      </div>
      <div class="card-body">
        <span class="card-tag-badge">${piece.tag}</span>
        <p class="card-name">${piece.name}</p>
        <p class="card-material">${piece.material}</p>
        <p class="card-description">${piece.description}</p>
        <div class="card-footer">
          <span class="card-price">£${piece.price}</span>
          <button class="card-view-btn" data-product-id="${piece.id}">Add to Cart</button>
        </div>
      </div>`;
    return card;
  }

  function createImageLightbox() {
    const lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Expanded product image");
    lightbox.innerHTML = `
      <button class="image-lightbox-close" type="button" aria-label="Close expanded image">&times;</button>
      <img src="" alt="">`;
    document.body.appendChild(lightbox);

    let trigger = null;
    const closeButton = lightbox.querySelector(".image-lightbox-close");
    const expandedImage = lightbox.querySelector("img");

    function open(cardImage) {
      const image = cardImage.querySelector("img");
      if (!image) return;
      trigger = cardImage;
      expandedImage.src = image.currentSrc || image.src;
      expandedImage.alt = image.alt;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      closeButton.focus();
    }

    function close() {
      if (!lightbox.classList.contains("open")) return;
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      expandedImage.src = "";
      if (trigger && document.body.contains(trigger)) trigger.focus();
    }

    closeButton.addEventListener("click", close);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    return { open };
  }

  // Silently preload the images on either side so they're ready before the slide
  function preloadAdjacent(filtered) {
    const total = filtered.length;
    [-1, 1].forEach(offset => {
      const idx = (currentIndex + offset + total) % total;
      if (filtered[idx] && filtered[idx].image) {
        new Image().src = filtered[idx].image;
      }
    });
  }

  function updateDotsAndCounter(filtered, total) {
    const dotsEl = document.getElementById("carousel-dots");
    dotsEl.innerHTML = "";
    filtered.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === currentIndex ? " active" : "");
      dot.setAttribute("aria-label", `Go to item ${i + 1}`);
      dot.addEventListener("click", () => {
        if (isAnimating) return;
        const dir = i > currentIndex ? "next" : "prev";
        currentIndex = i;
        renderCarousel(dir);
      });
      dotsEl.appendChild(dot);
    });
    document.getElementById("carousel-counter").textContent =
      String(currentIndex + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  }

  function insertCards(track, filtered, total, isMobile) {
    track.innerHTML = "";
    if (isMobile) {
      track.appendChild(buildCard(filtered[currentIndex], 0));
    } else {
      [-1, 0, 1].forEach(offset => {
        const idx = (currentIndex + offset + total) % total;
        track.appendChild(buildCard(filtered[idx], offset));
      });
    }
  }

  function renderCarousel(direction) {
    const filtered = getFiltered();
    const total    = filtered.length;
    if (total === 0) return;
    if (currentIndex >= total) currentIndex = 0;

    const track    = document.getElementById("cards-track");
    const isMobile = window.innerWidth < 768;

    updateDotsAndCounter(filtered, total);
    preloadAdjacent(filtered);

    // No direction = first render or filter change → instant, no animation
    if (!direction) {
      insertCards(track, filtered, total, isMobile);
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const exitX  = direction === "next" ? "-60px" : "60px";
    const enterX = direction === "next" ?  "60px" : "-60px";

    // ── Step 1: slide existing card(s) out ──
    track.querySelectorAll(".bracelet-card").forEach(card => {
      card.style.transition = "transform 0.22s ease, opacity 0.22s ease";
      card.style.opacity    = "0";
      card.style.transform  = card.classList.contains("main")
        ? `translateX(${exitX}) scale(1)`
        : `translateX(${exitX}) scale(0.97)`;
    });

    setTimeout(() => {
      // ── Step 2: swap the DOM ──
      insertCards(track, filtered, total, isMobile);

      const incoming = track.querySelectorAll(".bracelet-card");

      // ── Step 3: place new card(s) off-screen with NO transition ──
      incoming.forEach(card => {
        card.style.transition = "none";
        card.style.opacity    = "0";
        card.style.transform  = card.classList.contains("main")
          ? `translateX(${enterX}) scale(1)`
          : `translateX(${enterX}) scale(0.97)`;
      });

      // ── Step 4: double-rAF ensures the browser has painted the start
      //    position before we begin the enter transition ──
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          incoming.forEach(card => {
            card.style.transition = "transform 0.28s ease, opacity 0.28s ease";
            card.style.opacity    = card.classList.contains("main") ? "1" : "";
            card.style.transform  = card.classList.contains("main")
              ? "translateX(0) scale(1)"
              : "translateX(0) scale(0.97)";
          });

          // ── Step 5: clean up so CSS classes own the styles again ──
          setTimeout(() => {
            incoming.forEach(card => {
              card.style.transition = "";
              card.style.transform  = "";
              card.style.opacity    = "";
            });
            isAnimating = false;
          }, 300);
        });
      });
    }, 230);
  }

  // ── Show a banner when the customer returns from Stripe Checkout ──
  function showCheckoutBanner() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status !== "success" && status !== "cancel") return;

    const isSuccess = status === "success";
    if (isSuccess) clearCart(); // the order is placed — empty the basket

    const banner = document.createElement("div");
    banner.className = `checkout-banner ${isSuccess ? "success" : "cancel"}`;
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <span class="checkout-banner-icon">${isSuccess ? "✓" : "!"}</span>
      <div class="checkout-banner-text">
        <p class="checkout-banner-title">${isSuccess ? "Thank you for your order!" : "Checkout cancelled"}</p>
        <p class="checkout-banner-sub">${isSuccess
          ? "Your payment was successful — a confirmation email is on its way."
          : "No payment was taken. Your basket is still here whenever you're ready."}</p>
      </div>
      <button class="checkout-banner-close" aria-label="Dismiss">&times;</button>`;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add("show"));

    const dismiss = () => {
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 400);
    };
    banner.querySelector(".checkout-banner-close").addEventListener("click", dismiss);
    if (isSuccess) setTimeout(dismiss, 8000); // auto-hide success after 8s

    // Clean the checkout params from the URL without reloading.
    params.delete("checkout");
    params.delete("item");
    const clean = window.location.pathname + (params.toString() ? "?" + params : "");
    window.history.replaceState({}, "", clean);
  }

  function init() {
    showCheckoutBanner();
    const imageLightbox = createImageLightbox();

    // Delegated Add to Cart handler — works across carousel re-renders.
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".card-view-btn");
      if (btn && btn.dataset.productId) addToCartHandler(btn.dataset.productId, btn);

      const cardImage = e.target.closest(".card-image[data-expandable]");
      if (cardImage) imageLightbox.open(cardImage);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const cardImage = e.target.closest(".card-image[data-expandable]");
      if (!cardImage) return;
      e.preventDefault();
      imageLightbox.open(cardImage);
    });

    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.dataset.filter;
        currentIndex  = 0;
        renderCarousel(); // instant — no slide on filter change
      });
    });

    document.getElementById("prev-btn").addEventListener("click", () => {
      if (isAnimating) return;
      const filtered = getFiltered();
      currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
      renderCarousel("prev");
    });

    document.getElementById("next-btn").addEventListener("click", () => {
      if (isAnimating) return;
      const filtered = getFiltered();
      currentIndex = (currentIndex + 1) % filtered.length;
      renderCarousel("next");
    });

    // ─────────────────────────────────────────────────────────────────
    // KEY FIX — only re-render when the viewport WIDTH changes.
    //
    // On mobile, scrolling makes the browser's URL bar hide/show, which
    // fires a "resize" event with a new HEIGHT but the same WIDTH.
    // The old code re-rendered the card on every one of those events,
    // causing the flicker you saw while scrolling.
    // ─────────────────────────────────────────────────────────────────
    window.addEventListener("resize", () => {
      const w = window.innerWidth;
      if (w !== lastViewportWidth) {
        lastViewportWidth = w;
        renderCarousel(); // layout genuinely changed — safe to re-render
      }
    });

    renderCarousel(); // initial paint
  }

  document.addEventListener("DOMContentLoaded", init);
})();
