import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that can't be bundled in the NextJS build
  serverExternalPackages: ["@whatwg-node", "@ngrok/ngrok"],
};

export default nextConfig;
