/**
 * Evaluates official per-program threshold requirements (AdmissionRoutes.requirements), e.g. TAU
 * "ידע במתמטיקה: 5 יח״ל 80+ או 5 יח״ל 70+ ובחינת סיווג 75+ או 4 יח״ל 88+".
 */

import type { ProgramRequirement, RequirementOption } from '../../types/academic';
import type { CalculatorSubject } from '../calculators/types';
import { assignable, describeCondition } from './excellentBagrut';
import { isSameBagrutSubject } from './solver';

export interface RequirementContext {
	subjects: CalculatorSubject[];
	/** Psychometric section scores, 50–150. */
	psychQuant?: number;
	psychVerbal?: number;
	psychEnglish?: number;
}

export interface RequirementResult {
	requirement: ProgramRequirement;
	met: boolean;
	/** Not met outright, but this option is met apart from its institutional exam (e.g. a classification exam). */
	examOption?: RequirementOption;
	/**
	 * Not met only because a psychometric section score wasn't entered (e.g. English level with no English score):
	 * the outcome is unknown, so it must not block admission — callers show what's needed instead.
	 */
	unknown?: boolean;
	/** Sections whose missing score makes the result unknown. */
	missingSections?: ('quant' | 'verbal' | 'english')[];
}

const SECTION_LABEL = { quant: 'חשיבה כמותית', verbal: 'חשיבה מילולית', english: 'אנגלית' } as const;

/**
 * Subjects for the check: the bagrut list, plus math/physics from the dedicated fields when the list lacks them.
 */
export function requirementSubjects(
	subjects: CalculatorSubject[],
	math?: { units?: number; grade?: number },
	physics?: { units?: number; grade?: number }
): CalculatorSubject[] {
	const list = subjects.filter((s) => s.units > 0 && s.grade > 0);
	const add = (name: string, f?: { units?: number; grade?: number }) => {
		if (f?.units && f.grade && !list.some((s) => isSameBagrutSubject(s.name, name))) {
			list.push({ name, units: f.units, grade: f.grade });
		}
	};
	add('מתמטיקה', math);
	add('פיזיקה', physics);
	return list;
}

function optionMetIgnoringExam(o: RequirementOption, ctx: RequirementContext): boolean {
	const scores = { quant: ctx.psychQuant, verbal: ctx.psychVerbal, english: ctx.psychEnglish };
	if (o.psych?.some((p) => (scores[p.section] ?? 0) < p.min)) return false;
	return assignable(o.bagrut ?? [], ctx.subjects);
}

export function evaluateRequirement(requirement: ProgramRequirement, ctx: RequirementContext): RequirementResult {
	const met = requirement.anyOf.some((o) => !o.exam && optionMetIgnoringExam(o, ctx));
	if (met) return { requirement, met };
	const examOption = requirement.anyOf.find((o) => o.exam && optionMetIgnoringExam(o, ctx));
	// Unknown: an exam-free option whose bagrut part holds and whose only gaps are section scores never entered
	const scores = { quant: ctx.psychQuant, verbal: ctx.psychVerbal, english: ctx.psychEnglish };
	const unknownOption = requirement.anyOf.find(
		(o) =>
			!o.exam &&
			o.psych?.length &&
			assignable(o.bagrut ?? [], ctx.subjects) &&
			o.psych.every((p) => (scores[p.section] ?? 0) >= p.min || !scores[p.section])
	);
	if (unknownOption) {
		const missingSections = unknownOption.psych!.filter((p) => !scores[p.section]).map((p) => p.section);
		return { requirement, met: false, examOption, unknown: true, missingSections };
	}
	return { requirement, met: false, examOption };
}

/** True when the result blocks admission (not met, and not merely unknown for lack of a section score). */
export const isBlocking = (r: RequirementResult) => !r.met && !r.unknown;

export function evaluateRequirements(requirements: ProgramRequirement[] | undefined, ctx: RequirementContext): RequirementResult[] {
	return (requirements ?? []).map((r) => evaluateRequirement(r, ctx));
}

export function describeOption(o: RequirementOption): string {
	return [
		...(o.bagrut ?? []).map(describeCondition),
		...(o.psych ?? []).map((p) => `${SECTION_LABEL[p.section]} ${p.min}+ בפסיכומטרי`),
		...(o.exam ? [o.exam] : [])
	].join(' וגם ');
}

export function describeRequirement(r: ProgramRequirement): string {
	return `${r.anyOf.map(describeOption).join(' או ')}${r.otherOptions ? ` (או: ${r.otherOptions})` : ''}`;
}
