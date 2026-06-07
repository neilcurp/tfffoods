# tfffoods Architecture

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · MongoDB/Mongoose 8 · NextAuth v4 (JWT) · Tailwind + shadcn/Radix · Zustand + React Context + SWR · Stripe · Brevo · Cloudinary · Google Maps.

## Directory map

```
app/                 App Router pages + api/ route handlers
components/          ~112 components (ui/, Navbar/, HomepageComponents/, products/, logistics/, admin/, theme/, language/)
providers/           React Context providers (Language, Cart, User, Wishlist, Store, Blog, Hero, Newsletter, About, Contact)
store/               Zustand stores (cartStore, productStore)
utils/               database.ts, routeHandler.ts, logger.ts, cache.ts, cloudinary.ts, env.ts, models/
utils/models/        Canonical Mongoose models
models/              HeroSection, FeaturesSection, GuaranteeSection (secondary location)
app/models/          StoreSettings stub (duplicate — avoid)
lib/                 emailService.ts, emailTemplates, auth.ts (stale duplicate)
public/locales/      i18n JSON (en, zh-TW)
scripts/             test-auth.ts, test-products.ts, test-app.ts
types/               shared TS types + next-auth.d.ts augmentation
hooks/               custom hooks
```

## Pages (`app/`)

**Customer:** `/`, `/products`, `/products/[productId]`, `/product/[id]` (duplicate), `/products/brand/[brand]`, `/categories/[slug]`, `/brands/[slug]`, `/checkout` (+ success/canceled/offline-payment), `/orders[/orderId]`, `/invoices[/invoiceNumber]`, `/profile`, `/login`, `/signup`, `/about`, `/contact`, `/blog[/slug]`, `/privacy-policy`, `/warranty`, `/dashboard`.

**Admin (`/admin/*`):** dashboard, products (+create/editProduct), categories, specifications, brands, orders, invoices, roles, newsletter, blog, logistics, GuaranteeSection, featuresSection, gallery, settings (+theme/hero), delivery, period-users, product-of-the-month. Gated by client `useSession()` in `app/admin/layout.tsx` (NOT server-enforced).

**Conventions present:** root `layout.tsx` (deep provider tree) + admin `layout.tsx`; `not-found.tsx`; **`proxy.ts`** (Next 16's renamed middleware — see Auth). **Missing:** `loading.tsx`, `error.tsx`, route groups.

## API routes (`app/api/` — ~80 handlers)

- **Auth/users:** `auth/[...nextauth]` (config in `auth.config.ts`), `register`, `userData`, `updateUser`, `changPassword`, `deleteAcc`, `updateNotificationreference`.
- **Catalog:** `products` (paginated + LRU cache 30s), `products/allProducts`, `products-search`, `search`, `product/[productId]`, `products/manage/[productId]`, `products/featured`, `bestselling`, `product-of-the-month`, `products/brand/[brand]`, `categories[/category]`, `brands`, `review[/canReview|/allReviews]`, `wishlist`.
- **Orders/checkout:** `checkout` (~493 lines), `checkout/offline-payment`, `orders[/orderId][/download|/print]`, `orderAdmin[/orderId]` (GET/PUT unauthenticated).
- **Invoices:** `invoices/user`, `invoices/admin`, `invoices/[invoiceNumber][/download|/print]`, `invoices/status/[invoiceNumber]`, `cleanup`, `test`.
- **Admin:** `admin/users[/id]`, `admin/categories`, `admin/brands`, `admin/specifications/[categoryId]`, `admin/update-translations`, `admin/period-users`.
- **CMS:** `store-settings`, `theme-settings`, `hero-sections[/sectionId][/reorder|/activate]`, `features-section`, `guarantee-section`, `gallery`, `blog/posts[/id]`, `blog/featured`, `newsletter/subscribe`, `newsletter/subscribers`, `delivery`.
- **Logistics:** `logistics[/vehicleId][/maintenance|/assign]`.
- **Integrations:** `stripe/create-checkout-session`, `stripe/checkout-redirect`, `stripe/diagnostics`, `webhook` (Stripe + Brevo), `cloudinary/signature`, `health`.
- **Debug (security risk):** `test-session`, `test-email`, `stripe/diagnostics`, `invoices/test`.

## Data layer

**Connection** (`utils/database.ts`): global-cached singleton; pool `maxPoolSize:50 / minPoolSize:5`; `serverSelectionTimeoutMS:10000`; calls `ensureModelsAreRegistered()` on connect; `waitForConnection(timeout)` polling helper; connection event handlers + SIGINT cleanup. Alias `dbConnect` exists in `utils/config/dbConnection.ts` (same function).

**Models** (`utils/models/`): User, Product, Order, Invoice, InvoiceCounter, Category, Brand, BlogPost, Review, Newsletter, DeliverySettings, StoreSettings, Gallery, Logistics, Vehicle. `utils/models/index.ts` registers a subset; others load via side-effect import. Bilingual fields `{ en, "zh-TW" }` throughout. Key relationships: Product→Brand/Category/User; Order→User + items→Product; Invoice→User/Orders/items→Product; User.wishlist→Product.

## State management

- **Zustand:** `cartStore` (persisted to localStorage, syncs to `/api/userData`), `productStore` (optimistic deletes + SWR `mutate`).
- **Context:** Language, Cart, User, Wishlist, Store/StoreSettings, Blog, Hero, Newsletter, About, Contact, CartUI.
- **SWR:** product lists, blog, wishlist, product details (~18 files).
- **i18n:** `LanguageProvider` with `t(key)` + `getMultiLangValue`; locales under `public/locales/{en,zh-TW}/`; `MultiLangInput` for admin bilingual editing.

## Auth

NextAuth v4, JWT strategy (30-day), Google + Credentials (bcrypt). Active config: `app/api/auth/[...nextauth]/auth.config.ts` (stale duplicate in `lib/auth.ts`). Roles: `admin | accounting | logistics | user`, but most checks use the `admin` boolean. JWT callback persists only `id/email/role/admin`.

**Server-side route protection: `proxy.ts`** (repo root). Next.js 16 renamed the `middleware` convention to `proxy` — do NOT add a `middleware.ts` (Next 16 errors if both exist and crashes the dev server). `proxy.ts` uses `withAuth`, defines `PUBLIC_ROUTES` / `PUBLIC_API_ROUTES`, gates `/admin` pages to admins, and gates `ADMIN_API_ROUTES` (`/api/admin`, `/api/orderAdmin`) to admin tokens. Add new admin API prefixes there.

## Integrations

- **Stripe:** checkout session + `webhook` (`checkout.session.completed` → order update + email).
- **Brevo:** `lib/emailService.ts` + `lib/emailTemplates`; env validated in `utils/env.ts`. (`@sendgrid/mail`, `@aws-sdk/client-ses` are installed but unused.)
- **Cloudinary:** `utils/cloudinary.ts` (+ duplicate `utils/config/cloudinary.ts`); signed uploads via `cloudinary/signature`.
- **Google Maps / Leaflet:** `components/maps/`, `GoogleMapsScript.tsx`.
- **PDF:** `@react-pdf/renderer`, `jspdf`, `html2canvas` for invoices.
