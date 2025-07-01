import { Command } from "commander";
import importConstituencies from "@/server/commands/importConstituencies";
import importMSOAs from "@/server/commands/importMSOAs";
import importOutputAreas from "@/server/commands/importOutputAreas";
import importPostcodes from "@/server/commands/importPostcodes";
import removeDevWebhooks from "@/server/commands/removeDevWebhooks";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import { ensureOrganisationMap } from "@/server/repositories/Map";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { stopPublicTunnel } from "@/server/services/publicUrl";
import { quit as quitPubSub } from "@/server/services/pubsub";
import { runWorker } from "@/server/services/queue";
import { getClient as getRedisClient } from "@/server/services/redis";

const program = new Command();

program
  .command("upsertUser")
  .option("--email <email>")
  .option("--password <password>")
  .option(
    "--org <organisation>",
    "The name of an organisation this user belongs to",
  )
  .description("Create a new user")
  .action(async (options) => {
    try {
      const org = await upsertOrganisation({ name: options.org });
      const user = await upsertUser({
        email: options.email,
        password: options.password,
      });
      await upsertOrganisationUser({ organisationId: org.id, userId: user.id });
      await ensureOrganisationMap(org.id);
      logger.info(`Created user ${options.email}, ID ${user.id}`);
    } catch (error) {
      logger.error("Could not create user", { error });
    }
  });

program
  .command("enrichDataSource <dataSourceId>")
  .description("Enrich the source CMS of a data source by its Mapped ID")
  .action(async (dataSourceId) => {
    await enrichDataSource({ dataSourceId });
  });

program
  .command("importConstituencies")
  .description("Import Westminster Constituencies")
  .action(async () => {
    await importConstituencies();
  });

program
  .command("importDataSource <dataSourceId>")
  .description("Import a data source by its ID")
  .action(async (dataSourceId) => {
    await importDataSource({ dataSourceId });
  });

program
  .command("importMSOAs")
  .description("Import MSOAs")
  .action(async () => {
    await importMSOAs();
  });

program
  .command("importOutputAreas")
  .description("Import English Output Areas")
  .action(async () => {
    await importOutputAreas();
  });

program
  .command("importPostcodes")
  .description("Import Postcodes")
  .action(async () => {
    await importPostcodes();
  });

program
  .command("removeDevWebhooks")
  .description("Remove development environment webhooks from a data source")
  .option("--id <id>", "The data source ID")
  .action(async (options) => {
    await removeDevWebhooks(options.id);
  });

program
  .command("runWorker")
  .description("Run the worker process")
  .option("--queue <queue>", "Specify the queue to process")
  .action(async (options) => {
    await runWorker(options.queue);
  });

program.hook("postAction", async () => {
  logger.info("Done.");
  await db.destroy();
  await quitPubSub();
  await getRedisClient().quit();
  await stopPublicTunnel();
});

program.parse(process.argv);
