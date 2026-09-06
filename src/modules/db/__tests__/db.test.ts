/**
 * Automated Verification Test Suite for Subagent 1: Architecture & DB
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	dbRepository,
	getDirectAdmissionPrograms,
	getSTEMPrograms,
	getInstitutionDistributionStats,
	UserAcademicProfileInputSchema,
	ProgramSearchQuerySchema
} from '../index';

import { UserAcademicProfileRecord } from '../schema';

describe('Subagent 1: Architecture & Database Layer', () => {
	it('Repository seeds all universities and indexes programs', () => {
		const institutions = dbRepository.getAllInstitutions();
		assert.equal(institutions.length, 7);

		const instIds = institutions.map((i) => i.id);
		assert.ok(instIds.includes('technion'));
		assert.ok(instIds.includes('tau'));
		assert.ok(instIds.includes('huji'));
		assert.ok(instIds.includes('bgu'));
		assert.ok(instIds.includes('haifa'));
		assert.ok(instIds.includes('ariel'));
		assert.ok(instIds.includes('bar_ilan'));

		const technionPrograms = dbRepository.getProgramsByInstitution('technion');
		assert.ok(technionPrograms.length > 0);
		technionPrograms.forEach((p) => {
			assert.equal(p.institutionId, 'technion');
			assert.equal(p.relevantSekemType, 'technion');
			assert.ok(p.minSekemThreshold > 0);
		});
	});

	it('Fast search and O(1) ID lookups', () => {
		const technionPrograms = dbRepository.getProgramsByInstitution('technion');
		const sample = technionPrograms[0];
		assert.ok(sample);

		const fetched = dbRepository.findProgramById(sample.id);
		assert.deepEqual(fetched, sample);

		const csSearch = dbRepository.searchPrograms({ text: 'מדעי המחשב' });
		assert.ok(csSearch.total > 0);
		assert.ok(csSearch.programs.some((p) => p.name.includes('מחשב') || p.fieldOfStudy.includes('מחשב')));
	});

	it('Direct Admission queries return only eligible non-STEM programs', () => {
		const directPrograms = getDirectAdmissionPrograms();
		assert.ok(directPrograms.length > 0);

		// Technion or CS never allowed
		for (const p of directPrograms) {
			assert.notEqual(p.institutionId, 'technion');
			assert.equal(p.directBagrutEligible, true);
			assert.ok(p.directBagrutMinAverage !== null && p.directBagrutMinAverage !== undefined);
			assert.ok(!p.fieldOfStudy.includes('מדעי המחשב'));
		}
	});

	it('Sekem-based matching categorizes into eligible and reachable', () => {
		// Technion sekem 88.0
		const res = dbRepository.findProgramsBySekem('technion', 88.0, { tolerance: 4 });
		assert.ok(Array.isArray(res.eligible));
		assert.ok(Array.isArray(res.reachable));

		res.eligible.forEach((p) => {
			assert.ok(88.0 >= p.minSekemThreshold);
		});
		res.reachable.forEach((p) => {
			assert.ok(p.minSekemThreshold > 88.0);
			assert.ok(p.minSekemThreshold - 88.0 <= 4);
		});
	});

	it('User profile and action tracks state persistence', () => {
		const testProfile: UserAcademicProfileRecord = {
			userId: 'user_test_123',
			bagrutSubjects: [
				{
					id: 's1',
					profileId: 'user_test_123',
					subjectName: 'מתמטיקה',
					units: 5,
					grade: 90,
					isMandatory: true,
					isMath: true
				}
			],
			mathUnits: 5,
			mathGrade: 90,
			physicsUnits: 5,
			physicsGrade: 88,
			psychometricGeneral: 700,
			psychometricQuant: 140,
			psychometricVerbal: 130,
			psychometricEnglish: 135,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		dbRepository.saveUserProfile(testProfile);
		const retrieved = dbRepository.getUserProfile('user_test_123');
		assert.ok(retrieved);
		assert.equal(retrieved.userId, 'user_test_123');
		assert.equal(retrieved.psychometricGeneral, 700);

		// Clean up
		dbRepository.clearUserState('user_test_123');
		assert.equal(dbRepository.getUserProfile('user_test_123'), null);
	});

	it('Zod schema validation rejects malformed grades or units', () => {
		const valid = UserAcademicProfileInputSchema.safeParse({
			bagrutSubjects: [{ name: 'מתמטיקה', units: 5, grade: 90 }],
			mathUnits: 5,
			mathGrade: 90,
			psychometricGeneral: 700
		});
		assert.equal(valid.success, true);

		// Invalid: units > 5
		const invalidUnits = UserAcademicProfileInputSchema.safeParse({
			bagrutSubjects: [{ name: 'מתמטיקה', units: 7, grade: 90 }]
		});
		assert.equal(invalidUnits.success, false);

		// Invalid: grade > 100
		const invalidGrade = UserAcademicProfileInputSchema.safeParse({
			bagrutSubjects: [{ name: 'מתמטיקה', units: 5, grade: 110 }]
		});
		assert.equal(invalidGrade.success, false);
	});
});
