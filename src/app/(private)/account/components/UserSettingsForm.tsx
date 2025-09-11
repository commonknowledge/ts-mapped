"use client";

import { useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";

import { useCurrentUser } from "@/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { getInitials } from "@/utils";

export default function UserSettingsForm() {
  const userId = useCurrentUser();

  // TODO: replace with actual user data
  const user = {
    id: userId,
    name: "Joaquim Souza",
    email: "joaquim@commonknowledge.coop",
  };

  const [showActions, setShowActions] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.name);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log(username);
      toast.success("User settings updated!");
      setShowActions(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user settings");
    }
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <Avatar>
        <AvatarImage src="" />
        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
      </Avatar>
      <FormFieldWrapper label="Email" id="email">
        <Input
          name="email"
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormFieldWrapper>
      <FormFieldWrapper label="Name" id="username">
        <Input
          name="name"
          id="username"
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </FormFieldWrapper>

      {showActions && (
        <div className="flex gap-4">
          <Button type="submit">Save changes</Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
