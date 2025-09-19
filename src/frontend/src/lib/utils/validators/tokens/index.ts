import {
  TOKEN_CONSTANTS,
  TokenType,
  TokenConfig,
  FEE_MULTIPLIERS,
  FeeMultiplierType,
  MAX_DECIMAL_PLACES,
  MAX_SAFE_AMOUNT,
  SUPPORTED_TOKENS,
  DEFAULT_TOKEN
} from './constants';
import {
  TokenOperationOptions,
  TokenFormatResult,
  TokenConversionResult,
  FeeCalculationResult
} from './types';

/**
 * Gets the configuration for a specific token
 * @param token - The token type to get configuration for
 * @returns Token configuration object
 */
export const getTokenConfig = (token: TokenType): TokenConfig => {
  return TOKEN_CONSTANTS[token];
};

/**
 * Checks if a token type is supported
 * @param token - The token string to check
 * @returns True if token is supported, false otherwise
 */
export const isSupportedToken = (token: string): token is TokenType => {
  return SUPPORTED_TOKENS.includes(token as TokenType);
};

/**
 * Formats a token amount from smallest units to human-readable format
 * @param amount - Amount in smallest units (e8s/satoshis) as string or bigint
 * @param token - Token type for formatting rules
 * @returns Formatted token amount result
 */
export const formatTokenAmount = (
  amount: string | bigint,
  token: TokenType
): TokenFormatResult => {
  const config = getTokenConfig(token);
  const divisor = Math.pow(10, config.decimals);

  let numAmount: number;

  if (typeof amount === 'bigint') {
    numAmount = Number(amount) / divisor;
  } else {
    const parsedAmount = parseFloat(amount || '0');
    numAmount = parsedAmount / divisor;
  }

  const formatted = numAmount.toFixed(config.decimals);

  return {
    formatted,
    raw: amount.toString(),
    decimals: config.decimals,
    symbol: config.symbol
  };
};

/**
 * Converts a human-readable amount to smallest units (e8s/satoshis)
 * @param amount - Human-readable amount as string
 * @param token - Token type for conversion rules
 * @returns Conversion result with BigInt value or error
 */
export const convertToSmallestUnits = (
  amount: string,
  token: TokenType
): TokenConversionResult => {
  if (!amount?.trim()) {
    return {
      success: false,
      error: 'Amount is required'
    };
  }

  const config = getTokenConfig(token);
  const numAmount = parseFloat(amount.trim());

  if (isNaN(numAmount)) {
    return {
      success: false,
      error: 'Invalid amount format'
    };
  }

  if (numAmount < 0) {
    return {
      success: false,
      error: 'Amount cannot be negative'
    };
  }

  if (numAmount > parseFloat(MAX_SAFE_AMOUNT)) {
    return {
      success: false,
      error: `Amount exceeds maximum safe value (${MAX_SAFE_AMOUNT})`
    };
  }

  // Check decimal places
  const decimalPlaces = (amount.split('.')[1] || '').length;
  if (decimalPlaces > config.decimals) {
    return {
      success: false,
      error: `Amount cannot have more than ${config.decimals} decimal places`
    };
  }

  try {
    const multiplier = Math.pow(10, config.decimals);
    const smallestUnits = BigInt(Math.floor(numAmount * multiplier));

    return {
      success: true,
      value: smallestUnits,
      formatted: numAmount.toFixed(config.decimals)
    };
  } catch (error) {
    return {
      success: false,
      error: 'Amount conversion failed due to precision limits'
    };
  }
};

/**
 * Calculates fees for a token operation
 * @param token - Token type
 * @param operationType - Type of operation (transfer, withdraw, deposit)
 * @param customFee - Optional custom fee override
 * @returns Fee calculation result
 */
export const calculateFee = (
  token: TokenType,
  operationType: FeeMultiplierType = 'TRANSFER',
  customFee?: string
): FeeCalculationResult => {
  const config = getTokenConfig(token);
  const baseFee = customFee || config.fee;
  const multiplier = FEE_MULTIPLIERS[operationType];
  const multipliedFee = (parseFloat(baseFee) * multiplier).toFixed(config.decimals);

  const conversionResult = convertToSmallestUnits(multipliedFee, token);

  return {
    baseFee,
    multipliedFee,
    totalFeeInSmallestUnits: conversionResult.success ? conversionResult.value! : BigInt(0),
    formattedFee: `${multipliedFee} ${config.symbol}`
  };
};

/**
 * Calculates the maximum amount available for transfer including fees
 * @param balance - Current balance in smallest units
 * @param token - Token type
 * @param operationType - Type of operation for fee calculation
 * @returns Maximum available amount in human-readable format
 */
export const calculateMaxAvailable = (
  balance: string | bigint,
  token: TokenType,
  operationType: FeeMultiplierType = 'TRANSFER'
): string => {
  const balanceFormatted = formatTokenAmount(balance, token);
  const balanceNum = parseFloat(balanceFormatted.formatted);

  const feeResult = calculateFee(token, operationType);
  const feeFormatted = formatTokenAmount(feeResult.totalFeeInSmallestUnits, token);
  const feeNum = parseFloat(feeFormatted.formatted);

  const maxAvailable = Math.max(0, balanceNum - feeNum);

  return maxAvailable.toFixed(getTokenConfig(token).decimals);
};

/**
 * Validates if an amount meets the minimum transfer requirements
 * @param amount - Amount to validate
 * @param token - Token type
 * @returns True if amount meets minimum requirements
 */
export const meetsMinimumAmount = (amount: string, token: TokenType): boolean => {
  const config = getTokenConfig(token);
  const numAmount = parseFloat(amount);
  const minAmount = parseFloat(config.minTransfer);

  return !isNaN(numAmount) && numAmount >= minAmount;
};

/**
 * Gets a human-readable description of token requirements
 * @param token - Token type
 * @returns Description string with token requirements
 */
export const getTokenRequirements = (token: TokenType): string => {
  const config = getTokenConfig(token);
  return `Minimum: ${config.minTransfer} ${config.symbol}, Fee: ${config.fee} ${config.symbol}, Network: ${config.network}`;
};

// Re-export constants and types for convenience
export {
  TOKEN_CONSTANTS,
  SUPPORTED_TOKENS,
  DEFAULT_TOKEN,
  MAX_DECIMAL_PLACES,
  MAX_SAFE_AMOUNT,
  FEE_MULTIPLIERS
};

export type {
  TokenType,
  TokenConfig,
  FeeMultiplierType,
  TokenOperationOptions,
  TokenFormatResult,
  TokenConversionResult,
  FeeCalculationResult
} from './types';