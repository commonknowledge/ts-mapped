"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SentryFeedbackWidget() {
  useEffect(() => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      integrations: [
        Sentry.feedbackIntegration({
          colorScheme: "light",
          triggerLabel: "",
        }),
      ],
    });
  }, []);

  return <></>;
}
