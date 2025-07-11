import ngrok from "@ngrok/ngrok";
import { trimLeadingSlashes, trimTrailingSlashes } from "@/server/utils/text";
import logger from "./logger";
import { getClient } from "./redis";

let publicUrl = process.env.BASE_URL || "";

// Called from instrumentation.ts when running in dev mode
// Starts an ngrok tunnel and stores the URL in Redis
// (global variables do not persist between NextJS startup and execution)
export const startPublicTunnel = async (
  authToken: string | undefined = undefined,
) => {
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken: authToken,
    authtoken_from_env: !Boolean(authToken),
  });

  publicUrl = listener.url() || "";
  logger.info(`Forwarding traffic from ${publicUrl}`);

  const redis = getClient();
  await redis.set("mapped:publicUrl", publicUrl);
};

export const stopPublicTunnel = async () => {
  await ngrok.disconnect();
};

// Returns process.env.BASE_URL if it is set, otherwise tries to
// get the ngrok public URL from Redis. If no URL is found, an
// error will be thrown.
export const getPublicUrl = async (path = "/") => {
  if (!publicUrl) {
    const redis = getClient();
    const storedPublicUrl = await redis.get("mapped:publicUrl");
    if (!storedPublicUrl) {
      throw new Error(
        "Public URL not found. Set the BASE_URL environment variable, or start the server with NODE_ENV=development",
      );
    }
    publicUrl = storedPublicUrl;
  }
  return `${trimTrailingSlashes(publicUrl)}/${trimLeadingSlashes(path)}`;
};

export const getLocalUrl = (path = "/") => {
  const localBase = "http://localhost:3000";
  return `${localBase}/${trimLeadingSlashes(path)}`;
};
