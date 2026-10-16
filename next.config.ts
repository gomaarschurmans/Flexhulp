import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Profielfoto's worden in de browser verkleind, maar laat wat marge toe.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
