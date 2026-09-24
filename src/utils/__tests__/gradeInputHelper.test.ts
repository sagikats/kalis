import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanGradeInput, cleanNumberInput } from '../gradeInputHelper';

describe('Grade Input Helper (cleanGradeInput)', () => {
	it('handles empty, null, and non-numeric inputs gracefully', () => {
		assert.equal(cleanGradeInput(''), '');
		assert.equal(cleanGradeInput(undefined), '');
		assert.equal(cleanGradeInput(null), '');
		assert.equal(cleanGradeInput('abc'), '');
		assert.equal(cleanGradeInput('  '), '');
	});

	it('allows normal single and double digit grades', () => {
		assert.equal(cleanGradeInput('0'), 0);
		assert.equal(cleanGradeInput('5'), 5);
		assert.equal(cleanGradeInput('05'), 5);
		assert.equal(cleanGradeInput('50'), 50);
		assert.equal(cleanGradeInput('85'), 85);
		assert.equal(cleanGradeInput('99'), 99);
	});

	it('allows exactly 100 without truncation', () => {
		assert.equal(cleanGradeInput('100'), 100);
	});

	it('DOES NOT round up to 100 when > 100 is typed; strictly truncates to first two digits', () => {
		// When user has 85 and types 9 (raw "859"), it must stay 85 and NOT turn into 100!
		assert.equal(cleanGradeInput('859'), 85);

		// When user has 10 and types 5 (raw "105"), it must stay 10 and NOT turn into 100!
		assert.equal(cleanGradeInput('105'), 10);

		// When user types 123
		assert.equal(cleanGradeInput('123'), 12);

		// When user types 999
		assert.equal(cleanGradeInput('999'), 99);

		// When user types 1000
		assert.equal(cleanGradeInput('1000'), 10);
	});

	it('strips non-digits correctly while preserving first two digits', () => {
		assert.equal(cleanGradeInput('92a'), 92);
		assert.equal(cleanGradeInput('a92'), 92);
		assert.equal(cleanGradeInput('8 5'), 85);
	});

	it('cleanNumberInput delegates to cleanGradeInput when maxVal is 100', () => {
		assert.equal(cleanNumberInput('859', 0, 100), 85);
		assert.equal(cleanNumberInput('105', 0, 100), 10);
		assert.equal(cleanNumberInput('100', 0, 100), 100);
	});

	it('cleanNumberInput handles psychometric scores up to 800', () => {
		assert.equal(cleanNumberInput('720', 0, 800), 720);
		assert.equal(cleanNumberInput('800', 0, 800), 800);
		assert.equal(cleanNumberInput('850', 0, 800), 800);
	});
});
