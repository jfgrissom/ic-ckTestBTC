import { ValidationResult } from '../addresses';

/**
 * Form validation rule configuration
 */
export interface FormValidationRule<T = any> {
  field: keyof T;
  validator: (value: any, formData?: T) => ValidationResult;
  required?: boolean;
  dependsOn?: (keyof T)[];
  label?: string;
}

/**
 * Form validation result with field-specific errors
 */
export interface FormValidationResult<T = any> {
  valid: boolean;
  errors: Partial<Record<keyof T, string>>;
  details: Partial<Record<keyof T, string>>;
  fieldValidationResults?: Partial<Record<keyof T, ValidationResult>>;
}

/**
 * Form field validation state
 */
export interface FieldValidationState {
  isValid: boolean;
  error?: string;
  details?: string;
  hasBeenValidated: boolean;
  isDirty: boolean;
}

/**
 * Complete form validation state
 */
export interface FormValidationState<T = any> {
  isValid: boolean;
  isValidating: boolean;
  fields: Partial<Record<keyof T, FieldValidationState>>;
  hasErrors: boolean;
  touchedFields: Set<keyof T>;
}

/**
 * Form validation options
 */
export interface FormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  stopOnFirstError?: boolean;
  skipEmptyOptionalFields?: boolean;
}

/**
 * Async validation function type
 */
export type AsyncValidator<T = any> = (
  value: any,
  formData?: T
) => Promise<ValidationResult>;

/**
 * Async form validation rule
 */
export interface AsyncFormValidationRule<T = any> {
  field: keyof T;
  validator: AsyncValidator<T>;
  required?: boolean;
  dependsOn?: (keyof T)[];
  label?: string;
  debounceMs?: number;
}