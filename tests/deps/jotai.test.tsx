// @vitest-environment jsdom
import { render } from "@testing-library/react";
import {
  Provider,
  atom,
  createStore,
  useAtomValue,
  useAtomValueRawSync,
  useSetAtom,
} from "jotai";
import { unwrap } from "jotai/utils";
import React, { useEffect } from "react";
import { describe, expect, test } from "vitest";
import type { Atom } from "jotai";

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

/**
 * jotai 3 dropped the extra re-render `useAtomValue` used to do right after
 * subscribing. A component that renders before a sibling's effect writes an
 * atom, and subscribes after, now keeps the stale value until the atom next
 * changes. The map editor hits this: MapJotaiProvider hydrates viewIdAtom as
 * null, the overlay mounts in the same commit as the map data, and
 * useInitialMapViewEffect (in MapNavbar, earlier in the tree) writes the real
 * view ID before the overlay's subscriptions attach. The route-level hooks in
 * src/app/(private)/map/[id]/hooks/useMapCore.ts and useMapViews.ts use
 * `useAtomValueRawSync` for that reason; this test pins the behaviour.
 */
describe("jotai react: writes between render and subscribe", () => {
  const renderWithSiblingWriter = (
    Reader: (props: { atom: Atom<string | null> }) => React.ReactNode,
  ) => {
    const idAtom = atom<string | null>(null);
    const Writer = () => {
      const setId = useSetAtom(idAtom);
      useEffect(() => {
        setId("written-in-effect");
      }, [setId]);
      return null;
    };
    const store = createStore();
    // Writer comes first so its effect runs before Reader's subscription
    const view = render(
      <Provider store={store}>
        <Writer />
        <Reader atom={idAtom} />
      </Provider>,
    );
    return { view, store, idAtom };
  };

  test("useAtomValue misses the write (documents the v3 change)", () => {
    const Reader = ({ atom: a }: { atom: Atom<string | null> }) => {
      const id = useAtomValue(a);
      return <output>{String(id)}</output>;
    };
    const { view, store, idAtom } = renderWithSiblingWriter(Reader);
    expect(store.get(idAtom)).toBe("written-in-effect");
    expect(view.container.textContent).toBe("null");
  });

  test("useAtomValueRawSync picks the write up", () => {
    const Reader = ({ atom: a }: { atom: Atom<string | null> }) => {
      const id = useAtomValueRawSync(a);
      return <output>{String(id)}</output>;
    };
    const { view } = renderWithSiblingWriter(Reader);
    expect(view.container.textContent).toBe("written-in-effect");
  });
});
