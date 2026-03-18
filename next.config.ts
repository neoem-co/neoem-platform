import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
    './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Extend proxy timeout for long-running AI/LLM calls (5 minutes)
    experimental: {
        proxyTimeout: 300_000,
    },
    async rewrites() {
        const aiBackendUrl = process.env.AI_BACKEND_URL || "http://localhost:8000";
        return [
            {
                source: "/api/ai-health",
                destination: `${aiBackendUrl}/health`,
            },
            {
                source: "/api/ai/:path*",
                destination: `${aiBackendUrl}/api/ai/:path*`,
            },
        ];
    },
};

export default withNextIntl(nextConfig);
