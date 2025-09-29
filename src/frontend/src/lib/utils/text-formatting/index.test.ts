import {
  truncateMiddle,
  truncateEnd,
  formatAddressForDisplay,
  formatTxHashForDisplay
} from './index';

describe('Text Formatting Utilities', () => {
  describe('truncateMiddle', () => {
    it('should truncate long text in the middle', () => {
      const longText = 'abcdefghijklmnopqrstuvwxyz1234567890';
      const result = truncateMiddle(longText, 5, 5);
      expect(result).toBe('abcde...67890');
    });

    it('should return original text if shorter than combined length', () => {
      const shortText = 'short';
      const result = truncateMiddle(shortText, 10, 10);
      expect(result).toBe('short');
    });

    it('should handle custom separator', () => {
      const text = 'abcdefghijklmnopqrstuvwxyz';
      const result = truncateMiddle(text, 5, 5, ' --- ');
      expect(result).toBe('abcde --- vwxyz');
    });

    it('should handle empty string', () => {
      const result = truncateMiddle('', 5, 5);
      expect(result).toBe('');
    });

    it('should handle Principal ID format', () => {
      const principal = 'p2ba6-tvs7v-l47ffk54-lfxww-lqe';
      const result = truncateMiddle(principal, 15, 15);
      expect(result).toBe('p2ba6-tvs7v-l47...ffk54-lfxww-lqe');
    });
  });

  describe('truncateEnd', () => {
    it('should truncate at the end', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateEnd(longText, 20);
      expect(result).toBe('This is a very lo...');
    });

    it('should return original if shorter than max length', () => {
      const shortText = 'short';
      const result = truncateEnd(shortText, 20);
      expect(result).toBe('short');
    });

    it('should handle custom suffix', () => {
      const text = 'This is a long text';
      const result = truncateEnd(text, 10, ' [more]');
      expect(result).toBe('Thi [more]');
    });
  });

  describe('formatAddressForDisplay', () => {
    it('should format Bitcoin testnet address', () => {
      const address = 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const result = formatAddressForDisplay(address, 20);
      expect(result).toBe('tb1qxy2kgd...jx0wlh');
    });

    it('should format Principal ID', () => {
      const principal = 'rdmx6-jaaaa-aaaah-qcaiq-cai';
      const result = formatAddressForDisplay(principal, 20);
      expect(result).toBe('rdmx6-jaa...iq-cai');
    });

    it('should return short addresses unchanged', () => {
      const shortAddress = 'short';
      const result = formatAddressForDisplay(shortAddress, 20);
      expect(result).toBe('short');
    });

    it('should handle empty address', () => {
      const result = formatAddressForDisplay('', 20);
      expect(result).toBe('');
    });
  });

  describe('formatTxHashForDisplay', () => {
    it('should format transaction hash with default length', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef12345678';
      const result = formatTxHashForDisplay(txHash);
      expect(result).toBe('0x123456...345678');
    });

    it('should format with custom length', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef12345678';
      const result = formatTxHashForDisplay(txHash, 12);
      expect(result).toBe('0x1234...345678');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined/null gracefully', () => {
      expect(formatAddressForDisplay(undefined as any)).toBe('');
      expect(formatAddressForDisplay(null as any)).toBe('');
    });

    it('should handle very small visible characters count', () => {
      const address = 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      const result = formatAddressForDisplay(address, 4);
      expect(result).toBe('tb...lh');
    });
  });
});