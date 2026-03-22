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

// INCR is atomic — concurrent requests get strictly increasing counts,
// eliminating any TOCTOU race. If rollbackLoginAttempt is later called after
// the key has expired, Redis creates it at -1, which is harmless: the next
// INCR produces 0 with a fresh TTL.

export async function checkLoginAttempt(ip: string): Promise<boolean> {
  const count = await recordAttempt(`rate_limit:login:${ip}`);
  return count <= LOGIN_MAX_ATTEMPTS;
}

export async function rollbackLoginAttempt(ip: string): Promise<void> {
  const redis = getClient();
  await redis.decr(`rate_limit:login:${ip}`);
}

export async function checkForgotPasswordAttempt(ip: string): Promise<boolean> {
  const count = await recordAttempt(`rate_limit:forgot_password:${ip}`);
  return count <= FORGOT_PASSWORD_MAX_ATTEMPTS;
}
