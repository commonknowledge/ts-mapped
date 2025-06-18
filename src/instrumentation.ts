export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: logger } = await import("@/server/services/logger");
    if (!process.env.JWT_SECRET) {
      logger.error("Failed to start: missing JWT_SECRET environment variable");
      process.exit(1);
    }

    const { runWorker } = await import("./server/services/queue");
    await runWorker();

    if (process.env.NODE_ENV !== "production") {
      const { startPublicTunnel } = await import("./server/services/publicUrl");
      await startPublicTunnel();
    }

    const { schedule } = await import("@/server/services/queue");
    // Run refreshWebhooks at 3:00am every day (see https://timgit.github.io/pg-boss/#/./api/scheduling)
    await schedule("0 3 * * *", "refreshWebhooks", {});

    logger.info("Started");
  }
}
