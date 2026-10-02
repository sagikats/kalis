/**
 * HUJI thresholds imported from the official spreadsheet (src/data/sources/huji-thresholds-2026-10-02.csv)
 * and the per-program scoring rules they imply.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { evaluateHuji, hujiScoreTo800, calculateHujiWeightedScoreFor } from '../../calculators/huji';
import { selectProgramSekem } from '../../calculators';

const huji = (academicData as any[]).find((i) => i.id === 'inst-1').programs as any[];
const byId = (id: string) => huji.find((p) => p.id === id);

describe('HUJI official thresholds', () => {
	it('every sourced program stores its threshold on the 800 scale via the exact HUJI map', () => {
		const sourced = huji.filter((p) => p.officialThreshold !== undefined);
		assert.ok(sourced.length >= 90, `expected ~95 sourced programs, got ${sourced.length}`);
		for (const p of sourced) {
			assert.equal(p.admissionThreshold, hujiScoreTo800(p.officialThreshold), p.fieldOfStudy);
			assert.ok(p.thresholdSource?.includes('docs.google.com'), p.fieldOfStudy);
			assert.ok(['general', 'management', 'engineering', 'quantitative'].includes(p.relevantSekemType), p.fieldOfStudy);
		}
	});

	it('spot checks against the official sheet', () => {
		assert.equal(byId('prog-inst-1-37').officialThreshold, 23.75); // מדעי המחשב
		assert.equal(byId('prog-inst-1-37').relevantSekemType, 'engineering'); // 50/50, quant emphasis
		assert.equal(byId('prog-huji-5').officialThreshold, 25.186); // רפואה
		assert.equal(byId('prog-huji-5').relevantSekemType, 'quantitative'); // 30/70, general
		assert.equal(byId('prog-inst-1-48').relevantSekemType, 'general'); // מחשבת ישראל — no longer "engineering"
	});

	it("profile A is admitted to CS (matches HUJI's own admission checker)", () => {
		const res = evaluateHuji({
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
				{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
				{ name: 'הבעה עברית', units: 2, grade: 84 }
			],
			psychometricGeneral: 720,
			psychometricQuantEmphasis: 740,
			psychometricVerbalEmphasis: 704
		});
		const cs = byId('prog-inst-1-37');
		assert.ok(selectProgramSekem(res, cs.relevantSekemType, 'huji') >= cs.admissionThreshold);
	});
});

describe('HUJI scoring rule sets', () => {
	const subjects = [
		{ name: 'מתמטיקה', units: 5, grade: 90 }, { name: 'אנגלית', units: 5, grade: 90 },
		{ name: 'היסטוריה', units: 2, grade: 90 }, { name: 'אזרחות', units: 2, grade: 90 },
		{ name: 'הבעה עברית', units: 2, grade: 90 }, { name: 'ספרות', units: 2, grade: 90 },
		{ name: 'תנ"ך', units: 2, grade: 90 }, { name: 'גיאוגרפיה', units: 3, grade: 90 }
	];
	const res = evaluateHuji({ bagrutSubjects: subjects, psychometricGeneral: 650, psychometricQuantEmphasis: 700, psychometricVerbalEmphasis: 760 });
	const avg = res.bagrutAverage;

	it('engineering = 50/50 with quant emphasis only', () => {
		assert.equal(res.engineeringSekem, hujiScoreTo800(calculateHujiWeightedScoreFor(avg, 700, '50/50')));
	});
	it('quantitative (medicine) = 30/70 with the multi-domain score only', () => {
		assert.equal(res.quantitativeSekem, hujiScoreTo800(calculateHujiWeightedScoreFor(avg, 650, '30/70')));
	});
	it('management ignores the verbal-emphasis score; general may use it', () => {
		const withVerbal = hujiScoreTo800(calculateHujiWeightedScoreFor(avg, 760, '30/70'));
		assert.ok(res.generalSekem >= withVerbal);
		assert.ok((res.managementSekem ?? 0) < withVerbal);
	});
});
