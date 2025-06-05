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
      await startPublicTunnel()
    }

    logger.info("Started");
  }
}
