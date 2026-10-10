import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // admin paneldan bir nechta rasm yuklash uchun (har biri 5 MB gacha)
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
