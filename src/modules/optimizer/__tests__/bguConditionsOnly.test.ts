/**
 * BGU tracks admitted by official conditions alone (no sekem threshold): mathematics and statistics with mathematics.
 * Source: BGU's live calculator, סתו תשפ"ז (snapshot src/data/sources/bgu-math-conditions-2026-10-16.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

const programOf = (id: string) => (academicData as any[]).find((i) => i.id === 'inst-3').programs.find((p: any) => p.id === id);

const BASE = [
	{ name: 'אנגלית', units: 5, grade: 90 }, { name: 'היסטוריה', units: 2, grade: 85 },
	{ name: 'אזרחות', units: 2, grade: 85 }, { name: 'תנ"ך', units: 2, grade: 85 },
	{ name: 'ספרות', units: 2, grade: 85 }, { name: 'הבעה עברית', units: 2, grade: 85 },
	{ name: 'ביולוגיה', units: 5, grade: 90 }
];

function profile(math: [number, number], psych: number, quant?: number, physics?: [number, number]): UserAcademicProfile {
	const bagrut = [...BASE, { name: 'מתמטיקה', units: math[0], grade: math[1] }];
	if (physics) bagrut.push({ name: 'פיזיקה', units: physics[0], grade: physics[1] });
	return {
		bagrutSubjects: bagrut, psychometricGeneral: psych, psychometricQuant: quant,
		mathUnits: math[0], mathGrade: math[1], physicsUnits: physics?.[0] ?? 0, physicsGrade: physics?.[1] ?? 0
	};
}

function analyze(progId: string, prof: UserAcademicProfile) {
	const res = calculateMultiInstitutionSekem(prof as any, ['bgu'])[0];
	return { gap: analyzeProgramGap({ institutionId: 'inst-3', institutionName: '', calculatorId: 'bgu', program: programOf(progId) }, prof, res), res };
}

const MATH_TRACKS = ['prog-bgu-72', 'prog-bgu-63', 'prog-bgu-68', 'prog-bgu-73', 'prog-bgu-66', 'prog-bgu-65'];

describe('BGU condition-only admission (mathematics)', () => {
	it('the catalog has no invented threshold for these tracks', () => {
		for (const id of [...MATH_TRACKS, 'prog-bgu-146']) {
			const p = programOf(id);
			assert.equal(p.admissionThreshold, null, id);
			assert.ok(p.admissionRoutes.conditionsOnly, id);
		}
	});

	it('math 5 units 87+ admits, with no sekem involved', () => {
		const { gap } = analyze('prog-bgu-72', profile([5, 90], 520));
		assert.equal(gap.status, 'accepted');
		assert.equal(gap.admissionRoute, 'conditions');
	});

	it('math 5/85 alone does not — and the report says which condition is missing', () => {
		const { gap } = analyze('prog-bgu-72', profile([5, 85], 650));
		assert.equal(gap.status, 'not_accepted');
		assert.match(gap.admissionNote ?? '', /אין לתואר הזה סף סכם/);
		assert.ok(gap.improvementOptions.some((o) => o.id === 'opt-req-math'));
	});

	it('quantitative section 137 with a passing math grade admits', () => {
		assert.equal(analyze('prog-bgu-63', profile([5, 60], 600, 138)).gap.status, 'accepted');
		assert.notEqual(analyze('prog-bgu-63', profile([5, 60], 600, 135)).gap.status, 'accepted');
	});

	it('math 82 and physics 82 (both 5 units) admit', () => {
		assert.equal(analyze('prog-bgu-68', profile([5, 83], 500, undefined, [5, 84])).gap.status, 'accepted');
	});

	it('the sekem-700 alternative admits only with the sekem, the quantitative section and the math grade', () => {
		const ok = analyze('prog-bgu-72', profile([5, 80], 740, 128));
		assert.ok(ok.res.generalSekem >= 700, `general sekem ${ok.res.generalSekem}`);
		assert.equal(ok.gap.status, 'accepted');
		assert.match(ok.gap.admissionNote ?? '', /בחלופה/);

		const lowSekem = analyze('prog-bgu-72', profile([5, 80], 560, 128));
		assert.ok(lowSekem.res.generalSekem < 700, `general sekem ${lowSekem.res.generalSekem}`);
		assert.equal(lowSekem.gap.status, 'not_accepted');
	});

	it('double-major tracks remind that the other department\'s conditions apply too', () => {
		const { gap } = analyze('prog-bgu-73', profile([5, 95], 600));
		assert.match(gap.admissionNote ?? '', /המחלקה השנייה/);
	});
});

describe('BGU condition-only admission (statistics with mathematics)', () => {
	it('math 87 admits; quantitative sekem 630 with math 4/80 admits; neither → not accepted', () => {
		assert.equal(analyze('prog-bgu-146', profile([5, 88], 500)).gap.status, 'accepted');

		const viaSekem = analyze('prog-bgu-146', profile([4, 82], 720, 140));
		assert.ok((viaSekem.res.quantitativeSekem ?? 0) >= 630, `quantitative sekem ${viaSekem.res.quantitativeSekem}`);
		assert.equal(viaSekem.gap.status, 'accepted');

		assert.equal(analyze('prog-bgu-146', profile([4, 82], 500, 100)).gap.status, 'not_accepted');
	});
});
