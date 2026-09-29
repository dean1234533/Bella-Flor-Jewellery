# Bella Flor Jewellery: e-commerce store

**A full e-commerce website for a UK handmade jewellery brand, with a product catalogue, cart, Stripe checkout, sizing tools, and a content blog built for SEO.**

[![Live site](https://img.shields.io/badge/live-bellaflorjewellery.co.uk-b45309?style=flat-square)](https://www.bellaflorjewellery.co.uk/)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white)

**Live:** [www.bellaflorjewellery.co.uk](https://www.bellaflorjewellery.co.uk/)

---

## Screenshots

<!-- Add images to docs/screenshots/ and uncomment. -->
<!--
| Home | Collection | Cart |
|---|---|---|
| ![](docs/screenshots/home.png) | ![](docs/screenshots/collection.png) | ![](docs/screenshots/cart.png) |
-->

_Screenshots coming soon. For now, see the [live site](https://www.bellaflorjewellery.co.uk/)._

---

## Features

- **Product catalogue and collection page** for handmade cord bracelets and
  woven bangles
- **Shopping cart** and **Stripe Checkout**. A Cloudflare Pages Function builds
  the checkout session from the same product catalogue the site displays, so
  prices always match. A webhook handles order confirmation.
- **Sizing tools**: a bracelet size guide, a ring size guide, and an
  interactive wrist-measuring tool
- **Blog** with gift guides, care guides, and brand story posts, written for SEO
- Reviews, about, and contact pages (the contact form uses EmailJS)
- A sitemap, robots.txt, structured metadata, and security headers set through `_headers`

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Hand-written HTML, CSS, and vanilla JavaScript |
| Checkout | Stripe Checkout through Cloudflare Pages Functions (`functions/api/`) |
| Email | EmailJS |
| Hosting | Cloudflare Pages |

---

## Getting started

```bash
git clone https://github.com/dean1234533/Bella-Flor-Jewellery.git
cd Bella-Flor-Jewellery
npx wrangler pages dev .   # runs the site + /api functions locally
```

Set `STRIPE_SECRET_KEY` (and the webhook secret) in the Cloudflare Pages
environment variables. Products are defined once in `script/products.js`.

---

## Project structure

```
index.html, collection.html, about.html, contact.html, reviews.html
blog*.html                     blog posts
*-size-guide.html, tools.html  sizing tools
script/                        cart, products catalogue, collection, nav, size tools
styles/                        page stylesheets
functions/api/                 checkout.js, webhook.js (Cloudflare Pages Functions)
_headers, sitemap.xml, robots.txt
```

---

## Author

Built by **Dean Da Dev**, a UK full-stack developer building web apps, websites,
and AI tools.

🌐 [dean-da-dev.co.uk](https://www.dean-da-dev.co.uk/) · 💼 [More projects](https://www.dean-da-dev.co.uk/portfolio) · 🐙 [GitHub](https://github.com/dean1234533)
