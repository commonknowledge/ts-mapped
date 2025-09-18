import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Sentry
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  // Internal service setup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: logger } = await import("@/server/services/logger");
    if (!process.env.JWT_SECRET) {
      logger.error("Failed to start: missing JWT_SECRET environment variable");
      process.exit(1);
    }

    const { runWorker } = await import("./server/services/queue");
    await runWorker();

    if (process.env.NODE_ENV !== "production") {
      try {
        const { startPublicTunnel } = await import("./server/services/urls");
        await startPublicTunnel();
      } catch (error) {
        logger.error("Failed to start public tunnel", { error });
      }
    }

    const { schedule } = await import("@/server/services/queue");
    // Run refreshWebhooks at 3:00am every day (see https://timgit.github.io/pg-boss/#/./api/scheduling)
    await schedule("0 3 * * *", "refreshWebhooks", {});

    logger.info("Started");
  }
}

export const onRequestError = Sentry.captureRequestError;
