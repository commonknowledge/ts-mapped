import { useState } from "react";
import { ZodType } from "zod";

export function useFormValidation<T extends Record<string, string | number>>(
  schema: ZodType<T>,
  initialState: Partial<T> = {},
) {
  const [formState, setFormState] = useState<T>({ ...initialState } as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (state: T) => {
    const result = schema.safeParse(state);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
      return newErrors;
    }
    return {};
  };

  const handleChange =
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const newState = { ...formState, [field]: value };
      setFormState(newState);

      // Revalidate on change only if field has error
      if (errors[field as string]) {
        setErrors(validate(newState));
      }
    };

  const handleBlur = (field: keyof T) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(formState));
  };

  const resetForm = () => {
    setFormState({ ...initialState } as T);
    setErrors({});
    setTouched({});
  };

  const isValid = Object.keys(validate(formState)).length === 0;

  return {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    validate,
    isValid,
  };
}
