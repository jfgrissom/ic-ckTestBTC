import { Principal } from '@dfinity/principal';
import validator from 'validator';
import { AddressValidationResult } from './types';

/**
 * Validates Internet Computer Principal ID using @dfinity/principal
 * @param address - The Principal ID string to validate
 * @returns ValidationResult with validation status and error details
 */
export const validatePrincipalAddress = (address: string): AddressValidationResult => {
  if (!address?.trim()) {
    return {
      valid: false,
      error: 'Principal ID is required'
    };
  }

  try {
    const principal = Principal.fromText(address.trim());
    return {
      valid: true,
      normalizedAddress: principal.toText(),
      addressType: 'principal'
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid Principal ID format',
      details: 'Must be a valid Internet Computer Principal ID (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)'
    };
  }
};

/**
 * Validates Bitcoin testnet address using comprehensive regex patterns
 * Supports bech32 (tb1q...), P2SH (2...), and legacy (m.../n...) formats
 * @param address - The TestBTC address string to validate
 * @returns ValidationResult with validation status and error details
 */
export const validateTestBTCAddress = (address: string): AddressValidationResult => {
  if (!address?.trim()) {
    return {
      valid: false,
      error: 'TestBTC address is required'
    };
  }

  const trimmedAddress = address.trim();

  // Testnet bech32 addresses (tb1q...)
  const bech32Regex = /^tb1q[ac-hj-np-z02-9]{38,58}$/;
  if (bech32Regex.test(trimmedAddress)) {
    return {
      valid: true,
      normalizedAddress: trimmedAddress,
      addressType: 'testbtc-bech32'
    };
  }

  // Testnet P2SH addresses (2...)
  const p2shRegex = /^2[1-9A-HJ-NP-Za-km-z]{33}$/;
  if (p2shRegex.test(trimmedAddress)) {
    return {
      valid: true,
      normalizedAddress: trimmedAddress,
      addressType: 'testbtc-p2sh'
    };
  }

  // Testnet legacy addresses (m... or n...)
  const legacyRegex = /^[mn][1-9A-HJ-NP-Za-km-z]{33}$/;
  if (legacyRegex.test(trimmedAddress)) {
    return {
      valid: true,
      normalizedAddress: trimmedAddress,
      addressType: 'testbtc-legacy'
    };
  }

  return {
    valid: false,
    error: 'Invalid TestBTC address format',
    details: 'Must be a valid Bitcoin testnet address: tb1q... (bech32), 2... (P2SH), or m.../n... (legacy)'
  };
};

/**
 * Validates email address using validator.js library
 * @param email - The email string to validate
 * @returns ValidationResult with validation status and error details
 */
export const validateEmail = (email: string): AddressValidationResult => {
  if (!email?.trim()) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  const trimmedEmail = email.trim();

  if (!validator.isEmail(trimmedEmail)) {
    return {
      valid: false,
      error: 'Invalid email format',
      details: 'Please enter a valid email address (e.g., user@example.com)'
    };
  }

  return {
    valid: true,
    normalizedAddress: trimmedEmail.toLowerCase(),
    addressType: 'email'
  };
};

/**
 * Generic address validator that determines address type and validates accordingly
 * @param address - The address string to validate
 * @param expectedType - Optional expected address type for strict validation
 * @returns ValidationResult with validation status and error details
 */
export const validateAddress = (
  address: string,
  expectedType?: 'principal' | 'testbtc' | 'email'
): AddressValidationResult => {
  if (!address?.trim()) {
    return {
      valid: false,
      error: 'Address is required'
    };
  }

  // If expected type is specified, validate against that type only
  if (expectedType) {
    switch (expectedType) {
      case 'principal':
        return validatePrincipalAddress(address);
      case 'testbtc':
        return validateTestBTCAddress(address);
      case 'email':
        return validateEmail(address);
      default:
        return {
          valid: false,
          error: 'Unsupported address type',
          details: `Address type '${expectedType}' is not supported`
        };
    }
  }

  // Auto-detect address type and validate
  const trimmedAddress = address.trim();

  // Try Principal ID first (most common in IC context)
  const principalResult = validatePrincipalAddress(trimmedAddress);
  if (principalResult.valid) {
    return principalResult;
  }

  // Try TestBTC address
  const testBTCResult = validateTestBTCAddress(trimmedAddress);
  if (testBTCResult.valid) {
    return testBTCResult;
  }

  // Try email address
  const emailResult = validateEmail(trimmedAddress);
  if (emailResult.valid) {
    return emailResult;
  }

  // If none match, return a generic error
  return {
    valid: false,
    error: 'Invalid address format',
    details: 'Address must be a valid Principal ID, TestBTC address, or email address'
  };
};

// Re-export types for convenience
export type { ValidationResult, AddressValidationResult, AddressType } from './types';