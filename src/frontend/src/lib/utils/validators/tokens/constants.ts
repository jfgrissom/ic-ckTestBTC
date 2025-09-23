/**
 * Token configuration constants for validation and formatting
 * These constants define the rules and properties for each supported token type
 */
export const TOKEN_CONSTANTS = {
  ckTestBTC: {
    minTransfer: '0.00001',
    decimals: 8,
    fee: '0.00001',
    name: 'Chain-key Bitcoin Testnet',
    symbol: 'ckTestBTC',
    network: 'Bitcoin Testnet',
    description: 'ICRC-2 token representing Bitcoin testnet on Internet Computer'
  }
} as const;

/**
 * Type representing all supported token types
 */
export type TokenType = keyof typeof TOKEN_CONSTANTS;

/**
 * Type representing token configuration
 */
export type TokenConfig = typeof TOKEN_CONSTANTS[TokenType];

/**
 * Array of all supported token types for iteration
 */
export const SUPPORTED_TOKENS: TokenType[] = Object.keys(TOKEN_CONSTANTS) as TokenType[];

/**
 * Default token for the application
 */
export const DEFAULT_TOKEN: TokenType = 'ckTestBTC';

/**
 * Maximum decimal places for amount input validation
 */
export const MAX_DECIMAL_PLACES = 8;

/**
 * Maximum safe amount value to prevent overflow
 */
export const MAX_SAFE_AMOUNT = '999999999.99999999';

/**
 * Fee calculation multipliers for different operation types
 */
export const FEE_MULTIPLIERS = {
  TRANSFER: 1.0,     // Standard transfer fee
  WITHDRAW: 1.5,     // Withdrawal may have higher fees
  DEPOSIT: 0.0       // Deposits typically don't charge fees
} as const;

export type FeeMultiplierType = keyof typeof FEE_MULTIPLIERS;