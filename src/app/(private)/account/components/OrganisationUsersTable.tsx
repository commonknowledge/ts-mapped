"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
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
  const { currentOrganisation } = useOrganisations();

  const { data: users, isLoading } = useQuery(
    trpc.organisation.listUsers.queryOptions(
      { organisationId: currentOrganisation?.id ?? "" },
      { enabled: !!currentOrganisation },
    ),
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12" />
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
