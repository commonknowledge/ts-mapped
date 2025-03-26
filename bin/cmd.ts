import { Command } from "commander";
import importConstituencies from "@/server/commands/importConstituencies"
import importMSOAs from "@/server/commands/importMSOAs";
import importOutputAreas from "@/server/commands/importOutputAreas"
import importPostcodes from "@/server/commands/importPostcodes";
import importDataSource from "@/server/jobs/importDataSource";
import { db } from "@/server/services/database";
import { runWorker } from "@/server/services/queue";

const program = new Command();

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
  await db.destroy()
});

program.parse(process.argv);
