import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/repositories/User", () => ({
  findUserByEmailAndPassword: vi.fn(),
}));
vi.mock("@/server/utils/ratelimit", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    incrementLoginAttempt: vi.fn(),
    rollbackLoginAttempt: vi.fn(),
  };
});
vi.mock("@/auth/jwt", () => ({
  setJWT: vi.fn(),
}));
vi.mock("@/server/services/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/login/route";
import { findUserByEmailAndPassword } from "@/server/repositories/User";
import {
  checkLoginAttempt,
  rollbackLoginAttempt,
} from "@/server/utils/ratelimit";

const mockIncrementLoginAttempt = vi.mocked(checkLoginAttempt);
const mockRollbackLoginAttempt = vi.mocked(rollbackLoginAttempt);
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
    mockIncrementLoginAttempt.mockResolvedValue(true);
    mockRollbackLoginAttempt.mockResolvedValue(undefined);
    mockFindUser.mockResolvedValue(null);
  });

  describe("rate limiting", () => {
    test("allows request when rate limit is not exceeded", async () => {
      mockIncrementLoginAttempt.mockResolvedValue(true);
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      const response = await POST(request);
      expect(response.status).not.toBe(429);
      expect(mockIncrementLoginAttempt).toHaveBeenCalledWith("1.2.3.4");
    });

    test("returns 429 when rate limit is exceeded", async () => {
      mockIncrementLoginAttempt.mockResolvedValue(false);
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
      expect(mockIncrementLoginAttempt).toHaveBeenCalledWith("10.0.0.1");
    });

    test("trims whitespace from the first IP in x-forwarded-for", async () => {
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "  192.168.1.1  , 10.0.0.1" },
      );
      await POST(request);
      expect(mockIncrementLoginAttempt).toHaveBeenCalledWith("192.168.1.1");
    });

    test("falls back to x-real-ip when x-forwarded-for is absent", async () => {
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-real-ip": "5.6.7.8" },
      );
      await POST(request);
      expect(mockIncrementLoginAttempt).toHaveBeenCalledWith("5.6.7.8");
    });

    test('uses "unknown" when no IP header is present', async () => {
      const request = makeRequest({
        email: "user@example.com",
        password: "pass",
      });
      await POST(request);
      expect(mockIncrementLoginAttempt).toHaveBeenCalledWith("unknown");
    });

    test("rolls back the attempt on successful login", async () => {
      mockFindUser.mockResolvedValue({
        id: "1",
        email: "user@example.com",
        name: "User",
        createdAt: new Date(),
        passwordHash: "",
        avatarUrl: undefined,
      });
      const request = makeRequest(
        { email: "user@example.com", password: "correctpassword" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      await POST(request);
      expect(mockRollbackLoginAttempt).toHaveBeenCalledWith("1.2.3.4");
    });

    test("does not roll back on invalid credentials", async () => {
      mockFindUser.mockResolvedValue(null);
      const request = makeRequest(
        { email: "user@example.com", password: "wrongpassword" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(mockRollbackLoginAttempt).not.toHaveBeenCalled();
    });

    test("rolls back the attempt on invalid request body", async () => {
      const request = makeRequest({ email: "not-an-email", password: "" });
      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(mockRollbackLoginAttempt).toHaveBeenCalledWith("unknown");
    });

    test("rolls back the attempt on unexpected server error", async () => {
      mockFindUser.mockRejectedValue(new Error("db failure"));
      const request = makeRequest(
        { email: "user@example.com", password: "pass" },
        { "x-forwarded-for": "1.2.3.4" },
      );
      const response = await POST(request);
      expect(response.status).toBe(500);
      expect(mockRollbackLoginAttempt).toHaveBeenCalledWith("1.2.3.4");
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
