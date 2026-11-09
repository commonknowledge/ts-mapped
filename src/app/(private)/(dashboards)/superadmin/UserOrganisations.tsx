"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { OrganisationUserRole } from "@/models/OrganisationUser";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

interface UserOrganisation {
  id: string;
  name: string;
  role: OrganisationUserRole;
}

export default function UserOrganisations({
  user,
}: {
  user: { id: string; email: string; organisations: UserOrganisation[] };
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [organisationToLeave, setOrganisationToLeave] =
    useState<UserOrganisation | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() });

  const { mutate: setMemberRole } = useMutation(
    trpc.organisation.setMemberRole.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Organisation role updated");
      },
      onError: (error) => {
        toast.error("Failed to update organisation role.", {
          description: error.message,
        });
      },
    }),
  );

  const { mutate: removeUser, isPending: isRemoving } = useMutation(
    trpc.organisation.removeUser.mutationOptions({
      onSuccess: () => {
        invalidate();
        setOrganisationToLeave(null);
        toast.success("Removed from organisation");
      },
      onError: (error) => {
        toast.error("Failed to remove from organisation.", {
          description: error.message,
        });
      },
    }),
  );

  if (!user.organisations.length) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {user.organisations.map((organisation) => (
        <div key={organisation.id} className="flex items-center gap-2">
          <span className="truncate" title={organisation.name}>
            {organisation.name}
          </span>
          <Select
            value={organisation.role}
            onValueChange={(value) =>
              setMemberRole({
                organisationId: organisation.id,
                userId: user.id,
                role: value as OrganisationUserRole,
              })
            }
          >
            <SelectTrigger size="sm" className="w-28 ml-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OrganisationUserRole.Member}>
                Member
              </SelectItem>
              <SelectItem value={OrganisationUserRole.Admin}>Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title={`Remove from ${organisation.name}`}
            onClick={() => setOrganisationToLeave(organisation)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <DeleteConfirmationDialog
        open={Boolean(organisationToLeave)}
        onOpenChange={(open) => {
          if (!open) setOrganisationToLeave(null);
        }}
        title="Remove from organisation?"
        description={`${user.email} will lose access to ${organisationToLeave?.name}. Their account will not be deleted.`}
        confirmButtonText="Remove"
        isPending={isRemoving}
        onConfirm={() => {
          if (organisationToLeave) {
            removeUser({
              organisationId: organisationToLeave.id,
              userId: user.id,
            });
          }
        }}
      />
    </div>
  );
}
