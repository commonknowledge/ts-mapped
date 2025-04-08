import { Command } from "commander";
import importConstituencies from "@/server/commands/importConstituencies";
import importMSOAs from "@/server/commands/importMSOAs";
import importOutputAreas from "@/server/commands/importOutputAreas";
import importPostcodes from "@/server/commands/importPostcodes";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import { createDataSource } from "@/server/repositories/DataSource";
import { upsertOrganisation } from "@/server/repositories/Organisation";
import { createOrganisationUser } from "@/server/repositories/OrganisationUser";
import { createUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { quit as quitRedis } from "@/server/services/pubsub";
import { runWorker } from "@/server/services/queue";
import { DataSourceConfigSchema, GeocodingConfigSchema } from "@/zod";

const program = new Command();

program
  .command("createDataSource")
  .option("--name <name>", "The data source name")
  .option("--config <config>", "The data source config, as JSON")
  .option(
    "--geocoding-config <geocodingConfig>",
    "The data source geocoding config, as JSON",
  )
  .description("Create and import a data source")
  .action(async (options) => {
    const parsedConfig = DataSourceConfigSchema.parse(
      JSON.parse(options.config),
    );
    const parsedGeocodingConfig = GeocodingConfigSchema.parse(
      JSON.parse(options.geocodingConfig),
    );
    const dataSource = await createDataSource({
      name: options.name,
      config: JSON.stringify(parsedConfig),
      columnDefs: "[]",
      columnRoles: "{}",
      enrichments: "[]",
      geocodingConfig: JSON.stringify(parsedGeocodingConfig),
    });
    logger.info(`Created data source ${options.name}, ID ${dataSource.id}`);
    await importDataSource({ dataSourceId: dataSource.id });
  });

program
  .command("createUser")
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
      const user = await createUser({
        email: options.email,
        password: options.password,
      });
      await createOrganisationUser({ organisationId: org.id, userId: user.id });
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
  .command("runWorker")
  .description("Run the worker process")
  .option("--queue <queue>", "Specify the queue to process")
  .action(async (options) => {
    await runWorker(options.queue);
  });

program.hook("postAction", async () => {
  logger.info("Done.");
  await db.destroy();
  await quitRedis();
});

program.parse(process.argv);
