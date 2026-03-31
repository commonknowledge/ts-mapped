"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a callback that invokes the given function after `delay` ms of no further calls.
 * The last arguments are used when the timer fires.
 */
export function useDebouncedCallback<A extends unknown[], R>(
  fn: (...args: A) => R,
  delay: number,
): (...args: A) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: A) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
