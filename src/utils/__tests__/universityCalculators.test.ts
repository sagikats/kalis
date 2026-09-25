import test from 'node:test';
import assert from 'node:assert/strict';
import {
	getUniversityCalculator,
	UNIVERSITY_CALCULATORS,
	formatVerificationClipboardText,
	VerificationDataSummary
} from '../universityCalculators';

test('University Calculators Directory & Lookup', async (t) => {
	await t.test('resolves all 8 official universities by ID', () => {
		const expectedIds = ['technion', 'tau', 'huji', 'bgu', 'bar_ilan', 'haifa', 'ariel', 'reichman'];
		for (const id of expectedIds) {
			const info = getUniversityCalculator(id);
			assert.ok(info, `Expected calculator info for ${id}`);
			assert.ok(info.calculatorUrl.startsWith('https://'), `Expected https URL for ${id}`);
			assert.ok(info.name.length > 0, `Expected name for ${id}`);
			assert.ok(info.shortName.length > 0, `Expected shortName for ${id}`);
		}
	});

	await t.test('resolves institutions by Hebrew name fragments', () => {
		assert.equal(getUniversityCalculator('הטכניון - מכון טכנולוגי לישראל').id, 'technion');
		assert.equal(getUniversityCalculator('אוניברסיטת תל אביב').id, 'tau');
		assert.equal(getUniversityCalculator('האוניברסיטה העברית בירושלים').id, 'huji');
		assert.equal(getUniversityCalculator('אוניברסיטת בן-גוריון בנגב').id, 'bgu');
		assert.equal(getUniversityCalculator('אוניברסיטת בר-אילן').id, 'bar_ilan');
		assert.equal(getUniversityCalculator('אוניברסיטת חיפה').id, 'haifa');
		assert.equal(getUniversityCalculator('אוניברסיטת אריאל בשומרון').id, 'ariel');
		assert.equal(getUniversityCalculator('אוניברסיטת רייכמן').id, 'reichman');
	});

	await t.test('formats clean verification clipboard summary text', () => {
		const sampleData: VerificationDataSummary = {
			institutionName: 'הטכניון',
			programName: 'מדעי המחשב',
			trackTitle: 'המסלול הממוקד: שיפור מתמטיקה בלבד',
			targetSekem: 91.45,
			threshold: 89.0,
			isTechnion: true,
			psychometricScore: 714,
			isPsychUpgraded: false,
			subjects: [
				{ name: 'מתמטיקה', units: 5, grade: 95, isUpgraded: true, originalGrade: 80, originalUnits: 4 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'ספרות עברית', units: 5, grade: 92, isNew: true }
			],
			calculatorUrl: 'https://admissions.technion.ac.il/calculator/'
		};

		const formatted = formatVerificationClipboardText(sampleData);
		assert.ok(formatted.includes('אימות חישוב סכם מול הטכניון'));
		assert.ok(formatted.includes('91.45'));
		assert.ok(formatted.includes('714'));
		assert.ok(formatted.includes('מתמטיקה: 5 יח״ל — ציון 95'));
		assert.ok(formatted.includes('שודרג מ-80'));
		assert.ok(formatted.includes('מקצוע חדש מוצע'));
		assert.ok(formatted.includes('https://admissions.technion.ac.il/calculator/'));
	});
});
