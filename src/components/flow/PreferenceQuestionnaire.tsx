'use client';

import React, { useState } from 'react';
import {
	Brain,
	BookOpen,
	Clock,
	Calendar,
	Sparkles,
	CheckCircle2,
	ChevronLeft,
	ArrowRight,
	HelpCircle,
	AlertCircle,
	Target
} from 'lucide-react';
import { UserPreferencesQuestionnaire } from '@/utils/analysis/trackGenerator';
import { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';

interface PreferenceQuestionnaireProps {
	analysis: ProgramGapAnalysis;
	initialAnswers?: Partial<UserPreferencesQuestionnaire>;
	onSubmit: (answers: UserPreferencesQuestionnaire) => void;
	onCancel?: () => void;
}

export default function PreferenceQuestionnaire({
	analysis,
	initialAnswers,
	onSubmit,
	onCancel
}: PreferenceQuestionnaireProps) {
	// State for each question
	const [psychExperience, setPsychExperience] = useState<
		'never' | 'once' | 'multiple'
	>(initialAnswers?.psychExperience || 'once');

	const [psychWillingness, setPsychWillingness] = useState<
		'full_exam' | 'prefer_bagrut_only'
	>(initialAnswers?.psychWillingness || 'full_exam');

	const [psychFeeling, setPsychFeeling] = useState<
		'high_potential' | 'reached_ceiling'
	>(initialAnswers?.psychFeeling || 'high_potential');

	const [psychStrongestSection, setPsychStrongestSection] = useState<
		'quant' | 'verbal_eng' | 'balanced'
	>(initialAnswers?.psychStrongestSection || 'quant');

	const [learningOrientation, setLearningOrientation] = useState<
		'humanities' | 'stem' | 'flexible'
	>(initialAnswers?.learningOrientation || 'flexible');

	const [learningStrength, setLearningStrength] = useState<
		'memory_retention' | 'analytical_quick' | 'deep_accuracy_no_rush'
	>(initialAnswers?.learningStrength || 'analytical_quick');

	const [weeklyAvailabilityHours, setWeeklyAvailabilityHours] = useState<
		'full_30_plus' | 'part_15_25' | 'limited_under_15'
	>(initialAnswers?.weeklyAvailabilityHours || 'part_15_25');

	const [targetTimeline, setTargetTimeline] = useState<
		'immediate_october' | 'next_year_october' | 'flexible'
	>(initialAnswers?.targetTimeline || 'immediate_october');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const finalAnswers: UserPreferencesQuestionnaire = {
			psychExperience,
			psychWillingness: psychExperience === 'never' ? psychWillingness : undefined,
			psychFeeling: psychExperience !== 'never' ? psychFeeling : undefined,
			psychStrongestSection,
			learningOrientation,
			learningStrength,
			weeklyAvailabilityHours,
			targetTimeline
		};
		onSubmit(finalAnswers);
	};

	return (
		<div className="space-y-8 dir-rtl text-right">
			{/* Target Program Context Header */}
			<div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
				<div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black rounded-lg">
								שלב 4: שאלון התאמת מסלול אישי
							</span>
							<span className="text-xs text-slate-400 font-medium">
								{analysis.target.institutionName}
							</span>
						</div>
						<h2 className="text-2xl font-black text-white flex items-center gap-2">
							<Target className="h-6 w-6 text-cyan-400" />
							<span>שאלון העדפות ואילוצי למידה עבור: {analysis.target.program.fieldOfStudy}</span>
						</h2>
						<p className="text-xs sm:text-sm text-slate-300">
							כדי שלא נציע לך יעדים תלושים מהמציאות, השאלון ממפה את היכולות, הזמן הפנוי והחוזקות שלך.
							האלגוריתם ייצר עבורך 3 מסלולים ריאליים ומבוססי סטטיסטיקה לסגירת הפער.
						</p>
					</div>

					{analysis.gap > 0 && (
						<div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 text-center shrink-0">
							<span className="text-[11px] font-bold text-amber-400 block">פער סכם נוכחי</span>
							<span className="text-2xl font-black text-white dir-ltr">
								+{analysis.gap.toFixed(analysis.target.calculatorId === 'technion' ? 2 : 1)}
							</span>
							<span className="text-[10px] text-slate-400 block mt-0.5">
								{analysis.target.calculatorId === 'technion' ? 'נקודות סכם טכניוני' : 'נקודות סכם'}
							</span>
						</div>
					)}
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">
				{/* ========================================================================= */}
				{/* PART 1: PSYCHOMETRIC AXIS */}
				{/* ========================================================================= */}
				<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
					<div className="flex items-center gap-3 border-b border-slate-800 pb-4">
						<div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
							<Brain className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-black text-white">חלק א׳: ניסיון ויחס לבחינה הפסיכומטרית</h3>
							<p className="text-xs text-slate-400">
								הפסיכומטרי סוגר פערים במהירות, אך נתוני NITE מראים שהשיפור תלוי בניסיון קודם
							</p>
						</div>
					</div>

					{/* Question 1: Experience */}
					<div className="space-y-3">
						<label className="text-sm font-bold text-slate-200 block">
							1. האם נבחנת בבחינה הפסיכומטרית בעבר?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setPsychExperience('never')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'never'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">מעולם לא נבחנתי</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										טרם ניגשתי לבחינה רשמית (פוטנציאל לזינוק משמעותי בקורס ראשון)
									</span>
								</div>
								{psychExperience === 'never' && <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />}
							</button>

							<button
								type="button"
								onClick={() => setPsychExperience('once')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'once'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">נבחנתי פעם אחת</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										מכיר את המבנה, יש פוטנציאל שיפור של 30–60 נקודות במועד שני
									</span>
								</div>
								{psychExperience === 'once' && <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />}
							</button>

							<button
								type="button"
								onClick={() => setPsychExperience('multiple')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'multiple'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">נבחנתי פעמיים או יותר</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										ניגשתי למספר מועדים, קרוב למיצוי הפוטנציאל בבחינה זו
									</span>
								</div>
								{psychExperience === 'multiple' && <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />}
							</button>
						</div>
					</div>

					{/* Question 2: Sub-branch depending on experience */}
					{psychExperience === 'never' ? (
						<div className="space-y-3 pt-2">
							<label className="text-sm font-bold text-slate-200 block">
								2. האם אתה מתכנן לגשת לפסיכומטרי או מעדיף להתקבל על סמך בגרויות בלבד?
							</label>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setPsychWillingness('full_exam')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychWillingness === 'full_exam'
											? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
									}`}
								>
									<div>
										<span className="text-xs font-black block text-white">
											מוכן ומעוניין לגשת לפסיכומטרי
										</span>
										<span className="text-[11px] text-slate-400 block mt-1">
											מוכן להשקיע בקורס או למידה אינטנסיבית לקראת מועד קרוב
										</span>
									</div>
									{psychWillingness === 'full_exam' && (
										<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
									)}
								</button>

								<button
									type="button"
									onClick={() => setPsychWillingness('prefer_bagrut_only')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychWillingness === 'prefer_bagrut_only'
											? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
									}`}
								>
									<div>
										<span className="text-xs font-black block text-white">
											מעדיף מסלול מבוסס בגרויות בלבד (אם אפשרי)
										</span>
										<span className="text-[11px] text-slate-400 block mt-1">
											נרתע מפסיכומטרי, מעדיף להשקיע בשיפור שאלונים בבגרות
										</span>
									</div>
									{psychWillingness === 'prefer_bagrut_only' && (
										<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
									)}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-3 pt-2">
							<label className="text-sm font-bold text-slate-200 block">
								2. איך אתה מרגיש לגבי מועד נוסף בפסיכומטרי?
							</label>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setPsychFeeling('high_potential')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychFeeling === 'high_potential'
											? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
									}`}
								>
									<div>
										<span className="text-xs font-black block text-white">
											יש לי פוטנציאל לשיפור (לא מיציתי את עצמי)
										</span>
										<span className="text-[11px] text-slate-400 block mt-1">
											לא למדתי מספיק, היה יום לא טוב, או שיש לי מרווח שיפור ברור
										</span>
									</div>
									{psychFeeling === 'high_potential' && (
										<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
									)}
								</button>

								<button
									type="button"
									onClick={() => setPsychFeeling('reached_ceiling')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychFeeling === 'reached_ceiling'
											? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
									}`}
								>
									<div>
										<span className="text-xs font-black block text-white">
											השקעתי מקסימום ואני קרוב לתקרה שלי
										</span>
										<span className="text-[11px] text-slate-400 block mt-1">
											עדיף להתרכז בשיפור בגרויות ולא להמר שוב על פסיכומטרי
										</span>
									</div>
									{psychFeeling === 'reached_ceiling' && (
										<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
									)}
								</button>
							</div>
						</div>
					)}

					{/* Question 3: Strongest Section */}
					<div className="space-y-3 pt-2">
						<label className="text-sm font-bold text-slate-200 block">
							3. איזה תחום בפסיכומטרי הכי חזק/נוח לך?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setPsychStrongestSection('quant')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSection === 'quant'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">הפרק הכמותי</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										חזק במתמטיקה, גרפים, בעיות תנועה והספק
									</span>
								</div>
								{psychStrongestSection === 'quant' && (
									<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setPsychStrongestSection('verbal_eng')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSection === 'verbal_eng'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">המילולי והאנגלית</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										הבנה והסקה, אוצר מילים עשיר וקריאה שוטפת
									</span>
								</div>
								{psychStrongestSection === 'verbal_eng' && (
									<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setPsychStrongestSection('balanced')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSection === 'balanced'
										? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">רמה מאוזנת ושווה</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										אין פרק בולט, החלוקה שווה יחסית בכל התחומים
									</span>
								</div>
								{psychStrongestSection === 'balanced' && (
									<CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* ========================================================================= */}
				{/* PART 2: BAGRUT ORIENTATION */}
				{/* ========================================================================= */}
				<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
					<div className="flex items-center gap-3 border-b border-slate-800 pb-4">
						<div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
							<BookOpen className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-black text-white">חלק ב׳: אוריינטציית בגרויות</h3>
							<p className="text-xs text-slate-400">
								התמקדות במקצוע שמתאים לכישורים שלך מבטיחה ציון 90+ עם מינימום תסכול
							</p>
						</div>
					</div>

					<div className="space-y-3">
						<label className="text-sm font-bold text-slate-200 block">
							4. באילו מקצועות קל ונוח לך יותר להגיע לציונים גבוהים?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setLearningOrientation('humanities')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'humanities'
										? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">מקצועות הומניים וחברה</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										תנ״ך, ספרות, היסטוריה, אזרחות (קריאה וסיכומים)
									</span>
								</div>
								{learningOrientation === 'humanities' && (
									<CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningOrientation('stem')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'stem'
										? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">מקצועות ריאליים ומדעים</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										מתמטיקה 5 יח״ל, פיזיקה, מדעי המחשב (בונוסים של 25–35 נקודות)
									</span>
								</div>
								{learningOrientation === 'stem' && (
									<CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningOrientation('flexible')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'flexible'
										? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">גמיש לכל מקצוע</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										מוכן ללמוד כל מקצוע שייתן את התשואה (ROI) הגבוהה ביותר לסכם
									</span>
								</div>
								{learningOrientation === 'flexible' && (
									<CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* ========================================================================= */}
				{/* PART 3: LEARNING STYLE & TIME CONSTRAINTS */}
				{/* ========================================================================= */}
				<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
					<div className="flex items-center gap-3 border-b border-slate-800 pb-4">
						<div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-black text-white">חלק ג׳: אילוצי זמן, שעות ויעד פתיחה</h3>
							<p className="text-xs text-slate-400">
								המסלול חייב להשתלב בשגרת החיים שלך כדי שלא תנשור באמצע
							</p>
						</div>
					</div>

					{/* Question 5: Learning Strength */}
					<div className="space-y-3">
						<label className="text-sm font-bold text-slate-200 block">
							5. איזה סגנון למידה מתאר אותך בצורה הטובה ביותר?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setLearningStrength('analytical_quick')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'analytical_quick'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">
										קליטה מהירה ועבודה תחת לחץ זמנים
									</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										מסתדר טוב עם שאלות אמריקאיות ומהירות תגובה (מתאים לפסיכומטרי)
									</span>
								</div>
								{learningStrength === 'analytical_quick' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningStrength('deep_accuracy_no_rush')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'deep_accuracy_no_rush'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">
										למידה יסודית, הבנה עמוקה ודיוק
									</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										מעדיף מבחנים עם זמן מספק, פתרונות מלאים והבנה ולא ניחוש מהיר
									</span>
								</div>
								{learningStrength === 'deep_accuracy_no_rush' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningStrength('memory_retention')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'memory_retention'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">
										זיכרון חזק ויכולת קריאת מסות
									</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										זוכר פרטים, מונחים היסטוריים ותוכן בקלות (אידיאלי להומני)
									</span>
								</div>
								{learningStrength === 'memory_retention' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>
						</div>
					</div>

					{/* Question 6: Hours */}
					<div className="space-y-3 pt-2">
						<label className="text-sm font-bold text-slate-200 block">
							6. כמה שעות שבועיות תוכל להקדיש ללמידה ושיפור?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('full_30_plus')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'full_30_plus'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">30+ שעות שבועיות (מלא)</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										למידה אינטנסיבית כמשרה מלאה — פוטנציאל לסגירה מהירה
									</span>
								</div>
								{weeklyAvailabilityHours === 'full_30_plus' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('part_15_25')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'part_15_25'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">
										15–25 שעות שבועיות (משלב)
									</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										שילוב בריא עם עבודה חלקית או שירות צבאי/אזרחי
									</span>
								</div>
								{weeklyAvailabilityHours === 'part_15_25' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('limited_under_15')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'limited_under_15'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">
										עד 15 שעות שבועיות (מוגבל)
									</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										עובד במשרה מלאה — נדרש פיזור מאמץ ומסלול שאינו דחוס
									</span>
								</div>
								{weeklyAvailabilityHours === 'limited_under_15' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>
						</div>
					</div>

					{/* Question 7: Target timeline */}
					<div className="space-y-3 pt-2">
						<label className="text-sm font-bold text-slate-200 block">
							7. מתי אתה מעוניין להתחיל את שנת הלימודים האקדמית?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setTargetTimeline('immediate_october')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'immediate_october'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">באוקטובר הקרוב</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										רוצה להתחיל בהקדם האפשרי (דרוש שיפור ממוקד במועד הקרוב)
									</span>
								</div>
								{targetTimeline === 'immediate_october' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setTargetTimeline('next_year_october')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'next_year_october'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">אוקטובר של השנה הבאה</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										יש מרווח של שנה שלמה להכנה יסודית ללא לחץ
									</span>
								</div>
								{targetTimeline === 'next_year_october' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setTargetTimeline('flexible')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'flexible'
										? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
										: 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
								}`}
							>
								<div>
									<span className="text-xs font-black block text-white">גמיש לחלוטין</span>
									<span className="text-[11px] text-slate-400 block mt-1">
										העיקר להתקבל למסלול המבוקש בסיכויי ההצלחה הגבוהים ביותר
									</span>
								</div>
								{targetTimeline === 'flexible' && (
									<CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-800">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700"
						>
							<ArrowRight className="h-4 w-4" />
							<span>חזור לדוח הקבלה</span>
						</button>
					)}

					<div className="mr-auto flex items-center gap-3 flex-wrap">
						<button
							type="submit"
							className="px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
						>
							<Sparkles className="h-5 w-5 text-cyan-200 animate-pulse" />
							<span>חשב 3 מסלולים מומלצים ומותאמים אישית</span>
							<ChevronLeft className="h-5 w-5" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
