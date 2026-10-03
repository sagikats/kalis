/**
 * Shared "optimal bagrut average" (ממוצע בגרות מיטבי) engine used by all institution calculators.
 *
 * Every Israeli university computes the optimal average the same way:
 *  1. Mandatory subjects are always included.
 *  2. Elective subjects are included only if they raise the average,
 *     as long as the included subjects total at least `minUnits` (20).
 *  3. Bonus points are added per subject before averaging, and the result may be capped.
 * Institutions differ only in which subjects are mandatory, the bonus table,
 * the subject weight (e.g. Technion doubles math), the cap and rounding.
 */

import type { CalculatorSubject, DroppedSubjectInfo, OptimalBagrutResult, SubjectBreakdownItem } from './types';

export interface OptimalAverageRules {
	isMandatory: (name: string) => boolean;
	getBonus: (subject: CalculatorSubject) => number;
	/** Weight of the subject in the average (default: its units). */
	getWeight?: (subject: CalculatorSubject) => number;
	/** Minimum total units of the included subjects (default 20). */
	minUnits?: number;
	/** Maximum average after bonuses, if the institution caps it. */
	cap?: number;
	/** Decimal places the average is rounded to (default 2). */
	decimals?: number;
	/** Explanation attached to each dropped subject. */
	dropReason: string;
}

function weightedAverage(subjects: CalculatorSubject[], rules: OptimalAverageRules): number {
	let totalScore = 0;
	let totalWeight = 0;
	for (const s of subjects) {
		const w = rules.getWeight ? rules.getWeight(s) : s.units;
		totalScore += (s.grade + rules.getBonus(s)) * w;
		totalWeight += w;
	}
	if (totalWeight === 0) return 0;
	const factor = 10 ** (rules.decimals ?? 2);
	return Math.round((totalScore / totalWeight) * factor) / factor;
}

function applyCap(avg: number, cap?: number): number {
	return cap !== undefined ? Math.min(cap, avg) : avg;
}

/** Per-subject view of an optimal-average result: bonus, effective score and whether it counted. */
function buildBreakdown(
	subjects: CalculatorSubject[],
	included: CalculatorSubject[],
	rules: OptimalAverageRules
): SubjectBreakdownItem[] {
	const inSet = new Set(included);
	return subjects.map((s) => {
		const empty = !(s.units > 0 && s.grade > 0);
		const bonus = empty ? 0 : rules.getBonus(s);
		return {
			name: s.name,
			units: s.units,
			grade: s.grade,
			bonus,
			effective: s.grade + bonus,
			weight: rules.getWeight ? rules.getWeight(s) : s.units,
			status: empty ? 'empty' : rules.isMandatory(s.name) ? 'mandatory' : inSet.has(s) ? 'included' : 'dropped'
		};
	});
}

export function computeOptimalAverage(
	subjects: CalculatorSubject[],
	rules: OptimalAverageRules
): OptimalBagrutResult {
	const result = computeOptimalAverageCore(subjects, rules);
	return { ...result, breakdown: buildBreakdown(subjects || [], result.includedSubjects, rules), cap: rules.cap };
}

function computeOptimalAverageCore(
	subjects: CalculatorSubject[],
	rules: OptimalAverageRules
): OptimalBagrutResult {
	const empty: OptimalBagrutResult = {
		average: 0,
		optimalUnits: 0,
		totalOriginalUnits: 0,
		droppedSubjects: [],
		includedSubjects: []
	};
	if (!subjects || subjects.length === 0) return empty;

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) return empty;

	const minUnits = rules.minUnits ?? 20;
	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => rules.isMandatory(s.name));
	const droppableSubs = activeSubs.filter((s) => !rules.isMandatory(s.name));
	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	// Nothing can be dropped (or too few units to drop anything): average everything
	if (totalActiveUnits < minUnits || droppableSubs.length === 0) {
		return {
			average: applyCap(weightedAverage(activeSubs, rules), rules.cap),
			optimalUnits: totalActiveUnits,
			totalOriginalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs
		};
	}

	let bestAvg = -1;
	let bestDropped: DroppedSubjectInfo[] = [];
	let bestIncluded: CalculatorSubject[] = activeSubs;
	let bestUnits = totalActiveUnits;

	const numSubsets = 1 << droppableSubs.length;
	for (let mask = 0; mask < numSubsets; mask++) {
		const included = [...mandatorySubs];
		const dropped: DroppedSubjectInfo[] = [];
		let units = mandatoryUnits;

		for (let i = 0; i < droppableSubs.length; i++) {
			const sub = droppableSubs[i];
			if ((mask & (1 << i)) !== 0) {
				included.push(sub);
				units += sub.units;
			} else {
				dropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: sub.grade + rules.getBonus(sub),
					reason: rules.dropReason
				});
			}
		}

		if (units < minUnits) continue;

		const avg = weightedAverage(included, rules);
		if (avg > bestAvg || (avg === bestAvg && units > bestUnits)) {
			bestAvg = avg;
			bestDropped = dropped;
			bestIncluded = included;
			bestUnits = units;
		}
	}

	return {
		average: applyCap(Math.max(0, bestAvg), rules.cap),
		optimalUnits: bestUnits,
		totalOriginalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded
	};
}
