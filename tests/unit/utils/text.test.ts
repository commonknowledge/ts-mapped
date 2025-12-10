import { describe, expect, test } from "vitest";
import { formatNumber } from "@/utils/text";

describe("formatNumber", () => {
  describe("non-finite values", () => {
    test("handles Infinity", () => {
      expect(formatNumber(Infinity)).toBe("Infinity");
    });

    test("handles -Infinity", () => {
      expect(formatNumber(-Infinity)).toBe("-Infinity");
    });

    test("handles NaN", () => {
      expect(formatNumber(NaN)).toBe("NaN");
    });
  });

  describe("trillions", () => {
    test("formats values >= 1 trillion with 't' suffix", () => {
      expect(formatNumber(1e12)).toBe("1t");
      expect(formatNumber(1.23e12)).toBe("1.23t");
      expect(formatNumber(1234567890123)).toBe("1.23t");
      expect(formatNumber(9.87e12)).toBe("9.87t");
    });

    test("handles negative trillions", () => {
      expect(formatNumber(-1e12)).toBe("-1t");
      expect(formatNumber(-1.23e12)).toBe("-1.23t");
    });
  });

  describe("billions", () => {
    test("formats values >= 1 billion with 'b' suffix", () => {
      expect(formatNumber(1e9)).toBe("1b");
      expect(formatNumber(1.23e9)).toBe("1.23b");
      expect(formatNumber(1234567890)).toBe("1.23b");
      expect(formatNumber(9.87e9)).toBe("9.87b");
    });

    test("handles negative billions", () => {
      expect(formatNumber(-1e9)).toBe("-1b");
      expect(formatNumber(-5.67e9)).toBe("-5.67b");
    });
  });

  describe("millions", () => {
    test("formats values >= 1 million with 'm' suffix", () => {
      expect(formatNumber(1e6)).toBe("1m");
      expect(formatNumber(1.23e6)).toBe("1.23m");
      expect(formatNumber(1234567)).toBe("1.23m");
      expect(formatNumber(9.87e6)).toBe("9.87m");
    });

    test("handles negative millions", () => {
      expect(formatNumber(-1e6)).toBe("-1m");
      expect(formatNumber(-4.56e6)).toBe("-4.56m");
    });
  });

  describe("thousands", () => {
    test("formats values >= 1 thousand with 'k' suffix", () => {
      expect(formatNumber(1000)).toBe("1k");
      expect(formatNumber(1230)).toBe("1.23k");
      expect(formatNumber(5000)).toBe("5k");
      expect(formatNumber(9870)).toBe("9.87k");
    });

    test("handles negative thousands", () => {
      expect(formatNumber(-1000)).toBe("-1k");
      expect(formatNumber(-2340)).toBe("-2.34k");
    });
  });

  describe("small numbers (< 1000)", () => {
    test("formats small numbers to 3 significant figures", () => {
      expect(formatNumber(123)).toBe("123");
      expect(formatNumber(12.3)).toBe("12.3");
      expect(formatNumber(1.23)).toBe("1.23");
      expect(formatNumber(0.123)).toBe("0.123");
    });

    test("handles zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    test("handles negative small numbers", () => {
      expect(formatNumber(-123)).toBe("-123");
      expect(formatNumber(-12.3)).toBe("-12.3");
      expect(formatNumber(-1.23)).toBe("-1.23");
    });

    test("strips trailing zeros from decimals", () => {
      expect(formatNumber(1.0)).toBe("1");
      expect(formatNumber(12.0)).toBe("12");
      expect(formatNumber(100)).toBe("100");
    });

    test("handles very small numbers", () => {
      expect(formatNumber(0.00123)).toBe("0.00123");
      expect(formatNumber(0.000001)).toBe("0.000001");
    });
  });

  describe("boundary values", () => {
    test("handles values just below trillion threshold", () => {
      expect(formatNumber(999.9e9)).toBe("1000b");
    });

    test("handles values just below billion threshold", () => {
      expect(formatNumber(999.9e6)).toBe("1000m");
    });

    test("handles values just below million threshold", () => {
      expect(formatNumber(999.9e3)).toBe("1000k");
    });

    test("handles values just below thousand threshold", () => {
      expect(formatNumber(999)).toBe("999");
      expect(formatNumber(999.5)).toBe("1000");
    });
  });

  describe("significant figures", () => {
    test("maintains 3 significant figures", () => {
      expect(formatNumber(123456)).toBe("123k");
      expect(formatNumber(1234567)).toBe("1.23m");
      expect(formatNumber(12345678)).toBe("12.3m");
      expect(formatNumber(123456789)).toBe("123m");
    });

    test("handles rounding correctly", () => {
      expect(formatNumber(1235)).toBe("1.24k");
      expect(formatNumber(1234)).toBe("1.23k");
    });
  });

  describe("edge cases with sign handling", () => {
    test("correctly applies negative sign to all magnitudes", () => {
      expect(formatNumber(-1.5e12)).toBe("-1.5t");
      expect(formatNumber(-2.5e9)).toBe("-2.5b");
      expect(formatNumber(-3.5e6)).toBe("-3.5m");
      expect(formatNumber(-4.5e3)).toBe("-4.5k");
      expect(formatNumber(-5.5)).toBe("-5.5");
    });

    test("handles negative zero", () => {
      expect(formatNumber(-0)).toBe("0");
    });
  });

  describe("decimal precision edge cases", () => {
    test("handles numbers that result in trailing zeros after formatting", () => {
      expect(formatNumber(1000000)).toBe("1m");
      expect(formatNumber(2000000)).toBe("2m");
      expect(formatNumber(10000)).toBe("10k");
    });

    test("handles numbers with many decimal places", () => {
      expect(formatNumber(1.23456789e6)).toBe("1.23m");
      expect(formatNumber(1.23456789e3)).toBe("1.23k");
    });
  });
});
