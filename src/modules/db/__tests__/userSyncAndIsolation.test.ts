/**
 * Test Suite: User Academic Profile Sync & Complete Multi-User Isolation
 * Verifies that each authenticated user has their own independent data,
 * and that logging out / wiping user state leaves zero residuals.
 */

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { dbRepository } from '../repository';
import { UserAcademicProfileRecord, UserPreferencesRecord } from '../schema';
import { prisma } from '../../../lib/prisma';

describe('User Academic Profile Sync & Complete Multi-User Isolation', () => {
	const userAId = 'test_user_alice_alpha_1';
	const userBId = 'test_user_bob_beta_2';

	after(async () => {
		await dbRepository.clearUserStateAsync(userAId);
		await dbRepository.clearUserStateAsync(userBId);
		await prisma.$disconnect();
	});

	test('1. Saves distinct profiles for User A and User B with complete data isolation', async () => {
		// User A Profile: STEM orientation with 5u Math and 720 Psychometric
		const profileA: UserAcademicProfileRecord = {
			userId: userAId,
			mathUnits: 5,
			mathGrade: 95,
			physicsUnits: 5,
			physicsGrade: 92,
			psychometricGeneral: 720,
			psychometricQuant: 145,
			psychometricVerbal: 135,
			psychometricEnglish: 140,
			hasTakenPsychometric: true,
			updatedAt: new Date(),
			bagrutSubjects: [
				{ id: 'sub_a1', profileId: 'p', subjectName: 'מתמטיקה', units: 5, grade: 95, isMandatory: true, isMath: true },
				{ id: 'sub_a2', profileId: 'p', subjectName: 'אנגלית', units: 5, grade: 92, isMandatory: true },
				{ id: 'sub_a3', profileId: 'p', subjectName: 'פיזיקה', units: 5, grade: 92, isMandatory: false, isPhysics: true }
			]
		};

		// User B Profile: Humanities orientation with 4u Math and 610 Psychometric
		const profileB: UserAcademicProfileRecord = {
			userId: userBId,
			mathUnits: 4,
			mathGrade: 80,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 610,
			psychometricQuant: 115,
			psychometricVerbal: 135,
			psychometricEnglish: 120,
			hasTakenPsychometric: true,
			updatedAt: new Date(),
			bagrutSubjects: [
				{ id: 'sub_b1', profileId: 'p', subjectName: 'מתמטיקה', units: 4, grade: 80, isMandatory: true, isMath: true },
				{ id: 'sub_b2', profileId: 'p', subjectName: 'אנגלית', units: 4, grade: 85, isMandatory: true },
				{ id: 'sub_b3', profileId: 'p', subjectName: 'ספרות עברית', units: 5, grade: 94, isMandatory: false }
			]
		};

		await dbRepository.saveUserProfileAsync(profileA);
		await dbRepository.saveUserProfileAsync(profileB);

		// Read back User A
		const fetchedA = await dbRepository.getUserProfileAsync(userAId);
		assert.ok(fetchedA, 'User A profile must exist');
		assert.equal(fetchedA.userId, userAId);
		assert.equal(fetchedA.psychometricGeneral, 720);
		assert.equal(fetchedA.mathUnits, 5);
		assert.equal(fetchedA.mathGrade, 95);
		assert.equal(fetchedA.bagrutSubjects.some(s => s.subjectName === 'פיזיקה'), true);
		assert.equal(fetchedA.bagrutSubjects.some(s => s.subjectName === 'ספרות עברית'), false);

		// Read back User B
		const fetchedB = await dbRepository.getUserProfileAsync(userBId);
		assert.ok(fetchedB, 'User B profile must exist');
		assert.equal(fetchedB.userId, userBId);
		assert.equal(fetchedB.psychometricGeneral, 610);
		assert.equal(fetchedB.mathUnits, 4);
		assert.equal(fetchedB.mathGrade, 80);
		assert.equal(fetchedB.bagrutSubjects.some(s => s.subjectName === 'פיזיקה'), false);
		assert.equal(fetchedB.bagrutSubjects.some(s => s.subjectName === 'ספרות עברית'), true);
	});

	test('2. Saves and isolates User Preferences', async () => {
		const prefA: UserPreferencesRecord = {
			userId: userAId,
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'full_30_plus',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		};

		const prefB: UserPreferencesRecord = {
			userId: userBId,
			psychExperience: 'never',
			psychFeeling: 'neutral',
			psychStrongestSection: 'verbal',
			psychStrongestSections: ['verbal'],
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'limited_under_15',
			targetTimeline: 'next_year',
			updatedAt: new Date()
		};

		await dbRepository.saveUserPreferencesAsync(prefA);
		await dbRepository.saveUserPreferencesAsync(prefB);

		const fetchedPrefA = await dbRepository.getUserPreferencesAsync(userAId);
		assert.ok(fetchedPrefA);
		assert.equal(fetchedPrefA.learningOrientation, 'stem');
		assert.equal(fetchedPrefA.weeklyAvailabilityHours, 'full_30_plus');

		const fetchedPrefB = await dbRepository.getUserPreferencesAsync(userBId);
		assert.ok(fetchedPrefB);
		assert.equal(fetchedPrefB.learningOrientation, 'humanities');
		assert.equal(fetchedPrefB.weeklyAvailabilityHours, 'limited_under_15');
	});

	test('3. Completely clears User A state on disconnect/reset without affecting User B', async () => {
		await dbRepository.clearUserStateAsync(userAId);

		const clearedA = await dbRepository.getUserProfileAsync(userAId);
		assert.equal(clearedA, null, 'User A profile must be completely wiped');

		const intactB = await dbRepository.getUserProfileAsync(userBId);
		assert.ok(intactB, 'User B profile must remain intact');
		assert.equal(intactB.userId, userBId);
		assert.equal(intactB.psychometricGeneral, 610);
	});
});
