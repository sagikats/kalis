import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../../../app/api/calculate/route';
import { CalculateSekemRequestSchema, calculatorInputFromProfile } from '../../db/validation';
import { calculateAllInstitutions, calculateInstitution, selectProgramSekem } from '../../calculators';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

const subjects = [
	{ name: 'מתמטיקה', units: 5, grade: 92 },
	{ name: 'אנגלית', units: 5, grade: 90 },
	{ name: 'פיזיקה', units: 5, grade: 87 },
	{ name: 'היסטוריה', units: 2, grade: 85 },
	{ name: 'אזרחות', units: 2, grade: 85 },
	{ name: 'תנ"ך', units: 2, grade: 80 },
	{ name: 'ספרות', units: 2, grade: 82 },
	{ name: 'הבעה עברית', units: 2, grade: 85 }
];
const profile = {
	bagrutSubjects: subjects,
	mathUnits: 5, mathGrade: 92, physicsUnits: 5, physicsGrade: 87,
	psychometricGeneral: 640, psychometricQuant: 115, psychometricVerbal: 125, psychometricEnglish: 120,
	psychometricQuantEmphasis: 780, psychometricVerbalEmphasis: 720,
	hasTakenPsychometric: true
};
async function request(payload: unknown) {
	return POST(new NextRequest('http://offline.invalid/api/calculate', { method: 'POST', body: JSON.stringify(payload) }));
}
function projected(p: unknown) {
	return calculatorInputFromProfile(CalculateSekemRequestSchema.parse({ profile: p }).profile);
}

describe('Calculation request preserves supplied scores in the actual calculator path', () => {
	it('preserves actual emphasis rather than stripping or deriving it', () => {
		const input = projected(profile);
		assert.equal(input.psychometricQuantEmphasis, 780);
		assert.equal(input.psychometricVerbalEmphasis, 720);
		assert.notEqual(calculateInstitution('huji', input).generalSekem,
			calculateInstitution('huji', { ...input, psychometricQuantEmphasis: undefined, psychometricVerbalEmphasis: undefined }).generalSekem);
	});
	it('selected API results equal real calculator results and UI scores for a complete consistent profile', async () => {
		const ids = ['huji', 'bgu', 'technion'];
		const res = await request({ profile, institutionIds: ids });
		assert.equal(res.status, 200);
		const data = await res.json();
		assert.deepEqual(data.results, JSON.parse(JSON.stringify(ids.map(id => calculateInstitution(id, projected(profile))))));
		const ui = calculateMultiInstitutionSekem(profile, ids);
		for (const result of data.results) {
			const u = ui.find(x => x.institutionId === result.institutionId)!;
			assert.equal(result.bagrutAverage, u.bagrutAverage);
			assert.equal(result.generalSekem, u.generalSekem);
			assert.equal(result.engineeringSekem, u.engineeringSekem);
			assert.equal(result.quantitativeSekem, u.quantitativeSekem);
			assert.equal(result.officialScore, u.officialScore);
		}
	});
	it('all and selected dispatch retain general PET for psychometric-only selection', async () => {
		const all = calculateAllInstitutions(projected(profile));
		for (const result of all) {
			assert.deepEqual(result, calculateInstitution(result.institutionId, projected(profile)));
			assert.equal(result.psychometricGeneral, 640);
			assert.equal(selectProgramSekem(result, 'psychometric'), 640);
		}
		const res = await request({ profile });
		assert.equal(res.status, 200);
		assert.deepEqual((await res.json()).results, JSON.parse(JSON.stringify(all)));
	});
	it('missing scores and math stay absent in API projection; no default 4 units / 80 or emphasis', () => {
		const input = projected({ bagrutSubjects: subjects });
		for (const key of ['mathUnits', 'mathGrade', 'physicsUnits', 'physicsGrade', 'psychometricGeneral', 'psychometricQuant', 'psychometricVerbal', 'psychometricEnglish', 'psychometricQuantEmphasis', 'psychometricVerbalEmphasis']) {
			assert.equal(input[key as keyof typeof input], undefined, key);
		}
	});
	it('missing emphasis remains absent even when sections/general are supplied', () => {
		const { psychometricQuantEmphasis, psychometricVerbalEmphasis, ...withoutEmphasis } = profile;
		const input = projected(withoutEmphasis);
		assert.equal(input.psychometricQuantEmphasis, undefined);
		assert.equal(input.psychometricVerbalEmphasis, undefined);
		assert.equal(input.psychometricQuant, 115);
	});
	it('accepts actual score endpoints and the existing zero general/section missing sentinel', () => {
		for (const key of ['psychometricGeneral', 'psychometricQuantEmphasis', 'psychometricVerbalEmphasis']) {
			for (const score of [200, 800]) assert.equal(CalculateSekemRequestSchema.safeParse({ profile: { ...profile, [key]: score } }).success, true, `${key}:${score}`);
		}
		for (const key of ['psychometricQuant', 'psychometricVerbal', 'psychometricEnglish']) {
			for (const score of [0, 50, 150]) assert.equal(CalculateSekemRequestSchema.safeParse({ profile: { ...profile, [key]: score } }).success, true, `${key}:${score}`);
		}
		assert.equal(CalculateSekemRequestSchema.safeParse({ profile: { ...profile, psychometricGeneral: 0 } }).success, true);
	});
	it('rejects cross-scale, fractional and malformed emphasis without invoking calculators', async () => {
		for (const key of ['psychometricQuantEmphasis', 'psychometricVerbalEmphasis']) {
			for (const score of [0, 150, 199, 801, 640.5, '700', true, null, Infinity, NaN]) {
				assert.equal(CalculateSekemRequestSchema.safeParse({ profile: { ...profile, [key]: score } }).success, false, `${key}:${String(score)}`);
				assert.equal((await request({ profile: { ...profile, [key]: score } })).status, 400);
			}
		}
	});
	it('rejects invalid positive sections/general instead of accepting arbitrary numbers', async () => {
		for (const key of ['psychometricQuant', 'psychometricVerbal', 'psychometricEnglish']) {
			for (const score of [1, 49, 151, 700, 75.5, '100', true]) {
				assert.equal((await request({ profile: { ...profile, [key]: score } })).status, 400, `${key}:${String(score)}`);
			}
		}
		for (const score of [1, 199, 801, 640.5]) assert.equal((await request({ profile: { ...profile, psychometricGeneral: score } })).status, 400);
	});
});
