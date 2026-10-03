/**
 * Evaluates the Technion "בגרות מצוינת" route — admission without psychometric on per-subject bagrut
 * conditions (official page: admissions.technion.ac.il/acceptance-without-psychometric-exam/).
 */

import type { ExcellentBagrutRoute, MathExamRoute, SubjectCondition } from '../../types/academic';
import { calculateTechnionSekem } from '../calculators/technion';
import type { CalculatorSubject } from '../calculators/types';
import { isSameBagrutSubject } from './solver';

export interface ExcellentBagrutResult {
	met: boolean;
	rawAverage: number;
	/** Human-readable unmet requirements (Hebrew), empty when met. */
	missing: string[];
}

/** Plain bagrut average: units-weighted, no bonuses. */
export function rawBagrutAverage(subjects: CalculatorSubject[]): number {
	const valid = subjects.filter((s) => s.units > 0 && s.grade > 0);
	const units = valid.reduce((sum, s) => sum + s.units, 0);
	if (units === 0) return 0;
	return Math.round((valid.reduce((sum, s) => sum + s.grade * s.units, 0) / units) * 100) / 100;
}

const qualifies = (s: CalculatorSubject, c: SubjectCondition) =>
	s.units >= c.minUnits && s.grade >= c.minGrade && c.subjects.some((name) => isSameBagrutSubject(name, s.name));

/** Can every condition be met with distinct subjects? (small backtracking search) */
function assignable(conditions: SubjectCondition[], subjects: CalculatorSubject[]): boolean {
	const slots = conditions.flatMap((c) => Array.from({ length: c.count ?? 1 }, () => c));
	const used = new Set<number>();
	const fill = (i: number): boolean => {
		if (i === slots.length) return true;
		for (let j = 0; j < subjects.length; j++) {
			if (used.has(j) || !qualifies(subjects[j], slots[i])) continue;
			used.add(j);
			if (fill(i + 1)) return true;
			used.delete(j);
		}
		return false;
	};
	return fill(0);
}

const describe = (c: SubjectCondition) =>
	`${c.count && c.count > 1 ? `${c.count} מתוך ` : ''}${c.subjects.join(' / ')} ${c.minUnits} יח״ל בציון ${c.minGrade}+`;

export function evaluateExcellentBagrut(route: ExcellentBagrutRoute, subjects: CalculatorSubject[]): ExcellentBagrutResult {
	const missing: string[] = [];
	const rawAverage = rawBagrutAverage(subjects);

	if (route.rawAverageMin !== undefined && rawAverage < route.rawAverageMin) {
		missing.push(`ממוצע בגרות ללא בונוסים ${route.rawAverageMin}+ (יש לך ${rawAverage})`);
	}
	if (route.mathAnyOf?.length) {
		const ok = subjects.some((s) => isSameBagrutSubject(s.name, 'מתמטיקה') && route.mathAnyOf!.some((m) => s.units >= m.minUnits && s.grade >= m.minGrade));
		if (!ok) missing.push(`מתמטיקה ${route.mathAnyOf.map((m) => `${m.minUnits} יח״ל ${m.minGrade}+`).join(' או ')}`);
	}

	const all = route.all ?? [];
	const options = route.anyOf?.length ? route.anyOf : [[]];
	const subjectsOk = options.some((opt) => assignable([...all, ...opt], subjects));
	if (!subjectsOk) {
		for (const c of all) if (!assignable([c], subjects)) missing.push(describe(c));
		if (route.anyOf?.length && all.every((c) => assignable([c], subjects))) {
			missing.push(`אחת האפשרויות: ${route.anyOf.map((opt) => opt.map(describe).join(' + ')).join(' או ')}`);
		}
		if (missing.length === 0) missing.push('שילוב המקצועות הנדרש (כל מקצוע נספר לתנאי אחד בלבד)');
	}

	return { met: missing.length === 0, rawAverage, missing };
}

/**
 * Technion "בגרות ובחינת סיווג במתמטיקה": the lowest exam score whose converted (psychometric-scale) value brings the
 * Technion sekem up to `threshold`, or null if even 100 isn't enough.
 */
export function requiredMathExamScore(
	route: MathExamRoute,
	bagrutAverage: number,
	threshold: number
): { examScore: number; psychometricEquivalent: number } | null {
	for (let score = route.minExamScore; score <= 100; score++) {
		const equivalent = Math.round(score * route.conversion.slope + route.conversion.intercept);
		if (calculateTechnionSekem(bagrutAverage, equivalent) >= threshold) return { examScore: score, psychometricEquivalent: equivalent };
	}
	return null;
}
