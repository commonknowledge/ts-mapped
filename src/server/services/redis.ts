import Redis from "ioredis";

let client: Redis | null = null;

export const getClient = () => {
  if (!client) {
    // ioredis 6 defaults to RESP3; keep RESP2 so reply shapes are unchanged.
    client = new Redis(process.env.REDIS_URL || "", { protocol: 2 });
  }
  return client;
};
