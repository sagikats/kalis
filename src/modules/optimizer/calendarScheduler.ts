/**
 * Israeli Exam Calendar & Timeline Phasing Engine
 * Subagent 2: Recommendation & Optimization Algorithms
 *
 * Models real-world Israeli Ministry of Education (Bagrut) and MALAM (Psychometric) cycles:
 * - Winter Session (מועד חורף, Jan-Feb): Core 2u mandatory subjects (Civics, Tanach, History, Literature, Hebrew)
 *   plus Math & English (4/5u).
 * - Spring Session (מועד אביב/אפריל): Ideal Psychometric timing before summer bagruts.
 * - Summer Session (מועד קיץ, May-July): All subjects, especially 5u elective expansions (Geography, Physics, CS, Biology).
 */

import { ImprovementLeverRecord, TrackMilestoneRecord } from '../db/schema';
import { SubjectLeverCandidate } from './types';

export type ExamSession = 'winter' | 'spring_psych' | 'summer';

export interface SessionVisualInfo {
	name: string;
	timing: string;
	badgeLabel: string;
	badgeClass: string;
	cardBorderClass: string;
	iconEmoji: string;
}

export function getSessionInfo(session?: ExamSession | 'winter' | 'spring_psych' | 'summer' | string): SessionVisualInfo {
	switch (session) {
		case 'winter':
		case 'bagrut_core':
			return {
				name: 'מועד חורף',
				timing: 'ינואר–פברואר',
				badgeLabel: 'מועד חורף (ינואר)',
				badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
				cardBorderClass: 'border-blue-500/40 hover:border-blue-400',
				iconEmoji: '❄️'
			};
		case 'spring_psych':
		case 'psychometric':
			return {
				name: 'מועד אביב',
				timing: 'מרץ–אפריל',
				badgeLabel: 'מועד אביב (מרץ–אפריל)',
				badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
				cardBorderClass: 'border-cyan-500/40 hover:border-cyan-400',
				iconEmoji: '🌱'
			};
		case 'administrative':
			return {
				name: 'קליטה במוסד',
				timing: 'אוגוסט–ספטמבר',
				badgeLabel: 'קליטה במוסד (אוגוסט–ספטמבר)',
				badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
				cardBorderClass: 'border-emerald-500/40 hover:border-emerald-400',
				iconEmoji: '🎓'
			};
		case 'summer':
		case 'bagrut_elective':
		default:
			return {
				name: 'מועד קיץ',
				timing: 'מאי–יולי',
				badgeLabel: 'מועד קיץ (יוני–יולי)',
				badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
				cardBorderClass: 'border-amber-500/40 hover:border-amber-400',
				iconEmoji: '☀️'
			};
	}
}

const WINTER_CORE_PATTERNS = [
	'תנ"ך',
	'תנ״ך',
	'תנך',
	'אזרחות',
	'ספרות',
	'היסטוריה',
	'הבעה',
	'לשון',
	'עברית',
	'מתמטיקה',
	'אנגלית'
];

/**
 * Determines whether a subject improvement can be executed in the upcoming Winter session
 * or requires waiting for the Summer expansion session.
 */
export function getSubjectExamSession(subjectName: string, units: number): 'winter' | 'summer' {
	const isCoreOrLanguageOrMath = WINTER_CORE_PATTERNS.some((pattern) => subjectName.includes(pattern));

	// 5-unit electives like Geography, Physics, Biology, CS are strictly Summer exams
	if (units >= 5 && !subjectName.includes('מתמטיקה') && !subjectName.includes('אנגלית')) {
		return 'summer';
	}

	if (isCoreOrLanguageOrMath) {
		return 'winter';
	}

	return 'summer';
}

/**
 * Enriches a candidate lever with its realistic exam session.
 */
export function assignSessionToCandidate(candidate: SubjectLeverCandidate): SubjectLeverCandidate {
	const session = getSubjectExamSession(candidate.subjectName, candidate.targetUnits);
	return {
		...candidate,
		session
	};
}

/**
 * Generates sequential timeline milestones avoiding concurrency burnouts.
 * Phases:
 * 1. Winter Quick-Wins / Safety Cushion (Core 2u, Math/English)
 * 2. Spring Psychometric Focus (April moed)
 * 3. Summer Big Levers (5u Electives / Science / Expanded)
 */
export function generatePhasedMilestones(
	trackId: string,
	levers: ImprovementLeverRecord[],
	targetPsychometric?: number,
	currentPsychometric?: number
): TrackMilestoneRecord[] {
	const milestones: TrackMilestoneRecord[] = [];
	let orderIndex = 1;

	const winterLevers = levers.filter((l) => l.session === 'winter');
	const summerLevers = levers.filter((l) => l.session === 'summer');
	const hasPsychJump = targetPsychometric && (!currentPsychometric || targetPsychometric > currentPsychometric);

	// Phase 1: Winter Quick-Wins / Safety Cushion
	if (winterLevers.length > 0) {
		const winterNames = winterLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל)`).join(', ');
		milestones.push({
			id: `${trackId}-ms-${orderIndex}`,
			trackId,
			orderIndex: orderIndex++,
			title: 'תחנה 1: מועד חורף — שיפורי ליבה ממוקדים (Quick-Wins)',
			detail: `גש לבחינות חורף במקצועות: ${winterNames}. השגת ציוני היעד כבר בחורף מספקת כרית ביטחון ומפחיתה את הלחץ מהשלבים הבאים.`,
			timing: 'ינואר–פברואר',
			type: 'bagrut_core'
		});
	}

	// Phase 2: Spring Psychometric Station (April)
	if (hasPsychJump) {
		milestones.push({
			id: `${trackId}-ms-${orderIndex}`,
			trackId,
			orderIndex: orderIndex++,
			title: `תחנה ${orderIndex - 1}: מועד אביב — פסיכומטרי (יעד ${targetPsychometric})`,
			detail: `מיקוד מלא בבחינה הפסיכומטרית במועד אפריל ללא הסחות דעת, לפני כניסה לתקופת בגרויות הקיץ.`,
			timing: 'מרץ–אפריל',
			type: 'psychometric'
		});
	}

	// Phase 3: Summer Session Expansion
	if (summerLevers.length > 0) {
		const summerNames = summerLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל)`).join(', ');
		milestones.push({
			id: `${trackId}-ms-${orderIndex}`,
			trackId,
			orderIndex: orderIndex++,
			title: `תחנה ${orderIndex - 1}: מועד קיץ — הרחבות מוגברות (5 יח״ל)`,
			detail: `בחינות בגרות מורחבות במועד קיץ: ${summerNames}. השלמת מנופי הבחירה והזנקת ממוצע הבגרות המשוקלל.`,
			timing: 'מאי–יולי',
			type: 'bagrut_elective'
		});
	}

	// Final Milestone: University Admission Confirmation
	milestones.push({
		id: `${trackId}-ms-${orderIndex}`,
		trackId,
		orderIndex: orderIndex++,
		title: 'סיום וקליטת ציונים במוסדות',
		detail: 'קליטת ציוני הבגרות והפסיכומטרי במערכת ההרשמה של המוסד לקראת פתיחת שנת הלימודים האקדמית.',
		timing: 'אוגוסט–ספטמבר',
		type: 'administrative'
	});

	return milestones;
}
