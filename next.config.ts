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
  },
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
};

export default nextConfig;
