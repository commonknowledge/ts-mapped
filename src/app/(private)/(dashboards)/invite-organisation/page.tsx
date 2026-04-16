"use client";

import { useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { useCurrentUser } from "@/hooks";
import { useOrganisations } from "@/hooks/useOrganisations";
import { UserRole } from "@/models/User";
import { useTRPC } from "@/services/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import CreateInvitationModal from "./CreateInvitationModal";

export default function InviteOrganisationPage() {
  const { currentUser } = useCurrentUser();
  const { organisationId } = useOrganisations();
  const trpc = useTRPC();
  const isAllowed =
    currentUser?.role === UserRole.Advocate ||
    currentUser?.role === UserRole.Superadmin;

  const { data: invitations, isPending: invitationsLoading } = useQuery(
    trpc.invitation.list.queryOptions(
      { senderOrganisationId: organisationId ?? "" },
      { enabled: isAllowed && Boolean(organisationId) },
    ),
  );

  if (!isAllowed) {
    redirect("/");
  }

  if (invitationsLoading) {
    return "Loading...";
  }

  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-medium tracking-tight">
          Invite Organisation
        </h1>
        <CreateInvitationModal />
      </div>

      <h2 className="text-2xl font-medium mb-4">Pending invitations</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Organisation</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No pending invitations
              </TableCell>
            </TableRow>
          ) : (
            invitations?.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.email}</TableCell>
                <TableCell>{inv.name}</TableCell>
                <TableCell>{inv.organisationName}</TableCell>
                <TableCell>
                  {inv.createdAt
                    ? new Date(inv.createdAt).toLocaleDateString()
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
