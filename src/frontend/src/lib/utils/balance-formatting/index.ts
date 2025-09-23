/**
 * Shared balance formatting utilities
 *
 * IMPORTANT: These functions assume the balance is already formatted from the service layer.
 * The service layer (wallet.service.ts) converts from satoshis to ckTestBTC (divides by 100,000,000).
 * UI components should use these functions to display pre-formatted values without additional conversion.
 */

/**
 * Format balance for display with consistent decimal places
 * @param balance - Already formatted balance string from service layer
 * @param loading - Whether the balance is currently loading
 * @returns Formatted balance string with 8 decimal places
 */
export const formatBalance = (balance: string, loading?: boolean): string => {
  if (loading) return 'Loading...';
  if (!balance || balance === '0') return '0.00000000';

  // Balance is already formatted by the service layer
  // Just ensure consistent decimal places
  const numBalance = parseFloat(balance);
  return numBalance.toFixed(8);
};

/**
 * Format transaction amount for display
 * @param amount - Already formatted amount string from service layer
 * @returns Formatted amount string with 8 decimal places
 */
export const formatAmount = (amount: string): string => {
  if (!amount || amount === '0') return '0.00000000';

  // Amount is already formatted by the service layer
  const numAmount = parseFloat(amount);
  return numAmount.toFixed(8);
};

/**
 * Format token balance with token-specific logic
 * @param balance - Already formatted balance string from service layer
 * @param token - Token type ('ICP' | 'ckTestBTC')
 * @param loading - Whether the balance is currently loading
 * @returns Formatted balance string with appropriate decimal places
 */
export const formatTokenBalance = (
  balance: string,
  _token: 'ckTestBTC',
  loading?: boolean
): string => {
  if (loading) return 'Loading...';
  if (!balance || balance === '0') return '0.00000000';

  // ckTestBTC uses 8 decimal places
  // Balance is already formatted by the service layer
  const numBalance = parseFloat(balance);
  return numBalance.toFixed(8);
};