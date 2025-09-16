/**
 * Principal validation utilities for Internet Computer Principal IDs
 */

import { Principal } from '@dfinity/principal';

/**
 * Validates if a string is a valid Internet Computer Principal ID
 * @param principal - The principal ID string to validate
 * @returns true if valid, false otherwise
 */
export const validatePrincipal = (principal: string): boolean => {
  try {
    // Use the official Principal.fromText() method to validate
    // If it throws an error, the principal ID is invalid
    Principal.fromText(principal);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates a principal ID and returns detailed validation result
 * @param principal - The principal ID string to validate
 * @returns object with validation result and error message if invalid
 */
export const validatePrincipalWithDetails = (principal: string): {
  isValid: boolean;
  error?: string;
  principal?: Principal;
} => {
  if (!principal || typeof principal !== 'string') {
    return {
      isValid: false,
      error: 'Principal ID is required and must be a string'
    };
  }

  if (principal.trim().length === 0) {
    return {
      isValid: false,
      error: 'Principal ID cannot be empty'
    };
  }

  try {
    const principalObj = Principal.fromText(principal.trim());
    return {
      isValid: true,
      principal: principalObj
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid Principal ID format'
    };
  }
};

/**
 * Checks if a principal ID is anonymous
 * @param principal - The principal ID string to check
 * @returns true if the principal is anonymous
 */
export const isAnonymousPrincipal = (principal: string): boolean => {
  try {
    const principalObj = Principal.fromText(principal);
    return principalObj.isAnonymous();
  } catch (error) {
    return false;
  }
};

/**
 * Formats a principal ID for display (truncates if too long)
 * @param principal - The principal ID string to format
 * @param maxLength - Maximum length before truncating (default: 20)
 * @returns Formatted principal ID string
 */
export const formatPrincipalForDisplay = (principal: string, maxLength: number = 20): string => {
  if (!validatePrincipal(principal)) {
    return 'Invalid Principal';
  }

  if (principal.length <= maxLength) {
    return principal;
  }

  const start = Math.floor(maxLength / 2) - 2;
  const end = Math.floor(maxLength / 2) - 1;
  return `${principal.slice(0, start)}...${principal.slice(-end)}`;
};