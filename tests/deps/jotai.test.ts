import { atom, createStore } from "jotai";
import { unwrap } from "jotai/utils";
import { describe, expect, test } from "vitest";

/**
 * jotai as used in src/hooks and the map editor: plain atoms, derived atoms,
 * writable derived atoms, async atoms read through `unwrap`, and a store
 * (the Provider in src/providers wraps one). jotai 3 removes atomFamily and
 * loadable from jotai/utils and goes ESM-only; neither is used here.
 */
describe("jotai", () => {
  test("atom, derived atom, writable derived atom via a store", () => {
    const store = createStore();
    const countAtom = atom(1);
    const doubledAtom = atom((get) => get(countAtom) * 2);
    const incrementAtom = atom(null, (get, set, by: number) =>
      set(countAtom, get(countAtom) + by),
    );

    expect(store.get(doubledAtom)).toBe(2);
    store.set(incrementAtom, 4);
    expect(store.get(countAtom)).toBe(5);
    expect(store.get(doubledAtom)).toBe(10);
  });

  test("store.sub fires on change", () => {
    const store = createStore();
    const a = atom("x");
    const seen: string[] = [];
    const unsub = store.sub(a, () => seen.push(store.get(a)));
    store.set(a, "y");
    store.set(a, "z");
    unsub();
    store.set(a, "ignored");
    expect(seen).toEqual(["y", "z"]);
  });

  test("unwrap exposes an async atom's resolved value", async () => {
    const store = createStore();
    const asyncAtom = atom(async () => "resolved");
    const unwrapped = unwrap(asyncAtom, () => "loading");
    expect(store.get(unwrapped)).toBe("loading");
    await store.get(asyncAtom);
    expect(store.get(unwrapped)).toBe("resolved");
  });
});
