const nav = document.querySelector(".navBar");
const btn = document.querySelector(".btn");
const desktopNav = document.querySelector(".nav-desktop-container");

function closeNav() {
  if (!nav || !btn) return;
  nav.classList.remove("Active");
  btn.setAttribute("aria-expanded", "false");
}

function toggleNav() {
  if (!nav || !btn) return;
  nav.classList.toggle("Active");
  btn.setAttribute("aria-expanded", nav.classList.contains("Active") ? "true" : "false");
}

if (btn) btn.addEventListener("click", toggleNav);

if (nav) {
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNav));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
});

function updateStickyNav() {
  const scrolled = window.scrollY > 32;
  if (nav) nav.classList.toggle("is-scrolled", scrolled);
  if (desktopNav) desktopNav.classList.toggle("is-scrolled", scrolled);
}

updateStickyNav();
window.addEventListener("scroll", updateStickyNav, { passive: true });

// --- Cookie consent banner (site-wide, injected so every page picks it up) ---
(function cookieConsent() {
  if (localStorage.getItem("bf-cookie-consent")) return;

  const banner = document.createElement("div");
  banner.id = "cookie-consent-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <p>We use cookies to keep the site running smoothly and to understand how it's used. See our <a href="/privacy-policy">Privacy Policy</a> for details.</p>
    <button type="button" id="cookie-consent-accept">Accept</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("cookie-consent-accept").addEventListener("click", () => {
    localStorage.setItem("bf-cookie-consent", "1");
    banner.remove();
  });
})();
