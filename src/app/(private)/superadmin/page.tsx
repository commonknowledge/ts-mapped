"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

export default function SuperadminPage() {
  const { currentUser } = useCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [newOrganisation, setNewOrganisation] = useState("");

  const isNewOrganisation = !organisation || organisation === "NEW";

  const trpc = useTRPC();
  const { data: organisations, isPending: organisationsLoading } = useQuery(
    trpc.organisation.listAll.queryOptions(),
  );
  const { data: users, isPending: usersLoading } = useQuery(
    trpc.user.list.queryOptions(),
  );

  const client = useQueryClient();
  const { mutate: createUserMutate, isPending } = useMutation(
    trpc.user.upsert.mutationOptions({
      onSuccess: () => {
        toast.success("User created successfully.");
        setName("");
        setEmail("");
        setPassword("");
        setOrganisation("");
        setNewOrganisation("");
        client.invalidateQueries({
          queryKey: trpc.organisation.listAll.queryKey(),
        });
        client.invalidateQueries({
          queryKey: trpc.user.list.queryKey(),
        });
      },
      onError: () => {
        toast.error("Failed to create user.");
      },
    }),
  );

  if (currentUser?.email !== ADMIN_USER_EMAIL) {
    return redirect("/");
  }

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!window.confirm("Do you have this password saved? " + password)) {
      return;
    }

    createUserMutate({
      organisation: isNewOrganisation ? newOrganisation : organisation,
      email,
      name,
      password,
    });
  };

  const onSubmitUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    createUserMutate({
      organisation: isNewOrganisation ? newOrganisation : organisation,
      email,
      name,
    });
  };

  if (organisationsLoading || usersLoading) {
    return "Loading...";
  }

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <h1 className="text-3xl font-medium tracking-tight">Superadmin</h1>

      <Separator className="my-8" />

      <div className="flex gap-8">
        <div>
          <h2 className="text-center text-2xl font-medium mb-4">All Users</h2>
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
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-center text-2xl font-medium mb-4">
              Create User
            </h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
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

              <FormFieldWrapper id="password" label="Password">
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                  >
                    Generate Password
                  </Button>
                </div>
              </FormFieldWrapper>

              <FormFieldWrapper id="organisation" label="Organisation">
                <Select
                  value={organisation}
                  onValueChange={(org) => setOrganisation(org)}
                >
                  <SelectTrigger className="w-[360px]">
                    <SelectValue placeholder="Select an existing organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New organisation</SelectItem>
                    {organisations?.map((o) => {
                      return (
                        <SelectItem key={o.id} value={o.name || "Unknown"}>
                          {o.name || "Unknown"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              {isNewOrganisation && (
                <FormFieldWrapper
                  id="new-organisation"
                  label="New organisation"
                >
                  <Input
                    id="new-organisation"
                    name="new-organisation"
                    type="text"
                    value={newOrganisation}
                    onChange={(e) => setNewOrganisation(e.target.value)}
                  />
                </FormFieldWrapper>
              )}

              <Button disabled={isPending} size="sm">
                Create user
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-center text-2xl font-medium mb-4">
              Update User
            </h2>
            <form onSubmit={onSubmitUpdate} className="flex flex-col gap-6">
              <FormFieldWrapper id="email" label="Email">
                <Select
                  value={email}
                  onValueChange={(email) => setEmail(email)}
                >
                  <SelectTrigger className="w-[360px]">
                    <SelectValue placeholder="Select an existing user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => {
                      return (
                        <SelectItem key={u.id} value={u.email || "Unknown"}>
                          {u.email || "Unknown"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

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

              <FormFieldWrapper id="organisation" label="Organisation">
                <Select
                  value={organisation}
                  onValueChange={(org) => setOrganisation(org)}
                >
                  <SelectTrigger className="w-[360px]">
                    <SelectValue placeholder="Select an existing organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New organisation</SelectItem>
                    {organisations?.map((o) => {
                      return (
                        <SelectItem key={o.id} value={o.name || "Unknown"}>
                          {o.name || "Unknown"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormFieldWrapper>

              {isNewOrganisation && (
                <FormFieldWrapper
                  id="new-organisation"
                  label="New organisation"
                >
                  <Input
                    id="new-organisation"
                    name="new-organisation"
                    type="text"
                    value={newOrganisation}
                    onChange={(e) => setNewOrganisation(e.target.value)}
                  />
                </FormFieldWrapper>
              )}

              <Button disabled={isPending} size="sm">
                Update user
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
