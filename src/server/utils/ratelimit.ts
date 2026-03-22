import { getClient } from "@/server/services/redis";

const WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const redis = getClient();
  const key = `rate_limit:login:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }
  return count <= MAX_ATTEMPTS;
}
