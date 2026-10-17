/**
 * Marks catalog programs that are not open to high-school graduates as notOffered, so they disappear from degree search
 * and the calculator panel (DegreeSearchSelector / AdmissionPanel skip notOffered programs).
 *
 *   npx tsx scripts/data/hideNonHighSchoolPrograms.ts
 *
 * These are retraining and completion programs for degree holders or practising professionals. Admission isn't by bagrut
 * and psychometric, so the thresholds the catalog carried for them (no official source) were meaningless, and a student
 * searching "סיעוד" could pick the retraining track and be told "עובר את הסף". Approved by the user on 2026-10-16
 * (USER_TASKS 3.1). Runs last in importAll so no other importer re-activates them. Idempotent.
 */
import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(path.resolve(__dirname, '../..'), 'src/data/academicData.json');

const HIDDEN: Record<string, string> = {
	'prog-bgu-189': 'הסבת אקדמאים לסיעוד — תוכנית לבעלי תואר אקדמי, לא לבוגרי תיכון.',
	'prog-bgu-186': 'השלמה לרפואת חירום — תוכנית השלמה לבעלי מקצוע, לא לבוגרי תיכון.',
	'prog-tau-0162-14': 'הסבת אקדמאים למדעי האחיות — תוכנית לבעלי תואר אקדמי, לא לבוגרי תיכון.'
};
const SOURCE = 'החלטת מוצר (USER_TASKS 3.1, אושר 2026-10-16): תוכניות הסבה/השלמה אינן פתוחות לבוגרי תיכון';

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const found = new Set<string>();
	for (const inst of data) {
		for (const p of inst.programs ?? []) {
			const note = HIDDEN[p.id];
			if (!note) continue;
			p.notOffered = { note, source: SOURCE };
			found.add(p.id);
		}
	}
	const missing = Object.keys(HIDDEN).filter((id) => !found.has(id));
	if (missing.length > 0) throw new Error(`Programs not found in the catalog: ${missing.join(', ')}`);
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Marked ${found.size} programs notOffered.`);
}

main();
