import { DEV_NEXT_PUBLIC_BASE_URL } from "./src/constants";
import type { NextConfig } from "next";

const mainHost = new URL(
  process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL,
);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  experimental: {
    serverActions: {
      allowedOrigins: [mainHost.host],
    },
  },
  images: {
    remotePatterns: [new URL(`https://${process.env.MINIO_DOMAIN}/**`)],
    domains: [
      "localhost",
      process.env.MINIO_DOMAIN,
      "*.ngrok-free.app",
      "cdn.sanity.io",
    ].filter((d) => d !== undefined),
  },
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
};

export default nextConfig;
