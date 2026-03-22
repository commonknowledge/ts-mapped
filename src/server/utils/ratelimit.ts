import { getClient } from "@/server/services/redis";

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    (forwarded ? forwarded.split(",")[0].trim() : null) ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

const WINDOW_SECONDS = 15 * 60; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;
const FORGOT_PASSWORD_MAX_ATTEMPTS = 5;

async function recordAttempt(key: string): Promise<number> {
  const redis = getClient();
  const results = await redis
    .multi()
    .incr(key)
    .expire(key, WINDOW_SECONDS)
    .exec();
  return results && results[0] ? (results[0][1] as number) : 0;
}

export async function checkLoginAttempt(ip: string): Promise<boolean> {
  const count = await recordAttempt(`rate_limit:login:${ip}`);
  return count <= LOGIN_MAX_ATTEMPTS;
}

export async function rollbackLoginAttempt(ip: string): Promise<void> {
  const redis = getClient();
  const key = `rate_limit:login:${ip}`;

  const results = await redis
    .multi()
    .decr(key)
    .expire(key, WINDOW_SECONDS)
    .exec();

  const newCount =
    results && results[0] && Array.isArray(results[0]) ? (results[0][1] as number) : 0;

  if (newCount <= 0) {
    await redis.del(key);
  }
}

export async function checkForgotPasswordAttempt(ip: string): Promise<boolean> {
  const count = await recordAttempt(`rate_limit:forgot_password:${ip}`);
  return count <= FORGOT_PASSWORD_MAX_ATTEMPTS;
}
