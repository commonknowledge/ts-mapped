"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  PUBLIC_MAP_ACCESS_TOKEN_PARAM,
  PUBLIC_MAP_EMBED_PAGE_PARAM,
} from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

type ClaimStatus = "none" | "claiming" | "claimed" | "invalid";

/**
 * The interactive part of the access gate.
 *
 * Arriving with a magic link token in the URL: the token is removed from
 * the address bar (so it is not shared by copying the URL) and exchanged
 * for the access grant cookie, then the page refreshes so the server
 * renders the map.
 *
 * Otherwise: a form to request access by email.
 */
export default function PublicMapAccessForm({
  publicMapId,
  mapUrl,
}: {
  publicMapId: string;
  mapUrl: string;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const didClaim = useRef(false);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("none");
  const [isRefreshing, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  // In an iframe without embed.js (e.g. a hand-written <iframe>): requests
  // and magic links can't work here, as the map can't tell which page it
  // is on
  const [isBareIframe, setIsBareIframe] = useState(false);

  const {
    mutate: requestAccess,
    isPending: isRequesting,
    isSuccess: hasRequested,
    isError: requestFailed,
  } = useMutation(trpc.publicMapAccess.request.mutationOptions());

  useEffect(() => {
    if (didClaim.current) {
      return;
    }
    didClaim.current = true;

    const url = new URL(window.location.href);
    const isFramed = window.self !== window.top;
    if (isFramed && !url.searchParams.has(PUBLIC_MAP_EMBED_PAGE_PARAM)) {
      setIsBareIframe(true);
      return;
    }

    const token = url.searchParams.get(PUBLIC_MAP_ACCESS_TOKEN_PARAM);
    if (!token) {
      return;
    }
    url.searchParams.delete(PUBLIC_MAP_ACCESS_TOKEN_PARAM);
    window.history.replaceState(window.history.state, "", url);

    setClaimStatus("claiming");
    const claim = async () => {
      try {
        const response = await fetch("/api/public-map-access/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          setClaimStatus("invalid");
          return;
        }
        startTransition(() => router.refresh());
        setClaimStatus("claimed");
      } catch {
        setClaimStatus("invalid");
      }
    };
    void claim();
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isRequesting) {
      return;
    }
    const pageUrl = new URL(window.location.href).searchParams.get(
      PUBLIC_MAP_EMBED_PAGE_PARAM,
    );
    requestAccess({ publicMapId, email, pageUrl });
  };

  if (isBareIframe) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="font-medium">
          This map needs to be embedded using the embed code from Mapped.
        </p>
        <p>
          You can still{" "}
          <a href={mapUrl} target="_blank" className="underline">
            request access at the map&apos;s own address
          </a>
          .
        </p>
      </div>
    );
  }

  if (
    claimStatus === "claiming" ||
    (claimStatus === "claimed" && isRefreshing)
  ) {
    return <p className="text-sm">Opening the map…</p>;
  }

  // Cookie-stick detection, as in `ShareClaim`: the grant cookie is
  // httpOnly, so the only way to learn whether it stuck is to see what the
  // server renders. Once the refresh has finished, either the server saw
  // the grant and swapped in the map (unmounting us), or we are still
  // here, meaning the browser did not keep the cookie.
  if (claimStatus === "claimed") {
    return (
      <p className="text-sm">
        Your browser is blocking the cookie this map needs. Please allow cookies
        for this site, or open the link from your email in a different browser.
      </p>
    );
  }

  if (hasRequested) {
    return (
      <p className="text-sm">
        Thanks. If your request is approved, you will receive an email with a
        link to the map. If you already have access, a new link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {claimStatus === "invalid" && (
        <p className="text-sm text-red-600">
          That link has expired. Enter your email to get a new link.
        </p>
      )}
      <p className="text-sm">
        Enter your email to request access. A moderator will review your
        request.
      </p>
      <Input
        type="email"
        required
        value={email}
        placeholder="Email address"
        aria-label="Email address"
        onChange={(e) => setEmail(e.target.value)}
      />
      {requestFailed && (
        <p className="text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
      <Button type="submit" disabled={!email || isRequesting}>
        {isRequesting ? "Sending…" : "Request access"}
      </Button>
    </form>
  );
}
