"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { useCurrentUser } from "@/hooks";
import { useOrganisations } from "@/hooks/useOrganisations";
import { OrganisationUserRole } from "@/models/OrganisationUser";
import { useTRPC } from "@/services/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function OrganisationUsersTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { currentOrganisation, canManageMembers } = useOrganisations();
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const { data: users, isLoading } = useQuery(
    trpc.organisation.listUsers.queryOptions(
      { organisationId: currentOrganisation?.id ?? "" },
      { enabled: Boolean(currentOrganisation) },
    ),
  );

  const { mutate: removeMember, isPending: isRemoving } = useMutation(
    trpc.organisation.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed");
        setMemberToRemove(null);
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.listUsers.queryKey(),
        });
      },
      onError: (error) => {
        toast.error("Failed to remove member", {
          description: error.message,
        });
      },
    }),
  );

  if (!currentOrganisation) {
    return null;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading members…</p>;
  }

  if (!users?.length) {
    return <p className="text-sm text-muted-foreground">No members found.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManageMembers && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isAdmin = user.role === OrganisationUserRole.Admin;
            const isSelf = user.id === currentUser?.id;
            const canRemove = canManageMembers && !isAdmin && !isSelf;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Badge variant="secondary">Admin</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Member
                    </span>
                  )}
                </TableCell>
                {canManageMembers && (
                  <TableCell className="text-right">
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setMemberToRemove({
                            id: user.id,
                            label: user.name || user.email,
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <DeleteConfirmationDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        title="Remove member?"
        description={`${memberToRemove?.label} will lose access to ${currentOrganisation.name}. Their account will not be deleted.`}
        confirmButtonText="Remove"
        isPending={isRemoving}
        onConfirm={() => {
          if (memberToRemove) {
            removeMember({
              organisationId: currentOrganisation.id,
              userId: memberToRemove.id,
            });
          }
        }}
      />
    </>
  );
}
