import { useMemo, useRef, useState } from "react";
import type { ZodType } from "zod";

export function useForm<T extends Record<string, string | number | boolean>>(
  schema: ZodType<T> | undefined = undefined,
  _initialState: Partial<T> = {},
) {
  const initialStateRef = useRef<T>({ ..._initialState } as T);
  const [formState, setFormState] = useState<T>({ ..._initialState } as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (state: T) => {
    if (!schema) {
      return {};
    }

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
    (field: keyof T) => (e: { target: { value: string } }) => {
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
    setFormState({ ...initialStateRef.current } as T);
    setErrors({});
    setTouched({});
  };

  const isValid = Object.keys(validate(formState)).length === 0;

  const isDirty = useMemo(() => {
    return Object.keys(initialStateRef.current).some(
      (key) =>
        formState[key as keyof T] !== initialStateRef.current[key as keyof T],
    );
  }, [formState]);

  return {
    formState,
    setFormState,
    errors,
    touched,
    handleChange,
    handleBlur,
    resetForm,
    validate,
    isValid,
    isDirty,
  };
}
