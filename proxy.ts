import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";

// Next.js "middleware" file convention is deprecated in favor of "proxy".

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/blog",
  "/products",
  "/product",
  "/privacy-policy",
];

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/categories",
  "/api/products",
  "/api/blog/featured",
  "/api/products/featured",
  "/api/products/bestselling",
  "/api/products/product-of-the-month",
  "/api/gallery",
  "/api/store-settings",
  "/api/hero-sections",
];

// Define API routes that require an admin token
const ADMIN_API_ROUTES = ["/api/admin", "/api/orderAdmin"];

// Page routes that require a logged-in user (non-admin protected pages).
// Everything not listed here stays public, so public browsing pages
// (e.g. /categories, /brands, /products) are never accidentally blocked.
const PROTECTED_PAGE_PREFIXES = [
  "/profile",
  "/orders",
  "/invoices",
  "/dashboard",
  "/checkout",
];

const matchesPrefix = (path: string, routes: string[]) =>
  routes.some((route) =>
    route === "/" ? path === "/" : path.startsWith(route)
  );

export default withAuth(
  async function proxy(request) {
    try {
      const path = request.nextUrl.pathname;
      const isAdminRoute = path.startsWith("/admin");
      const isApiRoute = path.startsWith("/api");
      const isAdminApiRoute = ADMIN_API_ROUTES.some((route) =>
        path.startsWith(route)
      );
      const isPublicRoute = matchesPrefix(path, PUBLIC_ROUTES);
      const isPublicApiRoute = matchesPrefix(path, PUBLIC_API_ROUTES);
      const isAuthRoute = path.startsWith("/api/auth");

      // Log the request details
      logger.info(`Processing request: ${path}`, {
        method: request.method,
        isAdminRoute,
        isApiRoute,
        isPublicRoute,
        isPublicApiRoute,
        isAuthRoute,
      });

      // Enforce admin access first so admin pages/APIs are protected
      // regardless of the public-route handling below. Login enforcement for
      // protected user pages is handled by the `authorized` callback.
      const token = request.nextauth.token;
      if (isAdminApiRoute && !token?.admin) {
        logger.warn(`Non-admin user attempted to access admin API: ${path}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (isAdminRoute && !token?.admin) {
        logger.warn(`Non-admin user attempted to access admin route: ${path}`);
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Handle auth routes with proper cache control
      if (isAuthRoute) {
        const response = NextResponse.next();
        response.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        return response;
      }

      // Skip authentication for public routes
      if (isPublicRoute) return NextResponse.next();

      // Skip authentication for public API routes
      if (isPublicApiRoute) return NextResponse.next();

      // Handle API routes
      if (isApiRoute) {
        // Add CORS headers for API routes
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
      }

      return NextResponse.next();
    } catch (error) {
      logger.error("Error in proxy", error);
      return NextResponse.next();
    }
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // API routes always pass through to their own handlers, which perform
        // auth and return JSON (admin APIs are enforced in the proxy function).
        // This avoids turning JSON 401s into login-page redirects.
        if (path.startsWith("/api")) return true;

        // Admin pages pass through; the proxy function redirects non-admins.
        if (path.startsWith("/admin")) return true;

        // Protected user pages require a logged-in session.
        if (matchesPrefix(path, PROTECTED_PAGE_PREFIXES)) return !!token;

        // All other pages are public.
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|locales/).*)", // Exclude auth routes and static files
  ],
};

