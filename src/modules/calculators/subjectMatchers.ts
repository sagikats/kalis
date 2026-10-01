/**
 * Subject-name classifiers shared by the institution calculators.
 * Bagrut subject names come from free-text / catalog entries, so matching is by Hebrew substring.
 */

const has = (name: string, ...needles: string[]) => {
	const n = name.trim();
	return needles.some((k) => n.includes(k));
};

export const isMath = (name: string) => has(name, 'מתמטיקה');
export const isEnglish = (name: string) => has(name, 'אנגלית') && !has(name, 'ספרות אנגלית');
export const isPhysics = (name: string) => has(name, 'פיזיקה', 'פיסיקה');
export const isChemistry = (name: string) => has(name, 'כימיה');
export const isBiology = (name: string) => has(name, 'ביולוגיה');
export const isComputerScience = (name: string) => has(name, 'מדעי המחשב');
export const isLiterature = (name: string) => has(name, 'ספרות');
export const isBible = (name: string) => has(name, 'תנ"ך', 'תנ״ך', "תנ'ך");
export const isHistory = (name: string) => has(name, 'היסטוריה', 'תע"י', 'תע״י', 'תולדות עם ישראל');
export const isArabic = (name: string) => has(name, 'ערבית');
export const isCivics = (name: string) => has(name, 'אזרחות');
export const isHebrewExpression = (name: string) =>
	has(name, 'הבעה', 'לשון') || (has(name, 'עברית') && !has(name, 'ספרות'));
export const isJewishThought = (name: string) => has(name, 'מחשבת ישראל');

/** Physics / chemistry / biology. */
export const isCoreScience = (name: string) => isPhysics(name) || isChemistry(name) || isBiology(name);

/** Technological subjects recognized for science/tech bonuses (CS, electronics, software, etc.). */
export const isTechSubject = (name: string) =>
	isComputerScience(name) ||
	has(name, 'אלקטרוניקה', 'ביוטכנולוגיה', 'סייבר', 'רובוטיקה', 'תוכנה', 'תכנות', 'הנדס');
