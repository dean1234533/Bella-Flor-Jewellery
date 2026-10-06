// Bella Flor Admin — dashboard logic (no framework, no build step)
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const state = {
    products: [], categories: [], orders: [], enquiries: [], summary: null,
    seg: "orders", screen: "inbox", editing: null, photo: "", pollTimer: null,
  };

  // Escape anything that came from a customer before putting it in HTML.
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "£" + Number(n).toFixed(2);
  const pence = (n) => money((Number(n) || 0) / 100);
  const when = (iso) => {
    const d = new Date(String(iso).replace(" ", "T") + "Z");
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  // ── API ───────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const init = { credentials: "same-origin", ...opts };
    if (opts.body && !(opts.body instanceof FormData)) {
      init.headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch("/api/admin" + path, init);
    if (res.status === 401 && path !== "/login") { showLogin(); throw new Error("Signed out"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 4500);
  }

  // ── Sign in / out ─────────────────────────────────────────────
  function showLogin() {
    stopPolling();
    $("#app").hidden = true;
    $("#login").hidden = false;
    $("#install-banner").classList.add("no-tabs");
    maybeShowInstallBanner();
  }

  async function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    $("#install-banner").classList.remove("no-tabs");
    await Promise.all([loadProducts(), loadInbox()]);
    startPolling();
    initPushUi();
    maybeShowInstallBanner();
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#login-error");
    err.hidden = true;
    try {
      await api("/login", { method: "POST", body: { password: $("#password").value } });
      $("#password").value = "";
      await showApp();
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });

  $("#logout").addEventListener("click", async () => {
    await api("/logout", { method: "POST" }).catch(() => {});
    showLogin();
  });

  // ── Navigation ────────────────────────────────────────────────
  const TITLES = { inbox: "Inbox", stock: "Stock", settings: "Settings" };
  function go(screen) {
    state.screen = screen;
    $$(".screen").forEach((s) => (s.hidden = s.id !== "screen-" + screen));
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.screen === screen));
    $("#screen-title").textContent = TITLES[screen];
    window.scrollTo(0, 0);
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => go(t.dataset.screen)));
  $$(".seg-btn").forEach((b) => b.addEventListener("click", () => {
    state.seg = b.dataset.seg;
    $$(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    $("#list-orders").hidden = state.seg !== "orders";
    $("#list-enquiries").hidden = state.seg !== "enquiries";
  }));

  // ── Inbox ─────────────────────────────────────────────────────
  async function loadInbox() {
    const data = await api("/inbox");
    state.orders = data.orders;
    state.enquiries = data.enquiries;
    renderInbox();
    await refreshSummary(true);
  }

  function renderInbox() {
    const newO = state.orders.filter((o) => o.status === "new").length;
    const newE = state.enquiries.filter((q) => q.status === "new").length;
    setPill("#pill-orders", newO);
    setPill("#pill-enquiries", newE);
    $("#dot-inbox").hidden = newO + newE === 0;
    setBadge(newO + newE);

    const openIds = new Set($$("[data-open='1']").map((n) => n.dataset.key));

    $("#list-orders").innerHTML = state.orders.length ? state.orders.map((o) => orderCard(o, openIds)).join("")
      : `<p class="empty">No orders yet. They'll appear here the moment someone pays.</p>`;
    $("#list-enquiries").innerHTML = state.enquiries.length ? state.enquiries.map((q) => enquiryCard(q, openIds)).join("")
      : `<p class="empty">No enquiries yet.</p>`;
  }

  function setPill(sel, n) {
    const el = $(sel);
    el.textContent = n;
    el.hidden = n === 0;
  }

  function orderCard(o, openIds) {
    const key = "o" + o.id, open = openIds.has(key);
    const lines = (o.items || []).map((i) => `
      <div class="line">
        <img src="${esc(imgSrc(i.image))}" alt="" loading="lazy">
        <span>${esc(i.name)}<br><span class="muted small">${esc(i.qty)} × ${money(i.price)}</span></span>
        <span>${money(i.price * i.qty)}</span>
      </div>`).join("");
    return `
    <article class="item ${o.status === "new" ? "is-new" : ""}">
      <div class="item-head" data-toggle="${key}">
        <div class="item-main">
          <div class="item-title">${esc(o.customer_name || "Customer")} <span class="badge ${o.status === "new" ? "new" : o.status === "shipped" ? "ok" : "warn"}">${esc(o.status)}</span></div>
          <div class="item-sub">#${esc(o.ref)} · ${esc(when(o.created_at))}</div>
        </div>
        <div class="item-right">${pence(o.total_pence)}</div>
      </div>
      <div class="item-body" data-key="${key}" data-open="${open ? 1 : 0}" ${open ? "" : "hidden"}>
        ${lines}
        <p><strong>Ship to</strong><br>${esc(o.address || "No address").replace(/\n/g, "<br>")}</p>
        <p><a href="mailto:${esc(o.email)}">${esc(o.email)}</a>${o.phone ? ` · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a>` : ""}</p>
        <div class="row">
          ${["new", "packed", "shipped"].map((s) => `<button class="btn small-btn ${o.status === s ? "primary" : ""}" data-order="${o.id}" data-status="${s}">${s === "new" ? "New" : s === "packed" ? "Packed" : "Shipped"}</button>`).join("")}
        </div>
      </div>
    </article>`;
  }

  function enquiryCard(q, openIds) {
    const key = "q" + q.id, open = openIds.has(key);
    const subject = encodeURIComponent("Re: your enquiry to Bella Flor Jewellery");
    return `
    <article class="item ${q.status === "new" ? "is-new" : ""}">
      <div class="item-head" data-toggle="${key}" data-enquiry="${q.id}" data-estatus="${esc(q.status)}">
        <div class="item-main">
          <div class="item-title">${esc(q.name)} <span class="badge ${q.status === "new" ? "new" : q.status === "done" ? "ok" : "off"}">${esc(q.status)}</span></div>
          <div class="item-sub">${esc(q.message).slice(0, 90)}${q.message.length > 90 ? "…" : ""}</div>
        </div>
        <div class="item-sub">${esc(when(q.created_at))}</div>
      </div>
      <div class="item-body" data-key="${key}" data-open="${open ? 1 : 0}" ${open ? "" : "hidden"}>
        <p>${esc(q.message)}</p>
        <p><a href="mailto:${esc(q.email)}?subject=${subject}">${esc(q.email)}</a>${q.phone ? ` · <a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>` : ""}</p>
        <div class="row">
          <a class="btn small-btn primary" href="mailto:${esc(q.email)}?subject=${subject}">Reply</a>
          ${q.status !== "done" ? `<button class="btn small-btn" data-enquiry-status="${q.id}" data-status="done">Mark done</button>` : `<button class="btn small-btn" data-enquiry-status="${q.id}" data-status="new">Reopen</button>`}
          <button class="btn small-btn danger-ghost" data-enquiry-delete="${q.id}">Delete</button>
        </div>
      </div>
    </article>`;
  }

  $("#screen-inbox").addEventListener("click", async (e) => {
    const head = e.target.closest("[data-toggle]");
    const statusBtn = e.target.closest("[data-order]");
    const eStatus = e.target.closest("[data-enquiry-status]");
    const eDelete = e.target.closest("[data-enquiry-delete]");
    try {
      if (statusBtn) {
        await api("/orders/" + statusBtn.dataset.order, { method: "PATCH", body: { status: statusBtn.dataset.status } });
        const o = state.orders.find((x) => x.id == statusBtn.dataset.order);
        if (o) o.status = statusBtn.dataset.status;
        renderInbox();
      } else if (eStatus) {
        await api("/enquiries/" + eStatus.dataset.enquiryStatus, { method: "PATCH", body: { status: eStatus.dataset.status } });
        const q = state.enquiries.find((x) => x.id == eStatus.dataset.enquiryStatus);
        if (q) q.status = eStatus.dataset.status;
        renderInbox();
      } else if (eDelete) {
        if (!confirm("Delete this enquiry?")) return;
        await api("/enquiries/" + eDelete.dataset.enquiryDelete, { method: "DELETE" });
        state.enquiries = state.enquiries.filter((x) => x.id != eDelete.dataset.enquiryDelete);
        renderInbox();
      } else if (head && !e.target.closest("a")) {
        const body = $(`[data-key="${head.dataset.toggle}"]`);
        const open = body.hidden;
        body.hidden = !open;
        body.dataset.open = open ? "1" : "0";
        // Opening an unread enquiry marks it as read.
        if (open && head.dataset.enquiry && head.dataset.estatus === "new") {
          await api("/enquiries/" + head.dataset.enquiry, { method: "PATCH", body: { status: "read" } });
          const q = state.enquiries.find((x) => x.id == head.dataset.enquiry);
          if (q) q.status = "read";
          renderInbox();
        }
      }
    } catch (ex) { toast(ex.message); }
  });

  // ── Stock ─────────────────────────────────────────────────────
  async function loadProducts() {
    const data = await api("/products");
    state.products = data.products;
    state.categories = data.categories;
    $("#f-category").innerHTML = state.categories.map((c) => `<option>${esc(c)}</option>`).join("");
    renderStock();
  }

  function imgSrc(path) {
    if (!path) return "/admin/icon-192.png";
    return /^(https?:)?\//.test(path) ? path : "/" + path;
  }

  function stockBadge(p) {
    if (!p.active) return `<span class="badge off">Hidden</span>`;
    if (p.stock === null) return `<span class="badge">Not tracked</span>`;
    if (p.stock <= 0) return `<span class="badge new">Sold out</span>`;
    if (p.stock <= 3) return `<span class="badge warn">Low · ${p.stock} left</span>`;
    return `<span class="badge ok">${p.stock} in stock</span>`;
  }

  function renderStock() {
    const q = $("#stock-search").value.trim().toLowerCase();
    const list = state.products.filter((p) => !q || (p.name + " " + p.category + " " + p.tag).toLowerCase().includes(q));
    const soldOut = state.products.filter((p) => p.stock !== null && p.stock <= 0).length;
    const hidden = state.products.filter((p) => !p.active).length;
    $("#stock-summary").textContent =
      `${state.products.length} pieces` + (soldOut ? ` · ${soldOut} sold out` : "") + (hidden ? ` · ${hidden} hidden` : "");

    $("#list-stock").innerHTML = list.length ? list.map((p) => `
      <article class="item product" data-id="${p.id}">
        <img class="thumb" src="${esc(imgSrc(p.image))}" alt="" loading="lazy">
        <div class="product-main">
          <div class="product-name">${esc(p.name)}</div>
          <div class="product-meta">${money(p.price)} · ${esc(p.category)}</div>
          <div class="product-actions">
            ${stockBadge(p)}
            ${p.stock !== null ? `<span class="stepper"><button data-step="-1" aria-label="One less">−</button><span>${p.stock}</span><button data-step="1" aria-label="One more">+</button></span>` : ""}
            <button class="btn small-btn" data-edit="${p.id}">Edit</button>
          </div>
        </div>
      </article>`).join("") : `<p class="empty">No pieces found.</p>`;
  }

  $("#stock-search").addEventListener("input", renderStock);

  $("#list-stock").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]");
    const step = e.target.closest("[data-step]");
    if (edit) return openSheet(state.products.find((p) => p.id == edit.dataset.edit));
    if (step) {
      const id = step.closest("[data-id]").dataset.id;
      const p = state.products.find((x) => x.id == id);
      const next = Math.max(0, p.stock + Number(step.dataset.step));
      step.disabled = true;
      try {
        await api("/products/" + id, { method: "PUT", body: { ...p, stock: next } });
        p.stock = next;
        renderStock();
      } catch (ex) { toast(ex.message); step.disabled = false; }
    }
  });

  $("#add-product").addEventListener("click", () => openSheet(null));

  // ── Add / edit sheet ──────────────────────────────────────────
  function setPhoto(path) {
    state.photo = path || "";
    const box = $("#photo-preview");
    box.style.backgroundImage = path ? `url("${imgSrc(path)}")` : "";
    box.classList.toggle("has-img", !!path);
  }

  function openSheet(p) {
    state.editing = p;
    $("#sheet-title").textContent = p ? "Edit piece" : "Add piece";
    $("#f-name").value = p ? p.name : "";
    $("#f-price").value = p ? p.price : "";
    $("#f-stock").value = p && p.stock !== null ? p.stock : "";
    $("#f-category").value = p ? p.category : state.categories[0];
    $("#f-tag").value = p ? p.tag : "";
    $("#f-material").value = p ? p.material : "";
    $("#f-description").value = p ? p.description : "";
    $("#f-color").value = p ? p.color : "#f5ecd9";
    $("#f-active").checked = p ? p.active : true;
    $("#delete-product").hidden = !p;
    $("#form-error").hidden = true;
    $("#photo-note").textContent = "JPG, PNG or WebP. It's resized for you.";
    setPhoto(p ? p.image : "");
    $("#sheet").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSheet() {
    $("#sheet").hidden = true;
    document.body.style.overflow = "";
  }
  $$("[data-close]").forEach((n) => n.addEventListener("click", closeSheet));

  // Shrink photos in the browser so uploads are quick on mobile data.
  async function shrink(file, max = 1400) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const toBlob = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
    let blob = await toBlob("image/webp", 0.86);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.88); // Safari has no WebP encoder
    return blob;
  }

  $("#photo-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const note = $("#photo-note");
    note.textContent = "Uploading…";
    try {
      const blob = await shrink(file);
      const form = new FormData();
      form.append("file", blob, "photo");
      const data = await api("/upload", { method: "POST", body: form });
      setPhoto(data.image);
      note.textContent = "Photo uploaded ✓";
    } catch (ex) {
      note.textContent = ex.message || "Upload failed.";
    }
  });

  $("#product-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#form-error"), btn = $("#save-product");
    err.hidden = true;
    const body = {
      name: $("#f-name").value, price: $("#f-price").value, stock: $("#f-stock").value,
      category: $("#f-category").value, tag: $("#f-tag").value, material: $("#f-material").value,
      description: $("#f-description").value, color: $("#f-color").value,
      active: $("#f-active").checked, image: state.photo,
    };
    btn.disabled = true;
    try {
      if (state.editing) await api("/products/" + state.editing.id, { method: "PUT", body });
      else await api("/products", { method: "POST", body });
      await loadProducts();
      closeSheet();
      toast(state.editing ? "Saved ✓" : "Piece added ✓");
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally { btn.disabled = false; }
  });

  $("#delete-product").addEventListener("click", async () => {
    const p = state.editing;
    if (!p || !confirm(`Delete "${p.name}" for good? To just take it off the website, switch off "Show on website" instead.`)) return;
    try {
      await api("/products/" + p.id, { method: "DELETE" });
      await loadProducts();
      closeSheet();
      toast("Deleted");
    } catch (ex) { toast(ex.message); }
  });

  // ── Live notifications while the dashboard is open ────────────
  function setBadge(n) {
    document.title = (n ? `(${n}) ` : "") + "Bella Flor Admin";
    if (navigator.setAppBadge) (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
  }

  async function refreshSummary(silent) {
    const s = await api("/summary");
    const prev = state.summary;
    state.summary = s;
    if (!silent && prev) {
      const newOrder = s.latestOrder && (!prev.latestOrder || s.latestOrder.id > prev.latestOrder.id);
      const newEnq = s.latestEnquiry && (!prev.latestEnquiry || s.latestEnquiry.id > prev.latestEnquiry.id);
      if (newOrder) {
        toast(`🛍️ New order: ${s.latestOrder.customer_name || "customer"} · ${pence(s.latestOrder.total_pence)}`);
        await Promise.all([loadInbox(), loadProducts()]);
      } else if (newEnq) {
        toast(`✉️ New enquiry from ${s.latestEnquiry.name}`);
        await loadInbox();
      }
    }
  }

  function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(() => { if (!document.hidden) refreshSummary(false).catch(() => {}); }, 20000);
  }
  function stopPolling() { clearInterval(state.pollTimer); }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !$("#app").hidden) refreshSummary(false).catch(() => {});
  });

  // ── Push notifications (works with the app closed) ────────────
  const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function b64ToBytes(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  async function currentSub() {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }

  async function initPushUi() {
    const status = $("#push-status"), help = $("#push-help");
    const show = (on, test, off) => { $("#push-enable").hidden = !on; $("#push-test").hidden = !test; $("#push-disable").hidden = !off; };
    show(false, false, false);

    if (!pushSupported || (isIos && !isStandalone())) {
      status.textContent = "Notifications aren't available in this browser tab.";
      help.textContent = isIos
        ? "On iPhone/iPad: tap Share → Add to Home Screen, open Bella Flor Admin from your home screen, then come back here to turn notifications on."
        : "Try Chrome, Edge or Safari, or install the app from this page.";
      return;
    }
    if (Notification.permission === "denied") {
      status.textContent = "Notifications are blocked for this site.";
      help.textContent = "Allow notifications for this site in your browser or phone settings, then reload.";
      return;
    }
    const sub = await currentSub().catch(() => null);
    if (sub && Notification.permission === "granted") {
      status.textContent = "On: you'll be alerted for new orders and enquiries, even with the app closed.";
      help.textContent = "";
      show(false, true, true);
    } else {
      status.textContent = "Off: turn on to be alerted for every new order and enquiry.";
      help.textContent = "";
      show(true, false, false);
    }
  }

  $("#push-enable").addEventListener("click", async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return initPushUi();
      const { publicKey } = await api("/push");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      await api("/push", { method: "POST", body: { endpoint: sub.endpoint } });
      toast("Notifications on ✓");
    } catch (ex) { toast(ex.message || "Could not turn on notifications."); }
    initPushUi();
  });

  $("#push-test").addEventListener("click", async () => {
    try { await api("/push-test", { method: "POST" }); toast("Test sent: it should arrive in a few seconds."); }
    catch (ex) { toast(ex.message); }
  });

  $("#push-disable").addEventListener("click", async () => {
    try {
      const sub = await currentSub();
      if (sub) { await api("/push", { method: "DELETE", body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); }
      toast("Notifications off");
    } catch (ex) { toast(ex.message); }
    initPushUi();
  });

  // ── Install banner (PWA) ──────────────────────────────────────
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    $("#install-btn").hidden = false;
    maybeShowInstallBanner();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    $("#install-banner").hidden = true;
    $("#install-btn").hidden = true;
    $("#install-status").textContent = "Installed ✓";
    toast("App installed ✓");
  });

  function maybeShowInstallBanner() {
    const banner = $("#install-banner");
    if (isStandalone()) { banner.hidden = true; return; }
    const dismissed = Number(store.get("bf-install-dismissed") || 0);
    if (Date.now() - dismissed < 7 * 864e5) return;
    if (deferredInstall) {
      $("#install-banner-btn").textContent = "Install";
    } else if (isIos) {
      $("#install-banner-text").textContent = "Tap the Share button, then “Add to Home Screen”. Needed for order alerts on iPhone.";
      $("#install-banner-btn").textContent = "Show me";
    } else {
      return; // browser can't install (or already installed)
    }
    setTimeout(() => { if (!isStandalone()) banner.hidden = false; }, 1200);
  }

  async function doInstall() {
    if (deferredInstall) {
      deferredInstall.prompt();
      await deferredInstall.userChoice.catch(() => {});
      deferredInstall = null;
      $("#install-banner").hidden = true;
    } else if (isIos) {
      alert("1. Tap the Share button (square with an arrow) in Safari.\n2. Choose “Add to Home Screen”.\n3. Open Bella Flor Admin from your home screen.\n4. Go to Settings → Turn on notifications.");
      $("#install-banner").hidden = true;
    }
  }
  $("#install-banner-btn").addEventListener("click", doInstall);
  $("#install-btn").addEventListener("click", doInstall);
  $("#install-banner-close").addEventListener("click", () => {
    store.set("bf-install-dismissed", String(Date.now()));
    $("#install-banner").hidden = true;
  });
  if (isIos && !isStandalone()) $("#install-btn").hidden = false;
  if (isStandalone()) $("#install-status").textContent = "You're using the installed app ✓";

  // ── Boot ──────────────────────────────────────────────────────
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {});

  api("/me").then(showApp).catch(() => showLogin());
})();
