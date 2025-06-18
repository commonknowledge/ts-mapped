import Redis from "ioredis";

let client: Redis | null = null;

export const getClient = () => {
  if (!client) {
    client = new Redis(process.env.REDIS_URL || "");
  }
  return client;
};
