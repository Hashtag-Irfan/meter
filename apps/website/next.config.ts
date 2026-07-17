import type { NextConfig } from "next";

const isGithubPages = process.env["GITHUB_PAGES"] === "true";

const nextConfig: NextConfig = {
  // Static export — fully local, no server required
  output: "export",

  // Strict React mode
  reactStrictMode: true,

  // Image optimization disabled for static export
  images: {
    unoptimized: true,
  },

  // GitHub Pages hosts under a subpath: /<repo>/
  ...(isGithubPages
    ? {
        basePath: "/meter",
        assetPrefix: "/meter/",
      }
    : {}),
};

export default nextConfig;
