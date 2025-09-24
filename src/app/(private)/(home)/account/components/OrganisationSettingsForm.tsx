"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import { toast } from "sonner";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper, {
  FormFieldError,
} from "@/components/forms/FormFieldWrapper";
import { OrganisationsContext } from "@/providers/OrganisationsProvider";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function OrganisationSettingsForm() {
  const { getOrganisation, updateOrganisation: updateLocalOrganisation } =
    useContext(OrganisationsContext);
  const currentOrganisation = getOrganisation();

  const trpc = useTRPC();
  const {
    mutate: updateOrganisation,
    error,
    isPending,
  } = useMutation(
    trpc.organisation.update.mutationOptions({
      onSuccess: (res) => {
        toast.success("Organisation settings updated!");
        if (currentOrganisation) {
          form.reset();
          updateLocalOrganisation(currentOrganisation.id, res);
        }
      },
      onError: () => {
        toast.error("Failed to update organisation settings");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: currentOrganisation?.name || "",
      avatarUrl: currentOrganisation?.avatarUrl || null,
    },
    onSubmit: async ({ value }) => {
      if (!currentOrganisation) return;
      updateOrganisation({ organisationId: currentOrganisation?.id, ...value });
    },
  });

  const fieldErrors = error?.data?.zodError?.fieldErrors;
  const formError = error?.data?.formError;

  return (
    <form
      className="w-full max-w-[36ch] flex flex-col items-start gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="avatarUrl">
        {(field) => (
          <div className="space-y-2">
            <AvatarInput
              name={currentOrganisation?.name || ""}
              src={field.state.value}
              onChange={field.handleChange}
            />
            <FormFieldError error={fieldErrors?.[field.name]} />
          </div>
        )}
      </form.Field>

      <form.Field name="name">
        {(field) => (
          <FormFieldWrapper
            label="Organisation name"
            id={field.name}
            error={fieldErrors?.[field.name]}
          >
            <Input
              name={field.name}
              id={field.name}
              type="text"
              required
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </FormFieldWrapper>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isDefaultValue}>
        {(isDefaultValue) => (
          <div className="flex gap-4">
            <Button type="submit" disabled={isPending || isDefaultValue}>
              Save changes
            </Button>
            {!isDefaultValue && !isPending && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </form.Subscribe>
      {formError && <p className="text-xs mt-2 text-red-500">{formError}</p>}
    </form>
  );
}
