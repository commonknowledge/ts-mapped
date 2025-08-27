import http from "http";
import ngrok from "@ngrok/ngrok";
import httpProxy from "http-proxy";
import { trimLeadingSlashes, trimTrailingSlashes } from "@/lib/text";
import logger from "./logger";
import { getClient } from "./redis";

let publicUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

// Called from instrumentation.ts when running in dev mode
// Starts an ngrok tunnel and stores the URL in Redis
// (global variables do not persist between NextJS startup and execution)
// Also called from tests/setup.ts, with protocol = "http"
export const startPublicTunnel = async (
  backendProtocol: "http" | "https" = "https",
) => {
  const listener =
    backendProtocol === "http"
      ? await createHttpTunnel()
      : await createHttpsTunnel();

  publicUrl = listener.url() || "";
  logger.info(`Forwarding traffic from ${publicUrl}`);

  const redis = getClient();
  await redis.set("mapped:publicUrl", publicUrl);
};

// Used in unit tests, as (currently) the nextjs server doesn't run,
// so auto-generated https certs are not available
const createHttpTunnel = () => {
  return ngrok.forward({
    addr: 3000,
    authtoken_from_env: true,
  });
};

const createHttpsTunnel = () => {
  // Create an http => https proxy, as ngrok free tier is http only
  // The chain is: https://ngrok => http://localhost:3001 => https://localhost:3000
  const proxy = httpProxy.createProxyServer({
    target: "https://localhost:3000",
    changeOrigin: true,
    secure: false, // Accept self-signed certs
  });

  const server = http.createServer((req, res) => {
    proxy.web(req, res);
  });

  server.listen(3001, () => {
    logger.info("Proxy listening on http://localhost:3001");
  });

  return ngrok.forward({
    addr: 3001,
    authtoken_from_env: true,
  });
};

export const stopPublicTunnel = async () => {
  await ngrok.disconnect();
};

// Returns process.env.NEXT_PUBLIC_BASE_URL if it is set, otherwise tries to
// get the ngrok public URL from Redis. If no URL is found, an
// error will be thrown.
export const getPublicUrl = async (path = "/") => {
  if (!publicUrl) {
    const redis = getClient();
    const storedPublicUrl = await redis.get("mapped:publicUrl");
    if (!storedPublicUrl) {
      throw new Error(
        "Public URL not found. Set the NEXT_PUBLIC_BASE_URL environment variable, or start the server with NODE_ENV=development",
      );
    }
    publicUrl = storedPublicUrl;
  }
  return `${trimTrailingSlashes(publicUrl)}/${trimLeadingSlashes(path)}`;
};
