import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — fully local, no server required
  output: "export",

  // Strict React mode
  reactStrictMode: true,

  // Optimizations
  experimental: {
    // Use React compiler when stable
  },

  // Image optimization disabled for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
