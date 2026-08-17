import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRateLimitWindows,
  slidingWindowRateLimit,
} from "@/lib/rate-limit";

describe("slidingWindowRateLimit", () => {
  beforeEach(() => {
    clearRateLimitWindows();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first call and blocks when the limit is reached", () => {
    const first = slidingWindowRateLimit("ip-1", 1, 60_000);
    expect(first.allowed).toBe(true);

    const second = slidingWindowRateLimit("ip-1", 1, 60_000);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const limit = 1;
    const windowMs = 60_000;

    expect(slidingWindowRateLimit("ip-2", limit, windowMs).allowed).toBe(true);
    expect(slidingWindowRateLimit("ip-2", limit, windowMs).allowed).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    expect(slidingWindowRateLimit("ip-2", limit, windowMs).allowed).toBe(true);
  });

  it("keeps keys independent", () => {
    expect(slidingWindowRateLimit("ip-a", 1, 60_000).allowed).toBe(true);
    expect(slidingWindowRateLimit("ip-a", 1, 60_000).allowed).toBe(false);

    expect(slidingWindowRateLimit("ip-b", 1, 60_000).allowed).toBe(true);
  });

  it("reports retryAfterSeconds within the remaining window", () => {
    slidingWindowRateLimit("ip-3", 1, 60_000);

    const blocked = slidingWindowRateLimit("ip-3", 1, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});