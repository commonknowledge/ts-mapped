import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix build warning caused by graphql-yoga
  serverExternalPackages: ["@whatwg-node"],
};

export default nextConfig;
