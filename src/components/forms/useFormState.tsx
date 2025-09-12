import { useMemo, useRef, useState } from "react";

export function useFormState<T extends Record<string, string | number>>(
  initialState: Partial<T> = {},
) {
  const initialStateRef = useRef<T>({ ...initialState } as T);
  const [formState, setFormState] = useState<T>({ ...initialState } as T);

  const handleChange =
    (field: keyof T) => (e: { target: { value: string } }) => {
      const value = e.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

  const resetForm = () => {
    setFormState({ ...initialStateRef.current });
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
    setFormState,
    resetForm,
    isDirty,
    hasChanged,
  };
}
