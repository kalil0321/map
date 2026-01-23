import type { JobMarker } from '@/types';

/**
 * Parse and format salary from dict-like string format: {'unit': 'USD', 'amount': '140900.0'}
 */
function formatSalaryFromDict(salarySummary: string): string | null {
  // Try to extract unit and amount from dict-like string
  // Handle both single and double quotes, and whitespace variations
  const unitMatch = salarySummary.match(/'unit':\s*['"]([^'"]+)['"]|"unit":\s*['"]([^'"]+)['"]/i);
  const amountMatch = salarySummary.match(/'amount':\s*['"]([^'"]+)['"]|"amount":\s*['"]([^'"]+)['"]/i);

  if (unitMatch && amountMatch) {
    const unit = (unitMatch[1] || unitMatch[2] || '').toUpperCase();
    const amountStr = amountMatch[1] || amountMatch[2] || '';
    const amount = parseFloat(amountStr);

    if (!isNaN(amount)) {
      const currencySymbol = getCurrencySymbol(unit);
      // Format number in K format (e.g., 140900 -> 141K)
      const formattedAmount = formatNumberAsK(amount);
      return `${currencySymbol}${formattedAmount}K`;
    }
  }

  return null;
}

/**
 * Format number in K format (e.g., 140900 -> 140.9K, 79600 -> 79.6K)
 * For whole numbers, rounds to nearest integer (e.g., 130900 -> 131K)
 */
function formatNumberAsK(num: number): string {
  // Convert to thousands
  const thousands = num / 1000;
  // Round to nearest integer for cleaner display (e.g., 130.9 -> 131)
  const rounded = Math.round(thousands);
  return rounded.toString();
}

/**
 * Format number in K format with decimals (for ranges)
 */
function formatNumberAsKDecimal(num: number): string {
  // Convert to thousands with one decimal place
  const thousands = num / 1000;
  // Round to one decimal place and remove trailing zeros
  const rounded = Math.round(thousands * 10) / 10;
  // Convert to string and remove trailing .0 if present
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

/**
 * Parse and format single salary value (e.g., "$130900" -> "$131K", "$130,900" -> "$131K")
 */
function formatSingleSalary(salarySummary: string): string | null {
  // Match patterns like: $130900, $130,900, 130900, etc.
  // Handle optional currency symbol, then number with optional commas
  const singleMatch = salarySummary.match(/^([$€£¥₹]|USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR\s*)?([\d,]+)$/i);

  if (singleMatch) {
    const currencyPrefix = (singleMatch[1] || '$').trim();
    const numberStr = singleMatch[2].replace(/,/g, ''); // Remove commas

    const amount = parseFloat(numberStr);

    if (!isNaN(amount) && amount > 0) {
      // Determine currency symbol
      let currencySymbol = '$';
      if (currencyPrefix.startsWith('$')) {
        currencySymbol = '$';
      } else if (currencyPrefix.startsWith('€')) {
        currencySymbol = '€';
      } else if (currencyPrefix.startsWith('£')) {
        currencySymbol = '£';
      } else if (currencyPrefix.startsWith('¥')) {
        currencySymbol = '¥';
      } else if (currencyPrefix.startsWith('₹')) {
        currencySymbol = '₹';
      } else if (currencyPrefix) {
        // Try to get symbol from currency code
        currencySymbol = getCurrencySymbol(currencyPrefix);
      }

      const formatted = formatNumberAsK(amount);
      return `${currencySymbol}${formatted}K`;
    }
  }

  return null;
}

/**
 * Parse and format salary range (e.g., "$140000-170000" -> "$140K - $170K", "$200,000-$300,000" -> "$200K - $300K")
 */
function formatSalaryRange(salarySummary: string): string | null {
  // Pattern 1: Match ranges with currency symbols on both sides (e.g., $200,000-$300,000)
  const doubleCurrencyMatch = salarySummary.match(/^([$€£¥₹])([\d,]+)\s*[-–—]\s*\1([\d,]+)$/i);

  if (doubleCurrencyMatch) {
    const currencySymbol = doubleCurrencyMatch[1];
    const minStr = doubleCurrencyMatch[2].replace(/,/g, ''); // Remove commas
    const maxStr = doubleCurrencyMatch[3].replace(/,/g, ''); // Remove commas

    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);

    if (!isNaN(min) && !isNaN(max)) {
      const formattedMin = formatNumberAsKDecimal(min);
      const formattedMax = formatNumberAsKDecimal(max);

      return `${currencySymbol}${formattedMin}K - ${currencySymbol}${formattedMax}K`;
    }
  }

  // Pattern 2: Match patterns with currency symbol only at start (e.g., $140000-170000, $140000 - 170000)
  const rangeMatch = salarySummary.match(/^([$€£¥₹]|USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|INR\s*)?([\d,]+)\s*[-–—]\s*([\d,]+)$/i);

  if (rangeMatch) {
    const currencyPrefix = (rangeMatch[1] || '$').trim();
    const minStr = rangeMatch[2].replace(/,/g, ''); // Remove commas
    const maxStr = rangeMatch[3].replace(/,/g, ''); // Remove commas

    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);

    if (!isNaN(min) && !isNaN(max)) {
      // Determine currency symbol
      let currencySymbol = '$';
      if (currencyPrefix.startsWith('$')) {
        currencySymbol = '$';
      } else if (currencyPrefix.startsWith('€')) {
        currencySymbol = '€';
      } else if (currencyPrefix.startsWith('£')) {
        currencySymbol = '£';
      } else if (currencyPrefix.startsWith('¥')) {
        currencySymbol = '¥';
      } else if (currencyPrefix.startsWith('₹')) {
        currencySymbol = '₹';
      } else if (currencyPrefix) {
        // Try to get symbol from currency code
        currencySymbol = getCurrencySymbol(currencyPrefix);
      }

      const formattedMin = formatNumberAsKDecimal(min);
      const formattedMax = formatNumberAsKDecimal(max);

      return `${currencySymbol}${formattedMin}K - ${currencySymbol}${formattedMax}K`;
    }
  }

  return null;
}

/**
 * Format salary string for display (standalone version)
 * Converts formats like "$200,000-$300,000" to "$200K - $300K"
 */
export function formatSalaryString(salaryStr: string): string {
  if (!salaryStr) return salaryStr;

  // First, check if it's a salary range (e.g., "$140000-170000" or "$200,000-$300,000")
  const rangeFormatted = formatSalaryRange(salaryStr);
  if (rangeFormatted) {
    return rangeFormatted;
  }

  // Check if it's a single salary value (e.g., "$130900" or "$130,900")
  const singleFormatted = formatSingleSalary(salaryStr);
  if (singleFormatted) {
    return singleFormatted;
  }

  // Check if it looks like a dict format {'unit': 'X', 'amount': 'Y'}
  if (salaryStr.includes('unit') && salaryStr.includes('amount')) {
    const formatted = formatSalaryFromDict(salaryStr);
    if (formatted) {
      return formatted;
    }
  }

  // Otherwise return as-is
  return salaryStr;
}

/**
 * Format salary information for display
 */
export function formatSalary(job: JobMarker): string | null {
  // If there's a summary, try to format it
  if (job.salary_summary) {
    return formatSalaryString(job.salary_summary);
  }

  return null;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF ',
    CNY: '¥',
    INR: '₹',
  };
  return symbols[currency.toUpperCase()] || `${currency} `;
}

function formatPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    YEAR: '/year',
    MONTH: '/month',
    HOUR: '/hour',
    WEEK: '/week',
    DAY: '/day',
  };
  return periodMap[period.toUpperCase()] || '';
}

/**
 * Format experience information for display
 * Formats as "{value}+ y" (e.g., "3-5 years" -> "3+ y", "5 years" -> "5+ y")
 */
export function formatExperience(experience: string | null | undefined): string | null {
  if (!experience) return null;

  // Extract the first number from the experience string
  const numberMatch = experience.match(/\d+/);
  if (numberMatch) {
    const value = numberMatch[0];
    return `${value}+ y`;
  }

  return null;
}


