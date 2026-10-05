import { test } from 'node:test';
import assert from 'node:assert';
import { generatePersonalizedTracks } from '../../../utils/analysis/trackGenerator';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap } from '../../../utils/analysis/gapAnalyzer';

test('WhatIfDegreeSwitchSync: verifies primary recommended track is loaded on degree switch', async () => {
	// Candidate Sagi Profile
	const userProfile = {
		bagrutSubjects: [
			{ name: 'מתמטיקה', units: 5, grade: 87 },
			{ name: 'אנגלית', units: 5, grade: 90 },
			{ name: 'פיזיקה', units: 5, grade: 88 },
			{ name: 'היסטוריה / תע"י', units: 5, grade: 91 },
			{ name: 'ספרות עברית', units: 2, grade: 89 },
			{ name: 'תנ"ך', units: 2, grade: 83 },
			{ name: 'אזרחות', units: 2, grade: 90 },
			{ name: 'הבעה עברית', units: 2, grade: 72 },
			{ name: 'מדעי המחשב', units: 5, grade: 95 }
		],
		mathUnits: 5,
		mathGrade: 87,
		physicsUnits: 5,
		physicsGrade: 88,
		psychometricGeneral: 616,
		psychometricQuant: 130,
		psychometricVerbal: 115,
		psychometricEnglish: 125,
		hasTakenPsychometric: true
	};

	const multiRes = calculateMultiInstitutionSekem(userProfile, ['bar_ilan', 'technion', 'tau']);
	const biuRes = multiRes.find((r) => r.institutionId === 'bar_ilan')!;
	const technionRes = multiRes.find((r) => r.institutionId === 'technion')!;

	// 1. Program A: BIU computer science (official threshold 74 on Bar-Ilan's 0–100 scale)
	const biuMedicineSelection = {
		institutionId: 'bar_ilan',
		institutionName: 'אוניברסיטת בר אילן',
		calculatorId: 'bar_ilan',
		program: {
			id: 'prog-inst-4-41',
			name: 'מדעי המחשב',
			fieldOfStudy: 'מדעי המחשב',
			admissionThreshold: 90,
			minSekemThreshold: 90,
			relevantSekemType: 'quantitative',
			requiresPsychometric: true,
			directBagrutEligible: false
		} as any
	};
	const biuGap = analyzeProgramGap(biuMedicineSelection, userProfile, biuRes);

	const preferences = {
		psychExperience: 'multiple' as const,
		psychWillingness: 'full_exam' as const,
		psychFeeling: 'high_potential' as const,
		psychStrongestSection: 'quant' as const,
		learningOrientation: 'stem' as const,
		learningStrength: 'analytical_quick' as const,
		weeklyAvailabilityHours: 'part_15_25' as const,
		targetTimeline: 'immediate_october' as const
	};

	const biuTracks = generatePersonalizedTracks(biuGap, userProfile, biuRes);
	// Bar-Ilan CS is almost all psychometric: no bagrut lowers the target by 10+, so only track 1 (docs/TRACKS_REDESIGN.md)
	assert.ok(biuTracks.length >= 1, 'BIU program should have a track');
	for (let i = 1; i < biuTracks.length; i++) {
		assert.ok(biuTracks[i].targetPsychometric! <= biuTracks[i - 1].targetPsychometric! - 10, 'each further track lowers the psychometric by 10+');
	}
	const biuPrimary = biuTracks.find((t) => t.badge === 'הכי מומלץ') || biuTracks[0];
	assert.ok(biuPrimary, 'BIU program must have a primary track');
	assert.equal(biuPrimary.targetSekem! >= 90, true, 'BIU track reaches threshold');

	// 2. Program B: Technion Computer Science
	const technionCsSelection = {
		institutionId: 'technion',
		institutionName: 'הטכניון - מכון טכנולוגי לישראל',
		calculatorId: 'technion',
		program: {
			id: 'prog-inst-48-1',
			name: 'מדעי המחשב',
			fieldOfStudy: 'מדעי המחשב',
			admissionThreshold: 88,
			minSekemThreshold: 88,
			requiresPsychometric: true,
			directBagrutEligible: false
		} as any
	};
	const technionGap = analyzeProgramGap(technionCsSelection, userProfile, technionRes);
	const technionTracks = generatePersonalizedTracks(technionGap, userProfile, technionRes);
	assert.ok(technionTracks.length >= 1, 'Technion CS must have tracks');
	const technionPrimary = technionTracks.find((t) => t.badge === 'הכי מומלץ') || technionTracks[0];
	assert.ok(technionPrimary, 'Technion CS must have a primary track');

	// Verify that the two primary tracks are distinct and degree-specific
	assert.notEqual(biuPrimary.targetSekem, technionPrimary.targetSekem, 'Different scales between BIU and Technion');
	assert.ok(technionPrimary.targetSekem! >= 88, 'Technion primary track satisfies 88 threshold');
});
