"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks";
import { UserRole } from "@/models/User";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { FeatureAccessTab } from "./FeatureAccessTab";
import { UserChart } from "./UserChart";

export default function SuperadminPage() {
  const { currentUser } = useCurrentUser();

  const trpc = useTRPC();
  const { data: users, isPending: usersLoading } = useQuery(
    trpc.user.list.queryOptions(),
  );
  const { data: publicDataSources, isPending: publicDataSourcesLoading } =
    useQuery(trpc.dataSource.listPublic.queryOptions());

  const client = useQueryClient();
  const { mutate: updateRole } = useMutation(
    trpc.user.updateRole.mutationOptions({
      onSuccess: () => {
        client.invalidateQueries({ queryKey: trpc.user.list.queryKey() });
        toast.success("Role updated");
      },
      onError: (error) => {
        toast.error("Failed to update role.", { description: error.message });
      },
    }),
  );
  const { mutate: clearTrial } = useMutation(
    trpc.user.clearTrial.mutationOptions({
      onSuccess: () => {
        client.invalidateQueries({ queryKey: trpc.user.list.queryKey() });
        toast.success("Trial cleared");
      },
      onError: (error) => {
        toast.error("Failed to clear trial.", { description: error.message });
      },
    }),
  );

  if (currentUser?.role !== UserRole.Superadmin) redirect("/");

  if (usersLoading || publicDataSourcesLoading) {
    return "Loading...";
  }

  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <Tabs defaultValue="users" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-medium tracking-tight">Superadmin</h1>
          <TabsList>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="public-library">Public Library</TabsTrigger>
            <TabsTrigger value="features">Feature Access</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-6">
          <div className="mb-8">
            <UserChart users={users} />
          </div>
          <h2 className="text-2xl font-medium mb-4">All Users</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="max-w-xs">Organisation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Trial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className="max-w-xs">
                    {u.organisations.join(", ")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role ?? "none"}
                      onValueChange={(value) =>
                        updateRole({
                          userId: u.id,
                          role: value === "none" ? null : (value as UserRole),
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Regular</SelectItem>
                        <SelectItem value={UserRole.Advocate}>
                          Advocate
                        </SelectItem>
                        <SelectItem value={UserRole.Superadmin}>
                          Superadmin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.trialEndsAt ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Expires{" "}
                          {format(new Date(u.trialEndsAt), "d MMM yyyy")}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearTrial({ userId: u.id })}
                        >
                          Upgrade
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="public-library" className="mt-6">
          <h2 className="text-2xl font-medium mb-4">Public Library</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure how public data sources appear in the inspector for all
            users.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Record type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Inspector config</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicDataSources?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No public data sources
                  </TableCell>
                </TableRow>
              ) : (
                publicDataSources?.map((ds) => (
                  <TableRow key={ds.id}>
                    <TableCell className="font-medium">{ds.name}</TableCell>
                    <TableCell>{ds.organisationName ?? "-"}</TableCell>
                    <TableCell>{ds.recordType}</TableCell>
                    <TableCell>{ds.recordCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {ds.defaultInspectorConfig ? (
                        <span className="text-green-700 text-xs font-medium">
                          Configured
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Not configured
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/superadmin/data-sources/${ds.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Configure
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="features">
          <FeatureAccessTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
