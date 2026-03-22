import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/server/utils/ratelimit", () => ({
  checkForgotPasswordAttempt: vi.fn(),
}));
vi.mock("@/server/repositories/User", () => ({
  findUserByEmail: vi.fn(),
}));
vi.mock("@/server/services/mailer", () => ({
  sendEmail: vi.fn(),
}));
vi.mock("@/server/services/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { findUserByEmail } from "@/server/repositories/User";
import { authRouter } from "@/server/trpc/routers/auth";
import { checkForgotPasswordAttempt } from "@/server/utils/ratelimit";

const mockCheckForgotPasswordAttempt = vi.mocked(checkForgotPasswordAttempt);
const mockFindUserByEmail = vi.mocked(findUserByEmail);

function makeCaller(ip = "1.2.3.4") {
  return authRouter.createCaller({ user: null, ip });
}

describe("auth.forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckForgotPasswordAttempt.mockResolvedValue(true);
    mockFindUserByEmail.mockResolvedValue(undefined);
  });

  describe("rate limiting", () => {
    test("allows request when rate limit is not exceeded", async () => {
      mockCheckForgotPasswordAttempt.mockResolvedValue(true);
      const caller = makeCaller("1.2.3.4");
      await expect(
        caller.forgotPassword({ email: "user@example.com" }),
      ).resolves.toBe(true);
      expect(mockCheckForgotPasswordAttempt).toHaveBeenCalledWith("1.2.3.4");
    });

    test("throws TOO_MANY_REQUESTS when rate limit is exceeded", async () => {
      mockCheckForgotPasswordAttempt.mockResolvedValue(false);
      const caller = makeCaller("1.2.3.4");
      await expect(
        caller.forgotPassword({ email: "user@example.com" }),
      ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    });

    test("passes the caller IP to the rate limiter", async () => {
      const caller = makeCaller("9.8.7.6");
      await caller.forgotPassword({ email: "user@example.com" });
      expect(mockCheckForgotPasswordAttempt).toHaveBeenCalledWith("9.8.7.6");
    });

    test("does not look up user when rate limit is exceeded", async () => {
      mockCheckForgotPasswordAttempt.mockResolvedValue(false);
      const caller = makeCaller();
      await expect(
        caller.forgotPassword({ email: "user@example.com" }),
      ).rejects.toThrow();
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
    });
  });
});
