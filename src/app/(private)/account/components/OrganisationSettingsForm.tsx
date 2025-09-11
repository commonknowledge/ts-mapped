"use client";

import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { getInitials } from "@/utils";

export default function OrganisationSettingsForm() {
  const { organisations, organisationId } = useContext(OrganisationsContext);

  const [showActions, setShowActions] = useState(false);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    const currentOrganisation = organisations.find(
      (o) => o.id === organisationId,
    );

    setOrgName(currentOrganisation?.name || "");
  }, [organisationId, organisations]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log(orgName);
      setShowActions(false);
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
        <AvatarFallback>{getInitials(orgName)}</AvatarFallback>
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
