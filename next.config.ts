import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Remote image hosts allowed through next/image. Unsplash serves the free
  // editorial photography used in the writing posts.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },

  async headers() {
    return [
      { source: "/((?!examples/dynamic-toolbar|examples/reading-gif-panel).*)", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
      { source: "/examples/dynamic-toolbar", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] },
      { source: "/examples/reading-gif-panel", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }] },
      // Opaque sandbox documents need CORS for the original font files.
      { source: "/_next/static/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
