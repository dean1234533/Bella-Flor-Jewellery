const nav = document.querySelector(".navBar")
const btn = document.querySelector(".btn")


function toggleNav(){

nav.classList.toggle("Active")
btn.setAttribute("aria-expanded", nav.classList.contains("Active") ? "true" : "false")

}

btn.addEventListener("click", () =>{

toggleNav()

} );

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

