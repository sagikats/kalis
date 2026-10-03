/**
 * The step-4 "מסלולים עוקפים" tabs: every official route of a program other than the sekem, described for
 * one applicant with a status.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { describeOfficialRoutes } from '../officialRoutes';

const program = (instId: string, id: string) =>
	(academicData as any[]).find((i) => i.id === instId).programs.find((p: any) => p.id === id);

const A = [
	{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
	{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
	{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
	{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
	{ name: 'הבעה עברית', units: 2, grade: 84 }
];

describe('describeOfficialRoutes', () => {
	it('lists every Technion route of mechanical engineering, fitting ones first', () => {
		const routes = describeOfficialRoutes(program('inst-48', 'prog-technion-24').admissionRoutes, {
			subjects: A, bagrutAverage: 111.1, psychometric: 673, userSekem: 87, threshold: 92
		});
		assert.deepEqual(routes.map((r) => r.id).sort(), ['gesher', 'math-exam', 'promotion', 'short-track'].sort());
		assert.equal(routes[0].status, 'fits'); // math exam: eligible, a reachable exam score
		assert.equal(routes.find((r) => r.id === 'gesher')!.status, 'not_met'); // 5 points short, more than 2
		for (const r of routes) assert.ok(r.conditions.length > 0 && r.headline, r.id);
	});

	it('covers bagrut-only and psychometric-only routes too (TAU humanities)', () => {
		const routes = describeOfficialRoutes(program('inst-6', 'prog-tau-0618-27').admissionRoutes, {
			subjects: A, bagrutAverage: 98, psychometric: 470, userSekem: 480, threshold: 500
		});
		const byId = Object.fromEntries(routes.map((r) => [r.id, r]));
		assert.equal(byId['psychometric-only'].status, 'fits'); // 470 ≥ 450
		assert.equal(byId['bagrut-only'].status, 'close'); // 98 vs 102
		assert.match(byId['bagrut-only'].headline, /חסרות 4 נקודות/);
	});

	it('returns nothing for a program without special routes', () => {
		assert.deepEqual(describeOfficialRoutes(undefined, { subjects: A, bagrutAverage: 100, psychometric: 600, userSekem: 600, threshold: 650 }), []);
	});

	it('writes a condition with no grade floor as "at least N units"', () => {
		const g = describeOfficialRoutes(program('inst-48', 'prog-technion-24').admissionRoutes, {
			subjects: A, bagrutAverage: 111.1, psychometric: 673, userSekem: 87, threshold: 92
		}).find((r) => r.id === 'gesher')!;
		assert.ok(g.conditions.includes('אנגלית 4 יח״ל לפחות'));
	});
});
