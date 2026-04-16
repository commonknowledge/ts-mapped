"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";

const DISMISSED_KEY = "mapped-trial-banner-dismissed";

function getDaysRemaining(trialEndsAt: Date) {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function TrialBanner({ trialEndsAt }: { trialEndsAt: Date }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISSED_KEY) === "true";
  });
  // useState (not useMemo) because Date.now() triggers the react-hooks/purity lint rule
  const [daysRemaining] = useState(() => getDaysRemaining(trialEndsAt));

  if (daysRemaining === null || dismissed) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
      <AlertDescription className="flex items-center justify-between">
        <span>
          You&apos;re on a trial period.{" "}
          {daysRemaining === 1
            ? "1 day remaining."
            : `${daysRemaining} days remaining.`}
        </span>
        <button
          onClick={handleDismiss}
          className="ml-4 text-sm text-muted-foreground underline hover:text-foreground"
        >
          Dismiss
        </button>
      </AlertDescription>
    </Alert>
  );
}
