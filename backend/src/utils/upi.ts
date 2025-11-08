/**
 * UPI (Unified Payments Interface) Utility Functions for India
 *
 * Supports: PhonePe, Google Pay, Paytm, and all UPI-enabled apps
 */

interface UpiPaymentParams {
  pa: string;        // Payee address (UPI ID) - MANDATORY
  pn: string;        // Payee name - MANDATORY
  am?: number;       // Amount in INR (optional for collect requests)
  cu?: string;       // Currency code (default: INR)
  tn?: string;       // Transaction note/description
  tr?: string;       // Transaction reference ID
  mc?: string;       // Merchant code (for merchant payments)
  tid?: string;      // Transaction ID (PSP generated)
  url?: string;      // URL for transaction details
}

/**
 * Validates UPI ID format
 * Format: username@provider (e.g., user@paytm, alice@phonepe)
 *
 * Rules:
 * - Username: 2-256 chars (alphanumeric, dots, hyphens)
 * - Provider: 3-64 chars (letters only, must start with letter)
 * - No underscores allowed (as per NPCI standards)
 */
export function isValidUpiId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
}

/**
 * Generate UPI deep link for payment
 * Works with all UPI apps: PhonePe, Google Pay, Paytm, BHIM, etc.
 *
 * @param params - Payment parameters
 * @returns UPI deep link string
 *
 * @example
 * generateUpiDeepLink({
 *   pa: 'merchant@paytm',
 *   pn: 'Merchant Name',
 *   am: 500,
 *   tn: 'Dinner split payment'
 * })
 * // Returns: 'upi://pay?pa=merchant@paytm&pn=Merchant%20Name&am=500&cu=INR&tn=Dinner%20split%20payment'
 */
export function generateUpiDeepLink(params: UpiPaymentParams): string {
  if (!params.pa || !params.pn) {
    throw new Error('UPI ID (pa) and Payee Name (pn) are mandatory');
  }

  if (!isValidUpiId(params.pa)) {
    throw new Error('Invalid UPI ID format');
  }

  const searchParams = new URLSearchParams();

  // Mandatory parameters
  searchParams.append('pa', params.pa.toLowerCase());
  searchParams.append('pn', params.pn);

  // Optional parameters
  if (params.am !== undefined && params.am > 0) {
    searchParams.append('am', params.am.toFixed(2));
  }

  searchParams.append('cu', params.cu || 'INR');

  if (params.tn) {
    searchParams.append('tn', params.tn);
  }

  if (params.tr) {
    searchParams.append('tr', params.tr);
  }

  if (params.mc) {
    searchParams.append('mc', params.mc);
  }

  if (params.tid) {
    searchParams.append('tid', params.tid);
  }

  if (params.url) {
    searchParams.append('url', params.url);
  }

  return `upi://pay?${searchParams.toString()}`;
}

/**
 * Generate app-specific UPI deep links
 * Use these when you want to open a specific UPI app
 */
export function generateAppSpecificUpiLink(
  app: 'phonepe' | 'googlepay' | 'paytm' | 'bhim',
  params: UpiPaymentParams
): string {
  const baseParams = new URLSearchParams();

  baseParams.append('pa', params.pa.toLowerCase());
  baseParams.append('pn', params.pn);

  if (params.am) baseParams.append('am', params.am.toFixed(2));
  baseParams.append('cu', params.cu || 'INR');
  if (params.tn) baseParams.append('tn', params.tn);
  if (params.tr) baseParams.append('tr', params.tr);

  const schemes = {
    phonepe: `phonepe://pay?${baseParams.toString()}`,
    googlepay: `gpay://upi/pay?${baseParams.toString()}`,
    paytm: `paytmmp://pay?${baseParams.toString()}`,
    bhim: `upi://pay?${baseParams.toString()}`, // BHIM uses generic scheme
  };

  return schemes[app];
}

/**
 * Extract UPI ID from text
 * Useful for parsing payment confirmations or QR codes
 */
export function extractUpiId(text: string): string | null {
  const upiRegex = /[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}/;
  const match = text.match(upiRegex);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Get popular UPI providers in India
 */
export function getUpiProviders(): Array<{ name: string; suffix: string }> {
  return [
    { name: 'Paytm', suffix: 'paytm' },
    { name: 'PhonePe', suffix: 'phonepe' },
    { name: 'Google Pay', suffix: 'okaxis' }, // Google Pay uses multiple banks
    { name: 'Amazon Pay', suffix: 'apl' },
    { name: 'BHIM', suffix: 'upi' },
    { name: 'YONO SBI', suffix: 'sbi' },
    { name: 'ICICI Bank', suffix: 'icici' },
    { name: 'HDFC Bank', suffix: 'hdfcbank' },
    { name: 'Axis Bank', suffix: 'axisbank' },
  ];
}

/**
 * Format amount for UPI display (always 2 decimal places)
 */
export function formatUpiAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parse UPI deep link to extract parameters
 */
export function parseUpiDeepLink(deepLink: string): UpiPaymentParams | null {
  try {
    const url = new URL(deepLink);

    if (!url.protocol.startsWith('upi')) {
      return null;
    }

    const params = new URLSearchParams(url.search);

    const pa = params.get('pa');
    const pn = params.get('pn');

    if (!pa || !pn) {
      return null;
    }

    return {
      pa,
      pn,
      am: params.get('am') ? parseFloat(params.get('am')!) : undefined,
      cu: params.get('cu') || undefined,
      tn: params.get('tn') || undefined,
      tr: params.get('tr') || undefined,
      mc: params.get('mc') || undefined,
      tid: params.get('tid') || undefined,
      url: params.get('url') || undefined,
    };
  } catch (error) {
    return null;
  }
}
