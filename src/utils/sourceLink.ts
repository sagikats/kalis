/**
 * Turns a program's thresholdSource ("<url> — <description>") into what the UI shows: a link when the URL opens on its
 * own, plain text otherwise. Bar-Ilan's sources are its calculator's results page (shoham.biu.ac.il/kabala/Results.aspx),
 * which only works inside a calculator session — linking to it leads to a broken page.
 */
const NOT_LINKABLE: { pattern: RegExp; name: string }[] = [
	{ pattern: /shoham\.biu\.ac\.il\/kabala\/Results\.aspx/i, name: 'מחשבון הקבלה הרשמי של בר-אילן' }
];

export function describeThresholdSource(source: string): { href?: string; label: string } {
	const [url, ...rest] = source.split(' — ');
	const detail = rest.join(' — ');
	const blocked = NOT_LINKABLE.find((n) => n.pattern.test(url));
	if (blocked) return { label: `מקור: ${blocked.name}${detail ? ` — ${detail}` : ''}` };
	if (!/^https?:\/\//.test(url)) return { label: `מקור: ${source}` };
	return { href: url, label: `מקור${detail ? `: ${detail}` : ''}` };
}
