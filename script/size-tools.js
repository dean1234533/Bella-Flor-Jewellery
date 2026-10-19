// Ring size and bracelet size calculators for the /tools pages.
// Each block only runs if its markup is present on the current page.

(function ringSizeCalculator() {
  const form = document.getElementById("ring-size-form");
  if (!form) return;

  // Approximate standard ring size conversion (finger circumference in mm -> UK / US / EU).
  const RING_SIZES = [
    { circ: 44.2, us: "3", uk: "F", eu: "44" },
    { circ: 45.5, us: "3.5", uk: "G", eu: "46" },
    { circ: 46.8, us: "4", uk: "H", eu: "47" },
    { circ: 48.0, us: "4.5", uk: "I", eu: "48" },
    { circ: 49.3, us: "5", uk: "J", eu: "49" },
    { circ: 50.6, us: "5.5", uk: "K", eu: "51" },
    { circ: 51.9, us: "6", uk: "L", eu: "52" },
    { circ: 53.1, us: "6.5", uk: "M", eu: "53" },
    { circ: 54.4, us: "7", uk: "N", eu: "54" },
    { circ: 55.7, us: "7.5", uk: "O", eu: "56" },
    { circ: 57.0, us: "8", uk: "P", eu: "57" },
    { circ: 58.3, us: "8.5", uk: "Q", eu: "58" },
    { circ: 59.5, us: "9", uk: "R", eu: "60" },
    { circ: 60.8, us: "9.5", uk: "S", eu: "61" },
    { circ: 62.1, us: "10", uk: "T", eu: "62" },
    { circ: 63.4, us: "10.5", uk: "U", eu: "63" },
    { circ: 64.6, us: "11", uk: "V", eu: "65" },
    { circ: 65.9, us: "11.5", uk: "W", eu: "66" },
    { circ: 67.2, us: "12", uk: "X", eu: "67" },
  ];

  const modeButtons = form.querySelectorAll("[data-ring-mode]");
  const input = document.getElementById("ring-input");
  const label = document.getElementById("ring-input-label");
  const result = document.getElementById("ring-result");
  const resultValue = document.getElementById("ring-result-value");
  const resultNote = document.getElementById("ring-result-note");

  let mode = "circumference"; // or "diameter"

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      mode = btn.dataset.ringMode;
      label.textContent = mode === "circumference" ? "Finger circumference (mm)" : "Ring diameter (mm)";
      input.placeholder = mode === "circumference" ? "e.g. 54" : "e.g. 17.2";
    });
  });

  function closestSize(circumferenceMm) {
    let best = RING_SIZES[0];
    let bestDiff = Math.abs(RING_SIZES[0].circ - circumferenceMm);
    for (const size of RING_SIZES) {
      const diff = Math.abs(size.circ - circumferenceMm);
      if (diff < bestDiff) {
        best = size;
        bestDiff = diff;
      }
    }
    return best;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = parseFloat(input.value);
    if (!value || value <= 0) return;

    const circumferenceMm = mode === "diameter" ? value * Math.PI : value;
    const size = closestSize(circumferenceMm);

    resultValue.textContent = `UK ${size.uk} · US ${size.us} · EU ${size.eu}`;
    resultNote.textContent = `Based on a ${circumferenceMm.toFixed(1)}mm circumference. Sizes are approximate — if you're between two sizes, we'd suggest rounding up.`;
    result.classList.add("visible");
  });
})();

(function braceletSizeCalculator() {
  const form = document.getElementById("bracelet-size-form");
  if (!form) return;

  const unitButtons = form.querySelectorAll("[data-wrist-unit]");
  const input = document.getElementById("wrist-input");
  const fitButtons = form.querySelectorAll("[data-fit-style]");
  const result = document.getElementById("bracelet-result");
  const resultValue = document.getElementById("bracelet-result-value");
  const resultNote = document.getElementById("bracelet-result-note");

  let unit = "cm";
  let fit = "comfortable";

  const FIT_ADD_CM = { snug: 1, comfortable: 1.75, loose: 2.75 };
  const FIT_LABEL = { snug: "snug", comfortable: "comfortable, everyday", loose: "loose, layered" };

  unitButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      unitButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      unit = btn.dataset.wristUnit;
      input.placeholder = unit === "cm" ? "e.g. 16" : "e.g. 6.3";
    });
  });

  fitButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      fitButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      fit = btn.dataset.fitStyle;
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = parseFloat(input.value);
    if (!raw || raw <= 0) return;

    const wristCm = unit === "cm" ? raw : raw * 2.54;
    const braceletCm = wristCm + FIT_ADD_CM[fit];

    let size = "Medium";
    if (braceletCm < 16.5) size = "Small";
    else if (braceletCm > 19) size = "Large";

    resultValue.textContent = `${braceletCm.toFixed(1)}cm bracelet length — ${size}`;
    resultNote.textContent = `Wrist measured at ${wristCm.toFixed(1)}cm with a ${FIT_LABEL[fit]} fit. Our adjustable sliding-knot bracelets comfortably cover this range, so this is a starting point rather than an exact requirement.`;
    result.classList.add("visible");
  });
})();
