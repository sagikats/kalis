import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUserGrades } from '../../../utils/analysis/gradeValidation';
import { generatePersonalizedTracks } from '../../../utils/analysis/trackGenerator';
import { ProgramGapAnalysis, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { InstitutionSekemResult } from '../../../utils/calculators/multiCalculator';

describe('Matriculation Grade Validation & Empty State Guards', () => {
	const defaultBlankSubjects = [
		{ name: 'תנ"ך', units: 2, grade: 0 },
		{ name: 'ספרות עברית', units: 2, grade: 0 },
		{ name: 'אזרחות', units: 2, grade: 0 },
		{ name: 'היסטוריה / תע"י', units: 2, grade: 0 },
		{ name: 'הבעה עברית', units: 2, grade: 0 },
		{ name: 'אנגלית', units: 5, grade: 0 },
		{ name: 'מתמטיקה', units: 5, grade: 0 }
	];

	it('should invalidate blank default subjects (all grades = 0)', () => {
		const res = validateUserGrades(defaultBlankSubjects, true, '');
		assert.equal(res.isValid, false);
		assert.equal(res.missingBagrutCount, 7);
		assert.ok(res.errorMessage?.includes('חסר ציון'));
	});

	it('should invalidate when total valid units < 20', () => {
		const incompleteSubjects = [
			{ name: 'תנ"ך', units: 2, grade: 80 },
			{ name: 'אנגלית', units: 5, grade: 85 },
			{ name: 'מתמטיקה', units: 5, grade: 90 }
		]; // total = 12 units
		const res = validateUserGrades(incompleteSubjects, false, '');
		assert.equal(res.isValid, false);
		assert.ok(res.errorMessage?.includes('20 יח״ל'));
	});

	it('should invalidate when psychometric is claimed as taken but score is missing', () => {
		const validBagrut = [
			{ name: 'תנ"ך', units: 2, grade: 80 },
			{ name: 'ספרות עברית', units: 2, grade: 85 },
			{ name: 'אזרחות', units: 2, grade: 80 },
			{ name: 'היסטוריה / תע"י', units: 2, grade: 85 },
			{ name: 'הבעה עברית', units: 2, grade: 80 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', units: 5, grade: 90 }
		]; // total = 20 units
		const res = validateUserGrades(validBagrut, true, '');
		assert.equal(res.isValid, false);
		assert.equal(res.isPsychometricMissing, true);
		assert.ok(res.errorMessage?.includes('פסיכומטרי'));
	});

	it('should validate when user has not taken psychometric and has 20+ units with valid grades', () => {
		const validBagrut = [
			{ name: 'תנ"ך', units: 2, grade: 80 },
			{ name: 'ספרות עברית', units: 2, grade: 85 },
			{ name: 'אזרחות', units: 2, grade: 80 },
			{ name: 'היסטוריה / תע"י', units: 2, grade: 85 },
			{ name: 'הבעה עברית', units: 2, grade: 80 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', units: 5, grade: 90 }
		];
		const res = validateUserGrades(validBagrut, false, 0);
		assert.equal(res.isValid, true);
		assert.equal(res.totalValidUnits, 20);
		assert.equal(res.missingBagrutCount, 0);
	});

	it('should strictly return empty tracks [] from generatePersonalizedTracks when user has not entered grades', () => {
		const blankProfile: UserAcademicProfile = {
			bagrutSubjects: defaultBlankSubjects,
			psychometricGeneral: 0,
			psychometricQuant: 0,
			psychometricVerbal: 0,
			psychometricEnglish: 0,
			mathGrade: 0,
			mathUnits: 5,
			physicsGrade: 0,
			physicsUnits: 0
		};

		const dummyInstRes: InstitutionSekemResult = {
			institutionId: 'technion',
			institutionName: 'הטכניון',
			logoText: 'IIT',
			badgeColor: '#002D62',
			bagrutAverage: 0,
			generalSekem: 0,
			directBagrutEligible: false
		};

		const dummyGap: ProgramGapAnalysis = {
			target: {
				institutionId: 'inst-48',
				institutionName: 'הטכניון',
				calculatorId: 'technion',
				program: {
					id: 'prog-1',
					name: 'מדעי המחשב',
					institutionId: 'inst-48',
					faculty: 'מדעי המחשב',
					fieldOfStudy: 'מדעי המחשב',
					degreeType: 'bachelor',
					admissionThreshold: 88,
					prerequisites: []
				} as any
			},
			userSekem: 0,
			threshold: 88,
			gap: -88,
			status: 'not_accepted',
			relevantSekemType: 'engineering',
			relevantSekemLabel: 'סכם הנדסה',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		const preferences = {
			psychExperience: 'never' as const,
			psychFeeling: 'high_potential' as const,
			psychStrongestSection: 'balanced' as const,
			learningOrientation: 'flexible' as const,
			learningStrength: 'analytical_quick' as const,
			weeklyAvailabilityHours: 'part_15_25' as const,
			targetTimeline: 'immediate_october' as const
		};

		const tracks = generatePersonalizedTracks(dummyGap, blankProfile, dummyInstRes, preferences);
		assert.deepEqual(tracks, [], 'Engine must return empty array when no valid grades entered');
	});
});
