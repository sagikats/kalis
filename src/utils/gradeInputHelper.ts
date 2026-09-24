/**
 * Grade Input Sanitation Helper
 * Enforces strict 0-100 grade entry constraints:
 * - Strips non-digit characters.
 * - Strips leading zeros when followed by other digits ("085" -> "85", "05" -> "5", "0" -> "0").
 * - If value is exactly "100", allows 100.
 * - If value has more than 2 digits (e.g. 105, 859, 999): strictly keeps the first two digits (e.g. 10, 85, 99).
 * - NEVER rounds/clamps up to 100!
 */
export function cleanGradeInput(rawVal: string | number | undefined | null): number | '' {
	if (rawVal === '' || rawVal === null || rawVal === undefined) return '';
	const digits = String(rawVal).replace(/\D/g, '');
	if (digits === '') return '';

	// Strip leading zeros if followed by other digits (e.g. "05" -> "5", but single "0" stays "0")
	const sanitized = digits.replace(/^0+(?=\d)/, '');

	// If exactly 100, allow 100
	if (sanitized === '100') return 100;

	// If more than 2 digits (e.g. 105, 859, 999), take strictly the first 2 digits without rounding up to 100
	if (sanitized.length > 2) {
		const twoDigits = sanitized.slice(0, 2);
		const num = parseInt(twoDigits, 10);
		return isNaN(num) ? '' : num;
	}

	const num = parseInt(sanitized, 10);
	if (isNaN(num)) return '';
	if (num > 100) {
		return parseInt(String(num).slice(0, 2), 10);
	}
	return num;
}

/**
 * General number input cleaner supporting other ranges (e.g. psychometric 0-800, subscores 0-150).
 * If maxVal === 100, automatically delegates to cleanGradeInput to guarantee no rounding to 100.
 */
export function cleanNumberInput(
	rawVal: string | number | undefined | null,
	minVal: number = 0,
	maxVal: number = 100
): number | '' {
	if (rawVal === '' || rawVal === null || rawVal === undefined) return '';
	if (maxVal === 100) {
		return cleanGradeInput(rawVal);
	}

	const digits = String(rawVal).replace(/\D/g, '');
	if (digits === '') return '';
	const sanitized = digits.replace(/^0+(?=\d)/, '');
	const num = parseInt(sanitized, 10);
	if (isNaN(num)) return '';
	return Math.min(maxVal, Math.max(minVal, num));
}
