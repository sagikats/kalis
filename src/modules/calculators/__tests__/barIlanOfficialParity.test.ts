/**
 * Bar-Ilan admission score vs. the official calculator (shoham.biu.ac.il/kabala, 2026-10-05).
 * Fixtures: results the official calculator showed for one track per scoring group, across sweeps of each input.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import { calculateBarIlanScores, type BarIlanScores } from '../barIlan';

interface Case {
	label: string;
	group: keyof BarIlanScores;
	track: string;
	input: Parameters<typeof calculateBarIlanScores>[0];
	official: number;
}

const { cases } = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/biu-official/cases.json'), 'utf-8')) as { cases: Case[] };

describe('Bar-Ilan score matches the official calculator', () => {
	it(`reproduces all ${cases.length} captured results exactly`, () => {
		const misses = cases
			.map((c) => ({ c, got: calculateBarIlanScores(c.input)[c.group] }))
			.filter(({ c, got }) => Math.abs(got - c.official) > 1e-9)
			.map(({ c, got }) => `${c.label} / ${c.track}: ${got} ≠ ${c.official}`);
		assert.deepEqual(misses, []);
	});

	it('no psychometric score → no admission score', () => {
		const s = calculateBarIlanScores({ bagrutAverage: 110, psychometric: 0, quant: 0, mathUnits: 5, mathGrade: 90 });
		assert.deepEqual(s, { general: 0, sciences: 0, engineering: 0, software: 0 });
	});
});
