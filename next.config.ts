import { withSentryConfig } from "@sentry/nextjs";
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "commonknowledge",

  project: "typescript-mapped",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
