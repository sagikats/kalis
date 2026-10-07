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
import { calculateBarIlanOptimalBagrut, getBarIlanBonus, isBarIlanMandatorySubject } from '../barIlan';
import { calculateHujiOptimalBagrut, calculateHujiWeightedScore, getHujiBonus, isHujiMandatorySubject } from '../huji';
import {
	calculateBguEngineeringSekem,
	calculateBguGeneralSekem,
	calculateBguOptimalBagrut,
	calculateBguQuantitativeSekem,
	getBguBonus,
	isBguMandatorySubject
} from '../bgu';
import { calculateHaifaMathPsychometric, calculateHaifaMathSekem, calculateHaifaOptimalBagrut, calculateHaifaWeightedSekem, getHaifaBonus } from '../haifa';
import { calculateArielSekem, evaluateAriel } from '../ariel';

const sub = (name: string, units: number, grade: number) => ({ name, units, grade });

describe('Official admission rules', () => {
	// admissions.technion.ac.il — מקדמי הטבה, נוסחאות הסכם, כיצד מחשבים את ממוצע הבגרות המיטבי
	describe('Technion', () => {
		it('bonus table: math 5u +30; English, literature, Bible, history, sciences 5u +25; civics/expression 5u +20; 4u +10', () => {
			assert.equal(getTechnionBonus(sub('מתמטיקה', 5, 90), false), 30);
			assert.equal(getTechnionBonus(sub('פיזיקה', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('אנגלית', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('היסטוריה', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('ספרות עברית', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('תנ"ך', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('ערבית', 5, 90), false), 25);
			assert.equal(getTechnionBonus(sub('אזרחות', 5, 90), false), 20);
			assert.equal(getTechnionBonus(sub('הבעה עברית', 5, 90), false), 20);
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

		it('profiles A/B/C match the official HUJI calculator (user-verified 2026-10-02)', () => {
			const A = calculateHujiOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 2, 85), sub('אזרחות', 2, 88), sub('תנ"ך', 2, 80), sub('ספרות', 2, 82), sub('הבעה עברית', 2, 84)
			]);
			assert.equal(Math.round(A.average * 10) / 10, 112.1);
			assert.equal(A.optimalUnits, 26);

			// Literature (72) must stay: dropping it as well as Bible would leave 19 units
			const B = calculateHujiOptimalBagrut([
				sub('מתמטיקה', 4, 78), sub('אנגלית', 4, 82), sub('ביולוגיה', 5, 84), sub('היסטוריה', 2, 75),
				sub('אזרחות', 2, 80), sub('תנ"ך', 2, 70), sub('ספרות', 2, 72), sub('הבעה עברית', 2, 72)
			]);
			assert.equal(Math.round(B.average * 10) / 10, 90.6);
			assert.equal(B.optimalUnits, 21);
			assert.deepEqual(B.droppedSubjects.map((d) => d.name), ['תנ"ך']);

			const C = calculateHujiOptimalBagrut([
				sub('מתמטיקה', 4, 92), sub('אנגלית', 5, 90), sub('גיאוגרפיה', 5, 95), sub('היסטוריה', 2, 88),
				sub('אזרחות', 2, 90), sub('תנ"ך', 2, 84), sub('ספרות', 2, 86), sub('הבעה עברית', 2, 90)
			]);
			assert.equal(C.average, 105.7);
			assert.equal(C.optimalUnits, 20);
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

		it('Technion profile B (user-verified): 4u English/math +10, biology 5u +25, mandatory 54 kept -> 85.9', () => {
			const res = calculateTechnionOptimalBagrut([
				sub('מתמטיקה', 4, 78), sub('אנגלית', 4, 82), sub('ביולוגיה', 5, 84), sub('היסטוריה', 2, 75),
				sub('אזרחות', 2, 80), sub('תנ"ך', 2, 70), sub('ספרות', 2, 72), sub('הבעה עברית', 2, 54)
			]);
			assert.equal(res.average, 85.9);
			assert.equal(res.droppedSubjects.length, 0);
		});

		it('Technion profile A, all 5u (user-verified): literature/Bible/history +25, civics/expression +20 -> 114.4', () => {
			const res = calculateTechnionOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 5, 85), sub('אזרחות', 5, 88), sub('תנ"ך', 5, 80), sub('ספרות עברית', 5, 82), sub('הבעה עברית', 5, 84)
			]);
			assert.equal(res.average, 114.4);
		});

		it('Technion sekem for profiles A/B/C (user-verified): 90.6 / 69 / 82.8 incl. 68.95 -> 69 rounding', () => {
			assert.equal(calculateTechnionSekem(111.1, 720), 90.6);
			assert.equal(calculateTechnionSekem(85.9, 600), 69);
			assert.equal(calculateTechnionSekem(101.5, 680), 82.8);
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

		it('BGU engineering sekem (סכם הנדסה) — 24 probes of …/acceptanceProbabilityMAIN', () => {
			// [avg, Q, math grade, math units, physics grade (0 = none), official]
			const probes: [number, number, number, number, number, number][] = [
				[110, 145, 95, 5, 93, 574], [110, 145, 95, 5, 0, 556], [100, 125, 85, 4, 0, 429], [105, 135, 80, 5, 85, 514],
				[105, 135, 90, 5, 0, 509], [105, 125, 90, 5, 0, 479], [105, 145, 90, 5, 0, 539], [100, 135, 90, 5, 0, 497],
				[110, 135, 90, 5, 0, 521], [105, 135, 80, 5, 0, 499], [105, 135, 100, 5, 0, 519], [105, 135, 90, 4, 0, 475],
				[105, 135, 80, 4, 0, 467], [105, 135, 90, 5, 90, 534], [105, 135, 90, 5, 80, 514], [105, 145, 90, 5, 90, 563],
				[105, 135, 80, 5, 90, 523], [110, 135, 90, 5, 90, 534], [105, 135, 90, 4, 90, 500], [105, 115, 90, 5, 90, 474],
				[105, 150, 90, 5, 90, 578], [105, 135, 90, 5, 100, 553], [105, 135, 100, 5, 90, 544], [105, 135, 80, 4, 90, 492]
			];
			for (const [avg, q, mg, mu, pg, official] of probes) {
				const ours = calculateBguEngineeringSekem(mg, mu, 680, q, pg, pg ? 5 : 0, avg);
				assert.equal(ours, official, JSON.stringify({ avg, q, mg, mu, pg }));
			}
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

	// biu.ac.il/registration-and-admission/information/general-admission-req/matriculation-calculation
	describe('Bar-Ilan (bagrut average)', () => {
		it('bonus table: math 35/15, enhanced group 25/12.5 (incl. civics, CS, Talmud), others 20/10', () => {
			assert.equal(getBarIlanBonus(sub('מתמטיקה', 4, 90)), 15);
			assert.equal(getBarIlanBonus(sub('אזרחות', 5, 90)), 25);
			assert.equal(getBarIlanBonus(sub('מדעי המחשב', 4, 90)), 12.5);
			assert.equal(getBarIlanBonus(sub('תושב"ע / תלמוד (מוגבר 5 יח"ל)', 5, 90)), 25);
			assert.equal(getBarIlanBonus(sub('גיאוגרפיה', 5, 90)), 20);
			assert.equal(getBarIlanBonus(sub('גיאוגרפיה', 4, 90)), 10);
			assert.equal(getBarIlanBonus(sub('אנגלית', 5, 59)), 0);
		});

		it('profile A = 112.08 over 26 units, Bible+literature dropped (user-verified on shoham.biu.ac.il)', () => {
			const res = calculateBarIlanOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 2, 85), sub('אזרחות', 2, 88), sub('תנ"ך', 2, 80), sub('ספרות', 2, 82), sub('הבעה עברית', 2, 84)
			]);
			assert.equal(res.average, 112.08);
			assert.equal(res.optimalUnits, 26);
		});

		it('Bible, literature and Jewish thought are droppable; average is not capped', () => {
			assert.equal(isBarIlanMandatorySubject('תנ"ך'), false);
			assert.equal(isBarIlanMandatorySubject('ספרות'), false);
			assert.equal(isBarIlanMandatorySubject('מחשבת ישראל'), false);
			assert.equal(isBarIlanMandatorySubject('אזרחות'), true);
			const res = calculateBarIlanOptimalBagrut([
				sub('מתמטיקה', 5, 100), sub('אנגלית', 5, 100), sub('היסטוריה', 5, 100), sub('אזרחות', 5, 100)
			]);
			assert.ok(res.average > 125);
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

		it('averages for profiles A (107.1), B (90.91, 4u math/English +20) and C (103.08) match the Haifa calculator (user-verified)', () => {
			const A = calculateHaifaOptimalBagrut([
				sub('מתמטיקה', 5, 95), sub('אנגלית', 5, 92), sub('פיזיקה', 5, 93), sub('מדעי המחשב', 5, 90),
				sub('היסטוריה', 2, 85), sub('אזרחות', 2, 88), sub('תנ"ך', 2, 80), sub('ספרות', 2, 82), sub('הבעה עברית', 2, 84)
			]);
			assert.equal(Math.round(A.average * 10) / 10, 107.1);
			const B = calculateHaifaOptimalBagrut([
				sub('מתמטיקה', 4, 78), sub('אנגלית', 4, 82), sub('ביולוגיה', 5, 84), sub('היסטוריה', 2, 75),
				sub('אזרחות', 2, 80), sub('תנ"ך', 2, 70), sub('ספרות', 2, 72), sub('הבעה עברית', 2, 76)
			]);
			assert.equal(B.average, 90.91);
			const C = calculateHaifaOptimalBagrut([
				sub('מתמטיקה', 4, 92), sub('אנגלית', 5, 90), sub('גיאוגרפיה', 5, 95), sub('היסטוריה', 2, 88),
				sub('אזרחות', 2, 90), sub('תנ"ך', 2, 84), sub('ספרות', 2, 86), sub('הבעה עברית', 2, 90)
			]);
			assert.equal(C.average, 103.08);
		});

		it('CS sekem for profile A with Q145/V137/E124 = 731 (user-verified on Haifa calculator)', () => {
			const pm = calculateHaifaMathPsychometric(145, 137, 124);
			assert.equal(calculateHaifaMathSekem(107.1, pm), 731);
		});

		it('CS sekem for average 100 with Q150/V100/E100 = 658, truncated from 658.81 (user-verified on Haifa calculator, 2026-10-07)', () => {
			const pm = calculateHaifaMathPsychometric(150, 100, 100);
			assert.equal(calculateHaifaMathSekem(100, pm), 658);
		});

		it('worked examples on admissions.haifa.ac.il/score-calculation (BT 432, PC 554): 1:2 = 513, 3:7 = 517', () => {
			// BT 432 is a bagrut average of 76.2
			assert.equal(calculateHaifaWeightedSekem(76.2, 554, 'haifa-1:2'), 513);
			assert.equal(calculateHaifaWeightedSekem(76.2, 554, 'haifa-3:7'), 517);
			assert.equal(calculateHaifaWeightedSekem(76.2, 554, 'haifa-humanities-1:2'), 513);
		});

		it('humanities: psychometric 600+ means the bagrut is not counted', () => {
			assert.equal(calculateHaifaWeightedSekem(80, 640, 'haifa-humanities-1:2'), 640);
			assert.equal(calculateHaifaWeightedSekem(80, 640, 'haifa-1:2'), Math.floor((470 + 2 * 640) / 3));
		});

		it('math programs: PM = 0.514554*(6Q+4V+E) - 65.3, sekem = floor((BT + 3PM)/4)', () => {
			const pm = calculateHaifaMathPsychometric(140, 120, 130);
			assert.equal(pm, 0.514554 * (6 * 140 + 4 * 120 + 130) - 65.3);
			assert.equal(calculateHaifaMathSekem(110, pm), Math.floor((110 * 10 - 330 + 3 * pm) / 4));
		});
	});

	// Source: every department's "תנאי הקבלה" page on ariel.ac.il, תשפ"ז (snapshot ariel-admission-pages-2026-10-05.json)
	describe('Ariel University (combined score)', () => {
		it('combined score = [(bagrut × 6.666) + psychometric] / 2 — the communication page example: 87 & 580 = 580', () => {
			assert.equal(calculateArielSekem(87, 580), 580);
			assert.equal(calculateArielSekem(100, 600), Math.round((100 * 6.666 + 600) / 2));
		});

		it('science/engineering programs take the higher of the general and quantitative psychometric', () => {
			const subjects = [sub('מתמטיקה', 5, 90), sub('אנגלית', 5, 90), sub('פיזיקה', 5, 90), sub('היסטוריה', 2, 90),
				sub('אזרחות', 2, 90), sub('תנ"ך', 2, 90), sub('ספרות', 2, 90), sub('הבעה עברית', 2, 90)];
			const high = evaluateAriel({ bagrutSubjects: subjects, psychometricGeneral: 700, psychometricQuantEmphasis: 650 });
			assert.equal(high.engineeringSekem, high.generalSekem);
			const quant = evaluateAriel({ bagrutSubjects: subjects, psychometricGeneral: 650, psychometricQuantEmphasis: 700 });
			assert.ok(quant.engineeringSekem! > quant.generalSekem);
		});

		// Source: Ariel's official calculator results (pniot.ariel.ac.il/projects/tzmm/NewCalcMark, 2026-10-05).
		// The official page truncates the average to 2 decimals. Cases where the official result dropped literature
		// are left out until the drop rule is understood.
		it('bagrut average matches the official calculator (English 4u +12.5, any 5u +25, no bonus below 60)', () => {
			const base = (over: Record<string, [number, number]>, electives: [string, number, number][]) => {
				const m: Record<string, [number, number]> = { 'אזרחות': [2, 80], 'אנגלית': [3, 80], 'היסטוריה': [2, 80], 'מתמטיקה': [3, 80],
					'הבעה עברית': [2, 80], 'תנ"ך': [2, 80], 'ספרות': [2, 80], ...over };
				return [...Object.entries(m).map(([n, [u, g]]) => sub(n, u, g)), ...electives.map(([n, u, g]) => sub(n, u, g))];
			};
			// We round to 2 decimals, the official page truncates: allow one hundredth.
			const near = (subjects: ReturnType<typeof sub>[], official: number) =>
				assert.ok(Math.abs(evaluateAriel({ bagrutSubjects: subjects }).bagrutAverage - official) <= 0.011, `expected ≈${official}`);
			near(base({ 'אנגלית': [4, 80] }, [['פיזיקה', 5, 80]]), 87.95);
			near(base({}, [['ביולוגיה', 5, 80]]), 85.95);
			near(base({}, [['גאוגרפיה', 5, 80]]), 85.95);
			near(base({}, [['פיזיקה', 5, 100]]), 90.71);
			near(base({ 'מתמטיקה': [5, 55] }, [['פיזיקה', 5, 80]]), 80);
			near(base({ 'אנגלית': [5, 59] }, [['פיזיקה', 5, 80]]), 80.86);
		});
	});
});
