import { Command } from "commander";
import { SignJWT } from "jose";
import ensureOrganisationMap from "@/server/commands/ensureOrganisationMap";
import importAreaSet from "@/server/commands/importAreaSet";
import importPostcodes from "@/server/commands/importPostcodes";
import regeocode from "@/server/commands/regeocode";
import removeDevWebhooks from "@/server/commands/removeDevWebhooks";
import Invite from "@/server/emails/Invite";
import enrichDataSource from "@/server/jobs/enrichDataSource";
import importDataSource from "@/server/jobs/importDataSource";
import refreshWebhooks from "@/server/jobs/refreshWebhooks";
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
import { getClient as getMinioClient } from "@/server/services/minio";
import { getPubSub } from "@/server/services/pubsub";
import { boss } from "@/server/services/queue";
import { getClient as getRedisClient } from "@/server/services/redis";
import { stopPublicTunnel } from "@/server/services/urls";
import { runWorker } from "@/server/services/worker";

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
  .command("importAreaSet <areaSetCode>")
  .description("Import Area Set by code")
  .action(async (areaSetCode) => {
    await importAreaSet(areaSetCode);
  });

program
  .command("importPostcodes")
  .description("Import Postcodes")
  .action(async () => {
    await importPostcodes();
  });

program
  .command("importDataSource <dataSourceId>")
  .description("Import a data source by its ID")
  .action(async (dataSourceId) => {
    await importDataSource({ dataSourceId });
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
  .option("--senderOrganisationId <senderOrganisationId>")
  .description("Create an invitation for a user")
  .action(async (options) => {
    const invitation = await createInvitation({
      email: options.email,
      name: options.name,
      organisationId: options.organisationId,
      senderOrganisationId:
        options.senderOrganisationId || options.organisationId,
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
        logger.warn(`No organisation found for user ${user.email}`);
        continue;
      }

      const invitation = await createInvitation({
        email: user.email,
        name: user.name,
        organisationId: orgs[0].id,
        senderOrganisationId: orgs[0].id,
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
  .option("--ids <ids>", "The data source IDs")
  .option("--exclude <exclude>", "A data source ID to exclude")
  .option("--batchSize <batchSize>", "The data record batch size")
  .option(
    "--batchInterval <batchInterval>",
    "Time to sleep between importing batches, in milliseconds",
  )
  .action(async (options) => {
    await regeocode({
      onlyIds: (options.ids || "").split(",").filter(Boolean),
      excludeId: options.exclude,
      batchSize: Number(options.batchSize) || 100,
      batchIntervalMillis: Number(options.batchInterval) || 0,
    });
  });

program
  .command("refreshWebhooks")
  .description("Refresh webhooks")
  .action(async () => {
    await refreshWebhooks(null);
  });

program
  .command("removeDevWebhooks")
  .description("Remove development environment webhooks from a data source")
  .option("--id <id>", "The data source ID")
  .action(async (options) => {
    await removeDevWebhooks(options.id);
  });

program
  .command("largestMinioFiles")
  .description("Find the N largest files in the MinIO ts-mapped bucket")
  .option("-n <n>", "Number of files to return", "10")
  .action(async (options) => {
    const n = parseInt(options.n, 10);
    const client = getMinioClient();
    const stream = client.listObjects("ts-mapped", "", true);
    const files: { name: string; size: number }[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj) => {
        if (obj.name && obj.size !== undefined) {
          files.push({ name: obj.name, size: obj.size });
        }
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    if (!files.length) {
      logger.info("No files found in bucket.");
      return;
    }
    const toHuman = (size: number) => {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let value = size;
      let unit = units[0];
      for (let i = 1; i < units.length && value >= 1024; i++) {
        value /= 1024;
        unit = units[i];
      }
      return `${value.toFixed(2)} ${unit}`;
    };
    files
      .sort((a, b) => b.size - a.size)
      .slice(0, n)
      .forEach(({ name, size }, i) => {
        logger.info(`${i + 1}. ${name} (${toHuman(size)})`);
      });
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
    await boss.stop();
    await db.destroy();
    await getPubSub().quit();
    await getRedisClient().quit();
    await stopPublicTunnel();
  }
});

program.parse(process.argv);
