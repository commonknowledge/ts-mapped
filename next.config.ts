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
    remotePatterns: ["localhost", process.env.MINIO_DOMAIN, "cdn.sanity.io"]
      .filter((d) => d !== undefined)
      .map((d) => new URL(`https://${d}/**`)),
  },
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
};

export default nextConfig;
