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

    // Add the feedback integration to the existing client
    const feedbackIntegration = Sentry.feedbackIntegration({
      colorScheme: "light",
      triggerLabel: "",
    });

    client.addIntegration(feedbackIntegration);
  }, []);

  return <></>;
}
