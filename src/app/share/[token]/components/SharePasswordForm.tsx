"use client";

import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

/**
 * The password gate for a protected shared map. Submitting posts to the
 * verify endpoint, which sets the grant cookie; the refresh then re-runs
 * the server component, which sees the grant and renders the map.
 */
export default function SharePasswordForm({
  token,
  mapName,
}: {
  token: string;
  mapName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting || verified) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/share/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setVerified(true);
        startTransition(() => router.refresh());
        return;
      }
      if (response.status === 404) {
        // The share was disabled or its token rotated while the form was
        // open: refresh so the server renders the real outcome (the 404
        // page) rather than reporting an incorrect password
        startTransition(() => router.refresh());
        return;
      }
      if (response.status === 429) {
        setError("Too many attempts. Please try again in a few minutes.");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cookie-stick detection, shared with `ShareClaim`: the grant cookie is
  // httpOnly and `router.refresh()` reports nothing back, so the only way
  // to learn whether the cookie stuck is to see what the server renders.
  // `isRefreshing` spans the full refresh round-trip, and a refresh
  // preserves client component state — so once a correct password's
  // refresh has finished, either the server saw the grant and swapped in
  // the map (unmounting us), or this same instance is still mounted,
  // meaning the browser is blocking cookies. Without this the form would
  // silently re-appear and the viewer would resubmit forever.
  if (verified && !isRefreshing) {
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
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <LockIcon size={16} className="text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold truncate">{mapName}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            This map is password protected. Enter the password to view it.
          </p>
        </div>
        <Input
          type="password"
          value={password}
          autoFocus
          placeholder="Password"
          aria-label="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          disabled={!password || submitting || verified || isRefreshing}
        >
          {submitting || verified || isRefreshing ? "Checking..." : "View map"}
        </Button>
      </form>
    </div>
  );
}
