import { Command } from "commander";
import { SignJWT } from "jose";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import importConstituencies from "@/server/commands/importConstituencies";
import importMSOAs from "@/server/commands/importMSOAs";
import importOutputAreas from "@/server/commands/importOutputAreas";
import importPostcodes from "@/server/commands/importPostcodes";
import importRegions from "@/server/commands/importRegions";
import regeocode from "@/server/commands/regeocode";
import removeDevWebhooks from "@/server/commands/removeDevWebhooks";
import Invite from "@/server/emails/invite";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import { createInvitation } from "@/server/repositories/Invitation";
import {
  findOrganisationByName,
  findOrganisationsByUserId,
  upsertOrganisation,
} from "@/server/repositories/Organisation";
import { upsertOrganisationUser } from "@/server/repositories/OrganisationUser";
import { listUsers, upsertUser } from "@/server/repositories/User";
import { db } from "@/server/services/database";
import logger from "@/server/services/logger";
import { sendEmail } from "@/server/services/mailer";
import { getPubSub } from "@/server/services/pubsub";
import { runWorker } from "@/server/services/queue";
import { getClient as getRedisClient } from "@/server/services/redis";
import { stopPublicTunnel } from "@/server/services/urls";

const program = new Command();

let keepAlive = false;

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
  .command("importRegions")
  .description("Import English Regions & Nations")
  .action(async () => {
    await importRegions();
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
  .option("--name <name>")
  .option("--password <password>")
  .option(
    "--org <organisation>",
    "The name of an organisation this user belongs to",
  )
  .description("Create a new user")
  .action(async (options) => {
    try {
      const org = await upsertOrganisation({
        name: options.org,
      });
      const user = await upsertUser({
        email: options.email,
        name: options.name,
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
  .command("createInvitation")
  .option("--email <email>")
  .option("--name <name>")
  .option("--organisationId <organisationId>")
  .description("Create an invitation for a user")
  .action(async (options) => {
    const invitation = await createInvitation({
      email: options.email,
      name: options.name,
      organisationId: options.organisationId,
    });

    logger.info(`Created invitation ${invitation.id}`);

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const token = await new SignJWT({ invitationId: invitation.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    await sendEmail(options.email, "Invite to Mapped", Invite({ token }));
    logger.info(`Sent invite to ${options.email}`);

    logger.info(`Invitation token: ${token}`);
  });

program
  .command("inviteAll")
  .description("Create and send invitations for all users")
  .action(async () => {
    const users = await listUsers();
    for (const user of users) {
      const orgs = await findOrganisationsByUserId(user.id);

      if (!orgs.length) {
        logger.warning(`No organisation found for user ${user.email}`);
        continue;
      }

      const invitation = await createInvitation({
        email: user.email,
        name: user.name,
        organisationId: orgs[0].id,
      });

      logger.info(`Created invitation ${invitation.id}`);

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
      const token = await new SignJWT({ invitationId: invitation.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      await sendEmail(user.email, "Invite to Mapped", Invite({ token }));
      logger.info(`Sent invite to ${user.email}`);

      logger.info(`Invitation token: ${token}`);
    }
  });

program
  .command("regeocode")
  .description("Re-geocode all data records (e.g. after adding a new area set)")
  .option("--id <id>", "The data source ID")
  .option("--exclude <exclude>", "A data source ID to exclude")
  .action(async (options) => {
    await regeocode(options.id || null, options.exclude || null);
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
    keepAlive = true;
    await runWorker(options.queue);
  });

program.hook("postAction", async () => {
  if (!keepAlive) {
    logger.info("Done.");
    await db.destroy();
    await getPubSub().quit();
    await getRedisClient().quit();
    await stopPublicTunnel();
  }
});

program.parse(process.argv);
