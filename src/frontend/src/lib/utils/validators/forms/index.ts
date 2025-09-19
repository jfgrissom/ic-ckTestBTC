import { ValidationResult } from '../addresses';
import {
  FormValidationRule,
  FormValidationResult,
  FormValidationOptions,
  FieldValidationState,
  FormValidationState,
  AsyncFormValidationRule,
  AsyncValidator
} from './types';

/**
 * Validates a complete form using an array of validation rules
 * @param data - The form data object to validate
 * @param rules - Array of validation rules to apply
 * @param options - Validation options
 * @returns Comprehensive form validation result
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: FormValidationRule<T>[],
  options: FormValidationOptions = {}
): FormValidationResult<T> => {
  const {
    stopOnFirstError = false,
    skipEmptyOptionalFields = true
  } = options;

  const errors: Partial<Record<keyof T, string>> = {};
  const details: Partial<Record<keyof T, string>> = {};
  const fieldValidationResults: Partial<Record<keyof T, ValidationResult>> = {};

  for (const rule of rules) {
    const value = data[rule.field];
    const fieldLabel = rule.label || String(rule.field);

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      const error = `${fieldLabel} is required`;
      errors[rule.field] = error;
      fieldValidationResults[rule.field] = {
        valid: false,
        error
      };

      if (stopOnFirstError) break;
      continue;
    }

    // Skip validation for optional empty fields if requested
    if (skipEmptyOptionalFields && !rule.required && (value === undefined || value === null || value === '')) {
      fieldValidationResults[rule.field] = { valid: true };
      continue;
    }

    // Check dependencies
    if (rule.dependsOn) {
      const dependencyMissing = rule.dependsOn.some(dep => {
        const depValue = data[dep];
        return depValue === undefined || depValue === null || depValue === '';
      });

      if (dependencyMissing) {
        const missingDeps = rule.dependsOn
          .filter(dep => {
            const depValue = data[dep];
            return depValue === undefined || depValue === null || depValue === '';
          })
          .map(dep => String(dep))
          .join(', ');

        const error = `${fieldLabel} requires: ${missingDeps}`;
        errors[rule.field] = error;
        fieldValidationResults[rule.field] = {
          valid: false,
          error,
          details: 'Please fill in the required dependencies first'
        };

        if (stopOnFirstError) break;
        continue;
      }
    }

    // Run validator
    try {
      const result = rule.validator(value, data);
      fieldValidationResults[rule.field] = result;

      if (!result.valid) {
        errors[rule.field] = result.error || `${fieldLabel} is invalid`;
        if (result.details) {
          details[rule.field] = result.details;
        }

        if (stopOnFirstError) break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      errors[rule.field] = `${fieldLabel} validation error: ${errorMessage}`;
      fieldValidationResults[rule.field] = {
        valid: false,
        error: errorMessage
      };

      if (stopOnFirstError) break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    details,
    fieldValidationResults
  };
};

/**
 * Validates a single field with multiple validation rules
 * @param value - The field value to validate
 * @param rules - Array of validation functions to apply
 * @param label - Optional field label for error messages
 * @returns Validation result for the field
 */
export const validateField = (
  value: any,
  rules: ((value: any) => ValidationResult)[],
  label?: string
): ValidationResult => {
  for (const rule of rules) {
    try {
      const result = rule(value);
      if (!result.valid) {
        return {
          ...result,
          error: label ? `${label}: ${result.error}` : result.error
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return {
        valid: false,
        error: label ? `${label}: ${errorMessage}` : errorMessage
      };
    }
  }

  return { valid: true };
};

/**
 * Creates a validation state manager for forms
 * @param initialData - Initial form data
 * @param rules - Validation rules for the form
 * @param options - Validation options
 * @returns Form validation state and helper functions
 */
export const createFormValidator = <T extends Record<string, any>>(
  initialData: T,
  rules: FormValidationRule<T>[],
  options: FormValidationOptions = {}
) => {
  let formData = { ...initialData };
  let validationState: FormValidationState<T> = {
    isValid: false,
    isValidating: false,
    fields: {},
    hasErrors: false,
    touchedFields: new Set()
  };

  const validateSingleField = (field: keyof T, value: any): FieldValidationState => {
    const fieldRules = rules.filter(rule => rule.field === field);
    const fieldData = { ...formData, [field]: value };

    let hasError = false;
    let error: string | undefined;
    let details: string | undefined;

    for (const rule of fieldRules) {
      // Required field check
      if (rule.required && (value === undefined || value === null || value === '')) {
        hasError = true;
        error = `${rule.label || String(field)} is required`;
        break;
      }

      // Skip empty optional fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Check dependencies
      if (rule.dependsOn) {
        const dependencyMissing = rule.dependsOn.some(dep => {
          const depValue = fieldData[dep];
          return depValue === undefined || depValue === null || depValue === '';
        });

        if (dependencyMissing) {
          hasError = true;
          error = `${rule.label || String(field)} has missing dependencies`;
          break;
        }
      }

      // Run validator
      try {
        const result = rule.validator(value, fieldData);
        if (!result.valid) {
          hasError = true;
          error = result.error;
          details = result.details;
          break;
        }
      } catch (err) {
        hasError = true;
        error = err instanceof Error ? err.message : 'Validation failed';
        break;
      }
    }

    return {
      isValid: !hasError,
      error,
      details,
      hasBeenValidated: true,
      isDirty: validationState.touchedFields.has(field)
    };
  };

  const validateAllFields = (): FormValidationResult<T> => {
    return validateForm(formData, rules, options);
  };

  const updateField = (field: keyof T, value: any): void => {
    formData = { ...formData, [field]: value };
    validationState.touchedFields.add(field);

    if (options.validateOnChange) {
      const fieldState = validateSingleField(field, value);
      validationState.fields[field] = fieldState;

      // Update overall form state
      const allResults = validateAllFields();
      validationState.isValid = allResults.valid;
      validationState.hasErrors = !allResults.valid;
    }
  };

  const validateFormData = (): FormValidationResult<T> => {
    validationState.isValidating = true;
    const result = validateAllFields();

    // Update field states
    Object.keys(formData).forEach(key => {
      const field = key as keyof T;
      const value = formData[field];
      validationState.fields[field] = validateSingleField(field, value);
    });

    validationState.isValid = result.valid;
    validationState.hasErrors = !result.valid;
    validationState.isValidating = false;

    return result;
  };

  const resetValidation = (): void => {
    validationState = {
      isValid: false,
      isValidating: false,
      fields: {},
      hasErrors: false,
      touchedFields: new Set()
    };
  };

  const getFieldState = (field: keyof T): FieldValidationState | undefined => {
    return validationState.fields[field];
  };

  return {
    updateField,
    validateFormData,
    validateSingleField,
    resetValidation,
    getFieldState,
    get validationState() { return validationState; },
    get formData() { return formData; }
  };
};

/**
 * Common validation helpers for frequent use cases
 */
export const commonValidators = {
  required: (label?: string) => (value: any): ValidationResult => {
    if (value === undefined || value === null || value === '') {
      return {
        valid: false,
        error: `${label || 'Field'} is required`
      };
    }
    return { valid: true };
  },

  minLength: (min: number, label?: string) => (value: string): ValidationResult => {
    if (typeof value !== 'string' || value.length < min) {
      return {
        valid: false,
        error: `${label || 'Field'} must be at least ${min} characters`
      };
    }
    return { valid: true };
  },

  maxLength: (max: number, label?: string) => (value: string): ValidationResult => {
    if (typeof value === 'string' && value.length > max) {
      return {
        valid: false,
        error: `${label || 'Field'} must be no more than ${max} characters`
      };
    }
    return { valid: true };
  },

  pattern: (regex: RegExp, message?: string, label?: string) => (value: string): ValidationResult => {
    if (typeof value === 'string' && !regex.test(value)) {
      return {
        valid: false,
        error: message || `${label || 'Field'} format is invalid`
      };
    }
    return { valid: true };
  }
};

// Re-export types for convenience
export type {
  FormValidationRule,
  FormValidationResult,
  FormValidationOptions,
  FieldValidationState,
  FormValidationState,
  AsyncFormValidationRule,
  AsyncValidator
} from './types';