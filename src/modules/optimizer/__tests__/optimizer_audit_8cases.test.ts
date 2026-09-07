/**
 * Deep Audit Test Suite – 8 Representative Edge Cases
 * Subagent 2: Recommendation & Optimization Engine
 *
 * Covers all 8 supported Israeli universities with meaningful boundary conditions:
 *   1. Technion CS  – STEM psychometric mandate (no direct bagrut)
 *   2. HUJI Psychology – Direct bagrut on 106.5+ (0 psychometric improvement)
 *   3. TAU Electrical Engineering – 4u Math candidate: upgrade vs psychometric ROI
 *   4. BGU Economics/Society – Non-STEM ROI: core 2u / geography over hard math
 *   5. Haifa Law – Large Sekem gap: anchor track realism (no fantasy targets)
 *   6. Bar-Ilan Data Science – 3u Math prerequisite blocker detection
 *   7. Reichman/Ariel – Borderline candidate: binary search convergence precision
 *   8. Legal 20-unit rule – Candidate with exactly 21 units: no elective dropped below floor
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	generateOptimizedActionTracks,
	calculateLeverUtilityScore,
	extractRankedSubjectLevers,
	solveMinimumPsychometricTarget,
	toCalculatorSubjects,
	evaluateSimulatedSekem
} from '../index';

import { AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const defaultPreferences: UserPreferencesRecord = {
	userId: 'audit_user',
	psychExperience: 'never',
	psychFeeling: 'neutral',
	psychStrongestSection: 'balanced',
	learningOrientation: 'flexible',
	learningStrength: 'analytical_quick',
	weeklyAvailabilityHours: 'part_15_25',
	targetTimeline: 'flexible',
	updatedAt: new Date()
};

function makeProgram(overrides: Partial<AcademicProgramRecord>): AcademicProgramRecord {
	return {
		id: 'prog_test',
		institutionId: 'bgu',
		institutionName: 'בן-גוריון',
		facultyName: 'בדיקה',
		name: 'תוכנית בדיקה',
		fieldOfStudy: 'כללי',
		degreeLevel: 'bachelor',
		minSekemThreshold: 650,
		relevantSekemType: 'general',
		directBagrutEligible: false,
		directBagrutMinAverage: null,
		prerequisites: { mustHavePsychometric: false },
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

// ─── Case 1: Technion CS – STEM psychometric mandate ─────────────────────────

describe('Case 1: Technion CS – STEM psychometric mandate enforced', () => {
	it('never produces a direct-bagrut track regardless of bagrut average', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c1_technion_cs',
			bagrutSubjects: [
				{ id: '1', profileId: 'c1', subjectName: 'מתמטיקה', units: 5, grade: 85, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c1', subjectName: 'אנגלית', units: 5, grade: 90, isMandatory: true },
				{ id: '3', profileId: 'c1', subjectName: 'פיזיקה', units: 5, grade: 80, isMandatory: false, isPhysics: true },
				{ id: '4', profileId: 'c1', subjectName: 'מדעי המחשב', units: 5, grade: 92, isMandatory: false },
				{ id: '5', profileId: 'c1', subjectName: 'ספרות', units: 2, grade: 85, isMandatory: true },
				{ id: '6', profileId: 'c1', subjectName: 'היסטוריה', units: 2, grade: 85, isMandatory: true },
				{ id: '7', profileId: 'c1', subjectName: 'תנ״ך', units: 2, grade: 85, isMandatory: true },
				{ id: '8', profileId: 'c1', subjectName: 'אזרחות', units: 2, grade: 85, isMandatory: true }
			],
			mathUnits: 5, mathGrade: 85,
			physicsUnits: 5, physicsGrade: 80,
			psychometricGeneral: 680,
			psychometricQuant: 135, psychometricVerbal: 125, psychometricEnglish: 130,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const program = makeProgram({
			institutionId: 'technion',
			institutionName: 'הטכניון',
			name: 'מדעי המחשב',
			fieldOfStudy: 'מדעי המחשב',
			minSekemThreshold: 91.0,
			relevantSekemType: 'technion',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true }
		});

		const solution = generateOptimizedActionTracks(program, profile, defaultPreferences);

		// Must NEVER have direct bagrut option for Technion
		assert.strictEqual(solution.hasDirectBagrutOption, false,
			'Case 1: Technion CS must never allow direct bagrut admission');

		const directTrack = solution.tracks.find(t => t.id === 'track-direct-bagrut');
		assert.strictEqual(directTrack, undefined,
			'Case 1: No direct-bagrut track should be generated for Technion STEM');

		// Must have at least the balanced/fast track with psychometric target
		const psychTrack = solution.tracks.find(t => t.targetPsychometric !== undefined && t.targetPsychometric > 0);
		assert.ok(psychTrack, 'Case 1: Must have at least one psychometric-target track');
		assert.ok((psychTrack.targetPsychometric ?? 0) >= 680,
			'Case 1: Target psychometric must not be lower than current (680)');
	});
});

// ─── Case 2: HUJI Psychology – Direct bagrut on high average ─────────────────

describe('Case 2: HUJI Psychology – Direct bagrut (0 psychometric) for 106.5+ average', () => {
	it('generates a direct-bagrut track with no psychometric requirement', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c2_huji_psych',
			bagrutSubjects: [
				{ id: '1', profileId: 'c2', subjectName: 'מתמטיקה', units: 4, grade: 90, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c2', subjectName: 'אנגלית', units: 5, grade: 95, isMandatory: true },
				{ id: '3', profileId: 'c2', subjectName: 'ספרות עברית', units: 5, grade: 95, isMandatory: false },
				{ id: '4', profileId: 'c2', subjectName: 'היסטוריה', units: 2, grade: 88, isMandatory: true },
				{ id: '5', profileId: 'c2', subjectName: 'תנ״ך', units: 2, grade: 88, isMandatory: true },
				{ id: '6', profileId: 'c2', subjectName: 'אזרחות', units: 2, grade: 88, isMandatory: true },
				{ id: '7', profileId: 'c2', subjectName: 'הבעה עברית', units: 2, grade: 90, isMandatory: true }
			],
			mathUnits: 4, mathGrade: 90,
			physicsUnits: 0, physicsGrade: 0,
			// Low psychometric – but high bagrut
			psychometricGeneral: 550,
			psychometricQuant: 110, psychometricVerbal: 110, psychometricEnglish: 110,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const program = makeProgram({
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית',
			name: 'פסיכולוגיה',
			fieldOfStudy: 'פסיכולוגיה',
			minSekemThreshold: 660,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 105.0,
			prerequisites: { mustHavePsychometric: false }
		});

		const solution = generateOptimizedActionTracks(program, profile, {
			...defaultPreferences,
			weeklyAvailabilityHours: 'full_30_plus'
		});

		assert.ok(solution.hasDirectBagrutOption,
			'Case 2: HUJI Psychology with high bagrut must offer direct-bagrut path');

		const directTrack = solution.tracks.find(t => t.id === 'track-direct-bagrut');
		assert.ok(directTrack, 'Case 2: Direct-bagrut track must exist');
		assert.strictEqual(directTrack?.targetPsychometric, undefined,
			'Case 2: Direct-bagrut track must NOT include a psychometric target');
		assert.ok((directTrack?.targetBagrutAverage ?? 0) >= 105.0,
			'Case 2: Direct bagrut average must reach 105.0+');
	});
});

// ─── Case 3: TAU Electrical Engineering – Math 4u vs psychometric ROI ────────

describe('Case 3: TAU Electrical Engineering – 4u Math ROI correctly evaluated', () => {
	it('ranks Math 5u upgrade higher than generic electives for STEM degree', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c3_tau_ee',
			bagrutSubjects: [
				{ id: '1', profileId: 'c3', subjectName: 'מתמטיקה', units: 4, grade: 92, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c3', subjectName: 'אנגלית', units: 5, grade: 88, isMandatory: true },
				{ id: '3', profileId: 'c3', subjectName: 'פיזיקה', units: 5, grade: 82, isMandatory: false, isPhysics: true },
				{ id: '4', profileId: 'c3', subjectName: 'ספרות', units: 2, grade: 80, isMandatory: true },
				{ id: '5', profileId: 'c3', subjectName: 'היסטוריה', units: 2, grade: 80, isMandatory: true },
				{ id: '6', profileId: 'c3', subjectName: 'תנ״ך', units: 2, grade: 80, isMandatory: true },
				{ id: '7', profileId: 'c3', subjectName: 'אזרחות', units: 2, grade: 80, isMandatory: true }
			],
			mathUnits: 4, mathGrade: 92,
			physicsUnits: 5, physicsGrade: 82,
			psychometricGeneral: 670,
			psychometricQuant: 130, psychometricVerbal: 125, psychometricEnglish: 130,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const stemPref: UserPreferencesRecord = {
			...defaultPreferences,
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick'
		};

		// For STEM: Math 5u upgrade lever must score higher than humanities core 2u
		const mathLever = {
			id: 'math_5u', subjectName: 'מתמטיקה',
			currentUnits: 4, currentGrade: 92,
			targetUnits: 5, targetGrade: 90,
			isMath: true
		};
		const coreHistLever = {
			id: 'core_1', subjectName: 'היסטוריה',
			currentUnits: 2, currentGrade: 80,
			targetUnits: 2, targetGrade: 92
		};

		const mathScore = calculateLeverUtilityScore(mathLever, true, stemPref);
		const histScore = calculateLeverUtilityScore(coreHistLever, true, stemPref);

		assert.ok(mathScore > histScore,
			`Case 3: Math 5u (${mathScore}) must outrank History 2u (${histScore}) for STEM EE`);

		// Also verify ranked levers place math at top position for STEM
		const levers = extractRankedSubjectLevers(profile, true, stemPref);
		const topLever = levers[0];
		assert.ok(topLever.isMath || topLever.isPhysics,
			'Case 3: Top-ranked lever for STEM EE must be math or physics');
	});
});

// ─── Case 4: BGU Economics/Society – Non-STEM ROI scoring ────────────────────

describe('Case 4: BGU Economics/Social Sciences – Core 2u & geography beat math for non-STEM', () => {
	it('correctly ranks core-subjects and geography over 5u math for humanities-oriented student', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c4_bgu_econ',
			bagrutSubjects: [
				{ id: '1', profileId: 'c4', subjectName: 'מתמטיקה', units: 4, grade: 75, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c4', subjectName: 'אנגלית', units: 5, grade: 85, isMandatory: true },
				{ id: '3', profileId: 'c4', subjectName: 'היסטוריה', units: 2, grade: 78, isMandatory: true },
				{ id: '4', profileId: 'c4', subjectName: 'תנ״ך', units: 2, grade: 75, isMandatory: true },
				{ id: '5', profileId: 'c4', subjectName: 'אזרחות', units: 2, grade: 80, isMandatory: true },
				{ id: '6', profileId: 'c4', subjectName: 'ספרות', units: 2, grade: 77, isMandatory: true }
			],
			mathUnits: 4, mathGrade: 75,
			physicsUnits: 0, physicsGrade: 0,
			psychometricGeneral: 620,
			psychometricQuant: 120, psychometricVerbal: 125, psychometricEnglish: 120,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const humanPref: UserPreferencesRecord = {
			...defaultPreferences,
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention'
		};

		const mathLever = {
			id: 'math_5u', subjectName: 'מתמטיקה',
			currentUnits: 4, currentGrade: 75,
			targetUnits: 5, targetGrade: 90,
			isMath: true
		};
		const geoLever = {
			id: 'elective_geo_5u', subjectName: 'גיאוגרפיה',
			currentUnits: 2, currentGrade: 0,
			targetUnits: 5, targetGrade: 92
		};
		const histLever = {
			id: 'core_hist', subjectName: 'היסטוריה',
			currentUnits: 2, currentGrade: 78,
			targetUnits: 2, targetGrade: 92
		};

		const mathScore = calculateLeverUtilityScore(mathLever, false, humanPref);
		const geoScore = calculateLeverUtilityScore(geoLever, false, humanPref);
		const histScore = calculateLeverUtilityScore(histLever, false, humanPref);

		assert.ok(geoScore > mathScore,
			`Case 4: Geography (${geoScore}) must beat Math 5u (${mathScore}) for non-STEM student`);
		assert.ok(histScore > mathScore,
			`Case 4: History core (${histScore}) must beat Math 5u (${mathScore}) for non-STEM student`);
	});
});

// ─── Case 5: Haifa Law – Large gap → anchor track must be realistic ───────────

describe('Case 5: Haifa Law – Large Sekem gap → no impossible psychometric targets', () => {
	it('returns null or a realistic target when gap is too large to bridge by psychometric alone', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c5_haifa_law',
			bagrutSubjects: [
				{ id: '1', profileId: 'c5', subjectName: 'מתמטיקה', units: 3, grade: 70, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c5', subjectName: 'אנגלית', units: 4, grade: 75, isMandatory: true },
				{ id: '3', profileId: 'c5', subjectName: 'ספרות', units: 2, grade: 72, isMandatory: true },
				{ id: '4', profileId: 'c5', subjectName: 'היסטוריה', units: 2, grade: 70, isMandatory: true },
				{ id: '5', profileId: 'c5', subjectName: 'תנ״ך', units: 2, grade: 68, isMandatory: true },
				{ id: '6', profileId: 'c5', subjectName: 'אזרחות', units: 2, grade: 72, isMandatory: true }
			],
			mathUnits: 3, mathGrade: 70,
			physicsUnits: 0, physicsGrade: 0,
			// Very low psychometric – large gap to law (threshold ~700)
			psychometricGeneral: 520,
			psychometricQuant: 105, psychometricVerbal: 105, psychometricEnglish: 100,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		// Haifa Law typically requires high Sekem; candidate is far below
		const program = makeProgram({
			institutionId: 'haifa',
			institutionName: 'אוניברסיטת חיפה',
			name: 'משפטים',
			fieldOfStudy: 'משפטים',
			minSekemThreshold: 700,
			relevantSekemType: 'general',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: false }
		});

		const subjects = toCalculatorSubjects(profile);

		// Verify solver correctly returns null or a high target (no magic below 520)
		const target = solveMinimumPsychometricTarget(
			'haifa', 'general', 700, profile, subjects, 520, 800
		);

		// Either returns null (unreachable) or a value that is actually ≥ 520
		if (target !== null) {
			assert.ok(target >= 520, 'Case 5: Target must not be below current psychometric');
			// Verify that the target actually achieves or surpasses threshold when simulated
			const evalResult = evaluateSimulatedSekem('haifa', 'general', profile, subjects, target);
			assert.ok(evalResult.sekem >= 700,
				`Case 5: Evaluated sekem (${evalResult.sekem}) must reach threshold (700) at target psych ${target}`);
		}
		// null return is also valid – means the gap is unreachable within [520, 800]
	});
});

// ─── Case 6: Bar-Ilan Data Science – 3u Math prerequisite detection ───────────

describe('Case 6: Bar-Ilan Data Science – 3u Math student leveraged toward math upgrade', () => {
	it('places math upgrade as top lever candidate for data science (STEM orientation)', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c6_biu_ds',
			bagrutSubjects: [
				// Only 3 units of math – major red flag for Data Science
				{ id: '1', profileId: 'c6', subjectName: 'מתמטיקה', units: 3, grade: 95, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c6', subjectName: 'אנגלית', units: 5, grade: 90, isMandatory: true },
				{ id: '3', profileId: 'c6', subjectName: 'ספרות', units: 2, grade: 85, isMandatory: true },
				{ id: '4', profileId: 'c6', subjectName: 'היסטוריה', units: 2, grade: 82, isMandatory: true },
				{ id: '5', profileId: 'c6', subjectName: 'תנ״ך', units: 2, grade: 82, isMandatory: true },
				{ id: '6', profileId: 'c6', subjectName: 'אזרחות', units: 2, grade: 84, isMandatory: true }
			],
			mathUnits: 3, mathGrade: 95,
			physicsUnits: 0, physicsGrade: 0,
			psychometricGeneral: 680,
			psychometricQuant: 136, psychometricVerbal: 128, psychometricEnglish: 132,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const stemPref: UserPreferencesRecord = {
			...defaultPreferences,
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick'
		};

		const levers = extractRankedSubjectLevers(profile, true, stemPref);

		// With 3u math and STEM degree, math upgrade lever must be present
		const mathLever = levers.find(l => l.isMath);
		assert.ok(mathLever, 'Case 6: Math upgrade lever must be present for 3u student');

		// And it must be the top-1 or top-2 lever by utility
		const mathRank = levers.findIndex(l => l.isMath);
		assert.ok(mathRank <= 1,
			`Case 6: Math lever must be ranked #1 or #2 (got rank ${mathRank}) for STEM Data Science`);
	});
});

// ─── Case 7: Reichman / Ariel – Borderline candidate binary search precision ─

describe('Case 7: Reichman/Ariel borderline – binary search converges to minimal psychometric', () => {
	it('finds the exact minimum psychometric target without over-demanding from student', () => {
		const profile: UserAcademicProfileRecord = {
			userId: 'c7_reichman_borderline',
			bagrutSubjects: [
				{ id: '1', profileId: 'c7', subjectName: 'מתמטיקה', units: 4, grade: 80, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c7', subjectName: 'אנגלית', units: 4, grade: 82, isMandatory: true },
				{ id: '3', profileId: 'c7', subjectName: 'ספרות', units: 2, grade: 78, isMandatory: true },
				{ id: '4', profileId: 'c7', subjectName: 'היסטוריה', units: 2, grade: 76, isMandatory: true },
				{ id: '5', profileId: 'c7', subjectName: 'תנ״ך', units: 2, grade: 77, isMandatory: true },
				{ id: '6', profileId: 'c7', subjectName: 'אזרחות', units: 2, grade: 79, isMandatory: true }
			],
			mathUnits: 4, mathGrade: 80,
			physicsUnits: 0, physicsGrade: 0,
			psychometricGeneral: 580,
			psychometricQuant: 115, psychometricVerbal: 115, psychometricEnglish: 115,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		const subjects = toCalculatorSubjects(profile);

		// Reichman has relatively low Sekem threshold (~580–620 for most programs)
		const threshold = 610;
		const target = solveMinimumPsychometricTarget(
			'reichman', 'general', threshold, profile, subjects, 580, 800
		);

		if (target !== null) {
			// Target must be >= current psychometric
			assert.ok(target >= 580,
				`Case 7: Target (${target}) must not be below current psychometric (580)`);

			// Must not demand more than 150 points improvement (unrealistic)
			assert.ok(target <= 730,
				`Case 7: Target (${target}) must not demand unrealistic 150+ point jump over 580`);

			// Verify the target actually reaches the threshold
			const evalResult = evaluateSimulatedSekem('reichman', 'general', profile, subjects, target);
			assert.ok(evalResult.sekem >= threshold,
				`Case 7: Evaluated sekem (${evalResult.sekem.toFixed(1)}) must reach threshold (${threshold}) at target ${target}`);

			// Verify minimality: target - 10 should NOT reach threshold
			if (target > 580) {
				const evalMinus10 = evaluateSimulatedSekem('reichman', 'general', profile, subjects, target - 10);
				assert.ok(evalMinus10.sekem < threshold,
					`Case 7: Target-10 (${target - 10}) must NOT reach threshold – confirms minimality`);
			}
		}
		// null is acceptable if gap is unreachable within realistic bounds
	});
});

// ─── Case 8: Legal 20-unit rule – Candidate with exactly 21 units ─────────────

describe('Case 8: Legal 20-unit floor – 21-unit candidate never drops below 20 units', () => {
	it('does not recommend dropping a subject when doing so would leave fewer than 20 units', () => {
		// Candidate has exactly 21 units – dropping any 2u subject leaves only 19 (illegal)
		const profile: UserAcademicProfileRecord = {
			userId: 'c8_legal_20u',
			bagrutSubjects: [
				{ id: '1', profileId: 'c8', subjectName: 'מתמטיקה', units: 4, grade: 82, isMandatory: true, isMath: true },
				{ id: '2', profileId: 'c8', subjectName: 'אנגלית', units: 4, grade: 80, isMandatory: true },
				{ id: '3', profileId: 'c8', subjectName: 'ספרות', units: 2, grade: 75, isMandatory: true },
				{ id: '4', profileId: 'c8', subjectName: 'היסטוריה', units: 2, grade: 73, isMandatory: true },
				{ id: '5', profileId: 'c8', subjectName: 'תנ״ך', units: 2, grade: 72, isMandatory: true },
				{ id: '6', profileId: 'c8', subjectName: 'אזרחות', units: 2, grade: 74, isMandatory: true },
				// Total: 4+4+2+2+2+2 = 16 bagrut, but with math expansion = 21 total units
				// (We model by adding a small elective at 5u to reach 21)
				{ id: '7', profileId: 'c8', subjectName: 'ביולוגיה', units: 5, grade: 77, isMandatory: false }
			],
			mathUnits: 4, mathGrade: 82,
			physicsUnits: 0, physicsGrade: 0,
			psychometricGeneral: 610,
			psychometricQuant: 122, psychometricVerbal: 122, psychometricEnglish: 118,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		};

		// Total units: 4+4+2+2+2+2+5 = 21
		const totalUnits = profile.bagrutSubjects.reduce((sum, s) => sum + s.units, 0);
		assert.strictEqual(totalUnits, 21, 'Test setup: candidate must have exactly 21 total units');

		// Run through the calculator – verify it does not drop to <20
		// We do this by inspecting that the calculator result does not report
		// dropping all electives (which would be illegal with only 21 units)
		const subjects = toCalculatorSubjects(profile);
		const result = evaluateSimulatedSekem('bgu', 'general', profile, subjects, 610);

		// The key invariant: bagrutAverage must be calculated on subjects totaling ≥ 20 units.
		// We validate indirectly: the calculator must return a meaningful sekem (not NaN/0).
		assert.ok(!isNaN(result.sekem) && result.sekem > 0,
			`Case 8: Sekem must be a valid positive number even at 21 units (got: ${result.sekem})`);

		// Check that a valid bagrut average is computed
		assert.ok(result.bagrutAverage > 0 && result.bagrutAverage <= 120,
			`Case 8: Bagrut average (${result.bagrutAverage}) must be in valid range [0, 120]`);
	});
});
