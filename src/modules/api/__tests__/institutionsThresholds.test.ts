/**
 * The flow screen loads programs from /api/institutions (DB-backed) and feeds them to the gap analysis.
 * The DB keeps official-threshold provenance inside `prerequisites`; it must survive that path, or the card
 * would label every threshold "משוער".
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET as institutionsGET } from '../../../app/api/institutions/route';
import { analyzeProgramGap } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

const profileA = {
	bagrutSubjects: [
		{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
		{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
		{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
		{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
		{ name: 'הבעה עברית', units: 2, grade: 84 }
	],
	psychometricGeneral: 714, psychometricQuant: 145, psychometricVerbal: 137, psychometricEnglish: 124,
	mathGrade: 95, mathUnits: 5, physicsGrade: 93, physicsUnits: 5
};
const technionResult = () => calculateMultiInstitutionSekem(profileA as any, ['technion'])[0];

describe('/api/institutions → gap analysis keeps official thresholds', () => {
	it('the API lifts official-threshold fields out of prerequisites', async () => {
		const res = await institutionsGET({} as any);
		const { institutions } = await res.json();
		for (const inst of institutions) {
			for (const p of inst.programs) {
				assert.equal(p.thresholdSource, p.prerequisites?.thresholdSource, `${inst.id} ${p.id}`);
				assert.equal(p.officialThreshold, p.prerequisites?.officialThreshold, `${inst.id} ${p.id}`);
			}
		}
	});

	it('the gap analysis recognises a source that only exists inside prerequisites', () => {
		const program: any = {
			id: 'prog-technion-33', fieldOfStudy: 'מדעי המחשב', admissionThreshold: 91, relevantSekemType: 'technion',
			prerequisites: { officialThreshold: 91, thresholdSource: 'https://admissions.technion.ac.il/x — טבלה' }
		};
		const gap = analyzeProgramGap(
			{ institutionId: 'technion', institutionName: 'הטכניון', calculatorId: 'technion', program },
			profileA as any,
			technionResult()
		);
		assert.equal(gap.thresholdVerified, true);
		assert.equal(gap.officialThreshold, 91);
		assert.ok(gap.thresholdSource?.startsWith('https://admissions.technion.ac.il/'));
	});

	it('a program without a source stays "estimated"', () => {
		const program: any = { id: 'x', fieldOfStudy: 'מדעי המחשב', admissionThreshold: 91, prerequisites: {} };
		const gap = analyzeProgramGap(
			{ institutionId: 'technion', institutionName: 'הטכניון', calculatorId: 'technion', program },
			profileA as any,
			technionResult()
		);
		assert.equal(gap.thresholdVerified, false);
	});
});
