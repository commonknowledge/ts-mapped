import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/repositories/User", () => ({
  findUserByEmailAndPassword: vi.fn(),
}));
vi.mock("@/server/utils/ratelimit", () => ({
  checkLoginRateLimit: vi.fn(),
}));
vi.mock("@/auth/jwt", () => ({
  setJWT: vi.fn(),
}));
vi.mock("@/server/services/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/login/route";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import { checkLoginRateLimit } from "@/server/utils/ratelimit";

const mockCheckLoginRateLimit = vi.mocked(checkLoginRateLimit);
const mockFindUser = vi.mocked(findUserByEmailAndPassword);

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost/api/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLoginRateLimit.mockResolvedValue(true);
    mockFindUser.mockResolvedValue(null);
  });

  describe("rate limiting", () => {
    test("allows request when rate limit is not exceeded", async () => {
      mockCheckLoginRateLimit.mockResolvedValue(true);
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      const response = await POST(request);
      expect(response.status).not.toBe(429);
      expect(mockCheckLoginRateLimit).toHaveBeenCalledWith("1.2.3.4");
    });

    test("returns 429 when rate limit is exceeded", async () => {
      mockCheckLoginRateLimit.mockResolvedValue(false);
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      const response = await POST(request);
      expect(response.status).toBe(429);
      const body = (await response.json()) as { error: string };
      expect(body.error).toMatch(/too many login attempts/i);
    });

    test("uses only the first IP from a multi-value x-forwarded-for header", async () => {
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" },
      );
      await POST(request);
      expect(mockCheckLoginRateLimit).toHaveBeenCalledWith("10.0.0.1");
    });

    test("trims whitespace from the first IP in x-forwarded-for", async () => {
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "  192.168.1.1  , 10.0.0.1" },
      );
      await POST(request);
      expect(mockCheckLoginRateLimit).toHaveBeenCalledWith("192.168.1.1");
    });

    test("falls back to x-real-ip when x-forwarded-for is absent", async () => {
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-real-ip": "5.6.7.8" },
      );
      await POST(request);
      expect(mockCheckLoginRateLimit).toHaveBeenCalledWith("5.6.7.8");
    });

    test('uses "unknown" when no IP header is present', async () => {
      const request = makeRequest({
        email: "user@example.com",
        password: "pass",
      });
      await POST(request);
      expect(mockCheckLoginRateLimit).toHaveBeenCalledWith("unknown");
    });
  });

  describe("authentication", () => {
    test("returns 400 for invalid request body", async () => {
      const request = makeRequest({ email: "not-an-email", password: "" });
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 401 for invalid credentials", async () => {
      mockFindUser.mockResolvedValue(null);
      const request = makeRequest({
        email: "user@example.com",
        password: "wrongpassword",
      });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
});
