/**
 * Subagent 5: Automated QA & Track Quality Auditor
 * Track Auditor Engine
 */

import { RecommendedTrack, UserPreferencesQuestionnaire } from '../../utils/analysis/trackGenerator';
import { UserAcademicProfile } from '../../utils/analysis/gapAnalyzer';
import { calculateInstitution } from '../calculators';
import { CalculatorSubject, InstitutionCalculatorResult } from '../calculators/types';
import { QAProgramTarget, TrackAuditIssue, TrackAuditMetrics, TrackAuditReport, ScenarioAuditReport, StudentArchetype } from './types';
import { isSubjectMatch } from '../optimizer/solver';
import { simulateRealisticSubscores } from '../../utils/calculators/psychometricHelper';

/**
 * Reconstructs simulated subjects and special science units from a track's improvements
 */
export function applyTrackImprovementsToProfile(
	profile: UserAcademicProfile,
	track: RecommendedTrack
): {
	simSubjects: CalculatorSubject[];
	simMathU: number;
	simMathG: number;
	simPhysU: number;
	simPhysG: number;
} {
	let simMathU = profile.mathUnits || 4;
	let simMathG = profile.mathGrade || 80;
	let simPhysU = profile.physicsUnits || 0;
	let simPhysG = profile.physicsGrade || 0;

	// Start with candidate's existing subjects
	const subsMap = new Map<string, { units: number; grade: number }>();
	for (const s of profile.bagrutSubjects || []) {
		subsMap.set(s.name.trim(), { units: s.units, grade: s.grade });
	}

	for (const imp of track.recommendedSubjectImprovements || []) {
		const name = imp.subjectName.trim();
		const u = imp.targetUnits;
		const g = imp.targetGrade;

		if (isSubjectMatch(name, 'מתמטיקה')) {
			simMathU = u;
			simMathG = g;
		} else if (isSubjectMatch(name, 'פיזיקה')) {
			simPhysU = u;
			simPhysG = g;
		}

		// Update or insert into map
		let foundExistingKey: string | null = null;
		for (const k of subsMap.keys()) {
			if (isSubjectMatch(k, name)) {
				foundExistingKey = k;
				break;
			}
		}

		if (foundExistingKey) {
			subsMap.set(foundExistingKey, { units: u, grade: g });
		} else {
			subsMap.set(name, { units: u, grade: g });
		}
	}

	// Always ensure math is explicitly present
	let mathKey = Array.from(subsMap.keys()).find((k) => isSubjectMatch(k, 'מתמטיקה'));
	if (mathKey) {
		subsMap.set(mathKey, { units: simMathU, grade: simMathG });
	} else {
		subsMap.set('מתמטיקה', { units: simMathU, grade: simMathG });
	}

	// If physics is non-zero, ensure it's in the list
	if (simPhysU > 0 && simPhysG > 0) {
		let physKey = Array.from(subsMap.keys()).find((k) => isSubjectMatch(k, 'פיזיקה'));
		if (physKey) {
			subsMap.set(physKey, { units: simPhysU, grade: simPhysG });
		} else {
			subsMap.set('פיזיקה', { units: simPhysU, grade: simPhysG });
		}
	}

	const simSubjects: CalculatorSubject[] = Array.from(subsMap.entries()).map(([name, val]) => ({
		name,
		units: val.units,
		grade: val.grade
	}));

	return { simSubjects, simMathU, simMathG, simPhysU, simPhysG };
}

/**
 * Audits a single RecommendedTrack against academic ground-truth
 */
export function auditSingleTrack(
	track: RecommendedTrack,
	program: QAProgramTarget,
	profile: UserAcademicProfile,
	preferences: UserPreferencesQuestionnaire,
	calculatorId: string,
	threshold: number
): TrackAuditReport {
	const issues: TrackAuditIssue[] = [];
	let score = 100;

	const { simSubjects, simMathU, simMathG, simPhysU, simPhysG } = applyTrackImprovementsToProfile(profile, track);
	const targetPsych = track.targetPsychometric || profile.psychometricGeneral || 0;
	const cardSekem = track.targetSekem ?? 0;

	const simScores = simulateRealisticSubscores(
		targetPsych,
		profile.psychometricGeneral || targetPsych,
		profile.psychometricQuant,
		profile.psychometricVerbal,
		profile.psychometricEnglish,
		profile.psychometricQuantEmphasis,
		profile.psychometricVerbalEmphasis
	);

	// 1. Run Pure Institution Calculator
	const calcRes: InstitutionCalculatorResult = calculateInstitution(calculatorId, {
		bagrutSubjects: simSubjects,
		psychometricGeneral: targetPsych,
		psychometricQuant: simScores.quantSub,
		psychometricQuantEmphasis: simScores.quantEmphasis,
		psychometricVerbal: simScores.verbalSub,
		psychometricVerbalEmphasis: simScores.verbalEmphasis,
		psychometricEnglish: simScores.englishSub,
		mathUnits: simMathU,
		mathGrade: simMathG,
		physicsUnits: simPhysU,
		physicsGrade: simPhysG
	});

	const simSekem =
		program.relevantSekemType === 'engineering'
			? (calcRes.engineeringSekem ?? calcRes.generalSekem)
			: program.relevantSekemType === 'management'
			? (calcRes.managementSekem ?? calcRes.generalSekem)
			: calcRes.generalSekem;

	const isDirectBagrutTrack = track.id.includes('direct-bagrut') || track.title.includes('קבלה ישירה');
	const isTechnion = calculatorId === 'technion';

	// =========================================================================
	// Check 1: Zero Discrepancy Rule
	// =========================================================================
	const discrepancy = Math.abs(simSekem - cardSekem);
	const isAcceptableDiscrepancy = isDirectBagrutTrack || discrepancy <= 0.15;

	if (!isAcceptableDiscrepancy) {
		issues.push({
			code: 'MATH_DISCREPANCY',
			severity: 'critical',
			penaltyPoints: 25,
			title: 'פער סכם בין כרטיס המסלול לחישוב המוסדי',
			description: `הסכם המוצג בכרטיס (${cardSekem}) שונה מתוצאת המחשבון המוסדי הטהור (${simSekem}) בפער של ${discrepancy.toFixed(2)} נקודות.`,
			expected: simSekem,
			actual: cardSekem,
			remedyRecommendation: 'סנכרן את חישוב הסכם מול תוצאת המחשבון המוסדי הטהור (למשל, ודא טיפול אחיד בבונוס פיזיקה/ריאלי).'
		});
		score -= 25;
	}

	// =========================================================================
	// Check 2: Threshold Reach Guarantee
	// =========================================================================
	const directEligible =
		calcRes.directBagrutEligible ||
		(program.directBagrutEligible &&
			program.directBagrutMinAverage !== null &&
			program.directBagrutMinAverage !== undefined &&
			calcRes.bagrutAverage >= program.directBagrutMinAverage);

	const achievesAdmission = simSekem >= threshold - 0.1 || (isDirectBagrutTrack && directEligible);

	if (!achievesAdmission) {
		issues.push({
			code: 'THRESHOLD_UNMET',
			severity: 'critical',
			penaltyPoints: 35,
			title: 'המסלול אינו מביא לקבלה (אי-עמידה בסף)',
			description: `סכם המסלול (${simSekem}) נמוך מסף הקבלה הנדרש (${threshold}) ואינו מזכה בקבלה ישירה.`,
			expected: `>= ${threshold}`,
			actual: simSekem,
			remedyRecommendation: 'העלה את יעד הבחינה או הוסף מנוף לכיסוי הפער במלואו.'
		});
		score -= 35;
	}

	// =========================================================================
	// Check 3: Prerequisites Compliance (Degree-Specific Floors & Requirements)
	// =========================================================================
	const degreePsychFloor = program.minPsychometricFloor || (
		program.fieldOfStudy?.includes('רפואה') ? 700 :
		(program.fieldOfStudy?.includes('מחשב') || program.fieldOfStudy?.includes('תוכנה')) ? 600 :
		program.fieldOfStudy?.includes('הנדס') ? 560 :
		(program.fieldOfStudy?.includes('מתמטיקה') || program.fieldOfStudy?.includes('פיזיקה')) ? 550 : 500
	);

	if (!isDirectBagrutTrack && targetPsych < degreePsychFloor) {
		issues.push({
			code: 'PREREQUISITE_VIOLATION',
			severity: 'critical',
			penaltyPoints: 30,
			title: 'הפרת רצפת פסיכומטרי ייעודית של התואר',
			description: `המסלול מציע יעד פסיכומטרי של ${targetPsych}, אך לתואר ${program.fieldOfStudy} ב${program.institutionName} יש רצפת קבלה קשיחה של ${degreePsychFloor}.`,
			expected: `>= ${degreePsychFloor}`,
			actual: targetPsych,
			remedyRecommendation: `הגדר את רצפת החיפוש של הסולבר על לפחות ${degreePsychFloor} עבור תואר זה.`
		});
		score -= 30;
	}

	// Check Physics prerequisite requirement
	const requiresPhysics = program.prerequisites?.requiresPhysics || false;
	const candidateHasPhysics = (profile.physicsUnits || 0) >= 5 && (profile.physicsGrade || 0) >= 55;
	const trackAddsPhysics = (track.recommendedSubjectImprovements || []).some(
		(i) => isSubjectMatch(i.subjectName, 'פיזיקה') && i.targetUnits >= 5
	);
	const hasPhysicsClassificationNotice = (track.steps || []).some(
		(st) => isSubjectMatch(st.title, 'פיזיקה') || isSubjectMatch(st.detail, 'סיווג בפיזיקה')
	);

	if (requiresPhysics && !candidateHasPhysics && !trackAddsPhysics && !hasPhysicsClassificationNotice) {
		issues.push({
			code: 'PREREQUISITE_VIOLATION',
			severity: 'warning',
			penaltyPoints: 15,
			title: 'היעדר התייחסות לחובת פיזיקה / מבחן סיווג',
			description: `התואר דורש בגרות בפיזיקה, אך המועמד חסר פיזיקה והמסלול אינו מציע הרחבת פיזיקה ואף לא התריע על מעבר מבחן סיווג.`,
			expected: 'הרחבת פיזיקה 5 יח״ל או שלב מבחן סיווג',
			actual: 'ללא פיזיקה וללא התראה',
			remedyRecommendation: 'הוסף שלב מובנה של מעבר מבחן סיווג בפיזיקה (ציון 70+) למסלול.'
		});
		score -= 15;
	}

	// =========================================================================
	// Check 4: Dropped Subjects Sanity
	// =========================================================================
	const droppedSubjects = calcRes.droppedSubjects || [];
	let hasDroppedProposedSubject = false;
	for (const imp of track.recommendedSubjectImprovements || []) {
		if (droppedSubjects.some((d) => isSubjectMatch(d, imp.subjectName))) {
			hasDroppedProposedSubject = true;
			issues.push({
				code: 'DROPPED_SUBJECT',
				severity: 'critical',
				penaltyPoints: 25,
				title: 'הצעת מקצוע שנשמט ע״י המחשבון המוסדי',
				description: `המערכת מציעה לשפר את ${imp.subjectName} (${imp.targetUnits} יח״ל לציון ${imp.targetGrade}), אך מחשבון האוניברסיטה משמיט מקצוע זה מהממוצע כי הוא פוגע בו!`,
				expected: 'שילוב מקצועות תורמים בלבד',
				actual: `נשמט מהממוצע: ${imp.subjectName}`,
				remedyRecommendation: 'הפעל סינון Dropped Subjects במאגר הקומבינציות לפני בחירת המנופים.'
			});
			score -= 25;
		}
	}

	// =========================================================================
	// Check 5: Psychometric Jump Realism
	// =========================================================================
	const currentPsych = profile.psychometricGeneral || 0;
	if (currentPsych > 0 && targetPsych > currentPsych) {
		const jump = targetPsych - currentPsych;
		if (jump > 100) {
			issues.push({
				code: 'PSYCHOMETRIC_OVERLOAD',
				severity: 'critical',
				penaltyPoints: 25,
				title: 'קפיצה פסיכומטרית חריגה מעל תקרת השיפור הריאלית (+100)',
				description: `המסלול דורש קפיצה פסיכומטרית של +${jump} נקודות (מ-${currentPsych} ל-${targetPsych}), דבר העומד בסתירה למודל הריאליזם הסטטיסטי.`,
				expected: '<= +100 נקודות',
				actual: `+${jump}`,
				remedyRecommendation: 'הוסף מנופי בגרות שיורידו את העומס מהפסיכומטרי או המלץ על מכינה/מסלול רב-שנתי.'
			});
			score -= 25;
		}
	}

	// =========================================================================
	// Check 6: Workload & Concurrency Sanity
	// =========================================================================
	const examCount = (track.recommendedSubjectImprovements?.length || 0) + (targetPsych > currentPsych ? 1 : 0);
	const isTrack1 = track.id.includes('track-1') || track.id.includes('maximize-exam');
	const isTrack2 = track.id.includes('track-2') || track.id.includes('risk-spread');

	if (isTrack1 && examCount > 2) {
		issues.push({
			code: 'WORKLOAD_OVERLOAD',
			severity: 'warning',
			penaltyPoints: 10,
			title: 'עומס בחינות במסלול ממוקד (מסלול 1)',
			description: `מסלול 1 נועד להיות ממוקד (1–2 בחינות לכל היותר), אך הוא כולל ${examCount} בחינות.`,
			expected: '<= 2 בחינות',
			actual: `${examCount} בחינות`,
			remedyRecommendation: 'צמצם את כמות הבחינות במסלול 1 למנוף יחיד בעל ROI מקסימלי.'
		});
		score -= 10;
	}

	if (isTrack2 && examCount > 3) {
		issues.push({
			code: 'WORKLOAD_OVERLOAD',
			severity: 'warning',
			penaltyPoints: 15,
			title: 'עומס יתר במסלול מאוזן (מסלול 2)',
			description: `מסלול 2 כולל ${examCount} בחינות. הכלל הארכיטקטוני קובע שמסלול מאוזן לעולם לא יעלה על 3 בחינות במקביל.`,
			expected: '<= 3 בחינות',
			actual: `${examCount} בחינות`,
			remedyRecommendation: 'הגבל את סולבר מסלול 2 ל-3 בחינות לכל היותר.'
		});
		score -= 15;
	}

	// =========================================================================
	// Check 7: Copy / Phrasing Paradoxes
	// =========================================================================
	const fullTrackText = `${track.title} ${track.strategyDescription || ''} ${(track.steps || []).map((s) => s.title + ' ' + s.detail).join(' ')}`;
	if (fullTrackText.includes('0 ➔ 5 יח״ל') || fullTrackText.includes('0 ל-5 יח״ל')) {
		issues.push({
			code: 'COPY_PARADOX',
			severity: 'warning',
			penaltyPoints: 8,
			title: 'ניסוח מטעה של הרחבת מקצוע (0 יח״ל)',
			description: 'המסלול מציג "0 ➔ 5 יח״ל" במקום "מקצוע חדש: 5 יח״ל".',
			expected: 'מקצוע חדש (5 יח״ל)',
			actual: '0 ➔ 5 יח״ל',
			remedyRecommendation: 'השתמש ברכיב תצוגת מקצועות חדשים התקין.'
		});
		score -= 8;
	}

	// Final normalization of score & grade
	const finalScore = Math.max(0, Math.min(100, score));
	let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
	if (finalScore >= 95) grade = 'A+';
	else if (finalScore >= 85) grade = 'A';
	else if (finalScore >= 75) grade = 'B';
	else if (finalScore >= 65) grade = 'C';
	else if (finalScore >= 50) grade = 'D';
	else grade = 'F';

	const metrics: TrackAuditMetrics = {
		simulatedSekem: simSekem,
		cardTargetSekem: cardSekem,
		threshold,
		gapClosed: simSekem - (simSekem - (threshold - cardSekem)),
		psychometricDelta: Math.max(0, targetPsych - currentPsych),
		examCount,
		estimatedWeeks: track.estimatedWeeks || 8,
		weeklyHours: track.weeklyHours || 20,
		pointsPerStudyHour: track.estimatedWeeks > 0 ? (simSekem - threshold + 10) / (track.estimatedWeeks * (track.weeklyHours || 20)) : 1,
		hasPrerequisiteStep: hasPhysicsClassificationNotice,
		hasDroppedSubject: hasDroppedProposedSubject
	};

	return {
		trackId: track.id,
		trackTitle: track.title,
		isValid: !issues.some((i) => i.severity === 'critical'),
		qualityScore: finalScore,
		grade,
		issues,
		metrics
	};
}

/**
 * Audits a complete admission scenario (all tracks for a student archetype)
 */
export function auditScenario(
	archetype: StudentArchetype,
	program: QAProgramTarget,
	generatedTracks: RecommendedTrack[]
): ScenarioAuditReport {
	const threshold = typeof program.admissionThreshold === 'number'
		? program.admissionThreshold
		: (parseFloat(String(program.admissionThreshold || '600')) || 600);
	const calculatorId = program.calculatorId;

	const trackReports = generatedTracks.map((t) =>
		auditSingleTrack(t, program, archetype.profile, archetype.preferences, calculatorId, threshold)
	);

	// Scenario-level checks (e.g. Redundant Exams when k=0 exists)
	const hasTrackWith0Exams = generatedTracks.some(
		(t) => (t.recommendedSubjectImprovements?.length || 0) === 0 && (!t.targetPsychometric || t.targetPsychometric <= (archetype.profile.psychometricGeneral || 0))
	);

	if (archetype.expectedBehaviors.expectedDirectBagrut && !hasTrackWith0Exams) {
		// If archetype should get a 0-exam direct admission, but no track offers it:
		for (const tr of trackReports) {
			tr.issues.push({
				code: 'REDUNDANT_EXAMS',
				severity: 'critical',
				penaltyPoints: 25,
				title: 'החמצת קבלה ישירה מיידית (0 בחינות)',
				description: 'המועמד זכאי מלא לקבלה ישירה מיידית על סמך בגרותו הקיימת בלבד, אך לא הוצע לו מסלול של 0 בחינות.',
				expected: '0 בחינות (קבלה ישירה מיידית)',
				actual: `${tr.metrics.examCount} בחינות`,
				remedyRecommendation: 'אפשר בדיקת זכאות ישירה ב-0 מנופים (k=0) לפני הרצת הסולבר.'
			});
			tr.qualityScore = Math.max(0, tr.qualityScore - 25);
			tr.isValid = false;
		}
	}

	// Scenario-level ROI check: Track 2 vs Track 1
	if (generatedTracks.length >= 2) {
		const t1 = generatedTracks[0];
		const t2 = generatedTracks[1];
		const t1Exams = (t1.recommendedSubjectImprovements?.length || 0) + ((t1.targetPsychometric || 0) > (archetype.profile.psychometricGeneral || 0) ? 1 : 0);
		const t2Exams = (t2.recommendedSubjectImprovements?.length || 0) + ((t2.targetPsychometric || 0) > (archetype.profile.psychometricGeneral || 0) ? 1 : 0);
		const psychRelief = (t1.targetPsychometric || 0) - (t2.targetPsychometric || 0);

		if (t2Exams - t1Exams >= 2 && psychRelief < 10 && (t1.targetPsychometric || 0) > 0) {
			const tr2 = trackReports[1];
			tr2.issues.push({
				code: 'ROI_UNVIABLE',
				severity: 'warning',
				penaltyPoints: 15,
				title: 'יחס עלות-תועלת לקוי במסלול 2 לעומת מסלול 1',
				description: `מסלול 2 מוסיף ${t2Exams - t1Exams} בחינות על פני מסלול 1, אך מוריד את הפסיכומטרי ב-${psychRelief} נקודות בלבד (פחות מרף הכדאיות המינימלי של 10 נקודות).`,
				expected: 'הקלה פסיכומטרית של >= 10 נקודות',
				actual: `הקלה של ${psychRelief} נקודות`,
				remedyRecommendation: 'הפעל ROI Guard במסלול 2 לפסילת קומבינציות בעלות תוספת עומס ללא הקלה פסיכומטרית משמעותית.'
			});
			tr2.qualityScore = Math.max(0, tr2.qualityScore - 15);
		}
	}

	const criticalIssuesCount = trackReports.reduce(
		(sum, t) => sum + t.issues.filter((i) => i.severity === 'critical').length,
		0
	);
	const warningsCount = trackReports.reduce(
		(sum, t) => sum + t.issues.filter((i) => i.severity === 'warning').length,
		0
	);
	const overallScore = trackReports.length > 0
		? Math.round(trackReports.reduce((sum, t) => sum + t.qualityScore, 0) / trackReports.length)
		: 0;

	return {
		scenarioId: archetype.id,
		studentName: archetype.name,
		institutionId: program.institutionId,
		institutionName: program.institutionName || program.institutionId,
		programId: program.id,
		programName: program.fieldOfStudy,
		threshold,
		candidateInitialSekem: 0,
		candidateInitialBagrut: archetype.profile.bagrutAverage || 100,
		candidateInitialPsych: archetype.profile.psychometricGeneral || 0,
		tracksCount: generatedTracks.length,
		overallScore,
		hasCriticalErrors: criticalIssuesCount > 0,
		criticalIssuesCount,
		warningsCount,
		trackReports
	};
}
