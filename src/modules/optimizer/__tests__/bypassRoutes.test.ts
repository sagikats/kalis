import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	getDegreeBypassRoutes,
	generateAccurateMechinaTrack,
	generateDegreeAfikMaavarTrack,
	categorizeDegreeDomain
} from '../bypassRoutesEngine';
import { AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';

describe('Bypass Routes Engine: Mechina & Open University Transition Tracks', () => {
	const mockProfile: UserAcademicProfileRecord = {
		userId: 'user-test',
		bagrutSubjects: [
			{ id: '1', profileId: 'user-test', subjectName: 'מתמטיקה', units: 4, grade: 80, isMandatory: true, isMath: true, isPhysics: false },
			{ id: '2', profileId: 'user-test', subjectName: 'אנגלית', units: 5, grade: 85, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '3', profileId: 'user-test', subjectName: 'לשון עברית', units: 2, grade: 75, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '4', profileId: 'user-test', subjectName: 'תנ״ך', units: 2, grade: 78, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '5', profileId: 'user-test', subjectName: 'ספרות', units: 2, grade: 72, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '6', profileId: 'user-test', subjectName: 'היסטוריה', units: 2, grade: 76, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '7', profileId: 'user-test', subjectName: 'אזרחות', units: 2, grade: 80, isMandatory: true, isMath: false, isPhysics: false },
			{ id: '8', profileId: 'user-test', subjectName: 'גיאוגרפיה', units: 5, grade: 88, isMandatory: false, isMath: false, isPhysics: false }
		],
		mathUnits: 4,
		mathGrade: 80,
		physicsUnits: 0,
		physicsGrade: 0,
		psychometricGeneral: 620,
		psychometricQuant: 125,
		psychometricVerbal: 120,
		psychometricEnglish: 125,
		hasTakenPsychometric: true,
		updatedAt: new Date()
	};

	const mockPreferences: UserPreferencesRecord = {
		userId: 'user-test',
		psychExperience: 'once',
		psychFeeling: 'neutral',
		psychStrongestSection: 'quant',
		learningOrientation: 'flexible',
		learningStrength: 'analytical_quick',
		weeklyAvailabilityHours: 'part_15_25',
		targetTimeline: 'flexible',
		updatedAt: new Date()
	};

	const technionCsProgram: AcademicProgramRecord = {
		id: 'prog-technion-cs',
		institutionId: 'technion',
		institutionName: 'הטכניון - מכון טכנולוגי לישראל',
		facultyName: 'הפקולטה למדעי המחשב',
		name: 'מדעי המחשב (B.Sc)',
		fieldOfStudy: 'מדעי המחשב',
		degreeLevel: 'bachelor',
		relevantSekemType: 'engineering',
		minSekemThreshold: 88.0,
		requiresPsychometric: true,
		directBagrutEligible: false,
		prerequisites: { mustHavePsychometric: true },
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const tauEeProgram: AcademicProgramRecord = {
		id: 'prog-tau-ee',
		institutionId: 'tau',
		institutionName: 'אוניברסיטת תל אביב',
		facultyName: 'הפקולטה להנדסה',
		name: 'הנדסת חשמל (B.Sc)',
		fieldOfStudy: 'הנדסה',
		degreeLevel: 'bachelor',
		relevantSekemType: 'engineering',
		minSekemThreshold: 670,
		requiresPsychometric: true,
		directBagrutEligible: false,
		prerequisites: { mustHavePsychometric: true },
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const hujiPsychologyProgram: AcademicProgramRecord = {
		id: 'prog-huji-psych',
		institutionId: 'huji',
		institutionName: 'האוניברסיטה העברית בירושלים',
		facultyName: 'הפקולטה למדעי החברה',
		name: 'פסיכולוגיה (B.A)',
		fieldOfStudy: 'מדעי החברה',
		degreeLevel: 'bachelor',
		relevantSekemType: 'general',
		minSekemThreshold: 22.5,
		requiresPsychometric: true,
		directBagrutEligible: true,
		prerequisites: { mustHavePsychometric: false },
		createdAt: new Date(),
		updatedAt: new Date()
	};

	describe('Degree Domain Categorization', () => {
		it('should accurately categorize STEM and Social Science domains', () => {
			assert.strictEqual(categorizeDegreeDomain(technionCsProgram), 'computer_science');
			assert.strictEqual(categorizeDegreeDomain(tauEeProgram), 'engineering');
			assert.strictEqual(categorizeDegreeDomain(hujiPsychologyProgram), 'psychology_social');
		});
	});

	describe('Institutional Pre-Academic Mechina (מכינה קדם-אקדמית במוסד)', () => {
		it('should generate STEM Mechina with ZERO external Bagrut retakes (NO Geography, NO Literature)', () => {
			const mechinaTrack = generateAccurateMechinaTrack(technionCsProgram, mockProfile, mockPreferences);

			assert.ok(mechinaTrack.title.includes('המכינה הקדם-אקדמית של הטכניון'));
			assert.ok(mechinaTrack.title.includes('מדעים'));
			assert.strictEqual(mechinaTrack.type, 'mechina');

			// CRITICAL USER REQUIREMENT:
			// "תדייק את החלק של המכינות אם מישהו עושה מכינה למה הוא צריך לשפר גיאוגרפיה."
			// Must NOT contain candidate's arbitrary Bagrut subjects like Geography, Literature, etc.
			const leverNames = mechinaTrack.recommendedLevers.map((l) => l.subjectName);

			assert.ok(!leverNames.some((n) => n.includes('גיאוגרפיה')), 'Mechina must NOT include Geography!');
			assert.ok(!leverNames.some((n) => n.includes('ספרות')), 'Mechina must NOT include Literature!');
			assert.ok(!leverNames.some((n) => n.includes('תנ״ך')), 'Mechina must NOT include Tanakh!');
			assert.ok(!leverNames.some((n) => n.includes('היסטוריה')), 'Mechina must NOT include History!');

			// Must contain authentic STEM Mechina subjects:
			assert.ok(leverNames.some((n) => n.includes('מתמטיקה מכינה')), 'Must contain Math 5u Mechina');
			assert.ok(leverNames.some((n) => n.includes('פיזיקה מכינה')), 'Must contain Physics Mechina');
			assert.ok(leverNames.some((n) => n.includes('אנגלית')), 'Must contain Academic/Scientific English');

			// All Mechina levers must have currentUnits = 0 to prevent bogus (0 -> 5) diffs:
			for (const lever of mechinaTrack.recommendedLevers) {
				assert.strictEqual(lever.currentUnits, 0);
				assert.ok(lever.targetUnits > 0);
				assert.ok(lever.targetGrade >= 85);
			}
		});

		it('should generate Social Sciences Mechina with Statistics and Academic Literacy', () => {
			const mechinaTrack = generateAccurateMechinaTrack(hujiPsychologyProgram, mockProfile, mockPreferences);

			assert.ok(mechinaTrack.title.includes('האוניברסיטה העברית') || mechinaTrack.title.includes('רוח וחברה'));
			const leverNames = mechinaTrack.recommendedLevers.map((l) => l.subjectName);

			assert.ok(leverNames.some((n) => n.includes('סטטיסטיקה') || n.includes('מתמטיקה יישומית')));
			assert.ok(leverNames.some((n) => n.includes('אוריינות אקדמית') || n.includes('אנגלית')));
			assert.ok(!leverNames.some((n) => n.includes('גיאוגרפיה')));
		});
	});

	describe('Open University Transition Tracks (אפיק מעבר מהאוניברסיטה הפתוחה)', () => {
		it('should generate official Open University Transition Route for Technion CS', () => {
			const afikTrack = generateDegreeAfikMaavarTrack(technionCsProgram, mockProfile, mockPreferences);

			assert.ok(afikTrack, 'Afik Maavar track must be generated');
			assert.ok(afikTrack.title.includes('האוניברסיטה הפתוחה'));
			assert.ok(afikTrack.title.includes('מדעי המחשב'));
			assert.strictEqual(afikTrack.targetPsychometric, 0, 'Must grant 100% exemption from Psychometric');

			// Must contain official Open University course numbers:
			const courseNames = afikTrack.recommendedLevers.map((l) => l.subjectName);
			assert.ok(courseNames.some((n) => n.includes('20474')), 'Must contain Infi 1 (20474)');
			assert.ok(courseNames.some((n) => n.includes('20475') || n.includes('20485')), 'Must contain Infi 2 or Linear 1');
			assert.ok(courseNames.some((n) => n.includes('20441')), 'Must contain Java (20441)');

			// Must have realistic milestones:
			assert.ok(afikTrack.milestones.length >= 3);
			assert.ok(afikTrack.milestones[0].detail.includes('סמסטר') || afikTrack.milestones[0].timing.includes('שבועות'));
			assert.ok(afikTrack.milestones[2].title.includes('מעבר ישיר') || afikTrack.milestones[2].title.includes('קליטה'));
		});

		it('should generate official Open University Transition Route for TAU Electrical Engineering', () => {
			const afikTrack = generateDegreeAfikMaavarTrack(tauEeProgram, mockProfile, mockPreferences);

			assert.ok(afikTrack, 'Afik Maavar track must be generated');
			assert.ok(afikTrack.title.includes('הנדסת חשמל'));
			const courseNames = afikTrack.recommendedLevers.map((l) => l.subjectName);
			assert.ok(courseNames.some((n) => n.includes('20474') || n.includes('20187')), 'Must contain Infi or Mechanics');
		});
	});

	describe('getDegreeBypassRoutes Composite Wrapper', () => {
		it('should return both Mechina and Afik Maavar tracks with detailed spec for supported degree', () => {
			const result = getDegreeBypassRoutes(technionCsProgram, mockProfile, mockPreferences);

			assert.ok(result.mechinaTrack);
			assert.ok(result.afikMaavarTrack);
			assert.strictEqual(result.hasAfikMaavar, true);
			assert.ok(result.afikSpec);

			assert.strictEqual(result.afikSpec.targetInstitutionName, 'הטכניון - מכון טכנולוגי לישראל');
			assert.strictEqual(result.afikSpec.requiredGpa, 85);
			assert.strictEqual(result.afikSpec.minCourseGrade, 80);
			assert.ok(result.afikSpec.requiredCredits >= 24);
			assert.ok(result.afikSpec.courses.length >= 4);
		});
	});
});
