/**
 * User Registration & Authentication Integration Tests
 * Verifies password hashing, candidate number assignment, registration, login, and guest migration
 */

import { test, describe, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../../lib/authUtils';
import { dbRepository } from '../../db/repository';
import { prisma } from '../../../lib/prisma';
import { POST as registerHandler } from '../../../app/api/auth/register/route';
import { POST as loginHandler } from '../../../app/api/auth/login/route';
import { GET as meHandler } from '../../../app/api/auth/me/route';
import { NextRequest } from 'next/server';

describe('Auth & User Registration Engine', () => {
	const testEmail = `test_auth_${Date.now()}@kalis.test`;
	const testPassword = 'SecurePassword123!';
	const testName = 'ישראל ישראלי לבדיקה';
	let createdUserId: string;

	before(async () => {
		await dbRepository.ensureSyncedFromSQLite();
	});

	after(async () => {
		// Clean up created user
		if (createdUserId) {
			await prisma.savedTrack.deleteMany({ where: { userId: createdUserId } });
			await prisma.userAcademicProfile.deleteMany({ where: { userId: createdUserId } });
			await prisma.userPreferences.deleteMany({ where: { userId: createdUserId } });
			await prisma.user.deleteMany({ where: { id: createdUserId } });
		}
		await prisma.$disconnect();
	});

	test('1. Crypto Utilities: Password Hashing & Safe Verification', () => {
		const rawPassword = 'MySecretPassword!';
		const hash = hashPassword(rawPassword);

		assert.ok(hash.includes(':'), 'Hash must contain salt and hash separated by colon');
		assert.equal(verifyPassword(rawPassword, hash), true, 'Correct password must verify to true');
		assert.equal(verifyPassword('WrongPassword', hash), false, 'Wrong password must verify to false');
		assert.equal(verifyPassword('', hash), false, 'Empty password must verify to false');
	});

	test('2. Repository: registerUserAsync creates user with system-generated KL-XXXXX candidate number', async () => {
		const user = await dbRepository.registerUserAsync({
			name: testName,
			email: testEmail,
			password: testPassword,
			phone: '052-1234567'
		});

		assert.ok(user.id, 'User ID must be created');
		createdUserId = user.id;
		assert.equal(user.email, testEmail.toLowerCase());
		assert.equal(user.name, testName);
		assert.equal(user.phone, '052-1234567');
		assert.ok(user.candidateNumber, 'Candidate number must exist');
		assert.match(user.candidateNumber, /^KL-\d{5}$/, 'Candidate number must follow KL-XXXXX format');
		assert.ok(user.passwordHash, 'Password hash must be stored');
		assert.notEqual(user.passwordHash, testPassword, 'Raw password must never be stored');
	});

	test('3. Repository: registerUserAsync rejects duplicate email', async () => {
		await assert.rejects(
			async () => {
				await dbRepository.registerUserAsync({
					name: 'Another User',
					email: testEmail,
					password: 'anotherPassword123'
				});
			},
			{
				message: 'כתובת אימייל זו כבר רשומה במערכת'
			}
		);
	});

	test('4. Repository: authenticateUserAsync verifies credentials', async () => {
		// Valid credentials
		const validUser = await dbRepository.authenticateUserAsync(testEmail, testPassword);
		assert.ok(validUser, 'Must successfully authenticate valid user');
		assert.equal(validUser.id, createdUserId);
		assert.equal(validUser.email, testEmail.toLowerCase());

		// Wrong password
		const invalidPassUser = await dbRepository.authenticateUserAsync(testEmail, 'IncorrectPassword');
		assert.equal(invalidPassUser, null, 'Must return null for incorrect password');

		// Non-existent user
		const nonExistent = await dbRepository.authenticateUserAsync('nobody@kalis.test', testPassword);
		assert.equal(nonExistent, null, 'Must return null for non-existent user');
	});

	test('5. API Endpoint: POST /api/auth/register validates payload and returns safe user profile', async () => {
		const newEmail = `api_test_${Date.now()}@kalis.test`;
		const req = new NextRequest('http://localhost:3000/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({
				name: 'בדיקת API',
				email: newEmail,
				password: 'TestPassword999'
			})
		});

		const res = await registerHandler(req);
		const data = await res.json();

		assert.equal(res.status, 200);
		assert.equal(data.success, true);
		assert.ok(data.user.id);
		assert.equal(data.user.email, newEmail);
		assert.match(data.user.candidateNumber, /^KL-\d{5}$/);
		assert.equal((data.user as any).passwordHash, undefined, 'passwordHash must never be exposed in API response');

		// Clean up
		await prisma.user.delete({ where: { id: data.user.id } });
	});

	test('6. API Endpoint: POST /api/auth/login rejects invalid passwords and accepts valid credentials', async () => {
		// Wrong credentials
		const wrongReq = new NextRequest('http://localhost:3000/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				email: testEmail,
				password: 'WrongPassword!'
			})
		});
		const wrongRes = await loginHandler(wrongReq);
		assert.equal(wrongRes.status, 401);
		const wrongData = await wrongRes.json();
		assert.equal(wrongData.success, false);

		// Correct credentials
		const validReq = new NextRequest('http://localhost:3000/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				email: testEmail,
				password: testPassword
			})
		});
		const validRes = await loginHandler(validReq);
		assert.equal(validRes.status, 200);
		const validData = await validRes.json();
		assert.equal(validData.success, true);
		assert.equal(validData.user.id, createdUserId);
		assert.equal(validData.user.candidateNumber, (await prisma.user.findUnique({ where: { id: createdUserId } }))?.candidateNumber);
	});

	test('7. API Endpoint: GET /api/auth/me returns current user details with saved tracks count', async () => {
		// Create a saved track for test user via repository
		await dbRepository.saveActionTracksAsync(createdUserId, 'prog-inst-4-1', [
			{
				id: 'track-test-1',
				userId: createdUserId,
				programId: 'prog-inst-4-1',
				title: 'מסלול בדיקה',
				badge: 'בדיקה',
				badgeColor: 'blue',
				strategyDescription: 'תיאור בדיקה',
				targetSekem: 85,
				targetPsychometric: 650,
				targetBagrutAverage: 105,
				estimatedWeeks: 10,
				weeklyHours: 15,
				feasibility: 'high',
				feasibilityExplanation: 'הסבר היתכנות גבוהה',
				keyAdvantage: 'יתרון מרכזי לבדיקה',
				milestones: [],
				recommendedLevers: [],
				createdAt: new Date()
			}
		]);

		const req = new NextRequest(`http://localhost:3000/api/auth/me?userId=${createdUserId}`);
		const res = await meHandler(req);
		const data = await res.json();

		assert.equal(res.status, 200);
		assert.equal(data.success, true);
		assert.equal(data.user.id, createdUserId);
		assert.equal(data.user.email, testEmail.toLowerCase());
		assert.equal(data.user.savedTracksCount, 1, 'Saved tracks count must equal 1');
	});

	test('8. Seamless Guest Migration: re-assigns guest saved tracks to registered user', async () => {
		const guestUserId = `guest_${Date.now()}`;
		// Seed a guest track via repository
		await dbRepository.saveActionTracksAsync(guestUserId, 'prog-inst-4-2', [
			{
				id: 'track-guest-1',
				userId: guestUserId,
				programId: 'prog-inst-4-2',
				title: 'מסלול אורח לפני הרשמה',
				badge: 'אורח',
				badgeColor: 'amber',
				strategyDescription: 'תיאור מסלול אורח',
				targetSekem: 88,
				targetPsychometric: 680,
				targetBagrutAverage: 108,
				estimatedWeeks: 12,
				weeklyHours: 15,
				feasibility: 'moderate',
				feasibilityExplanation: 'הסבר היתכנות בינונית',
				keyAdvantage: 'יתרון מרכזי מסלול אורח',
				milestones: [],
				recommendedLevers: [],
				createdAt: new Date()
			}
		]);

		const migratingEmail = `migrated_${Date.now()}@kalis.test`;
		const req = new NextRequest('http://localhost:3000/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({
				name: 'משתמש עם הגירה',
				email: migratingEmail,
				password: 'Password123!',
				guestUserId
			})
		});

		const res = await registerHandler(req);
		const data = await res.json();
		assert.equal(res.status, 200);
		const newUserId = data.user.id;

		// Verify track was migrated to new user
		const migratedTrack = await prisma.savedTrack.findFirst({
			where: { userId: newUserId, title: 'מסלול אורח לפני הרשמה' }
		});
		assert.ok(migratedTrack, 'Track must now belong to the newly registered user');

		const oldGuestTracks = await prisma.savedTrack.findMany({ where: { userId: guestUserId } });
		assert.equal(oldGuestTracks.length, 0, 'Guest user must have 0 tracks remaining');

		// Cleanup
		await prisma.savedTrack.deleteMany({ where: { userId: newUserId } });
		await prisma.user.delete({ where: { id: newUserId } });
	});
});
