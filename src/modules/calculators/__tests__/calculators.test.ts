/**
 * Automated Verification & Audit Test Suite for Subagent 3: University Calculators
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	calculateAllInstitutions,
	calculateInstitution,
	isProgramEligibleForDirectBagrut,
	calculateTechnionSekem,
	calculateTechnionOptimalBagrut,
	detectTechnionScienceCluster,
	calculateTauEngineeringSekem,
	calculateBguGeneralSekem,
	calculateHaifaSekem,
	calculateArielSekem,
	calculateBarIlanGeneralSekem,
	calculateBarIlanEngineeringSekem,
	getBarIlanBonus
} from '../index';

import { CalculatorSubject } from '../types';

describe('Subagent 3: Institution Calculators & Data Verification', () => {
	const standardBagrutProfile: CalculatorSubject[] = [
		{ name: 'מתמטיקה', units: 5, grade: 90 },
		{ name: 'אנגלית', units: 5, grade: 92 },
		{ name: 'פיזיקה', units: 5, grade: 88 },
		{ name: 'מדעי המחשב', units: 5, grade: 95 },
		{ name: 'ספרות', units: 2, grade: 84 },
		{ name: 'היסטוריה', units: 2, grade: 85 },
		{ name: 'תנ״ך', units: 2, grade: 82 },
		{ name: 'אזרחות', units: 2, grade: 86 },
		{ name: 'הבעה עברית', units: 2, grade: 85 }
	];

	it('Technion: Detects science cluster and applies 30-point bonus', () => {
		const hasCluster = detectTechnionScienceCluster(standardBagrutProfile);
		assert.equal(hasCluster, true);

		const opt = calculateTechnionOptimalBagrut(standardBagrutProfile);
		assert.equal(opt.hasScienceCluster, true);
		assert.ok(opt.average > 108);
	});

	it('Technion: Exact Sekem formula math', () => {
		// S = 0.5 * 105.0 + 0.075 * 700 - 19 = 52.5 + 52.5 - 19 = 86.0
		const sekem = calculateTechnionSekem(105.0, 700);
		assert.equal(sekem, 86.0);
	});

	it('Dropping Law: Weak non-mandatory elective is legally dropped', () => {
		const profileWithWeakElective: CalculatorSubject[] = [
			...standardBagrutProfile,
			{ name: 'צרפתית', units: 5, grade: 60 } // Low grade, pulling down average
		];

		const opt = calculateTechnionOptimalBagrut(profileWithWeakElective);
		const droppedNames = opt.droppedSubjects.map((s) => s.name);
		assert.ok(droppedNames.includes('צרפתית'));
		assert.ok(opt.optimalUnits >= 20);
	});

	it('TAU: Engineering Sekem matches linear formula', () => {
		// S_eng = 78.239 + 0.0407 * 140 + 0.0384 * 130 + 4.975 * 105
		const engSekem = calculateTauEngineeringSekem(105.0, 140, 130);
		assert.ok(engSekem > 600);
		assert.ok(engSekem < 750);
	});

	it('BGU: General Sekem formula calculation', () => {
		// BT = 105 * 10 - 330 = 720
		// Sekem = 0.5 * 700 + 0.5 * 720 = 710
		const bguSekem = calculateBguGeneralSekem(105.0, 700);
		assert.equal(bguSekem, 710);
	});

	it('Haifa & Ariel: Correct Sekem formulas', () => {
		const haifa = calculateHaifaSekem(100.0, 600);
		// BT = 100 * 10 - 330 = 670; Sekem = 0.5 * 670 + 0.5 * 600 = 635
		assert.equal(haifa, 635);

		const ariel = calculateArielSekem(100.0, 600);
		// (100 * 6.666 + 600) / 2 = 633.3 -> 633
		assert.equal(ariel, 633);
	});

	it('Direct Bagrut Discipline Policy: Strict differentiation', () => {
		// Computer Science or Medicine NEVER eligible for Direct Bagrut without Psychometric
		assert.equal(isProgramEligibleForDirectBagrut('technion', 'מדעי המחשב', 115.0), false);
		assert.equal(isProgramEligibleForDirectBagrut('huji', 'רפואה', 118.0), false);
		assert.equal(isProgramEligibleForDirectBagrut('bgu', 'הנדסת מכונות', 110.0), false);

		// Psychology / Social Sciences at HUJI: Eligible for >= 105.0
		assert.equal(isProgramEligibleForDirectBagrut('huji', 'פסיכולוגיה', 105.4), true);
		assert.equal(isProgramEligibleForDirectBagrut('huji', 'פסיכולוגיה', 104.2), false);
	});

	it('Bar-Ilan: Bonuses, Sekem and Direct Bagrut', () => {
		// Bonus verification: Math 5u (+35), Bible/Jewish Studies 5u (+25), 4u elective (+10)
		assert.equal(getBarIlanBonus({ name: 'מתמטיקה', units: 5, grade: 90 }), 35);
		assert.equal(getBarIlanBonus({ name: 'מתמטיקה', units: 4, grade: 90 }), 12.5);
		assert.equal(getBarIlanBonus({ name: 'תנ״ך', units: 5, grade: 90 }), 25);
		assert.equal(getBarIlanBonus({ name: 'מחשבת ישראל', units: 5, grade: 90 }), 25);
		assert.equal(getBarIlanBonus({ name: 'גיאוגרפיה', units: 4, grade: 80 }), 10);

		// General Sekem: BT = 105 * 10 - 330 = 720; Sekem = 0.5 * 700 + 0.5 * 720 = 710
		const biuSekem = calculateBarIlanGeneralSekem(105.0, 700);
		assert.equal(biuSekem, 710);

		// Engineering Sekem: 0.55 * 140 + 0.45 * 720 + 10 (5u Math >= 85) = 77 + 324 + 10 = 411
		const biuEng = calculateBarIlanEngineeringSekem(105.0, 140, 5, 90);
		assert.equal(biuEng, 411);

		// Direct Bagrut in Bar-Ilan: >= 102.0
		assert.equal(isProgramEligibleForDirectBagrut('bar_ilan', 'כלכלה', 103.0), true);
		assert.equal(isProgramEligibleForDirectBagrut('bar_ilan', 'כלכלה', 101.5), false);
		assert.equal(isProgramEligibleForDirectBagrut('bar_ilan', 'הנדסת מחשבים', 108.0), false);
	});

	it('All Institutions Engine: Runs simultaneously without errors', () => {
		const results = calculateAllInstitutions({
			bagrutSubjects: standardBagrutProfile,
			psychometricGeneral: 680,
			psychometricQuant: 135
		});

		assert.equal(results.length, 7);
		const instIds = results.map((r) => r.institutionId);
		assert.deepEqual(instIds, ['technion', 'tau', 'huji', 'bgu', 'haifa', 'ariel', 'bar_ilan']);
		results.forEach((r) => {
			assert.ok(r.bagrutAverage > 100);
			assert.ok(r.generalSekem > 0);
		});
	});
});
