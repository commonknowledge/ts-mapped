"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
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
import { UserChart } from "./UserChart";

export default function SuperadminPage() {
  const { currentUser } = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);

  const trpc = useTRPC();
  const { data: organisations, isPending: organisationsLoading } = useQuery(
    trpc.organisation.listAll.queryOptions(),
  );
  const { data: users, isPending: usersLoading } = useQuery(
    trpc.user.list.queryOptions(),
  );
  const { data: invitations, isPending: invitationsLoading } = useQuery(
    trpc.invitation.list.queryOptions(),
  );

  const client = useQueryClient();
  const { mutate: createInvitationMutate, isPending } = useMutation(
    trpc.invitation.create.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation created successfully", {
          description: "An invite has been sent to the user",
        });
        setName("");
        setEmail("");
        setOrganisationId("");
        setOrganisationName("");
        setIsCreatingNewOrg(false);
        setDialogOpen(false);
        client.invalidateQueries({
          queryKey: trpc.organisation.listAll.queryKey(),
        });
        client.invalidateQueries({
          queryKey: trpc.user.list.queryKey(),
        });
        client.invalidateQueries({
          queryKey: trpc.invitation.list.queryKey(),
        });
      },
      onError: (error) => {
        toast.error("Failed to create invitation.", {
          description: error.message,
        });
      },
    }),
  );

  if (currentUser?.email !== ADMIN_USER_EMAIL) redirect("/");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!organisationId && !organisationName) {
      toast.error("Please select an organisation or create a new one");
      return;
    }
    createInvitationMutate({ organisationId, organisationName, email, name });
  };

  const toggleOrganisationMode = () => {
    setIsCreatingNewOrg(!isCreatingNewOrg);
    // Clear the state of whichever mode we're leaving
    if (isCreatingNewOrg) {
      setOrganisationName("");
    } else {
      setOrganisationId("");
    }
  };

  if (organisationsLoading || usersLoading || invitationsLoading) {
    return "Loading...";
  }

  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <Tabs defaultValue="users" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-medium tracking-tight ">Superadmin</h1>
          <TabsList>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
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
                <TableHead>Organisation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.organisations.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="invitations" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-medium">Pending Invitations</h2>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Invitation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Invitation</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new user to join the platform.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <FormFieldWrapper id="name" label="Name">
                    <Input
                      id="name"
                      name="name"
                      type="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper id="email" label="Email">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    id="organisation"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Organisation</span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={toggleOrganisationMode}
                          className="h-auto p-0 text-xs"
                        >
                          {isCreatingNewOrg
                            ? "or select one"
                            : "or create a new one"}
                        </Button>
                      </div>
                    }
                  >
                    {isCreatingNewOrg ? (
                      <Input
                        id="new-organisation"
                        name="new-organisation"
                        type="text"
                        autoFocus
                        placeholder="Enter new organisation name"
                        value={organisationName}
                        onChange={(e) => setOrganisationName(e.target.value)}
                        required
                      />
                    ) : (
                      <Select
                        value={organisationId}
                        onValueChange={(org) => setOrganisationId(org)}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an existing organisation" />
                        </SelectTrigger>
                        <SelectContent>
                          {organisations?.map((o) => {
                            return (
                              <SelectItem key={o.id} value={o.id.toString()}>
                                {o.name || "Unknown"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </FormFieldWrapper>

                  <Button
                    disabled={isPending}
                    type="submit"
                    size="sm"
                    className="mt-2"
                  >
                    Send invitation
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
