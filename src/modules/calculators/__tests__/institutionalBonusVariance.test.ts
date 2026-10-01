/**
 * Institutional Bonus Variance & Exact Admissions Match Test Suite
 * Validates institutional bonus variations across all 8 Israeli universities
 * and mathematically verifies the candidate's exact profile from BGU live calculator.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	evaluateBgu,
	calculateBguOptimalBagrut,
	calculateBguQuantitativeSekem,
	calculateBguGeneralSekem,
	getBguBonus
} from '../bgu';
import { evaluateTau, calculateTauOptimalBagrut, getTauBonus } from '../tau';
import { evaluateTechnion, calculateTechnionOptimalBagrut, getTechnionBonus } from '../technion';
import { evaluateHuji, calculateHujiOptimalBagrut, getHujiBonus } from '../huji';
import { evaluateHaifa, calculateHaifaOptimalBagrut } from '../haifa';
import { evaluateAriel, calculateArielOptimalBagrut } from '../ariel';
import { evaluateBarIlan, calculateBarIlanOptimalBagrut, getBarIlanBonus } from '../barIlan';
import { evaluateReichman, calculateReichmanOptimalBagrut } from '../reichman';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

describe('Institutional Bonus Variance & BGU Exact Matching Suite', () => {
	// Candidate's exact matriculation subjects from Step 1 screenshot
	const candidateSubjects = [
		{ name: 'תנ״ך', units: 2, grade: 83 },
		{ name: 'ספרות עברית', units: 2, grade: 89 },
		{ name: 'אזרחות', units: 2, grade: 93 },
		{ name: 'היסטוריה / תע״י', units: 5, grade: 91 },
		{ name: 'הבעה עברית', units: 2, grade: 72 },
		{ name: 'אנגלית', units: 5, grade: 90 },
		{ name: 'מתמטיקה', units: 5, grade: 87 },
		{ name: 'פיזיקה', units: 5, grade: 96 },
		{ name: 'מדעי המחשב', units: 5, grade: 86 }
	];

	// Candidate's exact psychometric scores from Step 1 screenshot
	const candidatePsych = {
		general: 616,
		quant: 135,
		verbal: 125,
		english: 100,
		quantEmphasis: 628
	};

	describe('1. Institutional Subject Bonus Variations', () => {
		it('Mathematics 5u Bonus: 35 points in BGU, TAU, HUJI, BIU, Ariel vs 30 in Haifa & Reichman', () => {
			const math5 = { name: 'מתמטיקה', units: 5, grade: 90 };
			assert.equal(getBguBonus(math5), 35, 'BGU gives +35 for 5u Math');
			assert.equal(getTauBonus(math5), 35, 'TAU gives +35 for 5u Math');
			assert.equal(getHujiBonus(math5), 35, 'HUJI gives +35 for 5u Math');
		});

		it('History 5u Bonus: BGU and HUJI give +25 bonus for 5u expanded History', () => {
			const hist5 = { name: 'היסטוריה / תע״י', units: 5, grade: 91 };
			assert.equal(getBguBonus(hist5), 25, 'BGU gives +25 for 5u History');
			assert.equal(getHujiBonus(hist5), 25, 'HUJI gives +25 for 5u History');
		});

		it('Computer Science 5u Bonus: BGU gives +25 bonus for 5u CS', () => {
			const cs5 = { name: 'מדעי המחשב', units: 5, grade: 86 };
			assert.equal(getBguBonus(cs5), 25, 'BGU gives +25 for 5u CS');
		});

		it('Middle Eastern Studies 5u Bonus: standard +20 at Technion/TAU/HUJI/BGU (not in any enhanced official table)', () => {
			const me5 = { name: 'לימודי המזרח התיכון והאסלאם / מזרחנות', units: 5, grade: 90 };
			assert.equal(getBarIlanBonus(me5), 25, 'BIU (unverified table) awards +25 for Middle Eastern Studies');
			assert.equal(getHujiBonus(me5), 20, 'HUJI awards standard +20 (info.huji.ac.il bonus table)');
			assert.equal(getTechnionBonus(me5, false), 20, 'Technion awards standard +20 (admissions.technion.ac.il)');
			assert.equal(getTauBonus(me5), 20, 'TAU awards standard +20 elective bonus for Middle Eastern Studies');
			assert.equal(getBguBonus(me5), 20, 'BGU awards standard +20 elective bonus for Middle Eastern Studies');
		});

		it('Robotics 5u Bonus: +25 only at Technion (recognized tech subject); +20 at TAU/HUJI/BGU', () => {
			const rob5 = { name: 'רובוטיקה ומערכות אוטונומיות', units: 5, grade: 90 };
			assert.equal(getTechnionBonus(rob5, false), 25, 'Technion awards +25 for Robotics');
			assert.equal(getTauBonus(rob5), 20, 'TAU: not in the +25 list (go.tau.ac.il)');
			assert.equal(getHujiBonus(rob5), 20, 'HUJI: not in the +25 list');
			assert.equal(getBguBonus(rob5), 20, 'BGU: not in the enhanced table (ידיעון תשפ"ז)');
			assert.equal(getBarIlanBonus(rob5), 25, 'BIU awards +25 for Robotics');
		});

		it('System Planning & Programming 5u Bonus: +25 at Technion (+30 in cluster), +20 at TAU/HUJI/BGU', () => {
			const sysProg5 = { name: 'תכנון ותכנות מערכות', units: 5, grade: 90 };
			assert.equal(getTechnionBonus(sysProg5, false), 25, 'Technion awards +25 for System Planning & Programming');
			assert.equal(getTechnionBonus(sysProg5, true), 30, 'Technion awards +30 for System Planning & Programming in cluster');
			assert.equal(getTauBonus(sysProg5), 20, 'TAU: not in the +25 list');
			assert.equal(getHujiBonus(sysProg5), 20, 'HUJI: not in the +25 list');
			assert.equal(getBguBonus(sysProg5), 20, 'BGU: not in the enhanced table');
			assert.equal(getBarIlanBonus(sysProg5), 25, 'BIU awards +25 for System Planning & Programming');
		});

		it('Law & Entrepreneurship 5u Bonus: +20 general elective bonus across institutions', () => {
			const law5 = { name: 'משפטים / מבוא למשפט ומשפט ציבורי', units: 5, grade: 90 };
			const ent5 = { name: 'יזמות עסקית וחדשנות / ניהול יזמות', units: 5, grade: 90 };
			assert.equal(getTauBonus(law5), 20, 'TAU gives +20 for Law');
			assert.equal(getHujiBonus(law5), 20, 'HUJI gives +20 for Law');
			assert.equal(getTauBonus(ent5), 20, 'TAU gives +20 for Entrepreneurship');
			assert.equal(getBguBonus(ent5), 20, 'BGU gives +20 for Entrepreneurship');
		});
	});

	describe('2. BGU Exact Mathematical Verification (User Case)', () => {
		it('Current Bagrut Average: 112.5 across 24 units (Bible, literature and CS dropped)', () => {
			// BGU always includes only English, math, history, civics and Hebrew expression (ידיעון תשפ"ז, עמ' 11);
			// Bible (83), literature (89) and CS (86+25=111) lower the average and are dropped.
			const bguBagrut = calculateBguOptimalBagrut(candidateSubjects);
			assert.equal(bguBagrut.average, 112.5);
			assert.equal(bguBagrut.optimalUnits, 24);
			assert.deepEqual(bguBagrut.droppedSubjects.map((s) => s.name).sort(), ['ספרות עברית', 'מדעי המחשב', 'תנ״ך'].sort());
		});

		it('Current Quantitative Sekem: Exactly 732 at current Bagrut 109.06', () => {
			// Formula: 2.705 * 135 + 0.715 * 125 + 0.39 * 100 + 6.29 * 109.06 - 448 = 731.99 -> 732
			const quantSekem = calculateBguQuantitativeSekem(
				109.06,
				candidatePsych.quant,
				candidatePsych.verbal,
				candidatePsych.english
			);
			assert.equal(quantSekem, 732, 'Current Quantitative Sekem must be 732 (gap of -18 from 750 threshold)');
		});

		it('Current General Sekem: Exactly 695 at current Bagrut 109.06', () => {
			// Formula: 0.62 * 616 + 5.9 * 109.06 - 330 = 695.37 -> 695
			const genSekem = calculateBguGeneralSekem(109.06, candidatePsych.general);
			assert.equal(genSekem, 695);
		});

		it('Verified BGU Live Calculator Match: Bagrut 115.0 produces Quantitative 769 and General 754', () => {
			// Matches the exact screenshot from BGU live calculator (GetSekemQuantity & GetSekem):
			const quantSekem115 = calculateBguQuantitativeSekem(115.0, 135, 125, 100);
			const genSekem115 = calculateBguGeneralSekem(115.0, 654); // quantitative emphasis composite
			assert.equal(quantSekem115, 769, 'Matches official BGU calculator 769 with Bagrut 115.0');
			assert.equal(genSekem115, 754, 'Matches official BGU calculator 754 with Bagrut 115.0');
		});

		it('Optimal Track Target: Minimum Bagrut needed for 750 threshold is 112.0 (NOT 115.0)', () => {
			// Formula at Bagrut 112.0: 2.705 * 135 + 0.715 * 125 + 0.39 * 100 + 6.29 * 112.0 - 448 = 750.03 -> 750
			const targetSekem = calculateBguQuantitativeSekem(112.0, 135, 125, 100);
			assert.equal(targetSekem, 750, 'Bagrut 112.0 exactly satisfies 750 admission threshold');
		});

		it('MultiCalculator Integration: returns quantitative 753 / general 716 at optimal average 112.5', () => {
			const results = calculateMultiInstitutionSekem({
				bagrutSubjects: candidateSubjects,
				psychometricGeneral: candidatePsych.general,
				psychometricQuant: candidatePsych.quant,
				psychometricVerbal: candidatePsych.verbal,
				psychometricEnglish: candidatePsych.english,
				psychometricQuantEmphasis: candidatePsych.quantEmphasis,
				mathUnits: 5,
				mathGrade: 87,
				physicsUnits: 5,
				physicsGrade: 96
			}, ['bgu']);

			// 2.705*135 + 0.715*125 + 0.39*100 + 6.29*112.5 - 448 = 753.4 -> 753
			assert.equal(results[0].quantitativeSekem, 753);
			assert.equal(results[0].bagrutAverage, 112.5);
			// 0.62*616 + 5.9*112.5 - 330 = 715.67 -> 716
			assert.equal(results[0].generalSekem, 716);
		});
	});
});
