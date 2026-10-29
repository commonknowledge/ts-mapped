"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicMapAccessStatus } from "@/models/PublicMapAccess";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";

const statusText: Record<PublicMapAccessStatus, string> = {
  [PublicMapAccessStatus.Pending]: "is waiting for a decision",
  [PublicMapAccessStatus.Approved]:
    "has been approved. They have been emailed a link to the map",
  [PublicMapAccessStatus.Rejected]: "has been rejected",
  [PublicMapAccessStatus.Revoked]: "had access, which has been revoked",
};

const decisionLabels: Record<PublicMapAccessStatus, string> = {
  [PublicMapAccessStatus.Pending]: "",
  [PublicMapAccessStatus.Approved]: "Approve",
  [PublicMapAccessStatus.Rejected]: "Reject",
  [PublicMapAccessStatus.Revoked]: "Revoke access",
};

export default function AccessReview({ token }: { token: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const queryKey = trpc.publicMapAccess.review.queryKey({ token });

  const { data: review } = useQuery(
    trpc.publicMapAccess.review.queryOptions({ token }),
  );

  const {
    mutate: decide,
    isPending,
    error,
    variables,
  } = useMutation(
    trpc.publicMapAccess.decide.mutationOptions({
      onSuccess: (result) => queryClient.setQueryData(queryKey, result),
      // Another moderator may have decided first: show the current state
      onError: () => queryClient.invalidateQueries({ queryKey }),
    }),
  );

  if (!review) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-base font-semibold">
          Access request for {review.mapName}
        </h1>
        <p className="text-sm">
          The request from <strong>{review.email}</strong>{" "}
          {statusText[review.status]}.
        </p>
        <p className="text-xs text-muted-foreground">
          Requested{" "}
          {review.requestedAt.toLocaleString("en-GB", {
            // Fixed, so the server and browser render the same text
            timeZone: "Europe/London",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {error && <p className="text-sm text-red-600">{error.message}</p>}
        {review.allowedDecisions.length > 0 && (
          <div className="flex gap-2">
            {review.allowedDecisions.map((status) => (
              <Button
                key={status}
                variant={
                  status === PublicMapAccessStatus.Approved
                    ? "default"
                    : "outline"
                }
                disabled={isPending}
                onClick={() => decide({ token, status })}
              >
                {isPending && variables?.status === status
                  ? "Saving…"
                  : decisionLabels[status]}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
