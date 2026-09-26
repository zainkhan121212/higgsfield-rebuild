import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't advertise the framework, and never ship source maps to browsers.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];
    return [
      // Sample pictures change only with a deploy; let browsers and the CDN keep them.
      { source: "/samples/:file*", headers: [...base, { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/_next/static/:path*", headers: base },
    ];
  },
};

export default nextConfig;
