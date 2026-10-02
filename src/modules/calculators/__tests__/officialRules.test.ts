/**
 * Regression tests pinned to the institutions' OFFICIAL published rules.
 * Each block cites its source; change these only when the institution changes its rules.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	calculateTechnionOptimalBagrut,
	calculateTechnionSekem,
	detectTechnionScienceCluster,
	getTechnionBonus
} from '../technion';
import { calculateTauGeneralSekem, calculateTauManagementSekem, calculateTauOptimalBagrut, getTauBonus } from '../tau';
import { calculateReichmanAdjustedScore, calculateReichmanOptimalBagrut } from '../reichman';
import { calculateHujiOptimalBagrut, calculateHujiWeightedScore, getHujiBonus, isHujiMandatorySubject } from '../huji';
import {
	calculateBguGeneralSekem,
	calculateBguOptimalBagrut,
	calculateBguQuantitativeSekem,
	getBguBonus,
	isBguMandatorySubject
} from '../bgu';
import { calculateHaifaMathPsychometric, calculateHaifaMathSekem, getHaifaBonus } from '../haifa';

const sub = (name: string, units: number, grade: number) => ({ name, units, grade });

describe('Official admission rules', () => {
	// admissions.technion.ac.il — מקדמי הטבה, נוסחאות הסכם, כיצד מחשבים את ממוצע הבגרות המיטבי
	describe('Technion', () => {
		it('bonus table: math 5u +30, English and sciences 5u +25, humanities 5u +20, 4u +10', () => {
			assert.equal(getTechnionBonus(sub('מתמטיקה', 5, 90), false), 30);
			assert.equal(getTechnionBonus(sub('פיזיקה', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('אנגלית', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('היסטוריה', 5, 90), false), 20);
			assert.equal(getTechnionBonus(sub('מתמטיקה', 4, 90), false), 10);
		});

		it('no bonus below a grade of 60', () => {
			assert.equal(getTechnionBonus(sub('מתמטיקה', 5, 59), false), 0);
			assert.equal(getTechnionBonus(sub('פיזיקה', 5, 55), true), 0);
		});

		it('science cluster requires 5u math plus two sciences (or science + tech) at 5u', () => {
			const withoutMath5 = [sub('מתמטיקה', 4, 90), sub('פיזיקה', 5, 90), sub('כימיה', 5, 90)];
			const withMath5 = [sub('מתמטיקה', 5, 90), sub('פיזיקה', 5, 90), sub('מדעי המחשב', 5, 90)];
			assert.equal(detectTechnionScienceCluster(withoutMath5), false);
			assert.equal(detectTechnionScienceCluster(withMath5), true);
			assert.equal(getTechnionBonus(sub('פיזיקה', 5, 90), true), 30);
		});

		it('optimal average is capped at 119 and sekem uses the capped value', () => {
			const strong = [
				sub('מתמטיקה', 5, 100),
				sub('אנגלית', 5, 100),
				sub('פיזיקה', 5, 100),
				sub('כימיה', 5, 100),
				sub('אזרחות', 2, 100)
			];
			assert.equal(calculateTechnionOptimalBagrut(strong).average, 119);
			// 0.5*119 + 0.075*800 - 19 = 100.5 -> clamped to 100
			assert.equal(calculateTechnionSekem(130, 700), calculateTechnionSekem(119, 700));
		});

		it('math counts double for 4u and 5u', () => {
			// math 5u 100(+30) weight 10, English 5u 60(+25) weight 5, civics 2u 60 weight 2, history 3u 60 weight 3
			const subs = [sub('מתמטיקה', 5, 100), sub('אנגלית', 5, 60), sub('אזרחות', 2, 60), sub('היסטוריה', 3, 60)];
			const expected = Math.round(((130 * 10 + 85 * 5 + 60 * 2 + 60 * 3) / 20) * 10) / 10;
			assert.equal(calculateTechnionOptimalBagrut(subs).average, expected);
		});
	});

	// go.tau.ac.il/he/ba/how-to-calculate
	describe('Tel Aviv University', () => {
		it('+25 only for English/physics/chemistry/biology/literature/history/Bible at 5u', () => {
			assert.equal(getTauBonus(sub('ביולוגיה', 5, 90)), 25);
			assert.equal(getTauBonus(sub('ספרות', 5, 90)), 25);
			assert.equal(getTauBonus(sub('מדעי המחשב', 5, 90)), 20);
			assert.equal(getTauBonus(sub('הלכה', 5, 90)), 20);
			assert.equal(getTauBonus(sub('מתמטיקה', 4, 90)), 12.5);
		});
	});

	// info.huji.ac.il — תעודת בגרות, נוסחת חישוב ציון משוקלל
	describe('Hebrew University', () => {
		it('enhanced subjects get +25 at 5u and +15 at 4u; others +20/+10', () => {
			assert.equal(getHujiBonus(sub('אנגלית', 4, 90)), 15);
			assert.equal(getHujiBonus(sub('אזרחות', 5, 90)), 25);
			assert.equal(getHujiBonus(sub('גאוגרפיה', 5, 90)), 20);
			assert.equal(getHujiBonus(sub('גאוגרפיה', 4, 90)), 10);
		});

		it('literature and Bible are droppable; English/math/history/civics/expression are not', () => {
			assert.equal(isHujiMandatorySubject('ספרות עברית'), false);
			assert.equal(isHujiMandatorySubject('תנ״ך'), false);
			for (const n of ['אנגלית', 'מתמטיקה', 'היסטוריה', 'אזרחות', 'הבעה עברית']) {
				assert.equal(isHujiMandatorySubject(n), true, n);
			}
			const res = calculateHujiOptimalBagrut([
				sub('מתמטיקה', 5, 95),
				sub('אנגלית', 5, 95),
				sub('היסטוריה', 5, 95),
				sub('אזרחות', 3, 95),
				sub('הבעה עברית', 2, 95),
				sub('תנ״ך', 2, 60) // mandatory subjects alone already total 20 units
			]);
			assert.ok(res.droppedSubjects.some((d) => d.name === 'תנ״ך'));
		});

		it('weighted score takes the better of 50/50 and 30/70', () => {
			// bagrut 115, psychometric 600: 50/50 wins (strong bagrut)
			const B = 3.963 * 11.5 - 20.0621;
			const P = 0.032073 * 600 + 0.3672;
			const y5050 = 1.2422 * (0.5 * B + 0.5 * P) - 4.7609;
			assert.equal(calculateHujiWeightedScore(115, 600), Math.round(y5050 * 1000) / 1000);
		});
	});

	// BGU ידיעון למועמדים תשפ"ז (2026-2027), עמ' 10–11, 43
	describe('Ben-Gurion University', () => {
		it('bonus table: math 4u +20, English 4u +15, civics 5u +20', () => {
			assert.equal(getBguBonus(sub('מתמטיקה', 4, 80)), 20);
			assert.equal(getBguBonus(sub('אנגלית', 4, 80)), 15);
			assert.equal(getBguBonus(sub('אזרחות', 5, 80)), 20);
			assert.equal(getBguBonus(sub('מדעי המחשב', 5, 80)), 25);
		});

		it('only English/math/history/civics/expression are always included', () => {
			assert.equal(isBguMandatorySubject('ספרות'), false);
			assert.equal(isBguMandatorySubject('תנ״ך'), false);
			assert.equal(isBguMandatorySubject('אזרחות'), true);
		});

		it('optimal average is capped at 120', () => {
			const res = calculateBguOptimalBagrut([
				sub('מתמטיקה', 5, 100),
				sub('אנגלית', 5, 100),
				sub('היסטוריה', 5, 100),
				sub('אזרחות', 5, 100),
				sub('הבעה עברית', 2, 100)
			]);
			assert.equal(res.average, 120);
		});

		it('sekem is not truncated at 800 (excellence thresholds reach 830)', () => {
			assert.ok(calculateBguGeneralSekem(120, 800) > 800);
		});
	});

	// Live official calculators (BGU …/GetSekem*, TAU go.tau.ac.il/graphql, Reichman runi.ac.il) — values captured 2026-10-02
	describe('Live official calculator snapshots', () => {
		it('Technion profile A (user-verified on admissions.technion.ac.il/sekem-calculator, 2026-10-02): 111.1', () => {
			const res = calculateTechnionOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 2, 85), sub('אזרחות', 2, 88), sub('תנ"ך', 2, 80), sub('ספרות', 2, 82), sub('הבעה עברית', 2, 84)
			]);
			assert.equal(res.average, 111.1);
			assert.equal(res.droppedSubjects.length, 0);
		});

		it('Technion profile C (user-verified): math 4u +10 at weight 8, geography 5u +20 -> 101.5', () => {
			const res = calculateTechnionOptimalBagrut([
				sub('מתמטיקה', 4, 92), sub('אנגלית', 5, 90), sub('גיאוגרפיה', 5, 95),
				sub('היסטוריה', 2, 88), sub('אזרחות', 2, 90), sub('תנ"ך', 2, 84), sub('ספרות', 2, 86), sub('הבעה עברית', 2, 90)
			]);
			assert.equal(res.average, 101.5);
		});

		it('BGU general and quantitative sekem', () => {
			assert.equal(calculateBguGeneralSekem(110, 700), 753);
			assert.equal(calculateBguGeneralSekem(115, 654), 754);
			assert.equal(calculateBguGeneralSekem(112.5, 616), 716);
			assert.equal(calculateBguQuantitativeSekem(115, 135, 125, 100), 769);
			assert.equal(calculateBguQuantitativeSekem(112, 135, 125, 100), 750);
			assert.equal(calculateBguQuantitativeSekem(100, 120, 120, 120), 638);
		});

		it('BGU: standalone sociology/psychology get no bonus, social sciences do', () => {
			assert.equal(getBguBonus(sub('סוציולוגיה (מוגבר 5 יח"ל)', 5, 90)), 0);
			assert.equal(getBguBonus(sub('פסיכולוגיה (מוגבר 5 יח"ל)', 5, 90)), 0);
			assert.equal(getBguBonus(sub('מדעי החברה (משולב סוציולוגיה ופסיכולוגיה)', 5, 90)), 20);
		});

		it('TAU adjustment scores and average cap', () => {
			assert.equal(calculateTauGeneralSekem(110, 700), 689);
			assert.equal(calculateTauManagementSekem(110, 700), 691);
			assert.equal(calculateTauManagementSekem(95, 650), 612);
			assert.equal(calculateTauOptimalBagrut([sub('מתמטיקה', 5, 100), sub('אנגלית', 5, 100), sub('פיזיקה', 5, 100), sub('אזרחות', 5, 100)]).average, 117);
		});

		it('Reichman adjusted score and optimal average', () => {
			assert.equal(calculateReichmanAdjustedScore(98.75, 700), 671.15); // official 671.16
			assert.ok(Math.abs(calculateReichmanAdjustedScore(111.38, 720) - 742.21) <= 0.02);
			assert.ok(Math.abs(calculateReichmanAdjustedScore(75.67, 520) - 467.72) <= 0.02);
			// Bible, literature and CS are dropped -> 111.38 (official)
			const res = calculateReichmanOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 2, 85), sub('אזרחות', 2, 88), sub('תנ"ך', 2, 80), sub('ספרות', 2, 82), sub('הבעה עברית', 2, 84)
			]);
			assert.equal(res.average, 111.38);
		});
	});

	// haifa.ac.il — חישוב סכם
	describe('University of Haifa', () => {
		it('bonus table: math 4u +20, core subjects 4u +20 / 5u +25, others 4u +10 / 5u +20', () => {
			assert.equal(getHaifaBonus(sub('מתמטיקה', 4, 80)), 20);
			assert.equal(getHaifaBonus(sub('אנגלית', 4, 80)), 20);
			assert.equal(getHaifaBonus(sub('ביולוגיה', 5, 80)), 25);
			assert.equal(getHaifaBonus(sub('גאוגרפיה', 4, 80)), 10);
		});

		it('math programs: PM = 0.514554*(6Q+4V+E) - 65.3, sekem = (BT + 3PM)/4', () => {
			const pm = calculateHaifaMathPsychometric(140, 120, 130);
			assert.equal(pm, 0.514554 * (6 * 140 + 4 * 120 + 130) - 65.3);
			assert.equal(calculateHaifaMathSekem(110, pm), Math.round((110 * 10 - 330 + 3 * pm) / 4));
		});
	});
});
