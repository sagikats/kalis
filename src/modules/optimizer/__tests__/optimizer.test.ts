/**
 * Automated Verification Test Suite for Subagent 2: Optimizer & Recommendation Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	solveMinimumPsychometricTarget,
	toCalculatorSubjects
} from '../index';

import { UserAcademicProfileRecord } from '../../db/schema';

describe('Subagent 2: Optimizer & Recommendation Algorithms', () => {
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

	it('Multi-select Psychometric Strengths: formats verbal and english split correctly', async () => {
		const { formatPsychSectionsLabel } = await import('../../../utils/analysis/trackGenerator');

		// Multi-select: quant + english
		const labelQuantEng = formatPsychSectionsLabel({
			psychExperience: 'once',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			psychStrongestSections: ['quant', 'english']
		});
		assert.equal(labelQuantEng, 'הפרק הכמותי ופרק האנגלית');

		// Multi-select: verbal + english
		const labelVerbalEng = formatPsychSectionsLabel({
			psychExperience: 'once',
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			psychStrongestSections: ['verbal', 'english']
		});
		assert.equal(labelVerbalEng, 'הפרק המילולי ופרק האנגלית');

		// Mutually exclusive balanced
		const labelBalanced = formatPsychSectionsLabel({
			psychExperience: 'once',
			learningOrientation: 'flexible',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			psychStrongestSections: ['balanced']
		});
		assert.equal(labelBalanced, 'כלל חלקי הבחינה (כמותי, מילולי ואנגלית)');
	});

	it('First-time examinee (no psychometric) generates valid targets >= 500 without 65 or phantom +deltas', async () => {
		const { generatePersonalizedTracks } = await import('../../../utils/analysis/trackGenerator');
		const { analyzeProgramGap } = await import('../../../utils/analysis/gapAnalyzer');
		const { calculateMultiInstitutionSekem } = await import('../../../utils/calculators/multiCalculator');

		const profile = {
			psychometricGeneral: 0,
			bagrutSubjects: [
				{ name: 'תנ״ך', units: 2, grade: 83 },
				{ name: 'ספרות עברית', units: 2, grade: 89 },
				{ name: 'אזרחות', units: 2, grade: 76 },
				{ name: 'היסטוריה / תע״י', units: 2, grade: 82 },
				{ name: 'הבעה עברית', units: 2, grade: 72 },
				{ name: 'אנגלית', units: 5, grade: 76 },
				{ name: 'מתמטיקה', units: 5, grade: 88 },
				{ name: 'פיזיקה', units: 5, grade: 78 }
			],
			mathUnits: 5,
			mathGrade: 88,
			physicsUnits: 5,
			physicsGrade: 78
		};

		const instResults = calculateMultiInstitutionSekem(
			{
				bagrutSubjects: profile.bagrutSubjects,
				psychometricGeneral: 0,
				psychometricQuant: 0,
				psychometricVerbal: 0,
				psychometricEnglish: 0,
				mathUnits: 5,
				mathGrade: 88,
				physicsUnits: 5,
				physicsGrade: 78
			},
			['tau']
		);
		const tauRes = instResults[0];

		const target = {
			calculatorId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			program: {
				id: 'tau-cs',
				name: 'מדעי המחשב',
				fieldOfStudy: 'מדעי המחשב',
				admissionThreshold: '705'
			}
		};

		const gap = analyzeProgramGap(target as any, profile as any, tauRes);
		const tracks = generatePersonalizedTracks(gap, profile as any, tauRes);

		assert.ok(tracks.length >= 2, 'Must generate at least 2 tracks');

		for (const track of tracks) {
			// Never propose psychometric target below 200 (valid range is 200-800)
			if (track.targetPsychometric !== undefined) {
				assert.ok(
					track.targetPsychometric >= 500,
					`Target psychometric must be >= 500 for university degree, got ${track.targetPsychometric} in track ${track.id}`
				);
			}

			// Description must never claim a "+65" or "+<target>" phantom jump when user hasn't tested
			assert.ok(
				!track.strategyDescription.includes('+65'),
				`Description must not include +65 phantom delta in track ${track.id}`
			);
			assert.ok(
				!track.strategyDescription.includes('פסיכומטרי ריאלי של 65'),
				`Description must not claim realistic psychometric of 65 in track ${track.id}`
			);

			// Sekem must reach or exceed the threshold (705)
			assert.ok(
				(track.targetSekem || 0) >= 705,
				`Target sekem must reach official admission threshold (>= 705), got ${track.targetSekem} in track ${track.id}`
			);
		}
	});
});

