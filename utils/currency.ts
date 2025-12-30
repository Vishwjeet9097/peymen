/**
 * Currency formatting utilities
 */

/**
 * Formats amount in Indian Rupees
 * @param amount Numeric amount
 * @param showSymbol Whether to show ₹ symbol
 * @returns Formatted currency string
 */
export const formatINR = (amount: number, showSymbol: boolean = true): string => {
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Formats amount based on currency code
 * @param amount Numeric amount
 * @param currency Currency code (INR, USD, etc.)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  // Always use INR formatting with ₹ symbol
  return formatINR(amount);
};

/**
 * Gets currency symbol
 * @param currency Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string = 'INR'): string => {
  // Always return ₹ for consistency
  return '₹';
};
