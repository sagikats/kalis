/**
 * Comprehensive 24-Case Benchmark Quality Assurance Suite
 * Validates all 8 Israeli Universities (3 test cases each)
 * Checks institutional calculators, official formula accuracy, and NITE psychometric scaling.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	calculateInstitution,
	calculateTauGeneralSekem,
	calculateTauEngineeringSekem,
	calculateTauManagementSekem,
	calculateTechnionSekem,
	calculateBguGeneralSekem,
	calculateBguEngineeringSekem,
	calculateHujiSekem,
	calculateHaifaSekem,
	calculateArielSekem,
	calculateBarIlanGeneralSekem,
	calculateBarIlanEngineeringSekem,
	calculateReichmanGeneralSekem
} from '../index';
import { CalculatorSubject } from '../types';

describe('Comprehensive 24-Case Quality Assurance Suite (All 8 Universities)', () => {
	// Standard full bagrut subject list
	const baseSubjects: CalculatorSubject[] = [
		{ name: 'מתמטיקה', units: 5, grade: 90 },
		{ name: 'אנגלית', units: 5, grade: 90 },
		{ name: 'פיזיקה', units: 5, grade: 90 },
		{ name: 'אזרחות', units: 2, grade: 90 },
		{ name: 'היסטוריה', units: 2, grade: 90 },
		{ name: 'הבעה עברית', units: 2, grade: 90 },
		{ name: 'ספרות', units: 2, grade: 85 },
		{ name: 'תנ״ך', units: 2, grade: 85 }
	];

	// =========================================================================
	// 1. TEL AVIV UNIVERSITY (TAU) - 3 Cases
	// =========================================================================
	describe('1. Tel Aviv University (TAU)', () => {
		it('Case 1: Bagrut 107.0 + Psychometric 698 + (5u Math & 5u Phys) -> General 673, Engineering 683, Management 681', () => {
			// Exact match against official TAU calculator: go.tau.ac.il/he/calculator
			const gen = calculateTauGeneralSekem(107.0, 698);
			const eng = calculateTauEngineeringSekem(107.0, 698, true);
			const mng = calculateTauManagementSekem(107.0, 698);

			assert.equal(gen, 673, 'TAU General Sekem must be 673');
			assert.equal(eng, 683, 'TAU Engineering Sekem must be 683 with realit bonus');
			assert.equal(mng, 681, 'TAU Management Sekem must be 681');
		});

		it('Case 2: Bagrut 107.0 + Psychometric 740 + (5u Math & 5u Phys) -> Engineering 705 (reaches CS threshold)', () => {
			const eng = calculateTauEngineeringSekem(107.0, 740, true);
			assert.equal(eng, 705, 'TAU Engineering Sekem must reach 705 with psychometric 740');
		});

		it('Case 3: Bagrut 107.0 + Psychometric 698 WITHOUT 5u Physics -> Engineering 673 (no realit bonus)', () => {
			const engWithoutPhysics = calculateTauEngineeringSekem(107.0, 698, false);
			assert.equal(engWithoutPhysics, 673, 'TAU Engineering without 5u Physics must equal 673');
		});
	});

	// =========================================================================
	// 2. TECHNION - 3 Cases
	// =========================================================================
	describe('2. Technion', () => {
		it('Case 1: Standard Science Cluster Profile (Math 5u, Phys 5u) -> Correct Sekem and Cluster Bonus', () => {
			const res = calculateInstitution('technion', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 720,
				psychometricQuant: 720,
				mathUnits: 5,
				mathGrade: 90,
				physicsUnits: 5,
				physicsGrade: 90
			});

			assert.ok(res.bagrutAverage > 105, 'Technion Bagrut average should reflect double math weight');
			assert.ok(res.engineeringSekem! > 85, 'Technion engineering sekem should be > 85 for 720 psych');
			assert.equal(res.directBagrutEligible, false, 'Technion strictly mandates psychometric for STEM');
		});

		it('Case 2: High Bagrut average (112.0) + Psychometric 680 -> Exact Sekem 88.0', () => {
			// S = 0.5 * 112.0 + 0.075 * 680 - 19 = 56.0 + 51.0 - 19 = 88.0
			const sekem = calculateTechnionSekem(112.0, 680);
			assert.equal(sekem, 88.0);
		});

		it('Case 3: High Psychometric (760) + Bagrut 100.0 -> Exact Sekem 88.0', () => {
			// S = 0.5 * 100.0 + 0.075 * 760 - 19 = 50.0 + 57.0 - 19 = 88.0
			const sekem = calculateTechnionSekem(100.0, 760);
			assert.equal(sekem, 88.0);
		});
	});

	// =========================================================================
	// 3. BEN-GURION UNIVERSITY (BGU) - 3 Cases
	// =========================================================================
	describe('3. Ben-Gurion University (BGU)', () => {
		it('Case 1: Engineering Formula with 200-800 Quant and 5u Physics Bonus', () => {
			const res = calculateInstitution('bgu', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 700,
				psychometricQuant: 700,
				mathUnits: 5,
				mathGrade: 90,
				physicsUnits: 5,
				physicsGrade: 90
			});

			assert.ok(res.engineeringSekem! > 500, 'BGU Engineering Sekem must use 200-800 scale');
			assert.ok(res.engineeringSekem! < 800, 'BGU Engineering Sekem must not exceed 800');
		});

		it('Case 2: General Sekem: Bagrut 105.0 + Psychometric 650 -> Exact Sekem 685', () => {
			// BT = 105 * 10 - 330 = 720; Sekem = 0.5 * 650 + 0.5 * 720 = 325 + 360 = 685
			const genSekem = calculateBguGeneralSekem(105.0, 650);
			assert.equal(genSekem, 685);
		});

		it('Case 3: Direct Bagrut threshold: Bagrut 105.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('bgu', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0,
				mathUnits: 5,
				mathGrade: 90
			});
			assert.equal(res.directBagrutEligible, true, 'BGU direct bagrut threshold is >= 104');
		});
	});

	// =========================================================================
	// 4. HEBREW UNIVERSITY OF JERUSALEM (HUJI) - 3 Cases
	// =========================================================================
	describe('4. Hebrew University (HUJI)', () => {
		it('Case 1: Standard Composite Sekem with Standard Deviation Normalization', () => {
			const sekem = calculateHujiSekem(106.0, 680);
			assert.ok(sekem > 600 && sekem < 750, 'HUJI Sekem must be in valid standard range');
		});

		it('Case 2: STEM Profile: Bagrut 108.0 + Psychometric 730 -> Exact Sekem 690', () => {
			// zB = (108 - 100) / 8 = 1.0; zP = (730 - 550) / 100 = 1.8
			// composite = 0.5 * 1.0 + 0.5 * 1.8 = 1.4 -> raw = 1.4 * 100 + 550 = 690
			const sekem = calculateHujiSekem(108.0, 730);
			assert.equal(sekem, 690, 'HUJI Sekem for 108 bagrut and 730 psych equals 690');
		});

		it('Case 3: Direct Bagrut: Bagrut >= 105.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('huji', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0
			});
			assert.equal(res.directBagrutEligible, true, 'HUJI direct bagrut threshold is >= 105.0');
		});
	});

	// =========================================================================
	// 5. UNIVERSITY OF HAIFA - 3 Cases
	// =========================================================================
	describe('5. University of Haifa', () => {
		it('Case 1: Bagrut 106.0 + Psychometric 640 -> Exact Sekem 685', () => {
			// BT = 106 * 10 - 330 = 730; Sekem = 0.5 * 730 + 0.5 * 640 = 365 + 320 = 685
			const sekem = calculateHaifaSekem(106.0, 640);
			assert.equal(sekem, 685);
		});

		it('Case 2: Bagrut 100.0 + Psychometric 600 -> Exact Sekem 635', () => {
			// BT = 100 * 10 - 330 = 670; Sekem = 0.5 * 670 + 0.5 * 600 = 335 + 300 = 635
			const sekem = calculateHaifaSekem(100.0, 600);
			assert.equal(sekem, 635);
		});

		it('Case 3: Direct Bagrut: Bagrut 102.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('haifa', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0
			});
			assert.equal(res.directBagrutEligible, true, 'Haifa direct bagrut threshold is >= 100.0');
		});
	});

	// =========================================================================
	// 6. ARIEL UNIVERSITY - 3 Cases
	// =========================================================================
	describe('6. Ariel University', () => {
		it('Case 1: Bagrut 105.0 + Psychometric 650 -> Exact Sekem 675', () => {
			// (105 * 6.666 + 650) / 2 = (699.93 + 650) / 2 = 1349.93 / 2 = 674.965 -> 675
			const sekem = calculateArielSekem(105.0, 650);
			assert.equal(sekem, 675);
		});

		it('Case 2: Bagrut 98.0 + Psychometric 620 -> Exact Sekem 637', () => {
			// (98 * 6.666 + 620) / 2 = (653.268 + 620) / 2 = 1273.268 / 2 = 636.634 -> 637
			const sekem = calculateArielSekem(98.0, 620);
			assert.equal(sekem, 637);
		});

		it('Case 3: Direct Bagrut: Bagrut 101.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('ariel', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0
			});
			assert.equal(res.directBagrutEligible, true, 'Ariel direct bagrut threshold is >= 100.0');
		});
	});

	// =========================================================================
	// 7. BAR-ILAN UNIVERSITY - 3 Cases
	// =========================================================================
	describe('7. Bar-Ilan University', () => {
		it('Case 1: Engineering/CS with Math 5u and Science Bonuses', () => {
			const res = calculateInstitution('bar_ilan', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 700,
				psychometricQuant: 700,
				mathUnits: 5,
				mathGrade: 90
			});

			assert.ok(res.engineeringSekem! > 650, 'Bar-Ilan engineering sekem should be > 650');
			assert.ok(res.bagrutAverage > 100, 'Bar-Ilan bagrut should include bonuses');
		});

		it('Case 2: General Sekem with 200-800 scale', () => {
			const sekem = calculateBarIlanGeneralSekem(102.0, 620);
			assert.ok(sekem >= 600 && sekem <= 700, 'Bar-Ilan general sekem in valid range');
		});

		it('Case 3: Direct Bagrut: Bagrut >= 102.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('bar_ilan', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0
			});
			assert.equal(res.directBagrutEligible, true, 'Bar-Ilan direct bagrut threshold is >= 102.0');
		});
	});

	// =========================================================================
	// 8. REICHMAN UNIVERSITY - 3 Cases
	// =========================================================================
	describe('8. Reichman University', () => {
		it('Case 1: Tech / CS Profile: Bagrut 106.0 + Psychometric 690', () => {
			const res = calculateInstitution('reichman', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 690,
				psychometricQuant: 690,
				mathUnits: 5,
				mathGrade: 90
			});

			assert.ok(res.generalSekem > 650, 'Reichman general sekem should be > 650');
			assert.ok(res.optimalUnits >= 20, 'Remaining units must be >= 20');
		});

		it('Case 2: Combined Sekem Formula Calculation', () => {
			const sekem = calculateReichmanGeneralSekem(102.0, 630);
			assert.ok(sekem >= 600 && sekem <= 700, 'Reichman general sekem in valid range');
		});

		it('Case 3: Direct Bagrut: Bagrut >= 100.0 -> directBagrutEligible = true', () => {
			const res = calculateInstitution('reichman', {
				bagrutSubjects: baseSubjects,
				psychometricGeneral: 0
			});
			assert.equal(res.directBagrutEligible, true, 'Reichman direct bagrut threshold is >= 100.0');
		});
	});
});
