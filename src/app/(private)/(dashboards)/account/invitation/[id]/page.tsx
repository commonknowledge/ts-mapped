"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DEFAULT_AUTH_REDIRECT } from "@/constants";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

export default function InvitationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery(
    trpc.invitation.listForUser.queryOptions(),
  );

  const invitation = invitations?.find((inv) => inv.id === params.id);

  const { mutate: acceptInvite, isPending: isAccepting } = useMutation(
    trpc.organisation.acceptInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation accepted!", {
          description: `You've joined ${invitation?.organisationName}`,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invitation.listForUser.queryKey(),
        });
        router.push(DEFAULT_AUTH_REDIRECT);
      },
      onError: (error) => {
        toast.error("Failed to accept invitation", {
          description: error.message,
        });
      },
    }),
  );

  const { mutate: rejectInvite, isPending: isRejecting } = useMutation(
    trpc.organisation.rejectInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation declined");
        queryClient.invalidateQueries({
          queryKey: trpc.invitation.listForUser.queryKey(),
        });
        router.push(DEFAULT_AUTH_REDIRECT);
      },
      onError: (error) => {
        toast.error("Failed to decline invitation", {
          description: error.message,
        });
      },
    }),
  );

  const isPending = isAccepting || isRejecting;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This invitation may have already been used or does not exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Organisation invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <strong>{invitation.organisationName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => acceptInvite({ invitationId: invitation.id })}
              disabled={isPending}
            >
              <CheckIcon className="mr-2 h-4 w-4" />
              {isAccepting ? "Accepting…" : "Accept"}
            </Button>
            <Button
              variant="outline"
              onClick={() => rejectInvite({ invitationId: invitation.id })}
              disabled={isPending}
            >
              <XIcon className="mr-2 h-4 w-4" />
              {isRejecting ? "Declining…" : "Decline"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
