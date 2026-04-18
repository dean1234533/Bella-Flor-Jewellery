// =============================================
// COLLECTION PAGE JS — collection.js
// =============================================

(function () {
  const pieces = [
    { id: 1, name: "Ivory Weave Bangle", category: "Chunky", price: "£18", material: "Woven Cord & Silver Toggle", description: "Double-strand ivory cord hand-woven into a smooth rounded bangle with a polished silver toggle closure.", color: "#F5ECD9", tag: "Bestseller", Image: "./images/IMG_9296.JPG", link: "https://square.link/u/QX64XqDC" },
    { id: 2, name: "Violet Weave Toggle", category: "Chunky", price: "£18", material: "Woven Cord & Silver Toggle", description: "Chunky lavender and purple herringbone-woven braid with a classic silver toggle clasp — bold and tactile.", color: "#E8D9F0", tag: "New Arrival", Image: "./images/IMG_9290.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 3, name: "Royal Gold Cord", category: "Chunky", price: "£16", material: "Thick Woven Cord & Lobster Clasp", description: "Bold solid Gold chunky rope bracelet with silver end caps and an extender chain.", color: "#D0D8F0", tag: "Popular", Image: "./images/IMG_9289.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 4, name: "Cobalt Rope Braid", category: "Chunky", price: "£16", material: "Thick Cord & Lobster Clasp", description: "Vivid royal blue chunky cord bracelet with silver end caps and lobster clasp — a bold pop of colour.", color: "#C8D4F0", tag: "Exclusive", Image: "./images/IMG_9288.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 5, name: "Blush Rope Toggle", category: "Chunky", price: "£18", material: "Woven Cord & Toggle Clasp", description: "Soft blush pink and lavender chunky woven rope with a classic silver toggle for easy fastening.", color: "#F9E8E8", tag: "Bestseller", Image: "./images/IMG_9287.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 6, name: "Dusk Duo Bangle", category: "Slim", price: "£14", material: "Fine Multi-strand Cord & Lobster Clasp", description: "Delicate silver-toned multi-strand slim bangle — understated and elegant for everyday wear.", color: "#EDE0F5", tag: "Limited", Image: "./images/IMG_9282.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 7, name: "Rust & Purple Slim", category: "Slim", price: "£12", material: "Twisted Cord & Lobster Clasp", description: "Minimalist dark twisted cord bracelet with a silver chain extension — subtle and wearable every day.", color: "#E8E8E8", tag: "New Arrival", Image: "./images/IMG_9264.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 8, name: "Plum & Blush Toggle", category: "Slim", price: "£12", material: "Twisted Cord & Chain", description: "Slender twisted cord bracelet with a fine silver chain extension — minimal and refined.", color: "#F5E0E8", tag: "Bestseller", Image: "./images/IMG_9263.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 9, name: "Ocean & Silver Hook", category: "Chunky", price: "£16", material: "Woven Cord & Hook Closure", description: "Striking blue and white chunky woven bracelet with a handmade hook closure — bold and beachy.", color: "#D0E8F5", tag: "Artisan Pick", Image: "./images/IMG_9262.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 10, name: "Berry Slim Braid", category: "Slim", price: "£12", material: "Braided Cord & Chain", description: "Dainty pink and purple slim braided cord with a delicate silver chain and lobster clasp.", color: "#F0D8E8", tag: "Artisan Pick", Image: "./images/IMG_9261.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 11, name: "Copper Slim Twist", category: "Slim", price: "£12", material: "Twisted Cord & Lobster Clasp", description: "Warm rust-red slim twisted cord bracelet with a lobster clasp — earthy and effortless.", color: "#F5DDD0", tag: "Artisan Pick", Image: "./images/IMG_9260.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 12, name: "Plum Chunky Braid", category: "Chunky", price: "£16", material: "Woven Cord & Lobster Clasp", description: "Rich deep purple chunky woven cord bracelet with silver end caps and extender chain.", color: "#E0D0F0", tag: "Artisan Pick", Image: "./images/IMG_9259.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 13, name: "Silver Chain Slim", category: "Slim", price: "£12", material: "Fine Cord & Silver Chain", description: "Delicate silver and neutral slim bracelet with a fine chain — perfect for layering.", color: "#ECECEC", tag: "Artisan Pick", Image: "./images/IMG_9258.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 14, name: "Violet Slim Cord", category: "Slim", price: "£12", material: "Twisted Cord & Lobster Clasp", description: "Elegant slim dark purple twisted cord bracelet with silver lobster clasp and extension chain.", color: "#D8D0F0", tag: "Artisan Pick", Image: "./images/IMG_9257.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 15, name: "Copper Hook Braid", category: "Chunky", price: "£18", material: "Woven Cord & Copper Hook", description: "Chunky tan and brown woven rope bracelet with a handcrafted copper arrowhead hook closure — rustic and refined.", color: "#F5EAD9", tag: "Artisan Pick", Image: "./images/IMG_9256.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 16, name: "Monochrome Weave", category: "Chunky", price: "£16", material: "Woven Cord & Toggle Clasp", description: "Classic black and white chunky herringbone-weave bracelet with a silver toggle clasp — timeless and bold.", color: "#E8E8E8", tag: "Artisan Pick", Image: "./images/IMG_9255.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 17, name: "Pastel Trio Charm", category: "Slim", price: "£14", material: "Multi-strand Cord & Charm Clasp", description: "Playful blue, pink and lilac multi-strand slim bracelet with a dainty silver charm and lobster clasp.", color: "#E0F0F5", tag: "Artisan Pick", Image: "./images/IMG_9253.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
    { id: 18, name: "Ivory Rope Toggle", category: "Chunky", price: "£18", material: "Woven Cord & Silver Toggle", description: "Clean ivory and silver chunky woven bangle with a polished toggle clasp — minimal and elegant.", color: "#F5ECD9", tag: "Bestseller", Image: "./images/IMG_9252.JPG", link: "https://yourshop.com/products/ivory-weave-bangle" },
  ];

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

  function buildCard(piece, position) {
    const isMain = position === 0;
    const card   = document.createElement("div");
    card.className = "bracelet-card" + (isMain ? " main" : "");
    card.innerHTML = `
      <div class="card-image" style="background:${piece.color}">
        ${piece.Image
          ? `<img src="${piece.Image}" class="card-img-content" alt="${piece.name}" loading="lazy">`
          : `<div class="card-initials">${initials(piece.name)}</div>`}
        <div class="card-tag-flag">${piece.tag}</div>
      </div>
      <div class="card-body">
        <span class="card-tag-badge">${piece.tag}</span>
        <p class="card-name">${piece.name}</p>
        <p class="card-material">${piece.material}</p>
        <p class="card-description">${piece.description}</p>
        <div class="card-footer">
          <span class="card-price">${piece.price}</span>
          <a href="${piece.link}" target="_blank" class="card-view-link">
            <button class="card-view-btn">Buy Now</button>
          </a>
        </div>
      </div>`;
    return card;
  }

  // Silently preload the images on either side so they're ready before the slide
  function preloadAdjacent(filtered) {
    const total = filtered.length;
    [-1, 1].forEach(offset => {
      const idx = (currentIndex + offset + total) % total;
      if (filtered[idx] && filtered[idx].Image) {
        new Image().src = filtered[idx].Image;
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

  function init() {
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