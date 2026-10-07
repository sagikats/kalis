/**
 * Ariel "סכם הנדסי" — (math grade × units + physics grade × units + 3 × quantitative section) / 1.8, an admission route
 * of its own in the engineering programs (ariel.ac.il program pages, תשפ"ז).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import data from '../../../data/academicData.json';
import { calculateArielEngineeringScore } from '../../calculators/ariel';
import { evaluateEngineeringScore } from '../officialRoutes';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap } from '../../../utils/analysis/gapAnalyzer';

const sub = (name: string, units: number, grade: number) => ({ name, units, grade });
const ariel = (data as any[]).find((i) => i.id === 'inst-2');
const program = (id: string) => ariel.programs.find((p: any) => p.id === id);

describe('Ariel engineering score', () => {
	it('math 4u 80, physics 5u 80, quantitative 124 = 606, as on the official calculator (2026-10-07)', () => {
		assert.equal(calculateArielEngineeringScore([sub('מתמטיקה', 4, 80), sub('פיזיקה', 5, 80), sub('אנגלית', 4, 80)], 124), 606);
	});

	it('needs math, physics and the quantitative section', () => {
		assert.equal(calculateArielEngineeringScore([sub('מתמטיקה', 5, 90)], 140), null);
		assert.equal(calculateArielEngineeringScore([sub('מתמטיקה', 5, 90), sub('פיזיקה', 5, 90)], 0), null);
	});

	it('the published conditions: civil engineering needs physics 5u, EE math and physics 5u at 80 and quantitative 130', () => {
		const civil = program('prog-inst-2-5').admissionRoutes.engineeringScore;
		const ee = program('prog-inst-2-7').admissionRoutes.engineeringScore;
		const s = [sub('מתמטיקה', 5, 95), sub('פיזיקה', 4, 95)];
		assert.deepEqual(evaluateEngineeringScore(civil, s, 600, 140).missing, ['פיזיקה 5 יח״ל לפחות']);
		const eeRun = evaluateEngineeringScore(ee, [sub('מתמטיקה', 5, 95), sub('פיזיקה', 5, 78)], 600, 125);
		assert.deepEqual(eeRun.missing, ['פיזיקה 5 יח״ל לפחות בציון 80+', 'חשיבה כמותית 130+']);
		assert.equal(eeRun.met, false);
	});

	it('every engineering program with the route on its page has it', () => {
		for (const id of ['prog-inst-2-5', 'prog-inst-2-6', 'prog-inst-2-7', 'prog-inst-2-8', 'prog-inst-2-9', 'prog-inst-2-40', 'prog-inst-2-42']) {
			assert.ok(program(id).admissionRoutes.engineeringScore, id);
		}
	});

	it('strong math and physics admit through the engineering score where the combined score falls short (mechanical engineering)', () => {
		const profile: any = {
			bagrutSubjects: [sub('מתמטיקה', 5, 70), sub('פיזיקה', 5, 90), sub('אנגלית', 4, 70), sub('היסטוריה', 2, 70),
				sub('אזרחות', 2, 70), sub('תנ"ך', 2, 70), sub('ספרות', 2, 70), sub('הבעה עברית', 2, 70)],
			psychometricGeneral: 560, psychometricQuant: 140, psychometricVerbal: 110, psychometricEnglish: 110,
			mathUnits: 5, mathGrade: 70, physicsUnits: 5, physicsGrade: 90
		};
		const res = calculateMultiInstitutionSekem(profile, ['ariel']).find((r: any) => r.institutionId === 'ariel')!;
		const p = program('prog-inst-2-8');
		const a = analyzeProgramGap({ institutionId: 'inst-2', institutionName: ariel.name, calculatorId: 'ariel', program: p } as any, profile, res as any);
		assert.ok(a.userSekem < p.admissionThreshold, `combined ${a.userSekem} should be below ${p.admissionThreshold}`);
		// (70·5 + 90·5 + 3·140) / 1.8 = 677
		assert.equal(a.status, 'accepted');
		assert.equal(a.admissionRoute, 'engineering_score');
	});
});
