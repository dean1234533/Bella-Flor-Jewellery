// =============================================================
// SINGLE SOURCE OF TRUTH — products.js
// -------------------------------------------------------------
// Edit a product's price / image / name / description HERE ONCE.
// Both the website (collection.js) AND the Stripe checkout
// (/api/checkout.js) read from this same file, so the price and
// image a customer sees on the site is ALWAYS what Stripe charges
// and shows at checkout. There are no separate Stripe links to
// keep in sync any more.
//
//   price    → a plain number in POUNDS (e.g. 18 means £18.00).
//              Use decimals if needed, e.g. 17.5 for £17.50.
//   currency → "gbp"
//   image    → path relative to the site root (no leading "./")
// =============================================================

// This is an ES module. It is imported by BOTH:
//   • the website  → script/collection.js  (loaded as <script type="module">)
//   • the checkout → functions/api/checkout.js  (Cloudflare Pages Function)
// so there is one shared catalog and nothing to keep in sync.

const currency = "gbp";

const PRODUCTS = [
    { id: 1,  name: "Blue & Pink Duo Twist",      category: "Two-tone", price: 18, currency, material: "Twisted Cord & Lobster Clasp",   description: "Slim double-strand bracelet twisting bright blue and soft pink cords together, finished with silver tube ends, a lobster clasp and extension chain. Light, playful and perfect for layering.", color: "#D0E8F5", tag: "Bestseller",   image: "images/IMG_9252.JPG" },
    { id: 2,  name: "Monochrome Gold Braid",      category: "Two-tone", price: 18, currency, material: "Braided Cord & Lobster Clasp",   description: "Chunky flat braid weaving black, white and gold cord together with silver end caps and a lobster clasp with extender chain. Bold, classic and eye-catching.", color: "#E8E8E8", tag: "New Arrival",  image: "images/IMG_9253.JPG" },
    { id: 3,  name: "Berry & Black Slim Braid",   category: "Two-tone", price: 16, currency, material: "Braided Cord & Lobster Clasp",   description: "Delicate slim bracelet braiding black, pink and purple cord into a fine flat plait, with silver end caps and a lobster clasp with extender chain. Subtle and wearable every day.", color: "#E0D0F0", tag: "Popular",     image: "images/IMG_9255.JPG" },
    { id: 4,  name: "Copper Rope Hook",           category: "Chunky",   price: 18, currency, material: "Twisted Rope Cord & Copper Hook", description: "Striking all-copper twisted rope bracelet with polished rose-gold copper cone ends and a handcrafted hook closure. Warm, bold and truly unique.", color: "#F5DDD0", tag: "Exclusive",   image: "images/IMG_9256.JPG" },
    { id: 5,  name: "Purple & Copper Twist",      category: "Two-tone", price: 18, currency, material: "Twisted Cord & Lobster Clasp",   description: "Double-strand bracelet intertwining rich purple and warm copper/rust cord, with silver end caps and a lobster clasp with extender chain. A vibrant earthy contrast.", color: "#E0D0F0", tag: "Bestseller",   image: "images/IMG_9257.JPG" },
    { id: 6,  name: "Violet Slim Twist",          category: "Slim",     price: 12, currency, material: "Twisted Cord & Lobster Clasp",   description: "Minimalist single-strand slim twisted purple cord bracelet with tiny silver tube ends and a lobster clasp with extension chain. Simple, elegant and effortlessly wearable.", color: "#D8D0F0", tag: "Limited",     image: "images/IMG_9258.JPG" },
    { id: 7,  name: "Purple & Rust Rope Twist",   category: "Two-tone", price: 14, currency, material: "Twisted Cord & Lobster Clasp",   description: "Thicker double-strand twisted bracelet blending deep purple and burnt rust cord, with decorative patterned silver end caps and a lobster clasp with extender chain.", color: "#E0D0F0", tag: "New Arrival",  image: "images/IMG_9259.JPG" },
    { id: 8,  name: "Rust & Purple Fine Twist",   category: "Two-tone", price: 12, currency, material: "Twisted Cord & Lobster Clasp",   description: "Fine double-strand twisted bracelet combining rust orange and deep purple cord, with small silver tube ends and a lobster clasp with extender chain. Subtle two-tone detail for everyday wear.", color: "#F5DDD0", tag: "Bestseller",   image: "images/IMG_9260.JPG" },
    { id: 9,  name: "Copper & Purple Chain Bar",  category: "Two-tone", price: 14, currency, material: "Twisted Cord & Silver Chain",    description: "Unique half-cord, half-chain bracelet featuring a short section of purple and rust twisted cord set between two lengths of bold silver chain, with a lobster clasp. Edgy and architectural.", color: "#D0E8F5", tag: "Artisan Pick", image: "images/IMG_9261.JPG" },
    { id: 10, name: "Silver & Gold Wire Toggle",  category: "Two-tone", price: 14, currency, material: "Fine Wire Cord & Toggle Clasp",  description: "Ultra-delicate double-strand bracelet pairing silver and gold fine twisted wire cord, with a polished silver toggle clasp. Barely-there elegance — ideal for stacking.", color: "#F5ECD9", tag: "Artisan Pick", image: "images/IMG_9296.JPG" },
    { id: 11, name: "Royal Blue Chunky Braid",    category: "Chunky",   price: 16, currency, material: "Braided Cord & Lobster Clasp",   description: "Solid royal blue chunky flat-braided cord bracelet with polished silver end caps and a lobster clasp with extender chain. A bold, clean pop of colour.", color: "#C8D4F0", tag: "Artisan Pick", image: "images/IMG_9262.JPG" },
    { id: 12, name: "Black & Silver Slim Twist",  category: "Two-tone", price: 12, currency, material: "Twisted Cord & Lobster Clasp",   description: "Slim twisted bracelet blending black and silver cord, with ornate patterned silver barrel ends and a lobster clasp with extender chain. Understated and refined.", color: "#E8E8E8", tag: "Artisan Pick", image: "images/IMG_9263.JPG" },
    { id: 13, name: "Black & White Slim Braid",   category: "Two-tone", price: 12, currency, material: "Braided Cord & Lobster Clasp",   description: "Classic slim flat-braided bracelet in black and white cord, with neat silver end caps and a lobster clasp with extender chain. Timeless monochrome styling.", color: "#ECECEC", tag: "Artisan Pick", image: "images/IMG_9264.JPG" },
    { id: 14, name: "Silver Wire Mesh Bangle",    category: "Slim",     price: 14, currency, material: "Woven Wire Mesh & Toggle Clasp", description: "Delicate silver wire mesh bracelet hand-woven into a hollow round bangle, finished with ornate engraved silver toggle caps. Lightweight, intricate and truly artisan.", color: "#ECECEC", tag: "Artisan Pick", image: "images/IMG_9282.JPG" },
    { id: 15, name: "Cobalt Rope Braid",          category: "Chunky",   price: 16, currency, material: "Thick Braided Cord & Lobster Clasp", description: "Bold solid royal blue thick rope-braided cord bracelet with silver end caps and a lobster clasp with extender chain. Chunky, vivid and built to make a statement.", color: "#C8D4F0", tag: "Artisan Pick", image: "images/IMG_9288.JPG" },
    { id: 16, name: "Blush Chunky Toggle",        category: "Chunky",   price: 16, currency, material: "Braided Cord & Silver Toggle",   description: "Soft peach and blush chunky flat-braided cord bracelet with a polished silver toggle clasp. Feminine and tactile — a warm, elegant everyday piece.", color: "#F9E8E8", tag: "Artisan Pick", image: "images/IMG_9289.JPG" },
    { id: 17, name: "Plum & Blush Herringbone",   category: "Two-tone", price: 18, currency, material: "Woven Cord & Toggle Clasp",      description: "Chunky herringbone-weave bracelet blending deep plum brown and soft blush pink cord, with silver toggle clasp. Rich texture and a beautiful two-tone contrast.", color: "#F5E0E8", tag: "Artisan Pick", image: "images/IMG_9290.JPG" },
    { id: 18, name: "Violet Chunky Braid",        category: "Chunky",   price: 18, currency, material: "Braided Cord & Lobster Clasp",   description: "Deep violet chunky flat-braided cord bracelet with polished silver end caps and a lobster clasp with extender chain. Vibrant, bold and richly coloured.", color: "#D8D0F0", tag: "Bestseller",   image: "images/IMG_9287.JPG" },
];

export default PRODUCTS;
