import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extend proxy timeout for long-running AI/LLM calls (5 minutes)
  experimental: {
    proxyTimeout: 300_000,
  },
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
