'use client';

import React, { useState } from 'react';
import {
	Brain,
	BookOpen,
	Clock,
	Sparkles,
	CheckCircle2,
	ChevronLeft,
	ArrowRight,
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

	const [psychStrongestSections, setPsychStrongestSections] = useState<
		('quant' | 'verbal' | 'english' | 'balanced')[]
	>(() => {
		if (initialAnswers?.psychStrongestSections && initialAnswers.psychStrongestSections.length > 0) {
			return initialAnswers.psychStrongestSections;
		}
		if (initialAnswers?.psychStrongestSection) {
			if (initialAnswers.psychStrongestSection === 'verbal_eng') {
				return ['verbal', 'english'];
			}
			return [initialAnswers.psychStrongestSection as 'quant' | 'verbal' | 'english' | 'balanced'];
		}
		return ['balanced'];
	});

	const togglePsychStrength = (option: 'quant' | 'verbal' | 'english' | 'balanced') => {
		if (option === 'balanced') {
			setPsychStrongestSections(['balanced']);
			return;
		}

		setPsychStrongestSections((prev) => {
			const withoutBalanced = prev.filter((item) => item !== 'balanced');

			if (withoutBalanced.includes(option)) {
				const next = withoutBalanced.filter((item) => item !== option);
				return next.length === 0 ? ['balanced'] : next;
			} else {
				return [...withoutBalanced, option];
			}
		});
	};

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

		const primarySection: 'quant' | 'verbal' | 'english' | 'verbal_eng' | 'balanced' =
			psychStrongestSections.includes('balanced')
				? 'balanced'
				: psychStrongestSections.includes('verbal') && psychStrongestSections.includes('english') && !psychStrongestSections.includes('quant')
				? 'verbal_eng'
				: (psychStrongestSections[0] as 'quant' | 'verbal' | 'english') || 'balanced';

		const finalAnswers: UserPreferencesQuestionnaire = {
			psychExperience,
			psychWillingness: psychExperience === 'never' ? psychWillingness : undefined,
			psychFeeling: psychExperience !== 'never' ? psychFeeling : undefined,
			psychStrongestSection: primarySection,
			psychStrongestSections,
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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 shadow-sm relative overflow-hidden">
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-[#FAF8F5] text-[#222222] border border-[#E5DFD4] text-xs font-bold rounded-lg">
								שלב 4: שאלון התאמת מסלול אישי
							</span>
							<span className="text-xs text-[#66635C] font-medium">
								{analysis.target.institutionName}
							</span>
						</div>
						<h2 className="text-2xl font-bold text-[#222222] flex items-center gap-2">
							<Target className="h-6 w-6 text-[#222222]" />
							<span>שאלון העדפות ואילוצי למידה עבור: {analysis.target.program.fieldOfStudy}</span>
						</h2>
						<p className="text-xs sm:text-sm text-[#66635C]">
							כדי שלא נציע לך יעדים תלושים מהמציאות, השאלון ממפה את היכולות, הזמן הפנוי והחוזקות שלך.
							האלגוריתם ייצר עבורך 3 מסלולים ריאליים ומבוססי סטטיסטיקה לסגירת הפער.
						</p>
					</div>

					{analysis.gap > 0 && (
						<div className="bg-[#FAF8F5] border border-[#ECDAB6] rounded-2xl p-4 text-center shrink-0">
							<span className="text-[11px] font-bold text-[#825B15] block">פער סכם נוכחי</span>
							<span className="text-2xl font-bold text-[#222222] dir-ltr">
								+{analysis.gap.toFixed(analysis.target.calculatorId === 'technion' ? 2 : 1)}
							</span>
							<span className="text-[10px] text-[#66635C] block mt-0.5">
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
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
					<div className="flex items-center gap-3 border-b border-[#E5DFD4] pb-4">
						<div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
							<Brain className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-[#222222]">חלק א׳: ניסיון ויחס לבחינה הפסיכומטרית</h3>
							<p className="text-xs text-[#66635C]">
								הפסיכומטרי סוגר פערים במהירות, אך נתוני NITE מראים שהשיפור תלוי בניסיון קודם
							</p>
						</div>
					</div>

					{/* Question 1: Experience */}
					<div className="space-y-3">
						<label className="text-sm font-bold text-[#222222] block">
							1. האם נבחנת בבחינה הפסיכומטרית בעבר?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setPsychExperience('never')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'never'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">מעולם לא נבחנתי</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										טרם ניגשתי לבחינה רשמית (פוטנציאל לזינוק משמעותי בקורס ראשון)
									</span>
								</div>
								{psychExperience === 'never' && <CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />}
							</button>

							<button
								type="button"
								onClick={() => setPsychExperience('once')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'once'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">נבחנתי פעם אחת</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										מכיר את המבנה, יש פוטנציאל שיפור של 30–60 נקודות במועד שני
									</span>
								</div>
								{psychExperience === 'once' && <CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />}
							</button>

							<button
								type="button"
								onClick={() => setPsychExperience('multiple')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychExperience === 'multiple'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">נבחנתי פעמיים או יותר</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										ניגשתי למספר מועדים, קרוב למיצוי הפוטנציאל בבחינה זו
									</span>
								</div>
								{psychExperience === 'multiple' && <CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />}
							</button>
						</div>
					</div>

					{/* Question 2: Sub-branch depending on experience */}
					{psychExperience === 'never' ? (
						<div className="space-y-3 pt-2">
							<label className="text-sm font-bold text-[#222222] block">
								2. האם אתה מתכנן לגשת לפסיכומטרי או מעדיף להתקבל על סמך בגרויות בלבד?
							</label>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setPsychWillingness('full_exam')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychWillingness === 'full_exam'
											? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
											: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
									}`}
								>
									<div>
										<span className="text-xs font-bold block text-[#222222]">
											מוכן ומעוניין לגשת לפסיכומטרי
										</span>
										<span className="text-[11px] text-[#66635C] block mt-1">
											מוכן להשקיע בקורס או למידה אינטנסיבית לקראת מועד קרוב
										</span>
									</div>
									{psychWillingness === 'full_exam' && (
										<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
									)}
								</button>

								<button
									type="button"
									onClick={() => setPsychWillingness('prefer_bagrut_only')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychWillingness === 'prefer_bagrut_only'
											? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
											: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
									}`}
								>
									<div>
										<span className="text-xs font-bold block text-[#222222]">
											מעדיף מסלול מבוסס בגרויות בלבד (אם אפשרי)
										</span>
										<span className="text-[11px] text-[#66635C] block mt-1">
											נרתע מפסיכומטרי, מעדיף להשקיע בשיפור שאלונים בבגרות
										</span>
									</div>
									{psychWillingness === 'prefer_bagrut_only' && (
										<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
									)}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-3 pt-2">
							<label className="text-sm font-bold text-[#222222] block">
								2. איך אתה מרגיש לגבי מועד נוסף בפסיכומטרי?
							</label>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setPsychFeeling('high_potential')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychFeeling === 'high_potential'
											? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
											: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
									}`}
								>
									<div>
										<span className="text-xs font-bold block text-[#222222]">
											יש לי פוטנציאל לשיפור (לא מיציתי את עצמי)
										</span>
										<span className="text-[11px] text-[#66635C] block mt-1">
											לא למדתי מספיק, היה יום לא טוב, או שיש לי מרווח שיפור ברור
										</span>
									</div>
									{psychFeeling === 'high_potential' && (
										<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
									)}
								</button>

								<button
									type="button"
									onClick={() => setPsychFeeling('reached_ceiling')}
									className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
										psychFeeling === 'reached_ceiling'
											? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
											: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
									}`}
								>
									<div>
										<span className="text-xs font-bold block text-[#222222]">
											השקעתי מקסימום ואני קרוב לתקרה שלי
										</span>
										<span className="text-[11px] text-[#66635C] block mt-1">
											עדיף להתרכז בשיפור בגרויות ולא להמר שוב על פסיכומטרי
										</span>
									</div>
									{psychFeeling === 'reached_ceiling' && (
										<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
									)}
								</button>
							</div>
						</div>
					)}

					{/* Question 3: Strongest Section */}
					<div className="space-y-3 pt-2">
						<div className="flex items-center justify-between flex-wrap gap-2">
							<label className="text-sm font-bold text-[#222222] block">
								3. באילו תחומים בפסיכומטרי אתה מרגיש חזק יותר?
							</label>
							<span className="text-[11px] text-[#66635C] font-semibold bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E5DFD4]">
								בחירה מרובה (או רמה מאוזנת)
							</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
							{/* Option 1: Quantitative */}
							<button
								type="button"
								onClick={() => togglePsychStrength('quant')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSections.includes('quant')
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										<span className="text-xs font-bold block text-[#222222]">הפרק הכמותי</span>
									</div>
									<span className="text-[11px] text-[#66635C] block leading-snug">
										חזק במתמטיקה, חשיבה כמותית, גרפים, בעיות תנועה והספק
									</span>
								</div>
								{psychStrongestSections.includes('quant') ? (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-[#DDD7CC] bg-[#FAF8F5] shrink-0" />
								)}
							</button>

							{/* Option 2: Verbal */}
							<button
								type="button"
								onClick={() => togglePsychStrength('verbal')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSections.includes('verbal')
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										<span className="text-xs font-bold block text-[#222222]">הפרק המילולי</span>
									</div>
									<span className="text-[11px] text-[#66635C] block leading-snug">
										הבנה והסקה, אנלוגיות, היגיון, אוצר מילים וכתיבת חיבור
									</span>
								</div>
								{psychStrongestSections.includes('verbal') ? (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-[#DDD7CC] bg-[#FAF8F5] shrink-0" />
								)}
							</button>

							{/* Option 3: English */}
							<button
								type="button"
								onClick={() => togglePsychStrength('english')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSections.includes('english')
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										<span className="text-xs font-bold block text-[#222222]">פרק האנגלית</span>
									</div>
									<span className="text-[11px] text-[#66635C] block leading-snug">
										קריאה שוטפת, השלמת משפטים, ניסוח מחדש וקטעי קריאה
									</span>
								</div>
								{psychStrongestSections.includes('english') ? (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-[#DDD7CC] bg-[#FAF8F5] shrink-0" />
								)}
							</button>

							{/* Option 4: Balanced */}
							<button
								type="button"
								onClick={() => togglePsychStrength('balanced')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									psychStrongestSections.includes('balanced')
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<div className="flex items-center gap-1.5 mb-1">
										<span className="text-xs font-bold block text-[#222222]">רמה מאוזנת ושווה</span>
									</div>
									<span className="text-[11px] text-[#66635C] block leading-snug">
										אין פרק בולט, החלוקה שווה יחסית (מבטל סימון פרקים בודדים)
									</span>
								</div>
								{psychStrongestSections.includes('balanced') ? (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-[#DDD7CC] bg-[#FAF8F5] shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* ========================================================================= */}
				{/* PART 2: BAGRUT ORIENTATION */}
				{/* ========================================================================= */}
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
					<div className="flex items-center gap-3 border-b border-[#E5DFD4] pb-4">
						<div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
							<BookOpen className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-[#222222]">חלק ב׳: אוריינטציית בגרויות</h3>
							<p className="text-xs text-[#66635C]">
								התמקדות במקצוע שמתאים לכישורים שלך מבטיחה ציון 90+ עם מינימום תסכול
							</p>
						</div>
					</div>

					<div className="space-y-3">
						<label className="text-sm font-bold text-[#222222] block">
							4. באילו מקצועות קל ונוח לך יותר להגיע לציונים גבוהים?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setLearningOrientation('humanities')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'humanities'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">מקצועות הומניים וחברה</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										תנ״ך, ספרות, היסטוריה, אזרחות (קריאה וסיכומים)
									</span>
								</div>
								{learningOrientation === 'humanities' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningOrientation('stem')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'stem'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">מקצועות ריאליים ומדעים</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										מתמטיקה 5 יח״ל, פיזיקה, מדעי המחשב (בונוסים של 25–35 נקודות)
									</span>
								</div>
								{learningOrientation === 'stem' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningOrientation('flexible')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningOrientation === 'flexible'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">גמיש לכל מקצוע</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										מוכן ללמוד כל מקצוע שייתן את התשואה (ROI) הגבוהה ביותר לסכם
									</span>
								</div>
								{learningOrientation === 'flexible' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* ========================================================================= */}
				{/* PART 3: LEARNING STYLE & TIME CONSTRAINTS */}
				{/* ========================================================================= */}
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
					<div className="flex items-center gap-3 border-b border-[#E5DFD4] pb-4">
						<div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-[#222222]">חלק ג׳: אילוצי זמן, שעות ויעד פתיחה</h3>
							<p className="text-xs text-[#66635C]">
								המסלול חייב להשתלב בשגרת החיים שלך כדי שלא תנשור באמצע
							</p>
						</div>
					</div>

					{/* Question 5: Learning Strength */}
					<div className="space-y-3">
						<label className="text-sm font-bold text-[#222222] block">
							5. איזה סגנון למידה מתאר אותך בצורה הטובה ביותר?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setLearningStrength('analytical_quick')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'analytical_quick'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">
										קליטה מהירה ועבודה תחת לחץ זמנים
									</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										מסתדר טוב עם שאלות אמריקאיות ומהירות תגובה (מתאים לפסיכומטרי)
									</span>
								</div>
								{learningStrength === 'analytical_quick' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningStrength('deep_accuracy_no_rush')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'deep_accuracy_no_rush'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">
										למידה יסודית, הבנה עמוקה ודיוק
									</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										מעדיף מבחנים עם זמן מספק, פתרונות מלאים והבנה ולא ניחוש מהיר
									</span>
								</div>
								{learningStrength === 'deep_accuracy_no_rush' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setLearningStrength('memory_retention')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									learningStrength === 'memory_retention'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">
										זיכרון חזק ויכולת קריאת מסות
									</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										זוכר פרטים, מונחים היסטוריים ותוכן בקלות (אידיאלי להומני)
									</span>
								</div>
								{learningStrength === 'memory_retention' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>
						</div>
					</div>

					{/* Question 6: Hours */}
					<div className="space-y-3 pt-2">
						<label className="text-sm font-bold text-[#222222] block">
							6. כמה שעות שבועיות תוכל להקדיש ללמידה ושיפור?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('full_30_plus')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'full_30_plus'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">30+ שעות שבועיות (מלא)</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										למידה אינטנסיבית כמשרה מלאה — פוטנציאל לסגירה מהירה
									</span>
								</div>
								{weeklyAvailabilityHours === 'full_30_plus' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('part_15_25')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'part_15_25'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">
										15–25 שעות שבועיות (משלב)
									</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										שילוב בריא עם עבודה חלקית או שירות צבאי/אזרחי
									</span>
								</div>
								{weeklyAvailabilityHours === 'part_15_25' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setWeeklyAvailabilityHours('limited_under_15')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									weeklyAvailabilityHours === 'limited_under_15'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">
										עד 15 שעות שבועיות (מוגבל)
									</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										עובד במשרה מלאה — נדרש פיזור מאמץ ומסלול שאינו דחוס
									</span>
								</div>
								{weeklyAvailabilityHours === 'limited_under_15' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>
						</div>
					</div>

					{/* Question 7: Target timeline */}
					<div className="space-y-3 pt-2">
						<label className="text-sm font-bold text-[#222222] block">
							7. מתי אתה מעוניין להתחיל את שנת הלימודים האקדמית?
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<button
								type="button"
								onClick={() => setTargetTimeline('immediate_october')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'immediate_october'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">באוקטובר הקרוב</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										רוצה להתחיל בהקדם האפשרי (דרוש שיפור ממוקד במועד הקרוב)
									</span>
								</div>
								{targetTimeline === 'immediate_october' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setTargetTimeline('next_year_october')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'next_year_october'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">אוקטובר של השנה הבאה</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										יש מרווח של שנה שלמה להכנה יסודית ללא לחץ
									</span>
								</div>
								{targetTimeline === 'next_year_october' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>

							<button
								type="button"
								onClick={() => setTargetTimeline('flexible')}
								className={`p-4 rounded-2xl border text-right transition flex items-start justify-between gap-3 ${
									targetTimeline === 'flexible'
										? 'bg-[#FAF8F5] border-2 border-[#3C3C3C] text-[#222222] shadow-sm'
										: 'bg-white border-[#E5DFD4] text-[#66635C] hover:text-[#222222] hover:border-[#DDD7CC]'
								}`}
							>
								<div>
									<span className="text-xs font-bold block text-[#222222]">גמיש לחלוטין</span>
									<span className="text-[11px] text-[#66635C] block mt-1">
										העיקר להתקבל למסלול המבוקש בסיכויי ההצלחה הגבוהים ביותר
									</span>
								</div>
								{targetTimeline === 'flexible' && (
									<CheckCircle2 className="h-5 w-5 text-[#222222] shrink-0" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Actions Bar */}
				<div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-[#E5DFD4]">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="px-5 py-3 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-2 border border-[#E5DFD4]"
						>
							<ArrowRight className="h-4 w-4" />
							<span>חזור לדוח הקבלה</span>
						</button>
					)}

					<div className="mr-auto flex items-center gap-3 flex-wrap">
						<button
							type="submit"
							className="px-8 py-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-2xl shadow-sm transition flex items-center gap-3"
						>
							<Sparkles className="h-5 w-5 text-white" />
							<span>חשב 3 מסלולים מומלצים ומותאמים אישית</span>
							<ChevronLeft className="h-5 w-5" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
