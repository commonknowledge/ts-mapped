"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    setReady(true);
  }, []);

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
