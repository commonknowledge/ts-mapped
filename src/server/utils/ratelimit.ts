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

async function checkRateLimit(
  key: string,
  maxAttempts: number,
): Promise<boolean> {
  const redis = getClient();
  const results = await redis
    .multi()
    .incr(key)
    .expire(key, WINDOW_SECONDS)
    .exec();
  const count = results && results[0] ? (results[0][1] as number) : 0;
  return count <= maxAttempts;
}

export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  return checkRateLimit(`rate_limit:login:${ip}`, LOGIN_MAX_ATTEMPTS);
}

export async function checkForgotPasswordRateLimit(
  ip: string,
): Promise<boolean> {
  return checkRateLimit(
    `rate_limit:forgot_password:${ip}`,
    FORGOT_PASSWORD_MAX_ATTEMPTS,
  );
}
