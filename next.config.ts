import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Brauzerga "bu sayt boshqa saytga joylanmasin, fayl turi aldanmasin" kabi himoya qoidalari
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`, // Next.js oʻzining ichki skriptlari uchun
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:", // Vercel Blob rasmlari https orqali
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // admin paneldan bir nechta rasm yuklash uchun (har biri 5 MB gacha)
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(isProd
            ? [
                { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
                { key: "Content-Security-Policy", value: csp },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
