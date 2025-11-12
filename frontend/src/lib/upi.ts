/**
 * UPI Deep Link Utility for TableSplit
 * Based on NPCI UPI specification
 */

export interface UpiPaymentParams {
	pa: string; // Payee UPI ID (required)
	pn: string; // Payee name (required)
	am?: number; // Amount (optional)
	cu?: string; // Currency (default: INR)
	tn?: string; // Transaction note (optional)
	tr?: string; // Transaction reference (optional)
	mc?: string; // Merchant code (optional)
}

/**
 * Generate a UPI deep link for payment
 * @param params - UPI payment parameters
 * @returns UPI deep link string
 */
export function generateUpiDeepLink(params: UpiPaymentParams): string {
	const { pa, pn, am, cu = "INR", tn, tr, mc } = params;

	// Build query parameters
	const queryParams: string[] = [
		`pa=${encodeURIComponent(pa)}`,
		`pn=${encodeURIComponent(pn)}`,
	];

	if (am !== undefined) {
		queryParams.push(`am=${am.toFixed(2)}`);
	}

	queryParams.push(`cu=${cu}`);

	if (tn) {
		queryParams.push(`tn=${encodeURIComponent(tn)}`);
	}

	if (tr) {
		queryParams.push(`tr=${encodeURIComponent(tr)}`);
	}

	if (mc) {
		queryParams.push(`mc=${encodeURIComponent(mc)}`);
	}

	return `upi://pay?${queryParams.join("&")}`;
}

/**
 * Validate UPI ID format
 * @param upiId - UPI ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidUpiId(upiId: string): boolean {
	const upiRegex = /^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/;
	return upiRegex.test(upiId);
}

/**
 * Extract provider name from UPI ID
 * @param upiId - UPI ID (e.g., user@paytm)
 * @returns Provider name (e.g., "Paytm")
 */
export function getUpiProvider(upiId: string): string {
	const providers: Record<string, string> = {
		paytm: "Paytm",
		ybl: "PhonePe",
		phonepe: "PhonePe",
		okaxis: "Google Pay",
		okicici: "Google Pay",
		apl: "Amazon Pay",
		upi: "BHIM",
		icici: "ICICI Bank",
		hdfcbank: "HDFC Bank",
		axisbank: "Axis Bank",
		sbi: "SBI YONO",
	};

	const handle = upiId.split("@")[1]?.toLowerCase();
	return providers[handle] || "UPI";
}

/**
 * Format UPI ID for display
 * @param upiId - UPI ID
 * @returns Formatted string with provider
 */
export function formatUpiId(upiId: string): string {
	const provider = getUpiProvider(upiId);
	return `${upiId} (${provider})`;
}

/**
 * Generate transaction reference ID
 * @param prefix - Optional prefix (default: "TS")
 * @returns Transaction reference string
 */
export function generateTransactionRef(prefix = "TS"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Open UPI payment in appropriate app
 * @param upiLink - UPI deep link
 * @param fallbackUrl - Optional fallback URL if UPI apps not available
 */
export function openUpiPayment(upiLink: string, fallbackUrl?: string): void {
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	if (isMobile) {
		// On mobile, try to open in new tab (will redirect to UPI app)
		const popup = window.open(upiLink, "_blank");

		// Fallback if popup blocked or UPI app not available
		setTimeout(() => {
			if (popup && !popup.closed) {
				popup.close();
				if (fallbackUrl) {
					window.location.href = fallbackUrl;
				}
			}
		}, 2000);
	} else {
		// On desktop, show QR code or copy link
		window.location.href = upiLink;
	}
}
