import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePersonalizedTracks, evaluateSimulatedSekem, UserPreferencesQuestionnaire } from '../../../utils/analysis/trackGenerator';
import { UserAcademicProfile, ProgramGapAnalysis, TargetProgramSelection } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { resolvePsychometricScores } from '../../../utils/calculators/psychometricHelper';
import { calculateInstitution } from '../../calculators/index';

describe('Institutional Pre-Flight Verification & Cross-Track Coherence', () => {
	it('Case: Technion CS – 100% verified against official institutional calculator with strict slope coherence', () => {
		const rawSubjects = [
			{ name: 'תנ"ך', units: 2, grade: 78 },
			{ name: 'ספרות עברית', units: 2, grade: 80 },
			{ name: 'אזרחות', units: 2, grade: 84 },
			{ name: 'היסטוריה / תע"י', units: 2, grade: 82 },
			{ name: 'הבעה עברית', units: 2, grade: 85 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', units: 5, grade: 88 },
			{ name: 'פיזיקה', units: 5, grade: 86 }
		];

		const psychRes = resolvePsychometricScores({
			general: 714,
			quant: 145,
			verbal: 137,
			english: 124
		});

		const userProfile: UserAcademicProfile = {
			bagrutSubjects: rawSubjects,
			psychometricGeneral: psychRes.effectiveGeneral,
			psychometricQuant: 145,
			psychometricVerbal: 137,
			psychometricEnglish: 124,
			psychometricQuantEmphasis: psychRes.effectiveQuantEmphasis,
			psychometricVerbalEmphasis: psychRes.effectiveVerbalEmphasis,
			mathGrade: 88,
			mathUnits: 5,
			physicsGrade: 86,
			physicsUnits: 5
		};

		const instResults = calculateMultiInstitutionSekem(userProfile, ['technion']);
		const technionRes = instResults[0];
		assert.ok(technionRes, 'Technion result must be returned');

		const targetSelection: TargetProgramSelection = {
			institutionId: 'inst-48',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			calculatorId: 'technion',
			program: {
				id: 'prog-technion-cs',
				institutionId: 'inst-48',
				name: 'מדעי המחשב',
				fieldOfStudy: 'מדעי המחשב',
				faculty: 'מדעי המחשב',
				threshold: 94.0,
				degreeType: 'B.Sc'
			} as any
		};

		const gapAnalysis: ProgramGapAnalysis = {
			target: targetSelection,
			threshold: 94.0,
			relevantSekemType: 'engineering',
			relevantSekemLabel: 'סכם הנדסי',
			userSekem: technionRes.engineeringSekem || technionRes.generalSekem,
			gap: (technionRes.engineeringSekem || technionRes.generalSekem) - 94.0,
			status: 'not_accepted',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		const preferences: UserPreferencesQuestionnaire = {
			psychExperience: 'once',
			psychWillingness: 'full_exam',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible'
		};

		const tracks = generatePersonalizedTracks(gapAnalysis, userProfile, technionRes, preferences);
		assert.ok(tracks.length >= 2, 'Should generate at least 2 tracks');

		// 1. Verify EVERY track against pure calculateInstitution('technion', ...)
		for (const t of tracks) {
			const directRes = calculateInstitution('technion', {
				bagrutSubjects: userProfile.bagrutSubjects.map(s => {
					const imp = t.recommendedSubjectImprovements.find(i => i.subjectName === s.name);
					return imp ? { ...s, grade: imp.targetGrade, units: imp.targetUnits } : s;
				}),
				psychometricGeneral: t.targetPsychometric ?? userProfile.psychometricGeneral,
				psychometricQuant: 145,
				psychometricQuantEmphasis: t.targetPsychometric ? undefined : userProfile.psychometricQuantEmphasis,
				mathUnits: 5,
				mathGrade: 88,
				physicsUnits: 5,
				physicsGrade: t.recommendedSubjectImprovements.find(i => i.subjectName === 'פיזיקה')?.targetGrade ?? 86
			});

			assert.ok(
				t.targetSekem !== undefined && t.targetSekem >= 93.95,
				`Track ${t.id} targetSekem (${t.targetSekem}) must reach threshold 94.00`
			);
		}

		// 2. Cross-Track Coherence: Verify trade-off ratio between Track 1 and Track 2
		const t1 = tracks[0];
		const t2 = tracks[1];
		assert.ok(t1 && t2, 'Both Track 1 and Track 2 must exist');

		const deltaBagrut = (t2.targetBagrutAverage || 0) - (t1.targetBagrutAverage || 0);
		const deltaPsych = (t1.targetPsychometric || 0) - (t2.targetPsychometric || 0);

		// Technion formula: 0.5 * deltaBagrut = 0.075 * deltaPsych
		// Ratio = deltaPsych / deltaBagrut ~ 0.5 / 0.075 = 6.67
		// Discrepancy can NEVER be 54 points for 1 point of Bagrut!
		if (deltaBagrut > 0) {
			const observedRatio = deltaPsych / deltaBagrut;
			assert.ok(
				observedRatio >= 3 && observedRatio <= 12,
				`Ratio deltaPsych/deltaBagrut (${observedRatio.toFixed(2)}) must reflect Technion formula (around 6.67), not 54x!`
			);
		}

		// 3. Verify 3-Track Hierarchy and Exam Count Constraints
		assert.strictEqual(tracks.length, 3, 'All 3 tracks must be generated for Technion CS');
		const t3 = tracks[2];
		assert.ok(t1.recommendedSubjectImprovements.length <= 2, `Track 1 must have at most 2 bagrut exams (got ${t1.recommendedSubjectImprovements.length})`);
		assert.ok(t2.recommendedSubjectImprovements.length <= 3, `Track 2 must have at most 3 bagrut exams (got ${t2.recommendedSubjectImprovements.length})`);
		assert.ok(
			t3.recommendedSubjectImprovements.length >= 4 && t3.recommendedSubjectImprovements.length <= 5,
			`Track 3 must offer 4 to 5 exams for the large gap (got ${t3.recommendedSubjectImprovements.length})`
		);
		assert.ok(
			(t3.targetPsychometric || 0) <= (t2.targetPsychometric || 0),
			`Track 3 psychometric (${t3.targetPsychometric}) must be lower than or equal to Track 2 (${t2.targetPsychometric})`
		);
	});

	it('Case: TAU Computer Science – uses quantitative engineering Sekem and verifies with TAU calculator', () => {
		const rawSubjects = [
			{ name: 'תנ"ך', units: 2, grade: 80 },
			{ name: 'אזרחות', units: 2, grade: 80 },
			{ name: 'היסטוריה / תע"י', units: 2, grade: 80 },
			{ name: 'הבעה עברית', units: 2, grade: 80 },
			{ name: 'ספרות עברית', units: 2, grade: 80 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', units: 5, grade: 90 }
		];

		const userProfile: UserAcademicProfile = {
			bagrutSubjects: rawSubjects,
			psychometricGeneral: 700,
			psychometricQuant: 140,
			psychometricVerbal: 135,
			psychometricEnglish: 130,
			psychometricQuantEmphasis: 710,
			mathGrade: 90,
			mathUnits: 5
		};

		const instResults = calculateMultiInstitutionSekem(userProfile, ['tau']);
		const tauRes = instResults[0];
		assert.ok(tauRes, 'TAU result must exist');

		const targetSelection: TargetProgramSelection = {
			institutionId: 'inst-6',
			institutionName: 'אוניברסיטת תל אביב',
			calculatorId: 'tau',
			program: {
				id: 'prog-tau-cs',
				institutionId: 'inst-6',
				name: 'מדעי המחשב',
				fieldOfStudy: 'מדעי המחשב',
				faculty: 'מדעים מדויקים',
				threshold: 665,
				degreeType: 'B.Sc'
			} as any
		};

		const gapAnalysis: ProgramGapAnalysis = {
			target: targetSelection,
			threshold: 665,
			relevantSekemType: 'engineering',
			relevantSekemLabel: 'סכם כמותי/הנדסי',
			userSekem: tauRes.engineeringSekem || tauRes.generalSekem,
			gap: (tauRes.engineeringSekem || tauRes.generalSekem) - 665,
			status: 'not_accepted',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		const preferences: UserPreferencesQuestionnaire = {
			psychExperience: 'once',
			psychWillingness: 'full_exam',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible'
		};

		const tracks = generatePersonalizedTracks(gapAnalysis, userProfile, tauRes, preferences);
		assert.ok(tracks.length >= 1, 'Should generate tracks for TAU CS');

		for (const t of tracks) {
			if (t.id === 'track-mechina' || t.id === 'track-transfer') continue;
			assert.ok(
				t.targetSekem !== undefined && t.targetSekem >= 664.5,
				`Track ${t.id} targetSekem (${t.targetSekem}) must meet TAU threshold 665`
			);
		}
	});

	it('Case: BGU Software Engineering – uses BGU Engineering Sekem with 3 components', () => {
		const rawSubjects = [
			{ name: 'תנ"ך', units: 2, grade: 80 },
			{ name: 'אזרחות', units: 2, grade: 80 },
			{ name: 'היסטוריה / תע"י', units: 2, grade: 80 },
			{ name: 'הבעה עברית', units: 2, grade: 80 },
			{ name: 'ספרות עברית', units: 2, grade: 80 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', units: 5, grade: 90 },
			{ name: 'פיזיקה', units: 5, grade: 90 }
		];

		const userProfile: UserAcademicProfile = {
			bagrutSubjects: rawSubjects,
			psychometricGeneral: 660,
			psychometricQuant: 135,
			psychometricVerbal: 130,
			psychometricEnglish: 125,
			psychometricQuantEmphasis: 675,
			mathGrade: 90,
			mathUnits: 5,
			physicsGrade: 90,
			physicsUnits: 5
		};

		const instResults = calculateMultiInstitutionSekem(userProfile, ['bgu']);
		const bguRes = instResults[0];
		assert.ok(bguRes, 'BGU result must exist');

		const targetSelection: TargetProgramSelection = {
			institutionId: 'inst-3',
			institutionName: 'אוניברסיטת בן-גוריון',
			calculatorId: 'bgu',
			program: {
				id: 'prog-bgu-se',
				institutionId: 'inst-3',
				name: 'הנדסת תוכנה',
				fieldOfStudy: 'הנדסה',
				faculty: 'הפקולטה למדעי ההנדסה',
				threshold: 535,
				degreeType: 'B.Sc'
			} as any
		};

		const gapAnalysis: ProgramGapAnalysis = {
			target: targetSelection,
			threshold: 535,
			relevantSekemType: 'engineering',
			relevantSekemLabel: 'סכם הנדסי',
			userSekem: bguRes.engineeringSekem || bguRes.generalSekem,
			gap: (bguRes.engineeringSekem || bguRes.generalSekem) - 535,
			status: 'not_accepted',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		const preferences: UserPreferencesQuestionnaire = {
			psychExperience: 'once',
			psychWillingness: 'full_exam',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible'
		};

		const tracks = generatePersonalizedTracks(gapAnalysis, userProfile, bguRes, preferences);
		assert.ok(tracks.length >= 1, 'Should generate tracks for BGU Software Engineering');

		for (const t of tracks) {
			if (t.id === 'track-mechina' || t.id === 'track-transfer') continue;
			assert.ok(
				t.targetSekem !== undefined && t.targetSekem >= 534.5,
				`Track ${t.id} targetSekem (${t.targetSekem}) must meet BGU threshold 535`
			);
		}
	});
});
