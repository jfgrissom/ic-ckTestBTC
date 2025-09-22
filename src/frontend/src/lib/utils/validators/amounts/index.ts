import {
  TokenType,
  FeeMultiplierType,
  getTokenConfig,
  formatTokenAmount,
  convertToSmallestUnits,
  calculateFee,
  calculateMaxAvailable,
  meetsMinimumAmount
} from '../tokens';
import {
  AmountValidationOptions,
  AmountValidationResult,
  BalanceCheckOptions,
  BalanceValidationResult
} from './types';

/**
 * Validates and converts an amount with comprehensive checks
 * @param amount - The amount string to validate and convert
 * @param options - Validation options including balance, token, and fee settings
 * @returns Comprehensive validation result with converted amount
 */
export const validateAndConvertAmount = (
  amount: string,
  options: AmountValidationOptions
): AmountValidationResult => {
  const {
    balance,
    token,
    includesFees = true,
    customMinAmount,
    customFee,
    operationType = 'TRANSFER'
  } = options;

  // Basic amount validation
  if (!amount?.trim()) {
    return {
      valid: false,
      error: 'Amount is required'
    };
  }

  const trimmedAmount = amount.trim();
  const numAmount = parseFloat(trimmedAmount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0'
    };
  }

  // Token configuration
  const tokenConfig = getTokenConfig(token);

  // Minimum amount validation
  const minAmount = parseFloat(customMinAmount || tokenConfig.minTransfer);
  if (numAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ${minAmount} ${tokenConfig.symbol}`,
      details: `The minimum transfer amount for ${tokenConfig.symbol} is ${minAmount}`
    };
  }

  // Convert amount to smallest units
  const conversionResult = convertToSmallestUnits(trimmedAmount, token);
  if (!conversionResult.success) {
    return {
      valid: false,
      error: conversionResult.error,
      details: 'Amount conversion to smallest units failed'
    };
  }

  // Balance validation
  const balanceResult = validateBalance({
    balance,
    amount: trimmedAmount,
    token,
    includeFees: includesFees,
    operationType
  });

  if (!balanceResult.valid) {
    return {
      valid: false,
      error: balanceResult.error,
      details: balanceResult.details,
      maxAvailable: balanceResult.availableBalance,
      requiredFee: includesFees ? calculateFee(token, operationType, customFee).formattedFee : undefined
    };
  }

  // Calculate remaining balance after transaction
  const balanceFormatted = formatTokenAmount(balance, token);
  const balanceNum = parseFloat(balanceFormatted.formatted);
  const feeResult = calculateFee(token, operationType, customFee);
  const feeNum = parseFloat(formatTokenAmount(feeResult.totalFeeInSmallestUnits, token).formatted);
  const remainingBalance = (balanceNum - numAmount - (includesFees ? feeNum : 0)).toFixed(tokenConfig.decimals);

  return {
    valid: true,
    convertedAmount: conversionResult.value!,
    formattedAmount: conversionResult.formatted!,
    maxAvailable: calculateMaxAvailable(balance, token, operationType),
    requiredFee: includesFees ? feeResult.formattedFee : undefined,
    remainingBalance
  };
};

/**
 * Validates if the current balance is sufficient for a transaction
 * @param options - Balance check options
 * @returns Balance validation result
 */
export const validateBalance = (options: BalanceCheckOptions): BalanceValidationResult => {
  const {
    balance,
    amount,
    token,
    includeFees = true,
    operationType = 'TRANSFER'
  } = options;

  const balanceFormatted = formatTokenAmount(balance, token);
  const balanceNum = parseFloat(balanceFormatted.formatted);
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum)) {
    return {
      valid: false,
      error: 'Invalid amount for balance validation'
    };
  }

  // Calculate total required (amount + fees if included)
  let totalRequired = amountNum;
  let feeAmount = 0;

  if (includeFees) {
    const feeResult = calculateFee(token, operationType);
    const feeFormatted = formatTokenAmount(feeResult.totalFeeInSmallestUnits, token);
    feeAmount = parseFloat(feeFormatted.formatted);
    totalRequired = amountNum + feeAmount;
  }

  if (totalRequired > balanceNum) {
    const shortfall = (totalRequired - balanceNum).toFixed(getTokenConfig(token).decimals);
    const availableBalance = calculateMaxAvailable(balance, token, operationType);

    return {
      valid: false,
      error: includeFees
        ? 'Insufficient balance (including fees)'
        : 'Amount exceeds available balance',
      details: includeFees
        ? `Required: ${totalRequired.toFixed(getTokenConfig(token).decimals)} ${getTokenConfig(token).symbol} (including ${feeAmount.toFixed(getTokenConfig(token).decimals)} fee)`
        : `Available: ${balanceNum.toFixed(getTokenConfig(token).decimals)} ${getTokenConfig(token).symbol}`,
      hasInsufficientBalance: true,
      availableBalance,
      requiredAmount: totalRequired.toFixed(getTokenConfig(token).decimals),
      shortfall
    };
  }

  return {
    valid: true,
    availableBalance: balanceNum.toFixed(getTokenConfig(token).decimals),
    requiredAmount: totalRequired.toFixed(getTokenConfig(token).decimals)
  };
};

/**
 * Validates a simple amount string for basic formatting and range
 * @param amount - Amount string to validate
 * @param token - Token type for validation rules
 * @returns Basic validation result
 */
export const validateAmountFormat = (amount: string, token: TokenType): AmountValidationResult => {
  if (!amount?.trim()) {
    return {
      valid: false,
      error: 'Amount is required'
    };
  }

  const trimmedAmount = amount.trim();
  const tokenConfig = getTokenConfig(token);

  // Check for valid number format
  const numAmount = parseFloat(trimmedAmount);
  if (isNaN(numAmount)) {
    return {
      valid: false,
      error: 'Invalid amount format',
      details: 'Amount must be a valid number'
    };
  }

  if (numAmount < 0) {
    return {
      valid: false,
      error: 'Amount cannot be negative'
    };
  }

  if (numAmount === 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0'
    };
  }

  // Check decimal places
  const decimalPlaces = (trimmedAmount.split('.')[1] || '').length;
  if (decimalPlaces > tokenConfig.decimals) {
    return {
      valid: false,
      error: `Amount cannot have more than ${tokenConfig.decimals} decimal places`,
      details: `${tokenConfig.symbol} supports up to ${tokenConfig.decimals} decimal places`
    };
  }

  // Check minimum amount
  if (!meetsMinimumAmount(trimmedAmount, token)) {
    return {
      valid: false,
      error: `Amount below minimum`,
      details: `Minimum amount for ${tokenConfig.symbol} is ${tokenConfig.minTransfer}`
    };
  }

  // Convert to verify precision
  const conversionResult = convertToSmallestUnits(trimmedAmount, token);
  if (!conversionResult.success) {
    return {
      valid: false,
      error: conversionResult.error
    };
  }

  return {
    valid: true,
    convertedAmount: conversionResult.value!,
    formattedAmount: conversionResult.formatted!
  };
};

/**
 * Calculates the maximum amount that can be sent with the current balance
 * @param balance - Current balance in smallest units
 * @param token - Token type
 * @param operationType - Operation type for fee calculation
 * @returns Maximum sendable amount in human-readable format
 */
export const calculateMaxSendableAmount = (
  balance: string | bigint,
  token: TokenType,
  operationType: FeeMultiplierType = 'TRANSFER'
): string => {
  return calculateMaxAvailable(balance, token, operationType);
};

/**
 * Utility function to check if an amount is within safe limits
 * @param amount - Amount to check
 * @param token - Token type
 * @returns True if amount is within safe limits
 */
export const isAmountSafe = (amount: string, token: TokenType): boolean => {
  const formatResult = validateAmountFormat(amount, token);
  return formatResult.valid;
};

// Re-export types for convenience
export type {
  AmountValidationOptions,
  AmountValidationResult,
  BalanceCheckOptions,
  BalanceValidationResult
} from './types';