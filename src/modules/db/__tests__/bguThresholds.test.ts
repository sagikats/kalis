/**
 * BGU thresholds imported from BGU's official "חתכי קבלה" service (סתו תשפ"ז)
 * (snapshot: src/data/sources/bgu-thresholds-2026-10-02.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';

const bgu = (academicData as any[]).find((i) => i.id === 'inst-3').programs as any[];
const byId = (id: string) => bgu.find((p) => p.id === id);

describe('BGU official thresholds', () => {
	it('every sourced program carries the sekem type from the official label and a source', () => {
		const sourced = bgu.filter((p) => p.officialThreshold !== undefined);
		assert.ok(sourced.length >= 175, `expected ~181 sourced programs, got ${sourced.length}`);
		for (const p of sourced) {
			assert.equal(p.admissionThreshold, p.officialThreshold, p.fieldOfStudy);
			assert.ok(p.thresholdSource?.startsWith('https://apps4cloud.bgu.ac.il/calcprod/'), p.fieldOfStudy);
			assert.ok(['general', 'quantitative', 'engineering', 'psychometric'].includes(p.relevantSekemType), p.fieldOfStudy);
		}
	});

	it('spot checks against the official service', () => {
		const cs = byId('prog-bgu-77'); // מדעי המחשב ראשי — סכם כמותי 720 ובנוסף 600
		assert.equal(cs.admissionThreshold, 720);
		assert.equal(cs.relevantSekemType, 'quantitative');
		assert.equal(cs.minPsychometricFloor, 600);
		const ee = byId('prog-bgu-150'); // הנדסת חשמל ומחשבים — סכם הנדסה 547 ובנוסף 600
		assert.equal(ee.admissionThreshold, 547);
		assert.equal(ee.relevantSekemType, 'engineering');
		const psy = byId('prog-bgu-12'); // פסיכולוגיה דו מחלקתי — סכם 650 ובנוסף 650, בגרות בלבד 113
		assert.equal(psy.admissionThreshold, 650);
		assert.equal(psy.relevantSekemType, 'general');
		assert.equal(psy.directBagrutMinAverage, 113);
		const se = byId('prog-bgu-175'); // הנדסת תכנה — scored by the quantitative sekem, not the engineering one
		assert.equal(se.relevantSekemType, 'quantitative');
		assert.equal(se.admissionThreshold, 720);
	});
});
