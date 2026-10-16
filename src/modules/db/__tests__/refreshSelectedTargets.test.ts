/**
 * Selected programs are stored as snapshots in localStorage; refreshSelectedTargets re-reads them from the catalog so
 * returning users see current thresholds (the stale-snapshot bug noted in the deploy log).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { refreshSelectedTargets } from '../refreshSelectedTargets';

const catalog = [
	{
		id: 'inst-6',
		name: 'אוניברסיטת תל אביב',
		programs: [
			{ id: 'prog-a', fieldOfStudy: 'מדעי המחשב', admissionThreshold: 720 },
			{ id: 'prog-b', fieldOfStudy: 'פסיכולוגיה', admissionThreshold: 680, notOffered: { note: 'x', source: 'y' } }
		]
	}
];

const stored = [
	{ institutionId: 'inst-6', institutionName: 'תל אביב (ישן)', calculatorId: 'tau', program: { id: 'prog-a', fieldOfStudy: 'מדעי המחשב', admissionThreshold: 700 } },
	{ institutionId: 'inst-6', institutionName: 'תל אביב', calculatorId: 'tau', program: { id: 'prog-gone', fieldOfStudy: 'תוכנית שהוסרה', admissionThreshold: 600 } }
];

describe('refreshSelectedTargets', () => {
	it('replaces a stored snapshot with the current catalog program', () => {
		const [cs] = refreshSelectedTargets(stored as any[], catalog as any[]);
		assert.equal(cs.program.admissionThreshold, 720);
		assert.equal(cs.institutionName, 'אוניברסיטת תל אביב');
		assert.equal(cs.calculatorId, 'tau', 'fields outside the catalog are kept');
	});

	it('keeps a program that is no longer in the catalog instead of dropping it', () => {
		const result = refreshSelectedTargets(stored as any[], catalog as any[]);
		assert.equal(result.length, 2);
		assert.equal(result[1].program.id, 'prog-gone');
		assert.equal(result[1].program.admissionThreshold, 600);
	});

	it('carries catalog flags such as notOffered onto the refreshed program', () => {
		const picked = [{ institutionId: 'inst-6', institutionName: 'תל אביב', calculatorId: 'tau', program: { id: 'prog-b', fieldOfStudy: 'פסיכולוגיה' } }];
		const [p] = refreshSelectedTargets(picked as any[], catalog as any[]);
		assert.ok((p.program as any).notOffered);
	});

	it('returns the stored list itself while the catalog is still loading', () => {
		assert.equal(refreshSelectedTargets(stored as any[], []), stored);
	});
});
