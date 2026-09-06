/**
 * Automated Integration Test Suite for Subagent 4: Backend API Endpoints
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { GET as healthGET } from '../../../app/api/health/route';
import { POST as calculatePOST } from '../../../app/api/calculate/route';
import { GET as programsGET } from '../../../app/api/programs/route';
import { POST as tracksPOST } from '../../../app/api/tracks/generate/route';
import { dbRepository } from '../../db';

describe('Subagent 4: Backend API Endpoints & Route Handlers', () => {
	it('GET /api/health: Returns system status and 7 institutions', async () => {
		const res = await healthGET();
		assert.equal(res.status, 200);

		const data = await res.json();
		assert.equal(data.status, 'healthy');
		assert.equal(data.institutionsCount, 7);
		assert.ok(data.modules.includes('calculators'));
	});

	it('POST /api/calculate: Multi-institution Sekem calculation', async () => {
		const req = new NextRequest('http://localhost:3000/api/calculate', {
			method: 'POST',
			body: JSON.stringify({
				profile: {
					bagrutSubjects: [
						{ name: 'מתמטיקה', units: 5, grade: 90 },
						{ name: 'אנגלית', units: 5, grade: 92 },
						{ name: 'פיזיקה', units: 5, grade: 88 }
					],
					mathUnits: 5,
					mathGrade: 90,
					physicsUnits: 5,
					physicsGrade: 88,
					psychometricGeneral: 700,
					psychometricQuant: 140
				}
			})
		});

		const res = await calculatePOST(req);
		assert.equal(res.status, 200);

		const data = await res.json();
		assert.equal(data.success, true);
		assert.equal(data.results.length, 7);

		const technionRes = data.results.find((r: any) => r.institutionId === 'technion');
		assert.ok(technionRes);
		assert.ok(technionRes.generalSekem > 80);
	});

	it('POST /api/calculate: Rejects invalid grade > 100 with 400 Bad Request', async () => {
		const req = new NextRequest('http://localhost:3000/api/calculate', {
			method: 'POST',
			body: JSON.stringify({
				profile: {
					bagrutSubjects: [{ name: 'מתמטיקה', units: 5, grade: 115 }] // Invalid grade!
				}
			})
		});

		const res = await calculatePOST(req);
		assert.equal(res.status, 400);

		const data = await res.json();
		assert.equal(data.success, false);
		assert.ok(data.error);
	});

	it('GET /api/programs: Filters by institution and search query', async () => {
		const req = new NextRequest('http://localhost:3000/api/programs?institutionId=technion&limit=10');
		const res = await programsGET(req);
		assert.equal(res.status, 200);

		const data = await res.json();
		assert.equal(data.success, true);
		assert.ok(data.programs.length > 0);
		data.programs.forEach((p: any) => {
			assert.equal(p.institutionId, 'technion');
		});
	});

	it('POST /api/tracks/generate: Generates Direct Bagrut Track for HUJI Psychology', async () => {
		// First find HUJI psychology program
		const searchRes = dbRepository.searchPrograms({
			institutionId: 'huji',
			text: 'פסיכולוגיה'
		});
		assert.ok(searchRes.programs.length > 0);
		const psychProgram = searchRes.programs[0];

		const req = new NextRequest('http://localhost:3000/api/tracks/generate', {
			method: 'POST',
			body: JSON.stringify({
				programId: psychProgram.id,
				profile: {
					userId: 'itai_test',
					bagrutSubjects: [
						{ name: 'מתמטיקה', units: 4, grade: 88 },
						{ name: 'אנגלית', units: 5, grade: 92 },
						{ name: 'ספרות עברית', units: 5, grade: 92 },
						{ name: 'היסטוריה', units: 2, grade: 85 },
						{ name: 'תנ״ך', units: 2, grade: 85 },
						{ name: 'אזרחות', units: 2, grade: 85 },
						{ name: 'הבעה עברית', units: 2, grade: 86 }
					],
					mathUnits: 4,
					mathGrade: 88,
					psychometricGeneral: 0,
					hasTakenPsychometric: false
				},
				preferences: {
					weeklyAvailabilityHours: 'full_30_plus'
				}
			})
		});

		const res = await tracksPOST(req);
		assert.equal(res.status, 200);

		const data = await res.json();
		assert.equal(data.success, true);
		assert.equal(data.program.id, psychProgram.id);
		assert.equal(data.solution.hasDirectBagrutOption, true);

		const directTrack = data.solution.tracks.find((t: any) => t.id === 'track-direct-bagrut');
		assert.ok(directTrack, 'Direct bagrut track must be present');
		assert.equal(directTrack.targetPsychometric, undefined);
		assert.ok(directTrack.targetBagrutAverage >= 105.0);
	});

	it('POST /api/tracks/generate: Returns 404 for unknown program ID', async () => {
		const req = new NextRequest('http://localhost:3000/api/tracks/generate', {
			method: 'POST',
			body: JSON.stringify({
				programId: 'unknown_fake_program_id_9999',
				profile: {
					bagrutSubjects: [{ name: 'מתמטיקה', units: 5, grade: 90 }]
				}
			})
		});

		const res = await tracksPOST(req);
		assert.equal(res.status, 404);

		const data = await res.json();
		assert.equal(data.success, false);
		assert.ok(data.error.includes('לא נמצא'));
	});
});
