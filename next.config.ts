import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extend proxy timeout for long-running AI/LLM calls (5 minutes)
  experimental: {
    proxyTimeout: 300_000,
  },
  async rewrites() {
    const aiBackendUrl = process.env.AI_BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/ai/:path*",
        destination: `${aiBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
