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
				badgeClass: 'bg-[#EEF2FF] text-[#1E40AF] border-[#C7D2FE]',
				cardBorderClass: 'border-[#C7D2FE] hover:border-[#93C5FD]',
				iconEmoji: '❄️'
			};
		case 'spring_psych':
		case 'psychometric':
			return {
				name: 'מועד אביב',
				timing: 'מרץ–אפריל',
				badgeLabel: 'מועד אביב (מרץ–אפריל)',
				badgeClass: 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]',
				cardBorderClass: 'border-[#A5F3FC] hover:border-[#67E8F9]',
				iconEmoji: '🌱'
			};
		case 'administrative':
			return {
				name: 'קליטה במוסד',
				timing: 'אוגוסט–ספטמבר',
				badgeLabel: 'קליטה במוסד (אוגוסט–ספטמבר)',
				badgeClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
				cardBorderClass: 'border-[#A7F3D0] hover:border-[#6EE7B7]',
				iconEmoji: '🎓'
			};
		case 'summer':
		case 'bagrut_elective':
		default:
			return {
				name: 'מועד קיץ',
				timing: 'מאי–יולי',
				badgeLabel: 'מועד קיץ (יוני–יולי)',
				badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
				cardBorderClass: 'border-[#FDE68A] hover:border-[#FCD34D]',
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

// =========================================================================
// CONCURRENT & INTERLEAVED STUDY ROADMAP ENGINE
// =========================================================================

export interface StudyStream {
	subjectName: string;
	type: 'psychometric' | 'bagrut_core' | 'bagrut_elective';
	weeklyHours: number;
	focusTopic: string;
	colorClass?: string;
	examTarget?: string;
}

export interface WeeklySchedulePhase {
	phaseIndex: number;
	timing: string;
	weeksRange: [number, number];
	title: string;
	isConcurrent: boolean;
	totalWeeklyHours: number;
	strategyNote: string;
	streams: StudyStream[];
	milestoneAtEnd?: {
		title: string;
		sessionBadge: string;
		type: 'psychometric' | 'bagrut_core' | 'bagrut_elective' | 'administrative';
		iconEmoji?: string;
	};
}

export interface ConcurrentSchedulePlan {
	totalWeeks: number;
	hasConcurrency: boolean;
	phases: WeeklySchedulePhase[];
	milestones: TrackMilestoneRecord[];
	steps: {
		title: string;
		detail: string;
		timing: string;
		type: 'psychometric' | 'bagrut_core' | 'bagrut_elective' | 'administrative' | 'mechina';
		isConcurrent?: boolean;
		streams?: StudyStream[];
	}[];
}

export interface ScheduleInputParams {
	trackId: string;
	availableWeeklyHours?: number;
	targetPsychometric?: number;
	currentPsychometric?: number;
	subjectLevers?: {
		subjectName: string;
		currentGrade?: number;
		currentUnits?: number;
		targetGrade: number;
		targetUnits: number;
		isMath?: boolean;
		isPhysics?: boolean;
		session?: 'winter' | 'spring_psych' | 'summer';
		reason?: string;
	}[];
	psychSectionsLabel?: string;
}

/**
 * Generates an adaptive study plan with interleaved parallel learning when advantageous.
 * Rules:
 * 1. Single exam -> 100% focused sequential plan.
 * 2. Combined psychometric + 1-2 bagruts -> Psychometric is continuous anchor spine (12 weeks),
 *    bagruts run in parallel in Months 1 and 2, Month 3 is 100% dedicated to simulation sprint.
 * 3. Weekly hours budget is strictly respected (streams sum = availableWeeklyHours).
 * 4. Concurrency is only applied when availableWeeklyHours >= 12 to prevent sub-critical time fragmentation.
 */
export function generateConcurrentSchedulePlan(params: ScheduleInputParams): ConcurrentSchedulePlan {
	const trackId = params.trackId;
	const weeklyHours = params.availableWeeklyHours && params.availableWeeklyHours > 0 ? params.availableWeeklyHours : 16;
	const levers = params.subjectLevers || [];
	const hasPsych =
		params.targetPsychometric !== undefined &&
		(!params.currentPsychometric || params.targetPsychometric > params.currentPsychometric);
	const targetPsych = params.targetPsychometric;
	const psychLabel = params.psychSectionsLabel || 'כלל חלקי הבחינה';

	const phases: WeeklySchedulePhase[] = [];
	const steps: ConcurrentSchedulePlan['steps'] = [];

	// CASE 1: Single Lever / Track A1 (Only Psychometric OR Only 1 Bagrut)
	if (!hasPsych && levers.length <= 1) {
		// Only 1 bagrut lever or none
		const lever = levers[0];
		if (lever) {
			const isExpanded = lever.targetUnits >= 5;
			const totalWeeks = isExpanded ? 8 : 6;
			const sInfo = getSessionInfo(lever.session || (isExpanded ? 'summer' : 'winter'));

			phases.push({
				phaseIndex: 1,
				timing: `שבועות 1–${totalWeeks}`,
				weeksRange: [1, totalWeeks],
				title: `הכנה ממוקדת לבגרות ב-${lever.subjectName}`,
				isConcurrent: false,
				totalWeeklyHours: weeklyHours,
				strategyNote: `מיקוד מלא של ${weeklyHours} שעות שבועיות בהשגת ציון יעד ${lever.targetGrade} (${lever.targetUnits} יח״ל)`,
				streams: [
					{
						subjectName: lever.subjectName,
						type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
						weeklyHours,
						focusTopic: 'תרגול מתכונות, שאלות בגרות ונושאי ליבה',
						examTarget: `יעד: ${lever.targetGrade}`
					}
				],
				milestoneAtEnd: {
					title: `בחינת בגרות ב-${lever.subjectName} (${lever.targetUnits} יח״ל)`,
					sessionBadge: sInfo.badgeLabel,
					type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
					iconEmoji: sInfo.iconEmoji
				}
			});

			steps.push({
				title: `הכנה ותרגול ממוקד: ${lever.subjectName}`,
				detail: `הקדשת כל ${weeklyHours} השעות השבועיות לחזרה מקיפה, מתכונות והגעה לציון היעד (${lever.targetGrade}).`,
				timing: `שבועות 1–${totalWeeks}`,
				type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
				isConcurrent: false,
				streams: phases[0].streams
			});

			return {
				totalWeeks,
				hasConcurrency: false,
				phases,
				milestones: [
					{
						id: `${trackId}-ms-1`,
						trackId,
						orderIndex: 1,
						title: `בחינת בגרות ב-${lever.subjectName}`,
						detail: `הגעה לציון ${lever.targetGrade} במועד ${sInfo.name}.`,
						timing: sInfo.timing,
						type: isExpanded ? 'bagrut_elective' : 'bagrut_core'
					}
				],
				steps
			};
		}
	}

	if (hasPsych && levers.length === 0) {
		// Psychometric Only
		const totalWeeks = 12;
		const sInfo = getSessionInfo('spring_psych');

		// Month 1
		phases.push({
			phaseIndex: 1,
			timing: 'שבועות 1–4 (חודש ראשון)',
			weeksRange: [1, 4],
			title: 'יסודות פסיכומטרי, עקרונות ואוצר מילים',
			isConcurrent: false,
			totalWeeklyHours: weeklyHours,
			strategyNote: 'בניית תשתית חזקה בחשיבה כמותית, אוצר מילים בעברית ואנגלית',
			streams: [
				{
					subjectName: 'פסיכומטרי',
					type: 'psychometric',
					weeklyHours,
					focusTopic: 'יסודות מתמטיים, אוצר מילים ואסטרטגיות קריאה באנגלית',
					examTarget: `יעד: ${targetPsych}`
				}
			]
		});

		// Month 2
		phases.push({
			phaseIndex: 2,
			timing: 'שבועות 5–8 (חודש שני)',
			weeksRange: [5, 8],
			title: 'שיטות פתרון, ניהול זמנים ופרקים מלאים',
			isConcurrent: false,
			totalWeeklyHours: weeklyHours,
			strategyNote: `חיזוק נקודתי של ${psychLabel} ותרגול פרקים מלאים תחת מגבלת זמן`,
			streams: [
				{
					subjectName: 'פסיכומטרי',
					type: 'psychometric',
					weeklyHours,
					focusTopic: `תרגול פרקים מלאים, דיוק ומהירות ב${psychLabel}`,
					examTarget: `יעד: ${targetPsych}`
				}
			]
		});

		// Month 3
		phases.push({
			phaseIndex: 3,
			timing: 'שבועות 9–12 (חודש שלישי)',
			weeksRange: [9, 12],
			title: 'מרתון סימולציות מלאות ותחקור',
			isConcurrent: false,
			totalWeeklyHours: weeklyHours,
			strategyNote: 'סימולציות יומיות בתנאי אמת, תחקור טעויות והגעה לשיא המוכנות לבחינה',
			streams: [
				{
					subjectName: 'פסיכומטרי',
					type: 'psychometric',
					weeklyHours,
					focusTopic: 'סימולציות אמת של המרכז הארצי, ניהול לחצים ותחקור מעמיק',
					examTarget: `יעד: ${targetPsych}`
				}
			],
			milestoneAtEnd: {
				title: `בחינה פסיכומטרית ארצית (יעד ${targetPsych})`,
				sessionBadge: sInfo.badgeLabel,
				type: 'psychometric',
				iconEmoji: sInfo.iconEmoji
			}
		});

		steps.push({
			title: 'שלב 1: בניית יסודות ותרגול נושאים',
			detail: 'חוקי יסוד בכמותי, אוצר מילים מילולי וקריאה מהירה באנגלית.',
			timing: 'שבועות 1–4',
			type: 'psychometric',
			isConcurrent: false,
			streams: phases[0].streams
		});
		steps.push({
			title: 'שלב 2: תרגול פרקים מלאים ושיפור קצב',
			detail: `הטמעת טכניקות פתרון מהיר ודגש על ${psychLabel}.`,
			timing: 'שבועות 5–8',
			type: 'psychometric',
			isConcurrent: false,
			streams: phases[1].streams
		});
		steps.push({
			title: 'שלב 3: מרתון סימולציות וספרינט שיא',
			detail: `סימולציות בחינה מלאות בתנאי זמן אמת ותחקור להבטחת ציון ${targetPsych}.`,
			timing: 'שבועות 9–12',
			type: 'psychometric',
			isConcurrent: false,
			streams: phases[2].streams
		});

		return {
			totalWeeks,
			hasConcurrency: false,
			phases,
			milestones: [
				{
					id: `${trackId}-ms-1`,
					trackId,
					orderIndex: 1,
					title: `בחינה פסיכומטרית ארצית`,
					detail: `השגת ציון יעד של ${targetPsych} במועד ${sInfo.name}.`,
					timing: sInfo.timing,
					type: 'psychometric'
				}
			],
			steps
		};
	}

	// CASE 2: Combined Psychometric + 1 or 2 Bagrut Levers (Track 2 / Balanced)
	// Supports Concurrent / Interleaved Study when weeklyHours >= 12
	if (hasPsych && levers.length > 0) {
		const canDoConcurrent = weeklyHours >= 12;

		if (canDoConcurrent) {
			const totalWeeks = 12;
			const lever1 = levers[0];
			const lever2 = levers.length > 1 ? levers[1] : undefined;

			// Month 1: Psychometric + Lever 1 in parallel
			const psychHours1 = Math.max(7, Math.round(weeklyHours * 0.625));
			const bagrutHours1 = weeklyHours - psychHours1;
			const sInfo1 = getSessionInfo(lever1.session || 'winter');

			phases.push({
				phaseIndex: 1,
				timing: 'שבועות 1–4 (חודש ראשון)',
				weeksRange: [1, 4],
				title: `למידה משולבת: יסודות פסיכומטרי + בגרות ב-${lever1.subjectName}`,
				isConcurrent: true,
				totalWeeklyHours: weeklyHours,
				strategyNote: `בניית יסודות פסיכומטריים (${psychHours1} ש״ש) במקביל להשלמה ממוקדת של ${lever1.subjectName} (${bagrutHours1} ש״ש) עד לבחינה`,
				streams: [
					{
						subjectName: 'פסיכומטרי',
						type: 'psychometric',
						weeklyHours: psychHours1,
						focusTopic: 'חוקי יסוד בכמותי, אוצר מילים ואנגלית',
						examTarget: `יעד: ${targetPsych}`
					},
					{
						subjectName: lever1.subjectName,
						type: lever1.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core',
						weeklyHours: bagrutHours1,
						focusTopic: `תרגול נושאי בגרות והכנה למתכונות לציון ${lever1.targetGrade}`,
						examTarget: `יעד: ${lever1.targetGrade}`
					}
				],
				milestoneAtEnd: {
					title: `בחינת בגרות ב-${lever1.subjectName} (${lever1.targetUnits} יח״ל)`,
					sessionBadge: sInfo1.badgeLabel,
					type: lever1.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core',
					iconEmoji: sInfo1.iconEmoji
				}
			});

			// Month 2: Psychometric + Lever 2 (or 100% Psych if only 1 lever)
			if (lever2) {
				const psychHours2 = Math.max(8, Math.round(weeklyHours * 0.68));
				const bagrutHours2 = weeklyHours - psychHours2;
				const sInfo2 = getSessionInfo(lever2.session || 'winter');

				phases.push({
					phaseIndex: 2,
					timing: 'שבועות 5–8 (חודש שני)',
					weeksRange: [5, 8],
					title: `למידה משולבת: שיטות פסיכומטרי + בגרות ב-${lever2.subjectName}`,
					isConcurrent: true,
					totalWeeklyHours: weeklyHours,
					strategyNote: `${lever1.subjectName} הושלם בהצלחה! כעת עוברים ל-${lever2.subjectName} (${bagrutHours2} ש״ש) במקביל להעמקת הפסיכומטרי (${psychHours2} ש״ש)`,
					streams: [
						{
							subjectName: 'פסיכומטרי',
							type: 'psychometric',
							weeklyHours: psychHours2,
							focusTopic: `תרגול פרקים שלמים, קצב ודיוק ב${psychLabel}`,
							examTarget: `יעד: ${targetPsych}`
						},
						{
							subjectName: lever2.subjectName,
							type: lever2.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core',
							weeklyHours: bagrutHours2,
							focusTopic: `שאלות בגרות ונושאי מפתח להבטחת ציון ${lever2.targetGrade}`,
							examTarget: `יעד: ${lever2.targetGrade}`
						}
					],
					milestoneAtEnd: {
						title: `בחינת בגרות ב-${lever2.subjectName} (${lever2.targetUnits} יח״ל)`,
						sessionBadge: sInfo2.badgeLabel,
						type: lever2.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core',
						iconEmoji: sInfo2.iconEmoji
					}
				});
			} else {
				// No second bagrut lever -> Month 2 is 100% Psychometric advancement
				phases.push({
					phaseIndex: 2,
					timing: 'שבועות 5–8 (חודש שני)',
					weeksRange: [5, 8],
					title: 'העמקת תרגול פסיכומטרי ופרקים מלאים',
					isConcurrent: false,
					totalWeeklyHours: weeklyHours,
					strategyNote: `הבגרות ב-${lever1.subjectName} מאחוריך! 100% מהזמן מוקדש לתרגול מתקדם ופרקים בזמנים`,
					streams: [
						{
							subjectName: 'פסיכומטרי',
							type: 'psychometric',
							weeklyHours,
							focusTopic: `תרגול פרקים מלאים, דיוק זמנים ודגש על ${psychLabel}`,
							examTarget: `יעד: ${targetPsych}`
						}
					]
				});
			}

			// Month 3: 100% Pure Psychometric Simulation Sprint (Zero Bagrut Exams!)
			const sInfoPsych = getSessionInfo('spring_psych');
			phases.push({
				phaseIndex: 3,
				timing: 'שבועות 9–12 (חודש שלישי)',
				weeksRange: [9, 12],
				title: 'מרתון סימולציות בלעדי: ספרינט שיא לפסיכומטרי',
				isConcurrent: false,
				totalWeeklyHours: weeklyHours,
				strategyNote: 'כל הבגרויות כבר הסתיימו בהצלחה! 100% מזמן הלימוד מוקדש לסימולציות מלאות ולהבטחת ציון היעד',
				streams: [
					{
						subjectName: 'פסיכומטרי',
						type: 'psychometric',
						weeklyHours,
						focusTopic: `סימולציות יומיות מלאות של המרכז הארצי, תחקור טעויות וניהול אסטרטגיית מבחן`,
						examTarget: `יעד: ${targetPsych}`
					}
				],
				milestoneAtEnd: {
					title: `בחינה פסיכומטרית ארצית (יעד ${targetPsych})`,
					sessionBadge: sInfoPsych.badgeLabel,
					type: 'psychometric',
					iconEmoji: sInfoPsych.iconEmoji
				}
			});

			// Steps Generation
			steps.push({
				title: `שבועות 1–4: יסודות פסיכומטרי + בגרות ב-${lever1.subjectName} (במקביל)`,
				detail: `חלוקה שבועית: ${psychHours1} שעות לפסיכומטרי + ${bagrutHours1} שעות ל-${lever1.subjectName} עד לבחינה בסוף החודש.`,
				timing: 'שבועות 1–4 (במקביל)',
				type: 'bagrut_core',
				isConcurrent: true,
				streams: phases[0].streams
			});

			if (lever2) {
				const psychHours2 = phases[1].streams[0].weeklyHours;
				const bagrutHours2 = phases[1].streams[1].weeklyHours;
				steps.push({
					title: `שבועות 5–8: שיטות פסיכומטרי + בגרות ב-${lever2.subjectName} (במקביל)`,
					detail: `חלוקה שבועית: ${psychHours2} שעות לפסיכומטרי + ${bagrutHours2} שעות ל-${lever2.subjectName} עד לבחינה בסוף החודש.`,
					timing: 'שבועות 5–8 (במקביל)',
					type: 'bagrut_core',
					isConcurrent: true,
					streams: phases[1].streams
				});
			} else {
				steps.push({
					title: 'שבועות 5–8: תרגול פרקים מלאים ושיפור קצב',
					detail: `מיקוד בלעדי של ${weeklyHours} ש״ש בטכניקות פתרון מהיר ודגש על ${psychLabel}.`,
					timing: 'שבועות 5–8',
					type: 'psychometric',
					isConcurrent: false,
					streams: phases[1].streams
				});
			}

			steps.push({
				title: 'שבועות 9–12: מרתון סימולציות בלעדי (100% פסיכומטרי)',
				detail: `כל הבגרויות מאחוריך! 100% מזמן הלימוד (${weeklyHours} ש״ש) מוקדש לסימולציות יומיות מלאות ולהבטחת יעד ${targetPsych}.`,
				timing: 'שבועות 9–12',
				type: 'psychometric',
				isConcurrent: false,
				streams: phases[2].streams
			});

			const milestones: TrackMilestoneRecord[] = [];
			let mIdx = 1;
			milestones.push({
				id: `${trackId}-ms-${mIdx}`,
				trackId,
				orderIndex: mIdx++,
				title: `בחינת בגרות ב-${lever1.subjectName}`,
				detail: `הגעה לציון ${lever1.targetGrade} (${lever1.targetUnits} יח״ל).`,
				timing: sInfo1.timing,
				type: lever1.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core'
			});
			if (lever2) {
				const sInfo2 = getSessionInfo(lever2.session || 'winter');
				milestones.push({
					id: `${trackId}-ms-${mIdx}`,
					trackId,
					orderIndex: mIdx++,
					title: `בחינת בגרות ב-${lever2.subjectName}`,
					detail: `הגעה לציון ${lever2.targetGrade} (${lever2.targetUnits} יח״ל).`,
					timing: sInfo2.timing,
					type: lever2.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core'
				});
			}
			milestones.push({
				id: `${trackId}-ms-${mIdx}`,
				trackId,
				orderIndex: mIdx++,
				title: `בחינה פסיכומטרית ארצית`,
				detail: `השגת ציון יעד של ${targetPsych} וסגירת סף הקבלה.`,
				timing: sInfoPsych.timing,
				type: 'psychometric'
			});

			return {
				totalWeeks,
				hasConcurrency: true,
				phases,
				milestones,
				steps
			};
		} else {
			// weeklyHours < 12: Sequential fallback to prevent spreading limited hours too thin
			const totalWeeks = 16;
			const lever1 = levers[0];

			phases.push({
				phaseIndex: 1,
				timing: 'שבועות 1–4',
				weeksRange: [1, 4],
				title: `הכנה ממוקדת לבגרות ב-${lever1.subjectName}`,
				isConcurrent: false,
				totalWeeklyHours: weeklyHours,
				strategyNote: `בשל תקציב של ${weeklyHours} שעות שבועיות, השלבים תוכננו בטור כדי להבטיח התקדמות אפקטיבית`,
				streams: [
					{
						subjectName: lever1.subjectName,
						type: lever1.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core',
						weeklyHours,
						focusTopic: 'תרגול מתכונות ושאלות בגרות',
						examTarget: `יעד: ${lever1.targetGrade}`
					}
				]
			});

			phases.push({
				phaseIndex: 2,
				timing: 'שבועות 5–16',
				weeksRange: [5, 16],
				title: 'הכנה מקיפה לפסיכומטרי',
				isConcurrent: false,
				totalWeeklyHours: weeklyHours,
				strategyNote: 'מיקוד מלא בפסיכומטרי בקצב מותאם לתקציב השעות השבועי',
				streams: [
					{
						subjectName: 'פסיכומטרי',
						type: 'psychometric',
						weeklyHours,
						focusTopic: 'בניית יסודות, תרגול ומרתון סימולציות',
						examTarget: `יעד: ${targetPsych}`
					}
				]
			});

			steps.push({
				title: `שלב 1: השלמת ${lever1.subjectName}`,
				detail: `הקדשת כל ${weeklyHours} השעות השבועיות לציון ${lever1.targetGrade}.`,
				timing: 'שבועות 1–4',
				type: lever1.targetUnits >= 5 ? 'bagrut_elective' : 'bagrut_core'
			});
			steps.push({
				title: 'שלב 2: הכנה מקיפה לפסיכומטרי',
				detail: `מיקוד מלא של ${weeklyHours} ש״ש לקראת יעד ${targetPsych}.`,
				timing: 'שבועות 5–16',
				type: 'psychometric'
			});

			return {
				totalWeeks,
				hasConcurrency: false,
				phases,
				milestones: [
					{
						id: `${trackId}-ms-1`,
						trackId,
						orderIndex: 1,
						title: `בחינת בגרות ב-${lever1.subjectName}`,
						detail: `הגעה לציון ${lever1.targetGrade}.`,
						timing: 'מועד חורף',
						type: 'bagrut_core'
					},
					{
						id: `${trackId}-ms-2`,
						trackId,
						orderIndex: 2,
						title: 'בחינה פסיכומטרית',
						detail: `הגעה ליעד ${targetPsych}.`,
						timing: 'מועד אביב',
						type: 'psychometric'
					}
				],
				steps
			};
		}
	}

	// CASE 3: Direct Bagrut (0 Psychometric, multiple bagruts)
	const totalWeeks = Math.max(8, levers.length * 4);
	let currentWeek = 1;

	levers.forEach((l, idx) => {
		const isExpanded = l.targetUnits >= 5;
		const dur = isExpanded ? 5 : 4;
		const endW = currentWeek + dur - 1;
		const sInfo = getSessionInfo(l.session || (isExpanded ? 'summer' : 'winter'));

		phases.push({
			phaseIndex: idx + 1,
			timing: `שבועות ${currentWeek}–${endW}`,
			weeksRange: [currentWeek, endW],
			title: `הכנה לבגרות ב-${l.subjectName} (${l.targetUnits} יח״ל)`,
			isConcurrent: false,
			totalWeeklyHours: weeklyHours,
			strategyNote: `הכנה ממוקדת של ${weeklyHours} ש״ש להשגת ציון יעד ${l.targetGrade}`,
			streams: [
				{
					subjectName: l.subjectName,
					type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
					weeklyHours,
					focusTopic: 'תרגול מתכונות ושאלות בגרות מהמאגר הרשמי',
					examTarget: `יעד: ${l.targetGrade}`
				}
			],
			milestoneAtEnd: {
				title: `בחינת בגרות ב-${l.subjectName}`,
				sessionBadge: sInfo.badgeLabel,
				type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
				iconEmoji: sInfo.iconEmoji
			}
		});

		steps.push({
			title: `שלב ${idx + 1}: שיפור / הרחבה של ${l.subjectName}`,
			detail: `הכנה ותרגול ממוקד להגעה לציון ${l.targetGrade} (${l.targetUnits} יח״ל).`,
			timing: `שבועות ${currentWeek}–${endW}`,
			type: isExpanded ? 'bagrut_elective' : 'bagrut_core',
			isConcurrent: false,
			streams: phases[phases.length - 1].streams
		});

		currentWeek = endW + 1;
	});

	const milestones = levers.map((l, idx) => {
		const isExpanded = l.targetUnits >= 5;
		const sInfo = getSessionInfo(l.session || (isExpanded ? 'summer' : 'winter'));
		return {
			id: `${trackId}-ms-${idx + 1}`,
			trackId,
			orderIndex: idx + 1,
			title: `בחינת בגרות ב-${l.subjectName}`,
			detail: `הגעה לציון ${l.targetGrade} (${l.targetUnits} יח״ל) במועד ${sInfo.name}.`,
			timing: sInfo.timing,
			type: isExpanded ? ('bagrut_elective' as const) : ('bagrut_core' as const)
		};
	});

	return {
		totalWeeks: currentWeek - 1,
		hasConcurrency: false,
		phases,
		milestones,
		steps
	};
}

