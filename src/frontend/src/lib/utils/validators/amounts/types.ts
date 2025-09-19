import { TokenType, FeeMultiplierType } from '../tokens';
import { ValidationResult } from '../addresses';

/**
 * Options for amount validation
 */
export interface AmountValidationOptions {
  balance: string | bigint;
  token: TokenType;
  includesFees?: boolean;
  customMinAmount?: string;
  customFee?: string;
  operationType?: FeeMultiplierType;
}

/**
 * Result of amount validation with conversion data
 */
export interface AmountValidationResult extends ValidationResult {
  convertedAmount?: bigint;
  formattedAmount?: string;
  maxAvailable?: string;
  requiredFee?: string;
  remainingBalance?: string;
}

/**
 * Balance checking options
 */
export interface BalanceCheckOptions {
  balance: string | bigint;
  amount: string;
  token: TokenType;
  includeFees?: boolean;
  operationType?: FeeMultiplierType;
}

/**
 * Balance validation result
 */
export interface BalanceValidationResult extends ValidationResult {
  hasInsufficientBalance?: boolean;
  availableBalance?: string;
  requiredAmount?: string;
  shortfall?: string;
}