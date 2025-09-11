import { useEffect, useMemo, useState } from "react";

export function useFormState<T extends Record<string, string | number>>(
  initialState: Partial<T> = {},
) {
  const [formState, setFormState] = useState<T>({ ...initialState } as T);

  useEffect(() => {
    setFormState({ ...initialState } as T);
  }, [initialState]);

  const handleChange =
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const resetForm = () => {
    setFormState({ ...initialState } as T);
  };

  const isDirty = useMemo(() => {
    return Object.keys(initialState).some(
      (key) => formState[key as keyof T] !== initialState[key as keyof T],
    );
  }, [formState, initialState]);

  const hasChanged = (field: keyof T) =>
    formState[field] !== initialState[field];

  return {
    handleChange,
    formState,
    resetForm,
    isDirty,
    hasChanged,
  };
}
