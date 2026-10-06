# Bella Flor Admin — one-time setup

The admin dashboard lives at **/admin/** (e.g. `https://www.bellaflorjewellery.co.uk/admin/`).
Until the steps below are done, the public shop keeps working exactly as before using
`script/products.js`, and `/admin/` just shows a "not set up yet" message.

## What it does
- **Stock tab** – add, edit, hide or delete pieces; upload photos from your phone; set prices and optional stock counts (a count goes down with each order and shows "Sold out" at 0).
- **Inbox tab** – every paid order (with shipping address) and every website enquiry. Mark orders packed/shipped and enquiries read/done.
- **Alerts** – a push notification on your phone/computer for each new order or enquiry, plus a live toast and badge while the dashboard is open.
- **Installable app (PWA)** – an install banner appears the first time you open it.

## Set up (about 10 minutes)

Commands are run from this folder.

1. **Database (D1)** – already created as `bella-flor`.
2. **Connect it to the site** – Cloudflare dashboard → Workers & Pages → `bella-flor-jewellery` → **Settings → Bindings → Add → D1 database** → variable name `DB` → choose `bella-flor`.

   (Use the dashboard here. Don't add a `wrangler.jsonc` to this project, as that would switch the project to file-managed settings.)
3. **Secrets** – in your terminal (it asks you to type the value, so it never appears in chat):
   ```
   npx wrangler pages secret put ADMIN_PASSWORD --project-name=bella-flor-jewellery
   ```
   Pick a long password (a few random words is fine). `VAPID_PRIVATE_JWK` (notifications) is already set. Existing secrets (`STRIPE_*`, `RESEND_API_KEY`) are untouched.
4. **Optional – R2 for photos.** Photos are stored in the database by default, which is fine for a jewellery catalogue. If you later enable R2 in the dashboard and add a bucket binding named `IMAGES`, new uploads go there automatically.
5. **Deploy** – the project is connected to GitHub, so pushing to `main` deploys it. After changing bindings or secrets, redeploy (Deployments → Retry) so they take effect.
6. Open `/admin/`, sign in, go to **Settings → Turn on notifications**, then **Send test**.

The first time it runs it creates its tables and loads your current 18 pieces into the database. After that, make all product changes in the dashboard (they go live immediately). Don't hand-edit `script/products.js`, as it's now only the starting list and the fallback if the database is ever unreachable.

## Phone notes
- **Android / desktop Chrome or Edge:** tap **Install** on the banner, then turn notifications on in Settings.
- **iPhone / iPad (iOS 16.4+):** open `/admin/` in Safari → Share → **Add to Home Screen**, open it from the home screen, then Settings → Turn on notifications. iPhones only allow notifications for installed apps.
- Lost phone? Change `ADMIN_PASSWORD` in Cloudflare. That signs out every device immediately.

## Orders & stock
- Orders are saved when Stripe confirms payment (the existing `/api/webhook`). Make sure the Stripe webhook is pointed at `https://YOUR-SITE/api/webhook` for `checkout.session.completed`.
- Stock only changes for pieces where you've entered a stock count. A blank count means "made to order, always available".

## Security
- One shared password, session cookie is HttpOnly + Secure + SameSite=Strict (30 days). Eight wrong guesses locks that visitor out for 15 minutes.
- `/admin/` is excluded from search engines (`noindex` + robots.txt).
- Customer text is escaped everywhere it's displayed in the dashboard.
