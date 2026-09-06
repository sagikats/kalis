/**
 * Automated Verification Test Suite for Subagent 2: Optimizer & Recommendation Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	generateOptimizedActionTracks,
	calculateLeverUtilityScore,
	extractRankedSubjectLevers,
	solveMinimumPsychometricTarget,
	toCalculatorSubjects
} from '../index';

import { AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';

describe('Subagent 2: Optimizer & Recommendation Algorithms', () => {
	const defaultPreferences: UserPreferencesRecord = {
		userId: 'user_1',
		psychExperience: 'never',
		psychFeeling: 'neutral',
		psychStrongestSection: 'balanced',
		learningOrientation: 'flexible',
		learningStrength: 'analytical_quick',
		weeklyAvailabilityHours: 'part_15_25',
		targetTimeline: 'flexible',
		updatedAt: new Date()
	};

	it('Utility Scoring: Non-STEM heavily favors core 2u and geography over 5u math', () => {
		const mathLever = {
			id: 'math_5u',
			subjectName: 'מתמטיקה',
			currentUnits: 4,
			currentGrade: 88,
			targetUnits: 5,
			targetGrade: 90,
			isMath: true
		};

		const civicsLever = {
			id: 'core_1',
			subjectName: 'אזרחות',
			currentUnits: 2,
			currentGrade: 85,
			targetUnits: 2,
			targetGrade: 95
		};

		const nonStemPref: UserPreferencesRecord = {
			...defaultPreferences,
			learningOrientation: 'humanities'
		};

		const mathUtilityNonStem = calculateLeverUtilityScore(mathLever, false, nonStemPref);
		const civicsUtilityNonStem = calculateLeverUtilityScore(civicsLever, false, nonStemPref);

		assert.ok(civicsUtilityNonStem > mathUtilityNonStem, 'Core subjects must have higher utility than Math 5u for non-STEM');

		// For STEM: Math 5u must have higher utility
		const mathUtilityStem = calculateLeverUtilityScore(mathLever, true, defaultPreferences);
		const civicsUtilityStem = calculateLeverUtilityScore(civicsLever, true, defaultPreferences);
		assert.ok(mathUtilityStem > civicsUtilityStem, 'Math 5u must have higher utility than core 2u for STEM');
	});

	it('Binary Search Solver: Finds exact psychometric target for threshold', () => {
		const testProfile: UserAcademicProfileRecord = {
			userId: 'u1',
			bagrutSubjects: [
				{ id: '1', profileId: 'u1', subjectName: 'מתמטיקה', units: 5, grade: 90, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'u1', subjectName: 'אנגלית', units: 5, grade: 90, isMandatory: true },
				{ id: '3', profileId: 'u1', subjectName: 'פיזיקה', units: 5, grade: 88, isMandatory: false, isPhysics: true },
				{ id: '4', profileId: 'u1', subjectName: 'ספרות', units: 2, grade: 85, isMandatory: true },
				{ id: '5', profileId: 'u1', subjectName: 'היסטוריה', units: 2, grade: 85, isMandatory: true },
				{ id: '6', profileId: 'u1', subjectName: 'תנ״ך', units: 2, grade: 85, isMandatory: true },
				{ id: '7', profileId: 'u1', subjectName: 'אזרחות', units: 2, grade: 85, isMandatory: true },
				{ id: '8', profileId: 'u1', subjectName: 'הבעה עברית', units: 2, grade: 85, isMandatory: true }
			],
			mathUnits: 5,
			mathGrade: 90,
			physicsUnits: 5,
			physicsGrade: 88,
			psychometricGeneral: 650,
			psychometricQuant: 130,
			psychometricVerbal: 130,
			psychometricEnglish: 130,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const subjects = toCalculatorSubjects(testProfile);
		const targetPsych = solveMinimumPsychometricTarget('technion', 'technion', 88.0, testProfile, subjects, 650, 800);

		assert.ok(targetPsych !== null);
		assert.ok(targetPsych >= 650 && targetPsych <= 760);
	});

	it('Student 3 (Itai - Psychology at HUJI): Generates Direct Bagrut Track (0 Psychometric)', () => {
		const itaiProfile: UserAcademicProfileRecord = {
			userId: 'itai',
			bagrutSubjects: [
				{ id: '1', profileId: 'itai', subjectName: 'מתמטיקה', units: 4, grade: 88, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'itai', subjectName: 'אנגלית', units: 5, grade: 92, isMandatory: true },
				{ id: '3', profileId: 'itai', subjectName: 'ספרות עברית', units: 5, grade: 92, isMandatory: false },
				{ id: '4', profileId: 'itai', subjectName: 'היסטוריה', units: 2, grade: 85, isMandatory: true },
				{ id: '5', profileId: 'itai', subjectName: 'תנ״ך', units: 2, grade: 85, isMandatory: true },
				{ id: '6', profileId: 'itai', subjectName: 'אזרחות', units: 2, grade: 85, isMandatory: true },
				{ id: '7', profileId: 'itai', subjectName: 'הבעה עברית', units: 2, grade: 86, isMandatory: true }
			],
			mathUnits: 4,
			mathGrade: 88,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 0, // Has not taken psychometric
			psychometricQuant: 0,
			psychometricVerbal: 0,
			psychometricEnglish: 0,
			hasTakenPsychometric: false,
			updatedAt: new Date()
		};

		const itaiPreferences: UserPreferencesRecord = {
			...defaultPreferences,
			weeklyAvailabilityHours: 'full_30_plus'
		};

		const hujiPsychologyProgram: AcademicProgramRecord = {
			id: 'prog_huji_psych',
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית בירושלים',
			facultyName: 'מדעי החברה',
			name: 'פסיכולוגיה ומדעי הקוגניציה',
			fieldOfStudy: 'פסיכולוגיה',
			degreeLevel: 'bachelor',
			minSekemThreshold: 660,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 105.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const solution = generateOptimizedActionTracks(hujiPsychologyProgram, itaiProfile, itaiPreferences);

		assert.ok(solution.hasDirectBagrutOption, 'Itai must have a Direct Bagrut Admission option');
		assert.ok(solution.tracks.length >= 2);

		const directTrack = solution.tracks.find((t) => t.id === 'track-direct-bagrut');
		assert.ok(directTrack, 'Direct Bagrut track must be present in solution');
		assert.equal(directTrack?.targetPsychometric, undefined, 'Direct Bagrut requires zero psychometric');
		assert.ok((directTrack?.targetBagrutAverage || 0) >= 105.0, 'Bagrut average must reach 105.0 or above');

		// Verify that 5-unit math is NOT the lever proposed for Itai's direct track
		const mathLeverInDirect = directTrack?.recommendedLevers.find((l) => l.subjectName.includes('מתמטיקה') && l.targetUnits === 5);
		assert.equal(mathLeverInDirect, undefined, '5-unit math must NOT be imposed on Itai for psychology');
	});

	it('STEM Discipline Filter: Technion CS never generates direct bagrut', () => {
		const tomerProfile: UserAcademicProfileRecord = {
			userId: 'tomer',
			bagrutSubjects: [
				{ id: '1', profileId: 'tomer', subjectName: 'מתמטיקה', units: 5, grade: 85, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'tomer', subjectName: 'אנגלית', units: 5, grade: 90, isMandatory: true },
				{ id: '3', profileId: 'tomer', subjectName: 'פיזיקה', units: 5, grade: 88, isMandatory: false, isPhysics: true },
				{ id: '4', profileId: 'tomer', subjectName: 'מדעי המחשב', units: 5, grade: 92, isMandatory: false }
			],
			mathUnits: 5,
			mathGrade: 85,
			physicsUnits: 5,
			physicsGrade: 88,
			psychometricGeneral: 680,
			psychometricQuant: 135,
			psychometricVerbal: 125,
			psychometricEnglish: 130,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const technionCSProgram: AcademicProgramRecord = {
			id: 'prog_technion_cs',
			institutionId: 'technion',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			facultyName: 'מדעי המחשב',
			name: 'מדעי המחשב',
			fieldOfStudy: 'מדעי המחשב',
			degreeLevel: 'bachelor',
			minSekemThreshold: 89.0,
			relevantSekemType: 'technion',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true },
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const solution = generateOptimizedActionTracks(technionCSProgram, tomerProfile, defaultPreferences);

		assert.equal(solution.hasDirectBagrutOption, false, 'CS must NEVER have direct bagrut option');
		const directTrack = solution.tracks.find((t) => t.id === 'track-direct-bagrut');
		assert.equal(directTrack, undefined);

		// Must have balanced track
		const balancedTrack = solution.tracks.find((t) => t.id === 'track-balanced');
		assert.ok(balancedTrack);
	});
});
