import ngrok from "@ngrok/ngrok";
import { trimLeadingSlashes, trimTrailingSlashes } from "@/server/utils/text";
import logger from "./logger";
import { getClient } from "./redis";

let publicUrl = process.env.BASE_URL || ""

export const startPublicTunnel = async () => {
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken_from_env: true,
  });

  publicUrl = listener.url() || ""
  logger.info(`Forwarding traffic from ${publicUrl}`)

  // Store in redis as global variables have strange behavior in NextJS
  const redis = getClient()
  await redis.set("mapped:publicUrl", publicUrl)
};

export const getPublicUrl = async (path: string) => {
  if (!publicUrl) {
    const redis = getClient()
    publicUrl = await redis.get("mapped:publicUrl") || ""
  }
  return `${trimTrailingSlashes(publicUrl)}/${trimLeadingSlashes(path)}`
}
