import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUniversityBookmarklet } from '../bookmarkletGenerator';

describe('Bookmarklet Generator (Zero-Install AutoFill)', () => {
	it('generates a valid javascript: bookmarklet URL with embedded payload', () => {
		const payload = {
			institutionId: 'technion',
			institutionName: 'הטכניון',
			calculatorUrl: 'https://admissions.technion.ac.il/calculator/',
			psychometricScore: 740,
			targetSekem: 91.5,
			targetBagrutAverage: 114.2,
			subjects: [
				{ name: 'מתמטיקה', units: 5, grade: 95 },
				{ name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'פיזיקה', units: 5, grade: 90 }
			]
		};

		const bm = generateUniversityBookmarklet(payload);

		assert.ok(bm.startsWith('javascript:'), 'Must start with javascript: scheme');
		assert.ok(bm.includes('technion'), 'Must include institution reference');
		assert.ok(decodeURIComponent(bm).includes('740'), 'Must contain psychometric score');
		assert.ok(decodeURIComponent(bm).includes('114.2'), 'Must contain target average');
		assert.ok(decodeURIComponent(bm).includes('מתמטיקה'), 'Must contain subject names');
	});

	it('handles TAU payload with 5u math and physics correctly', () => {
		const payload = {
			institutionId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			calculatorUrl: 'https://go.tau.ac.il/he/calculator',
			psychometricScore: 714,
			targetSekem: 719,
			targetBagrutAverage: 112.5,
			subjects: [
				{ name: 'מתמטיקה', units: 5, grade: 90 },
				{ name: 'פיזיקה', units: 5, grade: 88 }
			]
		};

		const bm = generateUniversityBookmarklet(payload);
		const decoded = decodeURIComponent(bm);

		assert.ok(decoded.includes('tau.ac.il'), 'Must handle TAU specific routing');
		assert.ok(decoded.includes('714'), 'Must include 714 psychometric');
		assert.ok(decoded.includes('112.5'), 'Must include 112.5 Bagrut average');
	});
});
