import { useState, useCallback, useMemo } from 'react';

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isLoading: boolean;
  isSubmitting: boolean;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
}

export interface ValidationRules {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom?: (value: any) => string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate?: (value: any) => Promise<string | null>;
}

type Validators<T> = {
  [K in keyof T]?: ValidationRules;
};

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
  validators?: Validators<T>
) => {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isLoading: false,
    isSubmitting: false,
    touched: {},
    isDirty: false,
  });

  const validateField = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (name: keyof T, value: any): Promise<string | null> => {
      const rules = validators?.[name];
      if (!rules) return null;

      // Required validation
      if (rules.required) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return typeof rules.required === 'string' ? rules.required : `${String(name)} is required`;
        }
      }

      // MinLength validation
      if (rules.minLength) {
        const minLen = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
        const message = typeof rules.minLength === 'number' ? null : rules.minLength.message;
        if (value && value.length < minLen) {
          return message || `Minimum length is ${minLen}`;
        }
      }

      // MaxLength validation
      if (rules.maxLength) {
        const maxLen = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
        const message = typeof rules.maxLength === 'number' ? null : rules.maxLength.message;
        if (value && value.length > maxLen) {
          return message || `Maximum length is ${maxLen}`;
        }
      }

      // Pattern validation
      if (rules.pattern) {
        const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern ? rules.pattern.value : rules.pattern;
        const message = typeof rules.pattern === 'object' && 'message' in rules.pattern ? rules.pattern.message : null;
        if (value && !pattern.test(value)) {
          return message || `Invalid format for ${String(name)}`;
        }
      }

      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) return customError;
      }

      // Async validation
      if (rules.validate) {
        const asyncError = await rules.validate(value);
        if (asyncError) return asyncError;
      }

      return null;
    },
    [validators]
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setState(prev => ({
        ...prev,
        values: { ...prev.values, [name]: fieldValue },
        touched: { ...prev.touched, [name]: true },
        isDirty: true,
      }));

      // Validate field on change
      const error = await validateField(name as keyof T, fieldValue);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error || undefined },
      }));
    },
    [validateField]
  );

  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [name]: true },
      }));

      const error = await validateField(name as keyof T, state.values[name as keyof T]);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error || undefined },
      }));
    },
    [validateField, state.values]
  );

  const setFieldValue = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (name: keyof T, value: any) => {
      setState(prev => ({
        ...prev,
        values: { ...prev.values, [name]: value },
        touched: { ...prev.touched, [name]: true },
        isDirty: true,
      }));

      const error = await validateField(name, value);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error || undefined },
      }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Validate all fields
      const newErrors: Partial<Record<keyof T, string>> = {};
      for (const key in state.values) {
        const error = await validateField(key as keyof T, state.values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
        }
      }

      setState(prev => ({
        ...prev,
        errors: newErrors,
        touched: Object.keys(state.values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>
        ),
      }));

      if (Object.keys(newErrors).length > 0) return;

      setState(prev => ({ ...prev, isSubmitting: true }));
      try {
        await onSubmit(state.values);
        setState(prev => ({ ...prev, isDirty: false }));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setState(prev => ({
          ...prev,
          errors: { ...prev.errors, general: errorMessage } as Partial<Record<keyof T, string>>,
        }));
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [state.values, validateField, onSubmit]
  );

  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      isLoading: false,
      isSubmitting: false,
      touched: {},
      isDirty: false,
    });
  }, [initialValues]);

  const isValid = useMemo(
    () => Object.keys(state.errors).length === 0,
    [state.errors]
  );

  return {
    values: state.values,
    errors: state.errors,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    touched: state.touched,
    isDirty: state.isDirty,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    handleSubmit,
    resetForm,
  };
};
