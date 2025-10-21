"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SentryFeedbackWidget() {
  useEffect(() => {
    // Get the existing Sentry client
    const client = Sentry.getClient();

    if (!client) {
      console.warn("Sentry client not initialized");
      return;
    }

    const feedbackIntegration = Sentry.feedbackIntegration({
      colorScheme: "light",
      triggerLabel: "",
      enableScreenshot: false,

      // Reducing the size of the request
      // redundant to global config for now but repeating it here to be on the safe side
      onFormOpen: () => {
        client.getOptions().beforeSend = (event) => {
          if (event.type === "feedback") {
            event.breadcrumbs = event.breadcrumbs?.slice(-10); // Keep only last 10
          }
          return event;
        };
      },
    });

    client.addIntegration(feedbackIntegration);
  }, []);

  return <></>;
}
