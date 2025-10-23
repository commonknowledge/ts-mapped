"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const [ready, setReady] = useState(false);
  const posthogKey =
    process.env.NODE_ENV !== "development"
      ? process.env.NEXT_PUBLIC_POSTHOG_KEY
      : "";

  useEffect(() => {
    if (!posthogKey) return;
    posthog.init(posthogKey || "", {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true,
      debug: false,
    });
    setReady(true);
  }, [posthogKey]);

  useEffect(() => {
    if (ready && currentUser?.id) {
      posthog.identify(currentUser.id, {
        email: currentUser.email,
        name: currentUser.name,
      });
    }
  }, [currentUser, ready]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
