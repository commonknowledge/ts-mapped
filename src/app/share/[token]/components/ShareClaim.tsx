"use client";

import { LoaderPinwheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// A claim attempted this recently that still yielded no grant means the
// browser is not storing our cookies
const RECENT_CLAIM_WINDOW_MS = 5000;

const CLAIM_ATTEMPT_KEY = "shareClaimAttemptedAt";

/**
 * The invisible claim step for a passwordless share: on mount, asks the
 * claim endpoint to mint the grant cookie, then refreshes so the server
 * component re-renders with the grant — the same mechanism as
 * `SharePasswordForm`, minus the form. If the refreshed page still has no
 * grant, the browser is blocking cookies: show a message instead of
 * claiming again.
 */
export default function ShareClaim({ token }: { token: string }) {
  const router = useRouter();
  const didRun = useRef(false);
  const [isRefreshing, startTransition] = useTransition();
  const [status, setStatus] = useState<"claiming" | "claimed" | "blocked">(
    "claiming",
  );

  useEffect(() => {
    if (didRun.current) {
      return;
    }
    didRun.current = true;

    try {
      const lastAttempt = Number(sessionStorage.getItem(CLAIM_ATTEMPT_KEY));
      if (Date.now() - lastAttempt < RECENT_CLAIM_WINDOW_MS) {
        setStatus("blocked");
        return;
      }
      sessionStorage.setItem(CLAIM_ATTEMPT_KEY, String(Date.now()));
    } catch {
      // Storage being unavailable means cookies are blocked too
      setStatus("blocked");
      return;
    }

    const claim = async () => {
      try {
        await fetch(`/api/share/${token}/claim`, { method: "POST" });
      } catch {
        // Let the refreshed page decide what went wrong (404, password
        // form, or the blocked-cookies message below)
      }
      startTransition(() => router.refresh());
      setStatus("claimed");
    };
    void claim();
  }, [token, router]);

  // A finished refresh that still renders this component means the server
  // saw no grant: the cookie did not stick
  const blocked =
    status === "blocked" || (status === "claimed" && !isRefreshing);

  if (blocked) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 text-center">
        <p className="max-w-[40ch] text-base">
          This shared map needs cookies to work. Please enable cookies for this
          site and reload the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoaderPinwheel className="w-6 h-6 animate-spin text-neutral-400" />
    </div>
  );
}
