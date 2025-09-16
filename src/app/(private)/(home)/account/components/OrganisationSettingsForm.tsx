"use client";

import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import { toast } from "sonner";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useForm } from "@/components/forms/useForm";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function OrganisationSettingsForm() {
  const { getOrganisation, updateOrganisation: updateLocalOrganisation } =
    useContext(OrganisationsContext);
  const currentOrganisation = getOrganisation();

  const { formState, setFormState, handleChange, resetForm, isDirty } =
    useForm<{ name: string; avatarUrl: string }>(undefined, {
      name: currentOrganisation?.name || "",
      avatarUrl: currentOrganisation?.avatarUrl || "",
    });

  useEffect(() => {
    if (currentOrganisation) {
      setFormState({
        name: currentOrganisation.name,
        avatarUrl: currentOrganisation.avatarUrl || "",
      });
    }
  }, [currentOrganisation, setFormState]);

  const trpc = useTRPC();
  const { mutate: updateOrganisation, isPending } = useMutation(
    trpc.organisation.update.mutationOptions({
      onSuccess: () => {
        toast.success("Organisation settings updated!");
        if (currentOrganisation) {
          updateLocalOrganisation(currentOrganisation.id, formState);
        }
      },
      onError: () => {
        toast.error("Failed to update organisation settings");
      },
    }),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentOrganisation) {
      updateOrganisation({
        organisationId: currentOrganisation.id,
        name: formState.name,
        avatarUrl: formState.avatarUrl || undefined,
      });
    }
  };

  const onAvatarChange = (avatarUrl: string) => {
    handleChange("avatarUrl")({ target: { value: avatarUrl } });
  };

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={handleSubmit}
    >
      <AvatarInput
        name={formState?.name}
        src={formState.avatarUrl || ""}
        onChange={onAvatarChange}
      />

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
          <Button type="submit" disabled={isPending}>
            Save changes
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
