/**
 * Text formatting utilities for the application
 */

/**
 * Truncates a string in the middle with ellipsis
 * Useful for displaying long addresses, principal IDs, transaction hashes, etc.
 *
 * @param text - The text to truncate
 * @param startChars - Number of characters to show at the start (default: 10)
 * @param endChars - Number of characters to show at the end (default: 10)
 * @param separator - Separator to use between parts (default: '...')
 * @returns Truncated string or original if shorter than startChars + endChars
 *
 * @example
 * truncateMiddle('p2ba6-tvs7v-l47ffk54-lfxww-lqe', 15, 15)
 * // Returns: 'p2ba6-tvs7v-l47...ffk54-lfxww-lqe'
 *
 * truncateMiddle('tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 10, 10)
 * // Returns: 'tb1qxy2kgd...p83kkfjhx0wlh'
 */
export const truncateMiddle = (
  text: string,
  startChars: number = 10,
  endChars: number = 10,
  separator: string = '...'
): string => {
  if (!text) return '';

  // If text is shorter than or equal to the combined length, return as is
  if (text.length <= startChars + endChars + separator.length) {
    return text;
  }

  return `${text.slice(0, startChars)}${separator}${text.slice(-endChars)}`;
};

/**
 * Truncates a string at the end with ellipsis
 * Useful for regular text truncation
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncating
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string or original if shorter than maxLength
 */
export const truncateEnd = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!text || text.length <= maxLength) return text;

  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Formats an address for display (Principal ID, Bitcoin address, etc.)
 * This is a convenience wrapper around truncateMiddle with sensible defaults
 *
 * @param address - The address to format
 * @param visibleChars - Total number of visible characters (split between start/end)
 * @returns Formatted address
 */
export const formatAddressForDisplay = (
  address: string,
  visibleChars: number = 20
): string => {
  if (!address) return '';

  // Calculate how to split the visible characters
  const startChars = Math.floor(visibleChars / 2);
  const endChars = Math.floor(visibleChars / 2);

  return truncateMiddle(address, startChars, endChars);
};

/**
 * Formats a transaction hash for display
 *
 * @param hash - The transaction hash
 * @param visibleChars - Number of visible characters (default: 16)
 * @returns Formatted hash
 */
export const formatTxHashForDisplay = (
  hash: string,
  visibleChars: number = 16
): string => {
  return formatAddressForDisplay(hash, visibleChars);
};