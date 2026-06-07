# tfffoods Conventions

Follow these established patterns. Match siblings; do not introduce a competing approach.

## API route handler (DB access)

Every route that touches MongoDB must open and confirm the connection, register referenced models before `.populate()`, and return JSON errors with status codes.

```ts
import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = await waitForConnection(10000);
    if (!isConnected) throw new Error("Database connection timeout");

    if (!mongoose.models.Brand) mongoose.model("Brand", Brand.schema);

    const data = await Product.find(/* ... */).populate("brand", "name");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error <doing X>:", error);
    return NextResponse.json({ error: "Failed to <do X>" }, { status: 500 });
  }
}
```

Rules:
- Add `export const dynamic = "force-dynamic";` for routes that must not be statically cached.
- Always guard `mongoose.model(...)` registration for any model used in `.populate()`.
- Never leak `error.message`/stack to the client in committed code (use it only for temporary local debugging, then revert).

## Auth checks (the real gate)

`createRouteHandler({ requireAuth, requireAdmin })` accepts these flags but **does not enforce them** (`utils/routeHandler.ts`). Always check the session inside the handler:

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// admin-only:
if (!session.user.admin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- Use the `admin` boolean for admin gating (matches the majority of the codebase). If you need finer control, use `role` — but be consistent within the route.
- Client-side checks in `app/admin/layout.tsx` are UX only, never security.

### Server-side gating: `proxy.ts` (Next 16)

The repo root `proxy.ts` is Next 16's renamed middleware (uses `withAuth`). **Never create `middleware.ts`** — if both exist Next 16 throws and crashes the dev server.

- Public access: add paths to `PUBLIC_ROUTES` / `PUBLIC_API_ROUTES`.
- Admin-only API: add the prefix to `ADMIN_API_ROUTES` (returns 403 for non-admin tokens). Admin enforcement runs at the **top** of the proxy function.
- `/admin` pages are gated to admins (redirect to `/`).
- Protected user **pages**: add the prefix to `PROTECTED_PAGE_PREFIXES` (the `authorized` callback requires a session and redirects to `/login`).
- **API routes always pass through `authorized`** (so they return their own JSON instead of a login redirect). Therefore **always add an inline `session?.user?.admin` / `session?.user` check in API handlers** — `proxy.ts` only gates admin APIs, not per-user API auth.

## Models

- Add new models in `utils/models/` (the canonical location). Do not add to `models/` or `app/models/`.
- Bilingual content fields use the shape `{ en: string, "zh-TW": string }`.
- Register the model in `utils/models/index.ts` if other code relies on `ensureModelsAreRegistered()`.
- Export pattern: `export default mongoose.models.X || mongoose.model("X", schema)`.

## i18n

- User-facing strings: `const { t, language } = useTranslation()` then `t("namespace.key")`.
- Add keys to both `public/locales/en/*.json` and `public/locales/zh-TW/*.json`.
- For content from the DB: render `obj.displayNames[language] || obj.displayNames.en`.
- Use `MultiLangInput` for admin forms that edit bilingual fields.

## Client data fetching

- Prefer SWR for read lists/details; use `mutate()` for cache invalidation (see `store/productStore.ts`).
- Cart state goes through `store/cartStore.ts` + `CartContext`; do not write to cart localStorage directly.
- On fetch failure, set empty state and surface a friendly message — don't leave the UI in a permanent skeleton.

## Styling / UI

- Use existing shadcn primitives in `components/ui/` before adding new ones.
- Tailwind with theme tokens (`text-foreground`, `bg-card`, `text-muted-foreground`, etc.) for dark-mode support — avoid hardcoded colors.
- Icons from `lucide-react`; toasts from `react-hot-toast`.

## Comments & readability

- No comments that narrate code. Comment only non-obvious intent/constraints.
- Keep new files focused; avoid extending the existing mega-files — extract components/hooks instead.
