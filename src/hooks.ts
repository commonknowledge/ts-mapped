"use client";

import { useContext, useEffect, useState } from "react";
import { ServerSessionContext } from "./providers/ServerSessionProvider";

export const useCurrentUser = () => {
  return useContext(ServerSessionContext).currentUser;
};

export const useDebounced = <T>(input: T) => {
  const [debounceValue, setDebouncedValue] = useState(input);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(input);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [input]);

  return debounceValue;
};
