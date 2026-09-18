/**
 * Subagent 5: Automated QA & Track Quality Auditor
 * Test Runner & Batch Benchmark Engine
 */

import fs from 'fs';
import path from 'path';
import { BENCHMARK_ARCHETYPES } from './archetypes';
import { auditScenario } from './trackAuditor';
import { generatePersonalizedTracks } from '../../utils/analysis/trackGenerator';
import { ProgramGapAnalysis } from '../../utils/analysis/gapAnalyzer';
import { calculateInstitution } from '../calculators';
import { AcademicDegree } from '../../types/academic';
import { BatchAuditSummary, QAProgramTarget, ScenarioAuditReport, TrackAuditPenaltyCategory } from './types';
import academicData from '../../data/academicData.json';

// Helper to map DB inst id or name to calculator id
export function mapInstToCalculatorId(instId: string, instName?: string): string {
	const id = (instId || '').toLowerCase();
	const name = (instName || '').toLowerCase();
	if (id === 'inst-48' || id === 'technion' || name.includes('טכניון')) return 'technion';
	if (id === 'inst-6' || id === 'tau' || name.includes('תל אביב')) return 'tau';
	if (id === 'inst-1' || id === 'huji' || name.includes('עברית')) return 'huji';
	if (id === 'inst-3' || id === 'bgu' || name.includes('בן-גוריון') || name.includes('בן גוריון')) return 'bgu';
	if (id === 'inst-5' || id === 'haifa' || name.includes('חיפה')) return 'haifa';
	if (id === 'inst-2' || id === 'ariel' || name.includes('אריאל')) return 'ariel';
	if (id === 'inst-4' || id === 'bar_ilan' || name.includes('בר אילן') || name.includes('בר-אילן')) return 'bar_ilan';
	if (id === 'inst-38' || id === 'reichman' || name.includes('רייכמן')) return 'reichman';
	return 'tau';
}

/**
 * Loads all catalog programs indexed by ID and search keys
 */
export function buildProgramIndex(): {
	byId: Map<string, { program: QAProgramTarget; instName: string; instId: string }>;
	all: { program: QAProgramTarget; instName: string; instId: string }[];
} {
	const byId = new Map<string, { program: QAProgramTarget; instName: string; instId: string }>();
	const all: { program: QAProgramTarget; instName: string; instId: string }[] = [];

	for (const inst of academicData as any[]) {
		const instName = inst.name;
		const instId = inst.id;
		for (const prog of inst.programs || []) {
			const calcId = mapInstToCalculatorId(instId, instName);
			const deg: QAProgramTarget = {
				id: prog.id,
				institutionId: instId,
				institutionName: instName,
				calculatorId: calcId,
				fieldOfStudy: prog.fieldOfStudy || prog.name || '',
				degreeLevel: prog.degreeLevel || 'B.Sc',
				admissionThreshold: typeof prog.admissionThreshold === 'number' ? prog.admissionThreshold : (parseFloat(String(prog.admissionThreshold || '600')) || 600),
				psychometricScore: prog.psychometricScore || 600,
				directBagrutEligible: prog.directBagrutEligible ?? false,
				directBagrutMinAverage: prog.directBagrutMinAverage ?? null,
				requiresPsychometric: prog.requiresPsychometric ?? true,
				minPsychometricFloor: prog.minPsychometricFloor || null,
				relevantSekemType:
					calcId === 'technion' ? 'technion' :
					(prog.fieldOfStudy?.includes('הנדס') || prog.fieldOfStudy?.includes('מחשב')) ? 'engineering' : 'general',
				prerequisites: {
					minMathUnits: prog.prerequisites?.minMathUnits || (prog.fieldOfStudy?.includes('הנדס') ? 4 : 3),
					minMathGrade: prog.prerequisites?.minMathGrade || 70,
					requiresPhysics: prog.prerequisites?.requiresPhysics ?? (prog.fieldOfStudy?.includes('חשמל') || prog.fieldOfStudy?.includes('מכונות')),
					minPsychometricFloor: prog.minPsychometricFloor || undefined,
					directBagrutMinAverage: prog.directBagrutMinAverage ?? undefined
				}
			};

			byId.set(prog.id, { program: deg, instName, instId });
			all.push({ program: deg, instName, instId });
		}
	}

	return { byId, all };
}

/**
 * Runs Subagent 5 QA Audit across all benchmark archetypes
 */
export function runBatchAudit(): BatchAuditSummary {
	const { byId, all } = buildProgramIndex();
	const scenarioReports: ScenarioAuditReport[] = [];

	const penaltyCategoryCounts: Record<TrackAuditPenaltyCategory, number> = {
		MATH_DISCREPANCY: 0,
		THRESHOLD_UNMET: 0,
		PREREQUISITE_VIOLATION: 0,
		DROPPED_SUBJECT: 0,
		REDUNDANT_EXAMS: 0,
		ROI_UNVIABLE: 0,
		PSYCHOMETRIC_OVERLOAD: 0,
		WORKLOAD_OVERLOAD: 0,
		COPY_PARADOX: 0,
		MECHINA_MISMANAGEMENT: 0,
		SEKEM_OVERSHOOT_OVERKILL: 0
	};

	for (const archetype of BENCHMARK_ARCHETYPES) {
		let match = byId.get(archetype.targetProgramId);

		// If exact ID not found, find closest match by name / institution
		if (!match) {
			const archName = archetype.name.toLowerCase();
			match = all.find((item) => {
				const pName = item.program.fieldOfStudy.toLowerCase();
				const calcId = item.program.calculatorId;
				if (archName.includes('טכניון') && calcId === 'technion') {
					if (archName.includes('מחשב') && pName.includes('מחשב')) return true;
					if (archName.includes('מכונות') && pName.includes('מכונות')) return true;
				}
				if (archName.includes('תל אביב') && calcId === 'tau') {
					if (archName.includes('חשמל') && (pName.includes('חשמל') || item.program.id.includes('0512'))) return true;
					if (archName.includes('מחשב') && pName.includes('מחשב')) return true;
					if (archName.includes('ניהול') && pName.includes('ניהול')) return true;
					if (archName.includes('משפטים') && pName.includes('משפטים')) return true;
				}
				if (archName.includes('עברית') && calcId === 'huji') {
					if (archName.includes('רפואה') && pName.includes('רפואה')) return true;
					if (archName.includes('פסיכולוגיה') && pName.includes('פסיכולוגיה')) return true;
				}
				if (archName.includes('בן-גוריון') && calcId === 'bgu') {
					if ((archName.includes('תעשייה') || archName.includes('מחשב')) && (pName.includes('תעשייה') || pName.includes('מחשב') || pName.includes('הנדס'))) return true;
				}
				if (archName.includes('בר-אילן') && calcId === 'bar_ilan') {
					if (archName.includes('מתמטיקה') && pName.includes('מתמטיקה')) return true;
					if (archName.includes('נתונים') && (pName.includes('נתונים') || pName.includes('מחשב'))) return true;
				}
				if (archName.includes('חיפה') && calcId === 'haifa') {
					if (archName.includes('סוציאלית') && pName.includes('סוציאלית')) return true;
					if (archName.includes('מחשב') && pName.includes('מחשב')) return true;
				}
				if (archName.includes('אריאל') && calcId === 'ariel') {
					if (archName.includes('תוכנה') && (pName.includes('תוכנה') || pName.includes('מחשב'))) return true;
					if (archName.includes('אזרחית') && pName.includes('אזרחית')) return true;
				}
				if (archName.includes('רייכמן') && calcId === 'reichman') {
					if (archName.includes('עסקים') && pName.includes('עסקים')) return true;
					if (archName.includes('מחשב') && pName.includes('מחשב')) return true;
				}
				return false;
			});
		}

		if (!match) {
			console.warn(`Could not match program for archetype ${archetype.id}`);
			continue;
		}

		const program = match.program;
		const calculatorId = program.calculatorId;
		const threshold = typeof program.admissionThreshold === 'number'
			? program.admissionThreshold
			: (parseFloat(String(program.admissionThreshold || '600')) || 600);

		// 1. Initial Institution Calculation
		const initialRes = calculateInstitution(calculatorId, {
			bagrutSubjects: archetype.profile.bagrutSubjects.map((s) => ({ name: s.name, units: s.units, grade: s.grade })),
			psychometricGeneral: archetype.profile.psychometricGeneral || 0,
			mathUnits: archetype.profile.mathUnits || 4,
			mathGrade: archetype.profile.mathGrade || 80,
			physicsUnits: archetype.profile.physicsUnits || 0,
			physicsGrade: archetype.profile.physicsGrade || 0
		});

		const initialSekem =
			program.relevantSekemType === 'engineering'
				? (initialRes.engineeringSekem ?? initialRes.generalSekem)
				: program.relevantSekemType === 'management'
				? (initialRes.managementSekem ?? initialRes.generalSekem)
				: initialRes.generalSekem;
		(initialRes as any).sekem = initialSekem;

		// 2. Build Gap Analysis
		const gapAnalysis: ProgramGapAnalysis = {
			target: {
				institutionId: program.institutionId,
				institutionName: program.institutionName,
				calculatorId,
				program
			},
			threshold,
			relevantSekemType: (program.relevantSekemType || 'general') as any,
			relevantSekemLabel: program.relevantSekemType || 'general',
			userSekem: initialSekem,
			gap: initialSekem - threshold,
			status: initialSekem >= threshold ? 'accepted' : 'not_accepted',
			prerequisites: [],
			missingPrerequisites: [],
			improvementOptions: []
		};

		// 3. Generate Tracks
		const tracks = generatePersonalizedTracks(
			gapAnalysis,
			archetype.profile,
			initialRes as any,
			archetype.preferences
		);

		// 4. Audit Scenario
		const scenarioReport = auditScenario(archetype, program, tracks);
		scenarioReport.candidateInitialSekem = initialSekem;
		scenarioReports.push(scenarioReport);

		// Aggregate penalty counts
		for (const tr of scenarioReport.trackReports) {
			for (const issue of tr.issues) {
				penaltyCategoryCounts[issue.code] = (penaltyCategoryCounts[issue.code] || 0) + 1;
			}
		}
	}

	// Compute Aggregate Metrics
	const totalScenarios = scenarioReports.length;
	const totalTracks = scenarioReports.reduce((sum, s) => sum + s.trackReports.length, 0);
	const allTrackScores = scenarioReports.flatMap((s) => s.trackReports.map((t) => t.qualityScore));
	const averageQualityScore = allTrackScores.length > 0
		? Math.round((allTrackScores.reduce((a, b) => a + b, 0) / allTrackScores.length) * 10) / 10
		: 0;

	const cleanTracksCount = scenarioReports.flatMap((s) => s.trackReports).filter((t) => t.isValid && t.issues.length === 0).length;
	const cleanTracksPercentage = totalTracks > 0 ? Math.round((cleanTracksCount / totalTracks) * 100) : 0;

	const criticalIssuesTotal = scenarioReports.reduce((sum, s) => sum + s.criticalIssuesCount, 0);
	const warningsTotal = scenarioReports.reduce((sum, s) => sum + s.warningsCount, 0);

	// Institution Breakdown
	const instMap: Record<string, { total: number; scoreSum: number; criticalCount: number; passedCount: number; name: string }> = {};
	for (const sc of scenarioReports) {
		const key = sc.institutionId;
		if (!instMap[key]) {
			instMap[key] = { total: 0, scoreSum: 0, criticalCount: 0, passedCount: 0, name: sc.institutionName };
		}
		instMap[key].total += 1;
		instMap[key].scoreSum += sc.overallScore;
		instMap[key].criticalCount += sc.criticalIssuesCount;
		if (!sc.hasCriticalErrors) instMap[key].passedCount += 1;
	}

	const institutionBreakdown: BatchAuditSummary['institutionBreakdown'] = {};
	for (const [key, val] of Object.entries(instMap)) {
		institutionBreakdown[key] = {
			institutionName: val.name,
			totalScenarios: val.total,
			averageScore: Math.round((val.scoreSum / val.total) * 10) / 10,
			criticalErrors: val.criticalCount,
			passRate: Math.round((val.passedCount / val.total) * 100)
		};
	}

	return {
		timestamp: new Date().toISOString(),
		totalScenariosTested: totalScenarios,
		totalTracksAudited: totalTracks,
		averageQualityScore,
		cleanTracksPercentage,
		criticalIssuesTotal,
		warningsTotal,
		issueCategoryCounts: penaltyCategoryCounts,
		institutionBreakdown,
		scenarios: scenarioReports
	};
}

/**
 * Formats the summary into a rich markdown report
 */
export function formatAuditMarkdownReport(summary: BatchAuditSummary): string {
	const lines: string[] = [];

	lines.push(`# 🛡️ דוח איכות ובקרת מסלולים — Subagent 5: QA & Track Auditor`);
	lines.push(`**תאריך ושעה:** ${summary.timestamp} | **תרחישים שנבדקו:** ${summary.totalScenariosTested} | **מסלולים שנבדקו:** ${summary.totalTracksAudited}\n`);

	lines.push(`## 📊 מדדי איכות עליונים (KPIs)`);
	lines.push(`| מדד | תוצאה | יעד | סטטוס |`);
	lines.push(`| :--- | :---: | :---: | :---: |`);
	lines.push(`| **ציון איכות ממוצע (0-100)** | **${summary.averageQualityScore}** | 90+ | ${summary.averageQualityScore >= 90 ? '🟢 מעולה' : summary.averageQualityScore >= 80 ? '🟡 טעון שיפור' : '🔴 קריטי'} |`);
	lines.push(`| **שיעור מסלולים ללא רבב (Clean Tracks)** | **${summary.cleanTracksPercentage}%** | 85%+ | ${summary.cleanTracksPercentage >= 80 ? '🟢' : '🟡'} |`);
	lines.push(`| **שגיאות קריטיות (Critical Issues)** | **${summary.criticalIssuesTotal}** | 0 | ${summary.criticalIssuesTotal === 0 ? '🟢 0 שגיאות' : '🔴 דורש תיקון'} |`);
	lines.push(`| **הערות ואזהרות (Warnings)** | **${summary.warningsTotal}** | < 5 | ${summary.warningsTotal < 5 ? '🟢' : '🟡'} |\n`);

	lines.push(`## 🏛️ פילוח איכות לפי 8 האוניברסיטאות`);
	lines.push(`| מוסד אקדמי | תרחישים | ציון ממוצע | שגיאות קריטיות | אחוז מעבר מלא |`);
	lines.push(`| :--- | :---: | :---: | :---: | :---: |`);
	for (const [_, inst] of Object.entries(summary.institutionBreakdown)) {
		lines.push(`| **${inst.institutionName}** | ${inst.totalScenarios} | **${inst.averageScore}** | ${inst.criticalErrors} | ${inst.passRate}% |`);
	}
	lines.push(`\n## ⚠️ התפלגות חריגות ונושאים לבדיקה`);
	lines.push(`| קטגוריית בדיקה | כמות חריגות | חומרה | משמעות |`);
	lines.push(`| :--- | :---: | :---: | :--- |`);
	for (const [cat, count] of Object.entries(summary.issueCategoryCounts)) {
		if (count > 0) {
			lines.push(`| \`${cat}\` | **${count}** | ${cat.includes('DISCREPANCY') || cat.includes('UNMET') || cat.includes('PREREQUISITE') || cat.includes('DROPPED') ? '🔴 קריטי' : '🟡 אזהרה'} | ${getCategoryDescription(cat as any)} |`);
		}
	}

	lines.push(`\n## 📋 פירוט תרחישי הבדיקה (Scenarios Breakdown)\n`);
	for (const sc of summary.scenarios) {
		const statusIcon = sc.hasCriticalErrors ? '❌' : sc.warningsCount > 0 ? '⚠️' : '✅';
		lines.push(`### ${statusIcon} תרחיש: ${sc.studentName} (${sc.programName} — ${sc.institutionName})`);
		lines.push(`- **סף קבלה:** ${sc.threshold} | **סכם התחלתי:** ${(sc.candidateInitialSekem ?? 0).toFixed(1)} | **בגרות התחלתית:** ${(sc.candidateInitialBagrut ?? 0).toFixed(1)} | **פסיכומטרי התחלתי:** ${sc.candidateInitialPsych || 'ללא'}`);
		lines.push(`- **ציון תרחיש כולל:** **${sc.overallScore}/100** | **מסלולים שנבדקו:** ${sc.tracksCount}`);

		for (const tr of sc.trackReports) {
			lines.push(`  * **[${tr.grade}] ${tr.trackTitle}** (ציון: ${tr.qualityScore}/100)`);
			lines.push(`    - סכם כרטיס: ${tr.metrics.cardTargetSekem} | סכם מחושב טהור: ${tr.metrics.simulatedSekem} | בחינות: ${tr.metrics.examCount} | שבועות: ${tr.metrics.estimatedWeeks}`);
			if (tr.issues.length > 0) {
				for (const iss of tr.issues) {
					lines.push(`      - **[${iss.severity.toUpperCase()}] ${iss.title}:** ${iss.description} *(המלצה: ${iss.remedyRecommendation})*`);
				}
			}
		}
		lines.push('');
	}

	return lines.join('\n');
}

function getCategoryDescription(cat: TrackAuditPenaltyCategory): string {
	switch (cat) {
		case 'MATH_DISCREPANCY': return 'פער סכם בין כרטיס המסלול לחישוב המוסדי הטהור';
		case 'THRESHOLD_UNMET': return 'סכם המסלול לא מביא לעמידה ברף הקבלה';
		case 'PREREQUISITE_VIOLATION': return 'הפרת רצפת פסיכומטרי או היעדר מענה לדרישת פיזיקה/מתמטיקה';
		case 'DROPPED_SUBJECT': return 'הצעת מקצוע שהמוסד משמיט מהממוצע כי אינו תורם';
		case 'REDUNDANT_EXAMS': return 'הצעת בחינות מיותרות כשיש זכאות ישירה ב-0 בחינות או בחינה בודדת';
		case 'ROI_UNVIABLE': return 'תוספת בחינות במסלול 2 ללא הקלה פסיכומטרית שמצדיקה זאת';
		case 'PSYCHOMETRIC_OVERLOAD': return 'דרישה לקפיצה פסיכומטרית מעבר לתקרה הריאלית (+100)';
		case 'WORKLOAD_OVERLOAD': return 'עומס בחינות ומקביליות חורג (מעל 2 במסלול 1 או מעל 3 במסלול 2)';
		case 'COPY_PARADOX': return 'סתירה ניסוחית (כגון שדרוג 0 ל-5 יח״ל במקצוע קיים)';
		case 'MECHINA_MISMANAGEMENT': return 'ניהול לא מותאם של מסלול מכינה';
		case 'SEKEM_OVERSHOOT_OVERKILL': return 'חריגת סכם מופרזת או עומס בחינות מיותר בפער קטן שניתן לסגור בבחינה בודדת';
		default: return '';
	}
}
