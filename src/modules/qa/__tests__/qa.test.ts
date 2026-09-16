/**
 * Subagent 5: Automated QA & Track Quality Auditor Unit Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { auditSingleTrack, auditScenario } from '../trackAuditor';
import { QAProgramTarget } from '../types';
import { UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { RecommendedTrack, UserPreferencesQuestionnaire } from '../../../utils/analysis/trackGenerator';
import { runBatchAudit } from '../runner';

describe('Subagent 5: QA & Track Quality Auditor Tests', () => {
	const defaultPref: UserPreferencesQuestionnaire = {
		weeklyAvailabilityHours: 'full_30_plus',
		learningOrientation: 'flexible',
		learningStrength: 'analytical_quick',
		psychExperience: 'never',
		targetTimeline: 'flexible'
	};

	const testProgram: QAProgramTarget = {
		id: 'prog-test-cs-1',
		institutionId: 'inst-6',
		institutionName: 'אוניברסיטת תל אביב',
		calculatorId: 'tau',
		fieldOfStudy: 'מדעי המחשב',
		degreeLevel: 'B.Sc',
		admissionThreshold: 720,
		psychometricScore: 720,
		directBagrutEligible: false,
		directBagrutMinAverage: null,
		requiresPsychometric: true,
		minPsychometricFloor: 600,
		relevantSekemType: 'engineering'
	};

	const testProfile: UserAcademicProfile = {
		bagrutSubjects: [
			{ name: 'מתמטיקה', units: 5, grade: 90 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'פיזיקה', units: 5, grade: 90 },
			{ name: 'ספרות', units: 2, grade: 80 },
			{ name: 'תנ״ך', units: 2, grade: 80 },
			{ name: 'היסטוריה', units: 2, grade: 80 },
			{ name: 'אזרחות', units: 2, grade: 80 }
		],
		psychometricGeneral: 650,
		mathGrade: 90,
		mathUnits: 5,
		physicsUnits: 5,
		physicsGrade: 90,
		bagrutAverage: 108.0
	};

	test('Flag critical penalty when Sekem on card deviates from pure calculator (Math Discrepancy)', () => {
		const fakeTrack: RecommendedTrack = {
			id: 'track-1',
			title: 'מסלול בדיקה עם פער',
			badge: 'בדיקה',
			badgeColor: 'blue',
			strategyDescription: 'בדיקה',
			targetSekem: 740, // Intentional lie: true sekem will be ~700
			targetPsychometric: 650,
			recommendedSubjectImprovements: [],
			estimatedWeeks: 10,
			weeklyHours: 15,
			feasibility: 'high',
			feasibilityExplanation: 'בדיקה',
			steps: [],
			keyAdvantage: 'בדיקה'
		};

		const report = auditSingleTrack(fakeTrack, testProgram, testProfile, defaultPref, 'tau', 720);
		assert.strictEqual(report.isValid, false);
		assert.ok(report.issues.some((i) => i.code === 'MATH_DISCREPANCY'));
		assert.ok(report.qualityScore < 80);
	});

	test('Flag critical penalty when target psychometric violates degree floor', () => {
		const progWithHighFloor: QAProgramTarget = {
			...testProgram,
			minPsychometricFloor: 680
		};

		const fakeTrack: RecommendedTrack = {
			id: 'track-floor-violation',
			title: 'מסלול המפר רצפה',
			badge: 'בדיקה',
			badgeColor: 'blue',
			strategyDescription: 'בדיקה',
			targetSekem: 725,
			targetPsychometric: 620, // Below 680 floor!
			recommendedSubjectImprovements: [],
			estimatedWeeks: 10,
			weeklyHours: 15,
			feasibility: 'high',
			feasibilityExplanation: 'בדיקה',
			steps: [],
			keyAdvantage: 'בדיקה'
		};

		const report = auditSingleTrack(fakeTrack, progWithHighFloor, testProfile, defaultPref, 'tau', 720);
		assert.strictEqual(report.isValid, false);
		assert.ok(report.issues.some((i) => i.code === 'PREREQUISITE_VIOLATION'));
	});

	test('Flag critical penalty when candidate qualifies for direct admission but track proposes exams', () => {
		const adelProfile: UserAcademicProfile = {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 96 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'כימיה', units: 5, grade: 98 }
			],
			psychometricGeneral: 0,
			mathGrade: 96,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 110.86
		};

		const biuMathProgram: QAProgramTarget = {
			id: 'prog-inst-4-49',
			institutionId: 'inst-4',
			institutionName: 'אוניברסיטת בר אילן',
			calculatorId: 'bar_ilan',
			fieldOfStudy: 'מתמטיקה',
			degreeLevel: 'B.Sc',
			admissionThreshold: 600,
			psychometricScore: 600,
			directBagrutEligible: true,
			directBagrutMinAverage: 100.0,
			requiresPsychometric: false,
			relevantSekemType: 'general'
		};

		const badTrackWithExams: RecommendedTrack = {
			id: 'track-bad',
			title: 'מסלול מיותר עם בחינות',
			badge: 'בדיקה',
			badgeColor: 'blue',
			strategyDescription: 'בדיקה',
			targetSekem: 660,
			targetPsychometric: 550,
			recommendedSubjectImprovements: [
				{ subjectName: 'אנגלית', currentGrade: 80, targetGrade: 95, currentUnits: 5, targetUnits: 5, reason: 'שיפור' }
			],
			estimatedWeeks: 12,
			weeklyHours: 15,
			feasibility: 'high',
			feasibilityExplanation: 'בדיקה',
			steps: [],
			keyAdvantage: 'בדיקה'
		};

		const scenarioReport = auditScenario(
			{
				id: 'adel_test',
				name: 'אדל',
				description: 'בדיקת קבלה ישירה',
				profile: adelProfile,
				preferences: defaultPref,
				targetProgramId: 'prog-inst-4-49',
				expectedBehaviors: {
					mustAchieveAdmission: true,
					expectedDirectBagrut: true
				}
			},
			biuMathProgram,
			[badTrackWithExams]
		);

		assert.strictEqual(scenarioReport.hasCriticalErrors, true);
		assert.ok(scenarioReport.trackReports[0].issues.some((i) => i.code === 'REDUNDANT_EXAMS'));
	});

	test('Run batch audit on benchmark suite without runtime errors', () => {
		const summary = runBatchAudit();
		assert.ok(summary.totalScenariosTested > 10);
		assert.ok(summary.totalTracksAudited > 20);
		assert.ok(summary.averageQualityScore > 0);
	});
});
