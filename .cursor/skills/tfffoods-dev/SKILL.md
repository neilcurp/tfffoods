---
name: tfffoods-dev
description: >-
  Architecture map, conventions, and known issues for the tfffoods Next.js +
  MongoDB e-commerce app. Use when working anywhere in this codebase: adding or
  editing API routes, Mongoose models, providers/stores, admin pages, auth,
  i18n, checkout/invoices, or payments/integrations (Stripe, Brevo, Cloudinary).
  Apply it before making changes so fixes stay compatible with existing patterns.
---

# tfffoods Development Guide

A bilingual (en / zh-TW) e-commerce app: **Next.js 16 App Router · React 19 · TypeScript · MongoDB/Mongoose · NextAuth v4 (JWT) · Zustand + React Context · Tailwind + shadcn/Radix**. Integrations: Stripe, Brevo (email), Cloudinary (media), Google Maps.

## How to use this skill

1. Before editing, identify which layer you're touching (route / model / provider / page / integration).
2. Match the **existing** pattern for that layer — see [CONVENTIONS.md](CONVENTIONS.md). Do not invent a new pattern when one exists.
3. Check [KNOWN-ISSUES.md](KNOWN-ISSUES.md) first — the bug you're fixing may be documented, and many traps (dead auth flags, duplicate models/routes, missing DB connect) are listed there.
4. For the big-picture layout and file locations, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Golden rules (from the project owner)

- **Remember previously fixed issues** — log new root-cause fixes in [KNOWN-ISSUES.md](KNOWN-ISSUES.md).
- **Don't break existing functionality** when fixing a new issue.
- **Consider the whole picture** before changing anything — there are duplicate models/routes; a change in one may need mirroring or consolidation.
- **Stay compatible with all existing solutions** — match the established pattern, don't fork a new one.
- **Keep code readable and maintainable** — no narrating comments; comments only for non-obvious intent.

## Non-negotiable conventions (quick reference)

| Layer | Rule |
|-------|------|
| API route | Call `await connectToDatabase()` then `await waitForConnection(10000)` at the top of every handler that touches the DB. Wrap in try/catch returning `NextResponse.json({ error }, { status })`. |
| Auth check | `createRouteHandler({ requireAdmin })` does **NOT** enforce auth (dead flag). Always check `getServerSession(authOptions)` manually inside the handler. |
| Admin gate | Server-side protection is in **`proxy.ts`** (Next 16's renamed middleware — never add `middleware.ts`). It gates `/admin` pages + `ADMIN_API_ROUTES`. Also add an inline `session?.user?.admin` check in admin API handlers (defense in depth). |
| Models | Reference brand/category by `mongoose.model(...)` registration guard before `.populate()`. Canonical models live in `utils/models/`. |
| i18n | All user-facing text uses `t("key")` from `LanguageContext`; content models store `{ en, "zh-TW" }`. Never hardcode display strings. |
| Env / DB | DB host is a MongoDB Atlas SRV cluster in `MONGODB_URI` (`.env` + `.env.local`). If products fail to load, suspect the cluster/DNS — see KNOWN-ISSUES. |

## Safe-change workflow

```
- [ ] 1. Locate the layer + read the existing sibling implementation
- [ ] 2. Check KNOWN-ISSUES.md for related traps / prior fixes
- [ ] 3. Check for duplicates (e.g. /product/[id] vs /products/[productId]) and decide if both need updating
- [ ] 4. Make the change matching the established pattern
- [ ] 5. For DB routes: confirm connectToDatabase + waitForConnection + manual auth check
- [ ] 6. Run ReadLints on edited files; fix introduced lints
- [ ] 7. If it's a root-cause fix, append a dated entry to KNOWN-ISSUES.md
```

## Top improvement areas (ranked)

1. **Security**: server protection is in `proxy.ts` (gates `/admin` pages + admin APIs). `orderAdmin` and debug routes were hardened 2026-06-07. CMS write routes (hero/features/guarantee) were verified 2026-06-23 to already have inline `session?.user?.admin` checks.
2. **Dead auth flags**: `requireAuth`/`requireAdmin` in `utils/routeHandler.ts` are accepted but never enforced.
3. **Duplication**: two auth configs, two Cloudinary configs, two StoreSettings models, models in 3 folders, duplicate product/featured routes.
4. **Mega-files**: `app/admin/settings/page.tsx` (~3179 lines), `app/invoices/[invoiceNumber]/page.tsx` (~1042), `app/api/checkout/route.ts` (~493).
5. **Missing App Router features**: no per-segment `loading.tsx` / `error.tsx`; error-boundary components exist but unwired.
6. **Hygiene**: auth-callback PII logs and unused deps removed (2026-06-07); `store/cartStore.ts` debug logs remain.

See [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for the full list with file paths and recommended fixes.
