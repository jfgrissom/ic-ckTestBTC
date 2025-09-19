import { TokenType, TokenConfig, FeeMultiplierType } from './constants';

/**
 * Options for token operations and validations
 */
export interface TokenOperationOptions {
  token: TokenType;
  operationType?: FeeMultiplierType;
  includesFees?: boolean;
  customFee?: string;
}

/**
 * Result of token formatting operations
 */
export interface TokenFormatResult {
  formatted: string;
  raw: string;
  decimals: number;
  symbol: string;
}

/**
 * Result of token conversion operations
 */
export interface TokenConversionResult {
  success: boolean;
  value?: bigint;
  formatted?: string;
  error?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  token: TokenType;
  balance: string;
  formatted: string;
  available: string;
  reserved?: string;
}

/**
 * Fee calculation result
 */
export interface FeeCalculationResult {
  baseFee: string;
  multipliedFee: string;
  totalFeeInSmallestUnits: bigint;
  formattedFee: string;
}

// Re-export token types for convenience
export type { TokenType, TokenConfig, FeeMultiplierType } from './constants';