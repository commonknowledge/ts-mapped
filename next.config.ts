import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  images: {
    remotePatterns: [new URL(`https://${process.env.MINIO_DOMAIN}/**`)],
    domains: ["localhost", "minio-server-2irj.onrender.com", "*.ngrok-free.app", "cdn.sanity.io"],

  },
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
};

export default nextConfig;
