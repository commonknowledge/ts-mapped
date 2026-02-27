"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useOrganisations } from "@/hooks/useOrganisations";
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

export default function InviteMemberDialog() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { currentOrganisation } = useOrganisations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const { mutate: inviteMember, isPending } = useMutation(
    trpc.organisation.inviteMember.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent", {
          description: `An invite has been sent to ${email}`,
        });
        setName("");
        setEmail("");
        setDialogOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.listUsers.queryKey(),
        });
      },
      onError: (error) => {
        toast.error("Failed to send invitation", {
          description: error.message,
        });
      },
    }),
  );

  if (!currentOrganisation) {
    return null;
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    inviteMember({
      organisationId: currentOrganisation.id,
      name,
      email,
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4">
          <PlusIcon className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentOrganisation.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormFieldWrapper id="invite-name" label="Name">
            <Input
              id="invite-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormFieldWrapper>

          <FormFieldWrapper id="invite-email" label="Email">
            <Input
              id="invite-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormFieldWrapper>

          <Button disabled={isPending} type="submit" size="sm" className="mt-2">
            {isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
