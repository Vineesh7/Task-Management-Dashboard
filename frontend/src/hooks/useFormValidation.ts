import { useState, useCallback } from "react";

type Errors<T> = Partial<Record<keyof T, string>>;
type Validator<T> = (values: T) => Errors<T>;

/**
 * Lightweight form validation hook.
 * - Call validate(values) before submit — returns true if no errors.
 * - Call clearField(key) on change to dismiss errors as the user types.
 */
export function useFormValidation<T extends Record<string, any>>(
  validator: Validator<T>,
) {
  const [errors, setErrors] = useState<Errors<T>>({});

  const validate = useCallback(
    (values: T): boolean => {
      const result = validator(values);
      setErrors(result);
      return Object.keys(result).length === 0;
    },
    [validator],
  );

  const clearField = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  return { errors, validate, clearField, clearAll };
}
