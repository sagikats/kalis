/**
 * Technion architecture and landscape architecture: the sekem includes an entrance exam.
 * Source: the official calculator (admissions.technion.ac.il/calculator, 2026-10-17) — forms 73/74 and the optimal
 * average with "ארכיטקטורה" / "אדריכלות נוף" selected (math weighted 5, not 10).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import type { AcademicDegree } from '../../../types/academic';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { generateTrackPlan } from '../../../utils/analysis/trackGenerator';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import {
	calculateTechnionArchitectureBagrut,
	calculateTechnionOptimalBagrut,
	calculateTechnionEntranceExamSekem,
	requiredTechnionEntranceExam
} from '../../calculators/technion';

type CatalogProgram = AcademicDegree & { admissionRoutes: { entranceExam?: { scaleMax: number } } };
const technion = (academicData as unknown as { id: string; programs: CatalogProgram[] }[]).find((i) => i.id === 'inst-48')!;
const programNamed = (name: string) => technion.programs.find((p) => p.fieldOfStudy === name)!;

// The profile run on the official calculator: regular optimal average 103.8, architecture / landscape 101.9
const SUBJECTS = [
	{ name: 'אנגלית', units: 4, grade: 85 }, { name: 'ספרות', units: 2, grade: 85 }, { name: 'מתמטיקה', units: 5, grade: 85 },
	{ name: 'תנ"ך', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 85 }, { name: 'הבעה עברית', units: 2, grade: 85 },
	{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'פיזיקה', units: 5, grade: 90 }, { name: 'גיאוגרפיה', units: 5, grade: 95 }
];

function profile(psych: number): UserAcademicProfile {
	return { bagrutSubjects: SUBJECTS, psychometricGeneral: psych, mathUnits: 5, mathGrade: 85, physicsUnits: 5, physicsGrade: 90 };
}

function analyze(name: string, prof: UserAcademicProfile) {
	const res = calculateMultiInstitutionSekem(prof as Parameters<typeof calculateMultiInstitutionSekem>[0], ['technion'])[0];
	const program = programNamed(name);
	return { a: analyzeProgramGap({ institutionId: 'inst-48', institutionName: '', calculatorId: 'technion', program }, prof, res), res };
}

describe('Technion architecture / landscape architecture (entrance-exam sekem)', () => {
	it('the optimal average does not double math: 101.9 vs the regular 103.8 (official calculator)', () => {
		assert.equal(calculateTechnionOptimalBagrut(SUBJECTS).average, 103.8);
		assert.equal(calculateTechnionArchitectureBagrut(SUBJECTS).average, 101.9);
	});

	it('official formulas: architecture 0.7(0.1D + 0.09P + 15) + 0.3E; landscape 0.65(0.412D + 0.08P − 13) + 0.35E − 1.5', () => {
		assert.equal(calculateTechnionEntranceExamSekem('architecture', 100, 700, 100), Math.round((0.7 * (10 + 63 + 15) + 30) * 10) / 10);
		assert.equal(calculateTechnionEntranceExamSekem('landscape', 100, 700, 100), Math.round((0.65 * (41.2 + 56 - 13) + 35 - 1.5) * 10) / 10);
	});

	it('the required exam score is the lowest one-decimal score that reaches the threshold', () => {
		for (const kind of ['architecture', 'landscape'] as const) {
			const req = requiredTechnionEntranceExam(kind, 101.9, 700, 85);
			assert.ok(calculateTechnionEntranceExamSekem(kind, 101.9, 700, req) >= 85);
			assert.ok(calculateTechnionEntranceExamSekem(kind, 101.9, 700, Math.round((req - 0.1) * 10) / 10) < 85);
		}
	});

	it('both programs are marked in the catalog with the official exam scales', () => {
		assert.equal(programNamed('ארכיטקטורה').admissionRoutes.entranceExam?.scaleMax, 140);
		assert.equal(programNamed('אדריכלות נוף').admissionRoutes.entranceExam?.scaleMax, 123);
	});

	it('the report shows the exam score needed instead of accepted / not accepted, and builds no tracks', () => {
		for (const name of ['ארכיטקטורה', 'אדריכלות נוף']) {
			const { a, res } = analyze(name, profile(700));
			assert.equal(a.status, 'screening', name);
			assert.ok(a.entranceExam, name);
			assert.equal(a.entranceExam!.bagrutAverage, 101.9);
			assert.ok(a.admissionNote!.includes(String(a.entranceExam!.requiredScore)), name);
			assert.equal(generateTrackPlan(a, profile(700), res).tracks.length, 0, name);
		}
	});

	it('when even the top exam score cannot reach the threshold, the status is not accepted', () => {
		const { a } = analyze('ארכיטקטורה', profile(300));
		assert.equal(a.status, 'not_accepted');
		assert.ok(a.gap < 0);
	});

	it('other Technion programs are unchanged', () => {
		const { a, res } = analyze('הנדסת מכונות', profile(700));
		assert.equal(a.entranceExam, undefined);
		assert.equal(a.userSekem, res.generalSekem);
	});
});
