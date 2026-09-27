import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePersonalizedTracks, UserPreferencesQuestionnaire } from '../../../utils/analysis/trackGenerator';
import { UserAcademicProfile, ProgramGapAnalysis, TargetProgramSelection } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { resolvePsychometricScores } from '../../../utils/calculators/psychometricHelper';
import { isSubjectMatch } from '../../optimizer/solver';

describe('Technion Electrical Engineering Verification Debug', () => {
	it('inspects generated tracks and verification subject mapping', () => {
		const rawSubjects = [
			{ name: 'תנ״ך', subjectName: 'תנ״ך', units: 5, grade: 92 },
			{ name: 'ספרות עברית', subjectName: 'ספרות עברית', units: 5, grade: 91 },
			{ name: 'אזרחות', subjectName: 'אזרחות', units: 2, grade: 93 },
			{ name: 'היסטוריה', subjectName: 'היסטוריה', units: 5, grade: 91 },
			{ name: 'הבעה עברית', subjectName: 'הבעה עברית', units: 2, grade: 91 },
			{ name: 'אנגלית', subjectName: 'אנגלית', units: 5, grade: 90 },
			{ name: 'מתמטיקה', subjectName: 'מתמטיקה', units: 5, grade: 87 },
			{ name: 'מדעי המחשב', subjectName: 'מדעי המחשב', units: 5, grade: 86 }
		];

		const psychRes = resolvePsychometricScores({
			general: 730,
			quant: 140,
			verbal: 135,
			english: 135
		});

		const userProfile: UserAcademicProfile = {
			bagrutSubjects: rawSubjects,
			psychometricGeneral: 730,
			psychometricQuant: 140,
			psychometricVerbal: 135,
			psychometricEnglish: 135,
			psychometricQuantEmphasis: 735,
			psychometricVerbalEmphasis: 725,
			mathGrade: 87,
			mathUnits: 5
		};

		const instResults = calculateMultiInstitutionSekem(userProfile, ['technion']);
		const technionRes = instResults[0];
		console.log('Technion Result Full:', JSON.stringify(technionRes, null, 2));

		const targetSelection: TargetProgramSelection = {
			institutionId: 'inst-48',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			calculatorId: 'technion',
			program: {
				id: 'prog-technion-ee',
				institutionId: 'inst-48',
				name: 'הנדסת חשמל',
				fieldOfStudy: 'הנדסת חשמל',
				faculty: 'הנדסת חשמל',
				threshold: 94.0,
				degreeType: 'B.Sc'
			} as any
		};

		const gapAnalysis: ProgramGapAnalysis = {
			target: targetSelection,
			userSekem: 93.2,
			threshold: 94.0,
			gap: -0.8,
			status: 'borderline',
			relevantSekemType: 'technion',
			relevantSekemLabel: 'סכם טכניון',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		const answers: UserPreferencesQuestionnaire = {
			psychExperience: 'multiple',
			psychFeeling: 'high_potential',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible'
		};

		const tracks = generatePersonalizedTracks(gapAnalysis, userProfile, technionRes, answers);
		console.log('Generated tracks count:', tracks.length);
		tracks.forEach((t, i) => {
			console.log(`\n=== TRACK ${i + 1}: ${t.title} ===`);
			console.log('Target Sekem:', t.targetSekem);
			console.log('Target Psychometric:', t.targetPsychometric);
			console.log('Target Bagrut:', t.targetBagrutAverage);
			console.log('Improvements count:', t.recommendedSubjectImprovements.length);
			t.recommendedSubjectImprovements.forEach((imp) => {
				console.log(`  - ${imp.subjectName}: ${imp.currentGrade} -> ${imp.targetGrade} (${imp.targetUnits}u)`);
			});

			// Now test subject matching as done in UniversityVerificationModal:
			const improvements = t.recommendedSubjectImprovements;
			const verificationSubjects: any[] = [];
			rawSubjects.forEach((sub) => {
				const sName = sub.name;
				const matchingImp = improvements.find((imp) => isSubjectMatch(sName, imp.subjectName));
				if (matchingImp) {
					verificationSubjects.push({
						name: sName,
						units: matchingImp.targetUnits || sub.units,
						grade: matchingImp.targetGrade || sub.grade,
						isUpgraded: true
					});
				} else {
					verificationSubjects.push({
						name: sName,
						units: sub.units,
						grade: sub.grade,
						isUpgraded: false
					});
				}
			});

			console.log('Verification Subjects:');
			verificationSubjects.forEach((vs) => {
				console.log(`    ${vs.name} (${vs.units}u): ${vs.grade} ${vs.isUpgraded ? '[UPGRADED]' : ''}`);
			});
		});
	});
});
