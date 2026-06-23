/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "cdn-icons-png.flaticon.com" },
    ],
  },
  serverExternalPackages: ["mongoose"],
  // Path aliases (@, @/utils, @/utils/models) are resolved from tsconfig.json
  // "paths" — Turbopack reads them natively, so no resolveAlias is needed.
  // Mapping them here to bare directories breaks `import "@/utils/models"`
  // because Turbopack won't auto-resolve the folder's index.ts.
  turbopack: {},
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  async rewrites() {
    return [
      {
        source: "/locales/:path*",
        destination: "/public/locales/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      {
        source: "/locales/:path*",
        headers: [
          { key: "Content-Type", value: "application/json" },
          // Revalidate on every load so newly added translation keys show up
          // immediately instead of being served from a stale 1h browser cache.
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
