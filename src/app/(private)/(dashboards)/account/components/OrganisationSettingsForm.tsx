"use client";

import { useForm } from "@tanstack/react-form";
import { AvatarInput } from "@/components/forms/AvatarInput";
import FormFieldWrapper, {
  FormFieldError,
} from "@/components/forms/FormFieldWrapper";
import { useOrganisations } from "@/hooks/useOrganisations";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";

export default function OrganisationSettingsForm() {
  const { currentOrganisation, updateOrganisation, isUpdating, updateError } =
    useOrganisations();

  const form = useForm({
    defaultValues: {
      name: currentOrganisation?.name || "",
      avatarUrl: currentOrganisation?.avatarUrl || null,
    },
    onSubmit: async ({ value }) => {
      if (!currentOrganisation) return;
      updateOrganisation({ organisationId: currentOrganisation.id, ...value });
      form.reset();
    },
  });

  const fieldErrors = updateError?.data?.zodError?.fieldErrors;
  const formError = updateError?.data?.formError;

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
            <Button type="submit" disabled={isUpdating || isDefaultValue}>
              Save changes
            </Button>
            {!isDefaultValue && !isUpdating && (
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
