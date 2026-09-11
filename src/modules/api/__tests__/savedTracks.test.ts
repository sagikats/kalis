/**
 * Saved Tracks API Integration Tests
 * Verifies saving, retrieving enriched tracks, and deleting saved tracks
 */

import { test, describe, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { dbRepository } from '../../db/repository';
import { prisma } from '../../../lib/prisma';
import { POST as savePostHandler, GET as saveGetHandler, DELETE as saveDeleteHandler } from '../../../app/api/tracks/save/route';
import { NextRequest } from 'next/server';

describe('Saved Tracks API & Storage Engine', () => {
	const testEmail = `saved_tracks_test_${Date.now()}@kalis.test`;
	const testPassword = 'TestPassword123!';
	const testName = 'בדיקת מסלולים שמורים';
	let createdUserId: string;

	before(async () => {
		await dbRepository.ensureSyncedFromSQLite();
		const user = await dbRepository.registerUserAsync({
			name: testName,
			email: testEmail,
			password: testPassword
		});
		createdUserId = user.id;
	});

	after(async () => {
		if (createdUserId) {
			await prisma.savedTrack.deleteMany({ where: { userId: createdUserId } });
			await prisma.userAcademicProfile.deleteMany({ where: { userId: createdUserId } });
			await prisma.userPreferences.deleteMany({ where: { userId: createdUserId } });
			await prisma.user.deleteMany({ where: { id: createdUserId } });
		}
		await prisma.$disconnect();
	});

	test('1. POST /api/tracks/save saves a track and returns candidate number', async () => {
		const trackPayload = {
			id: 'track-fast-test',
			title: 'המסלול הממוקד',
			badge: 'הכי מהיר',
			badgeColor: '#FAF4E8',
			targetSekem: 91.0,
			targetPsychometric: 751,
			currentPsychometric: 708,
			targetBagrutAverage: 107.3,
			currentBagrutAverage: 104.2,
			strategyDescription: 'שדרוג ממוקד של פיזיקה ופסיכומטרי',
			estimatedWeeks: 12,
			weeklyHours: 20,
			feasibility: 'high',
			feasibilityExplanation: 'היתכנות גבוהה',
			keyAdvantage: 'סגירת סף הקבלה במינימום זמן',
			milestones: [],
			recommendedSubjectImprovements: [
				{
					subjectName: 'פיזיקה',
					currentGrade: 85,
					currentUnits: 5,
					targetGrade: 94,
					targetUnits: 5,
					reason: 'העלאת ציון בפיזיקה 5 יח״ל מחזקת את מקדם הסכם'
				}
			]
		};

		const req = new NextRequest('http://localhost:3000/api/tracks/save', {
			method: 'POST',
			body: JSON.stringify({
				userId: createdUserId,
				programId: 'prog-technion-33',
				track: trackPayload
			})
		});

		const res = await savePostHandler(req);
		const data = await res.json();

		assert.equal(res.status, 200);
		assert.equal(data.success, true);
		assert.ok(data.savedTrackId, 'Must return savedTrackId');
		assert.ok(data.candidateNumber, 'Must return candidateNumber');
		assert.equal(data.userId, createdUserId);
	});

	test('2. GET /api/tracks/save returns enriched tracks with institution and program info', async () => {
		const req = new NextRequest(`http://localhost:3000/api/tracks/save?userId=${encodeURIComponent(createdUserId)}`);
		const res = await saveGetHandler(req);
		const data = await res.json();

		assert.equal(res.status, 200);
		assert.equal(data.success, true);
		assert.equal(data.total, 1);
		assert.ok(Array.isArray(data.tracks));
		assert.equal(data.tracks.length, 1);

		const track = data.tracks[0];
		assert.equal(track.programId, 'prog-technion-33');
		assert.ok(track.programName, 'Must include enriched programName');
		assert.ok(track.institutionName, 'Must include enriched institutionName');
		assert.equal(track.admissionThreshold, 91);
		assert.equal(track.targetSekem, 91.0);
	});

	test('3. DELETE /api/tracks/save removes the track from database', async () => {
		const deleteReq = new NextRequest(
			`http://localhost:3000/api/tracks/save?userId=${encodeURIComponent(createdUserId)}&trackId=track-fast-test&programId=prog-technion-33`,
			{ method: 'DELETE' }
		);
		const deleteRes = await saveDeleteHandler(deleteReq);
		const deleteData = await deleteRes.json();

		assert.equal(deleteRes.status, 200);
		assert.equal(deleteData.success, true);
		assert.equal(deleteData.deleted, true);

		// Verify GET returns 0 tracks now
		const verifyReq = new NextRequest(`http://localhost:3000/api/tracks/save?userId=${encodeURIComponent(createdUserId)}`);
		const verifyRes = await saveGetHandler(verifyReq);
		const verifyData = await verifyRes.json();

		assert.equal(verifyRes.status, 200);
		assert.equal(verifyData.total, 0);
		assert.equal(verifyData.tracks.length, 0);
	});

	test('4. DELETE /api/tracks/save requires userId and trackId', async () => {
		const req = new NextRequest('http://localhost:3000/api/tracks/save?userId=some_user', { method: 'DELETE' });
		const res = await saveDeleteHandler(req);
		assert.equal(res.status, 400);
	});
});
