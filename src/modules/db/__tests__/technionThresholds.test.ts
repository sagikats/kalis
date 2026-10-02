/**
 * Technion thresholds from the official admission-routes table (src/data/sources/technion-thresholds-2026-10.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { calculateTechnionSekem } from '../../calculators/technion';

const technion = (academicData as any[]).find((i) => i.id === 'inst-48').programs as any[];
const byId = (id: string) => technion.find((p) => p.id === id);

describe('Technion official thresholds', () => {
	it('sourced programs are on the Technion 0–100 sekem scale with a source', () => {
		const sourced = technion.filter((p) => p.officialThreshold !== undefined);
		assert.ok(sourced.length >= 46);
		for (const p of sourced) {
			assert.equal(p.admissionThreshold, p.officialThreshold, p.fieldOfStudy);
			assert.ok(p.thresholdSource?.startsWith('https://admissions.technion.ac.il/'), p.fieldOfStudy);
			assert.equal(p.relevantSekemType, 'technion');
		}
		assert.equal(byId('prog-technion-33').admissionThreshold, 91); // מדעי המחשב
		assert.equal(byId('prog-technion-19').admissionThreshold, 94); // הנדסת חשמל
		assert.ok(byId('prog-technion-36').thresholdSource.includes('מו"ר')); // medicine: MOR invitation threshold
	});

	it("profile A's user-verified sekem (90.6) (avg 111.1, psych 720) is just below CS (91) and above industrial engineering (89)", () => {
		const s = calculateTechnionSekem(111.1, 720);
		assert.equal(Math.round(s * 10) / 10, 90.6);
		assert.ok(s < byId('prog-technion-33').admissionThreshold);
		assert.ok(s >= byId('prog-technion-29').admissionThreshold); // הנדסת תעשיה וניהול 89
	});
});
