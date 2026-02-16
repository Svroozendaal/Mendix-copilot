import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TTL_MS, MendixCache } from "../../../src/mendix/cache.js";

describe("MendixCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves values", () => {
    const cache = new MendixCache();
    cache.set("key", { value: 42 });

    expect(cache.get<{ value: number }>("key")).toEqual({ value: 42 });
  });

  it("expires entries using default TTL", () => {
    const cache = new MendixCache();
    cache.set("key", "value");

    vi.advanceTimersByTime(DEFAULT_TTL_MS - 1);
    expect(cache.get<string>("key")).toBe("value");

    vi.advanceTimersByTime(1);
    expect(cache.get<string>("key")).toBeUndefined();
  });

  it("expires entries using custom TTL", () => {
    const cache = new MendixCache();
    cache.set("key", "value", 1000);

    vi.advanceTimersByTime(999);
    expect(cache.get<string>("key")).toBe("value");

    vi.advanceTimersByTime(1);
    expect(cache.get<string>("key")).toBeUndefined();
  });

  it("invalidates a single key", () => {
    const cache = new MendixCache();
    cache.set("a", 1);
    cache.set("b", 2);

    cache.invalidate("a");

    expect(cache.get<number>("a")).toBeUndefined();
    expect(cache.get<number>("b")).toBe(2);
  });

  it("clears all keys", () => {
    const cache = new MendixCache();
    cache.set("a", 1);
    cache.set("b", 2);

    cache.clear();

    expect(cache.get<number>("a")).toBeUndefined();
    expect(cache.get<number>("b")).toBeUndefined();
  });
});
