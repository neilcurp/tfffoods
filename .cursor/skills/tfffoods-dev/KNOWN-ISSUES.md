# tfffoods Known Issues & Fix Log

Append a dated entry under "Fix log" whenever you resolve a root-cause issue. Check this file before debugging — the trap may already be documented.

## Fix log

### 2026-06-07 — User auth schema fixed + cleanup (deps, PII logs)
- **User schema (functional auth bug):** `utils/models/User.ts` was missing `password` and `profileImage`. With Mongoose strict mode, `register` saved users with **no password**, so credentials login always failed (`bcrypt.compare(pw, "")`). Added both fields (plain, not `select:false`, to match readers: `auth.config` `findOne`, `changPassword`, admin routes' `.select("-password")`). Also added `connectToDatabase()` + `waitForConnection()` to `app/api/register/route.ts` (it queried with no connection under `bufferCommands:false`). *Full login test pending DB cluster restore.*
- **Removed unused deps:** `@sendgrid/mail`, `@aws-sdk/client-ses`, `express` (verified no app imports). Removed 136 packages; app still serves 200.
- **Removed PII debug logs:** `auth.config.ts` jwt/session callbacks + the `Found user in database` log (leaked the password hash); `components/Navbar/UserSection.tsx` `DEBUG SESSION`.

### 2026-06-07 — proxy `"/"` bug resolved + protected pages enforced + products POST gated
- **`proxy.ts` rewrite (safe):** Replaced the neutralized whitelist logic. The `authorized` callback now: lets all `/api/*` through (so handlers return JSON, not login redirects), lets `/admin/*` through (proxy fn redirects non-admins), requires a session for `PROTECTED_PAGE_PREFIXES` (`/profile`, `/orders`, `/invoices`, `/dashboard`, `/checkout`), and treats everything else as public. Used a **blacklist of protected pages** instead of a public whitelist so public browsing (`/categories/[slug]`, `/brands/[slug]`, etc.) is never accidentally blocked. Added `matchesPrefix` helper (treats `"/"` as exact) and `pages.signIn: "/login"` so redirects hit the branded login.
- **`products` POST** (`app/api/products/route.ts`) now requires `session?.user?.admin` (was any logged-in user via `session?.user?.id`).
- **Verified:** protected pages → 307 → `/login?callbackUrl=...`; public pages unaffected; protected APIs still return JSON status (no redirect regression — `/api/orders`, `/api/userData`); `/admin` → 307 → `/`; admin API → 403; public API → 200; products POST anon → 401.
- **Note:** this supersedes the "still open" `"/"` caveat from the entry below.

### 2026-06-07 — CMS section mutations gated to admin + proxy admin enforcement made effective
- **Context:** `hero-sections` mutations (POST/PATCH/DELETE/reorder/activate) and `guarantee-section` POST only checked for *any* logged-in user (`!session?.user` / `!session`). `features-section` and `gallery` were already admin-gated.
- **Newly discovered bug:** `proxy.ts` `PUBLIC_ROUTES` contains `"/"`, and matching uses `path.startsWith(route)`. Since every path starts with `"/"`, `isPublicRoute` was always true and the `authorized` callback always returned true — **neutralizing all proxy auth** (admin pages were NOT redirected server-side; the `ADMIN_API_ROUTES` check was unreachable). Verified: `/admin/dashboard` returned 200 anonymously.
- **Fix:**
  - Changed the 6 CMS mutation handlers to `!session?.user?.admin` (inline gate; their GETs stay public for the homepage).
  - Moved admin enforcement to the **top** of the `proxy.ts` function (before the public-route short-circuit) so `/admin` pages redirect to `/` and `ADMIN_API_ROUTES` return 403 for non-admins — without changing the broader public-route handling (no regression).
- **Verified:** `/admin/dashboard` anon → 307→`/`; `/api/orderAdmin` anon → 403; public pages/APIs (`/profile`, `/api/hero-sections`, `/api/features-section`, `/api/guarantee-section`) → 200; CMS POSTs anon → 401.
- **Still open:** the `"/"`-in-`PUBLIC_ROUTES` bug itself is NOT fully fixed — non-admin *protected* routes (e.g. `/profile`, `/api/orders`) still rely only on inline checks because `authorized` short-circuits. Fixing `"/"` to an exact match would make `withAuth` enforce login app-wide but risks turning inline JSON 401s into login redirects; needs a careful pass + `PUBLIC_API_ROUTES` audit.

### 2026-06-07 — Admin API routes hardened (auth gating)
- **Context:** `app/api/orderAdmin` GET/PUT and several debug routes (`test-session`, `test-email`, `stripe/diagnostics`, `invoices/test`) were callable without admin rights.
- **Key correction:** This app is **Next.js 16**, which renamed `middleware.ts` to **`proxy.ts`**. A `proxy.ts` already exists at the repo root and uses `withAuth` — it already protects `/admin` *pages* (redirects non-admins). Do NOT create `middleware.ts`; Next 16 errors with "Both middleware file and proxy file are detected" and crashes the dev server (all routes 404). Edit `proxy.ts` instead.
- **Fix:**
  - Added `ADMIN_API_ROUTES = ["/api/admin", "/api/orderAdmin"]` to `proxy.ts` and a check returning `403` when `request.nextauth.token?.admin` is false. (`proxy.ts` matcher already covers `/api/*` except `/api/auth`.)
  - Added inline `getServerSession(authOptions)` + `session?.user?.admin` 401 guards (defense in depth) to `orderAdmin` GET/PUT and the four debug routes.
  - Trimmed `test-session` to stop dumping all cookies/headers.
- **Verified:** all listed routes return `401`/`403` unauthenticated; `/api/health` returns `503 database:disconnected` (separate cluster-down issue below).

### 2026-06-07 — Homepage products fail to load (DB cluster unreachable)
- **Symptom:** Console errors "Failed to fetch products" / "Failed to fetch featured products" from `components/HomepageComponents/BestSelling.tsx` and `FeaturedProduct.tsx`. `/api/products/bestselling` and `/api/products/featured` returned HTTP 500.
- **Root cause:** `connectToDatabase()` failed with `querySrv ENOTFOUND _mongodb._tcp.tummyfoods.yzqag1j.mongodb.net`. The Atlas SRV record does not resolve (general DNS works; only this cluster fails) — cluster deleted/paused or `MONGODB_URI` host outdated. Both `.env` and `.env.local` point to the same host.
- **Fix:** Not a code bug. Restore/resume the Atlas cluster or update `MONGODB_URI` host in `.env.local` (+ `.env`), confirm IP allowlist in Atlas Network Access, restart dev server. Verify with `Resolve-DnsName -Type SRV "_mongodb._tcp.<host>.mongodb.net"`.
- **Note:** The frontend "Failed to fetch" errors are symptoms; always check the actual API status/server log for the real cause before touching component code.

## Open issues (verified, with locations)

### Security (high priority)
1. ~~**No `middleware.ts`**~~ **CORRECTED:** server-side protection lives in **`proxy.ts`** (Next 16's renamed middleware) using `withAuth`. It already gates `/admin` pages. Admin API gating for `/api/admin` + `/api/orderAdmin` was **added 2026-06-07** (see fix log). Other admin APIs may still need adding to `ADMIN_API_ROUTES`.
2. ~~**`orderAdmin` GET/PUT unauthenticated**~~ **FIXED 2026-06-07** — admin gate in `proxy.ts` + inline guards.
3. ~~**Debug routes exposed publicly**~~ **FIXED 2026-06-07** — `test-session`, `test-email`, `stripe/diagnostics`, `invoices/test` now require admin; `test-session` no longer dumps cookies/headers.
4. ~~**Some CMS POSTs require only any session, not admin**~~ **FIXED 2026-06-07** — `hero-sections` (POST/PATCH/DELETE/reorder/activate) and `guarantee-section` POST now require admin. (`features-section`/`gallery` were already gated.)
5. ~~**`proxy.ts` `"/"` bug**~~ **FIXED 2026-06-07** — rewrote `authorized` (blacklist of protected pages; APIs pass through; `matchesPrefix` treats `"/"` as exact). Protected user pages now require login server-side.
6. ~~**`products` POST auth is weak**~~ **FIXED 2026-06-07** — now requires `session?.user?.admin`.

### Dead / misleading auth
5. **`requireAuth` / `requireAdmin` not enforced** in `utils/routeHandler.ts` (destructured line 16, never used). Routes using `createRouteHandler({ requireAdmin: true })` are NOT protected — add an explicit `getServerSession` check, or implement enforcement in `withDatabaseConnection`.
6. **JWT callback drops user fields** (`auth.config.ts` jwt callback) — only `id/email/role/admin` persisted; `profileImage`/`address`/`phone` expected client-side are lost.
7. **JWT/PII logs** — ~~auth callbacks~~ **FIXED 2026-06-07** (auth.config + `UserSection.tsx` `DEBUG SESSION` removed). `store/cartStore.ts` still has debug `console.log`s (lower priority).

### Data model
8. ~~**User schema missing `password` / `profileImage`**~~ **FIXED 2026-06-07** — both added to `utils/models/User.ts`. (Was silently dropping passwords → credentials login broken.)
9. ~~**`register/route.ts` missing `connectToDatabase()`**~~ **FIXED 2026-06-07** — connect + `waitForConnection` added.
10. **Invoice pre-save can set `status = "cancelled"`** but the enum only allows `pending|paid|overdue` (`utils/models/Invoice.ts`).
11. **User `address` shape differs** between auth types and the User model — align before depending on either.

### Duplication (consolidate carefully — "consider the whole picture")
12. ~~Two auth configs~~ **FIXED 2026-06-07** — deleted stale `lib/auth.ts`; `app/admin/blog/[action]/page.tsx` now imports the canonical `auth.config`.
13. Two DB import paths: `connectToDatabase` (`utils/database.ts`) vs `dbConnect` (`utils/config/dbConnection.ts`). Both work (dbConnect is used by a few routes); left as-is — consolidating is churn-heavy/low-value.
14. ~~Two Cloudinary configs~~ **FIXED 2026-06-07** — deleted both unused `utils/cloudinary.ts` and `utils/config/cloudinary.ts` (the signature route configures the SDK inline).
15. ~~Two StoreSettings models~~ **FIXED 2026-06-07** — deleted unused `app/models/StoreSettings.ts`; canonical is `utils/models/StoreSettings.ts`.
16. **Duplicate product routes (NEEDS PRODUCT DECISION — do not blindly delete):** the **singular** `/product/[id]` page + `/api/product/[id]` are the actively-used ones across the app (ProductCard, Wishlist, Search, MobileMenu…). Only `bestselling`/`featured` APIs link to the **plural** `/products/[id]`. Deleting either breaks navigation/SEO. Pick one canonical route, update all links + the two API `link` fields, then remove the other — with runtime testing.
17. Two vehicle systems: `Logistics` model vs `Vehicle` model — needs domain knowledge to merge.
18. Models still split across `utils/models/` (canonical) and `models/` (HeroSection/FeaturesSection/GuaranteeSection). `app/models/` is now empty.
> When editing one of a duplicated pair, check whether the other must change too, or propose consolidation.

### Mega-files (extract, don't extend)
19. `app/admin/settings/page.tsx` — **DONE 2026-06-07**: (1) extracted all interfaces/types → `settingsTypes.ts` (+ shared callback type aliases `SetSettings`/`HandleInputChange`/`UploadHandler`/`AddArrayItem`/`RemoveArrayItem`/`CoordinateUpdate`/`TeamMemberUploadHandler`); removed 3 dead helpers (`isAboutPageSection`/`isContactPageSection`/`getArrayData`). (2) Split the 4 `TabsContent` panels into `tabs/GeneralTab.tsx` (464), `tabs/NewsletterTab.tsx` (185), `tabs/AboutTab.tsx` (651), `tabs/ContactTab.tsx` (770). Page now 960 lines (was 3179) holding only state + handlers + the `Tabs` shell; children pull `t`/`language` from `useTranslation()` and receive `settings`/`setSettings`/handlers as props. Zero new type errors. **Still untested at runtime** (needs admin auth + DB) — verify each tab's edit/upload/save in browser when DB is back.
20. `app/invoices/[invoiceNumber]/page.tsx` — **DONE 2026-06-07**: extracted types → `invoiceTypes.ts`, PDF doc → `InvoicePDF.tsx`, and the JSX into `components/InvoiceInfoCard.tsx`/`OrderSummaryCard.tsx`/`PaymentInfoCard.tsx`/`AddressesCard.tsx`. Page now ~290 lines (was 1042) holding data fetch + handlers + layout shell. Children pull `t`/`language` from `useTranslation()`; `invoice` + callbacks passed as props. Also fixed the bogus `CldUploadWidgetResults` import → real `CloudinaryUploadWidgetResults` export. (Pre-existing, build-tolerated type noise remains: `[language]` indexing in `InvoicePDF.tsx` and `order.cartProducts.map` in `OrderSummaryCard.tsx` — kept as-is for behavior parity; whole project runs with `typescript.ignoreBuildErrors: true`.)
21. `app/api/checkout/route.ts` — **PARTIALLY DONE 2026-06-07**: pure input-validation + totals extracted to `utils/services/checkoutService.ts` (route ~493→~380 lines, verbose debug logs removed). DB-coupled order/invoice creation still inline — extract `createPeriodOrder`/`createOneTimeOrder` once the DB is restored for runtime testing.

### App Router gaps
22. ~~No per-segment `loading.tsx` / `error.tsx`~~ **FIXED 2026-06-07** — added root `app/error.tsx`, `app/loading.tsx`, `app/global-error.tsx` (apply to all segments lacking their own).

### Hygiene / performance
23. ~~Unused deps~~ **FIXED 2026-06-07** — removed `@sendgrid/mail`, `@aws-sdk/client-ses`, `express`.
24. In-memory LRU product cache (`utils/cache.ts`, 30s) is ineffective across serverless instances.
25. Potential N+1 in checkout (per-item product lookups); populate-heavy order/invoice queries lacking field projection.
26. Pagination present on `products`/`orders` but missing on some list endpoints.
27. `app/api/about/page.tsx` is a React component stub inside `app/api/`; `app/admin/specifications/[categoryId]/route.ts` is an API handler misplaced under `app/admin/`.
