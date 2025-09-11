"use client";

import * as React from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";

import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function UserSettingsForm() {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log(username);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
    }
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <Avatar>
        <AvatarImage src="" />
        <AvatarFallback>CN</AvatarFallback>
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

      <Button type="submit" variant="secondary">
        Save changes
      </Button>
    </form>
  );
}
