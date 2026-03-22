import { getClient } from "@/server/services/redis";

const WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const redis = getClient();
  const key = `rate_limit:login:${ip}`;
  const results = await redis
    .multi()
    .incr(key)
    .expire(key, WINDOW_SECONDS)
    .exec();
  const count = results && results[0] ? (results[0][1] as number) : 0;
  return count <= MAX_ATTEMPTS;
}
