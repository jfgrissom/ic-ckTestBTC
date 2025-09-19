export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

export interface AddressValidationResult extends ValidationResult {
  normalizedAddress?: string;
  addressType?: 'principal' | 'testbtc-bech32' | 'testbtc-p2sh' | 'testbtc-legacy' | 'email';
}

export type AddressType = 'principal' | 'testbtc' | 'email';