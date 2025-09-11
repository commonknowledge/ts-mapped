"use client";

import * as React from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";

import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function OrganisationSettingsForm() {
  const [orgName, setOrgName] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log(orgName);
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
        <AvatarImage src="https://picsum.photos/100" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <FormFieldWrapper label="Organisation name" id="org-name">
        <Input
          name="name"
          id="org-name"
          type="text"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
      </FormFieldWrapper>

      <Button type="submit" variant="secondary">
        Save changes
      </Button>
    </form>
  );
}
