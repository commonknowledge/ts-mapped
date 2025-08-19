import { Command } from "commander";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import importConstituencies from "@/server/commands/importConstituencies";
import importMSOAs from "@/server/commands/importMSOAs";
import importOutputAreas from "@/server/commands/importOutputAreas";
import importPostcodes from "@/server/commands/importPostcodes";
import removeDevWebhooks from "@/server/commands/removeDevWebhooks";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import {
  findOrganisationByName,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { quit as quitPubSub } from "@/server/services/pubsub";
import { runWorker } from "@/server/services/queue";
import { getClient as getRedisClient } from "@/server/services/redis";
import { stopPublicTunnel } from "@/server/services/urls";

const program = new Command();

program
  .command("ensureOrganisationMap")
  .option(
    "--org <organisation>",
    "The name of an organisation this map belongs to",
  )
  .description("Create a new map")
  .action(async (options) => {
    try {
      const org = await findOrganisationByName(options.org);
      if (!org) {
        throw new Error(`Organisation not found: ${options.org}`);
      }
      const map = await ensureOrganisationMap(org.id);
      logger.info(`Created map ${map.id}`);
    } catch (error) {
      logger.error("Could not create map", { error });
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
  .command("createsuperuser")
  .description(
    "Create a superuser with hello@commonknowledge.coop and password 1234",
  )
  .action(async () => {
    try {
      const email = "hello@commonknowledge.coop";
      const password = "1234";
      const orgName = "Common Knowledge";

      logger.info("Creating superuser...");

      // Create or find the organisation
      const org = await upsertOrganisation({ name: orgName });
      logger.info(`Organisation: ${org.name} (ID: ${org.id})`);

      // Create the user
      const user = await upsertUser({
        email,
        password,
      });
      logger.info(`User created: ${user.email} (ID: ${user.id})`);

      // Link user to organisation
      await upsertOrganisationUser({ organisationId: org.id, userId: user.id });
      logger.info(`User linked to organisation: ${org.name}`);

      // Ensure the organisation has a map
      const map = await ensureOrganisationMap(org.id);
      logger.info(`Organisation map ensured: ${map.id}`);

      logger.info("✅ Superuser created successfully!");
      logger.info(`Email: ${email}`);
      logger.info(`Password: ${password}`);
      logger.info(`Organisation: ${orgName}`);
    } catch (error) {
      logger.error("❌ Failed to create superuser", { error });
    }
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
