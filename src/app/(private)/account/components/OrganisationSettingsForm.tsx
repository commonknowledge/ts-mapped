"use client";

import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useFormState } from "@/components/forms/useFormState";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/ui/avatar";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { getInitials } from "@/utils";

export default function OrganisationSettingsForm() {
  const { organisations, organisationId } = useContext(OrganisationsContext);
  const [initialValues, setInitialValues] = useState({ name: "" });

  const { formState, handleChange, resetForm, isDirty } =
    useFormState(initialValues);

  useEffect(() => {
    const currentOrganisation = organisations.find(
      (o) => o.id === organisationId,
    );

    if (currentOrganisation) {
      setInitialValues(currentOrganisation);
    }
  }, [organisationId, organisations, setInitialValues]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // TODO: update organisation data in the db
      console.log(formState.name);
      toast.success("Organisation settings updated!");

      // updating initial form values to the current db values on success
      setInitialValues(formState);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organisation settings");
    }
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <Avatar>
        <AvatarImage src="" />
        <AvatarFallback>{getInitials(formState.name)}</AvatarFallback>
      </Avatar>

      <FormFieldWrapper label="Organisation name" id="org-name">
        <Input
          name="name"
          id="org-name"
          type="text"
          required
          value={formState.name}
          onChange={handleChange("name")}
        />
      </FormFieldWrapper>

      {isDirty && (
        <div className="flex gap-4">
          <Button type="submit">Save changes</Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
