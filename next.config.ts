import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Fix build on Render
    ignoreDuringBuilds: true,
  },
  // Fix build warning caused by graphql-yoga
  serverExternalPackages: ["@whatwg-node"],
};

export default nextConfig;
