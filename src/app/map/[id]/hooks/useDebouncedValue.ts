"use client";

import { useEffect, useState } from "react";

/**
 * Returns a value that updates after `delay` ms of the source value not changing.
 * Useful for search/filter inputs so the input stays responsive while heavy work is debounced.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
