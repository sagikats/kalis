/**
 * Catalog programs whose name differs from every official track, mapped by hand (2026-10-06). Each official variant of
 * these tracks has identical values (e.g. cognition with life sciences / mathematics / physics: סכם 720 ובנוסף 620,
 * בגרות 115), so the mapping can't change the result.
 */
export const ALIASES: Record<string, string> = {
	'prog-bgu-5': 'מדעי הקוגניציה והמח דו מחלקתי עם מדעי הטבע - שילוב עם מדעי החיים',
	'prog-bgu-1': 'מדעי הקוגניציה והמח דו מחלקתי עם מדעי המחשב והמידע - שילוב עם מדעי המחשב',
	'prog-bgu-202': 'ניהול תיירות ופנאי חד מחלקתי'
};
