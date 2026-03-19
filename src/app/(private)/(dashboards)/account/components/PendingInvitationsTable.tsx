"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

export default function PendingInvitationsTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery(
    trpc.invitation.listForUser.queryOptions(),
  );

  const { mutate: acceptInvite, isPending: isAccepting } = useMutation(
    trpc.organisation.acceptInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation accepted!");
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invitation.listForUser.queryKey(),
        });
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
      <p className="text-sm text-muted-foreground">Loading invitations…</p>
    );
  }

  if (!invitations?.length) {
    return (
      <p className="text-sm text-muted-foreground">No pending invitations.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organisation</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">
              {invitation.organisationName ?? "Unknown"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => acceptInvite({ invitationId: invitation.id })}
                  disabled={isPending}
                >
                  <CheckIcon className="mr-1 h-3 w-3" />
                  {isAccepting ? "Accepting…" : "Accept"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectInvite({ invitationId: invitation.id })}
                  disabled={isPending}
                >
                  <XIcon className="mr-1 h-3 w-3" />
                  {isRejecting ? "Declining…" : "Decline"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
