'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, BookmarkCheck, Loader2, Plus, RotateCcw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProgramGapAnalysis, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import type { InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import type { SubjectInput } from '@/modules/calculators';
import type { RecommendedTrack } from '@/utils/analysis/trackGenerator';
import { isSameBagrutSubject } from '@/modules/optimizer/solver';
import {
	evaluateImpacts,
	evaluateScenario,
	isSubjectChanged,
	scenarioFromProfile,
	scenarioFromTrack,
	ScenarioState,
	ScenarioSubject,
	PSYCHOMETRIC_MAX,
	PSYCHOMETRIC_MIN
} from '@/modules/simulator/evaluate';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import type { BagrutSubjectOption } from '@/data/bagrutSubjects';
import { useAuth } from '@/context/AuthContext';
import { resolveInstitutionKey, UNIVERSITIES_META } from '@/components/common/UniversityLogo';
import FillSliderCard from './FillSliderCard';
import ProgramResultCard from './ProgramResultCard';

interface ScenarioSimulatorProps {
	/** The degree the simulator opens with (its tracks are loaded and saved against it). */
	analysis: ProgramGapAnalysis;
	/** Every degree in the user's target basket; any of them can be added to the simulator. */
	allAnalyses?: ProgramGapAnalysis[];
	userProfile: UserAcademicProfile;
	institutionResult?: InstitutionSekemResult;
	onApplyScenario?: (customPsych: number, customSubjects: SubjectInput[], simulatedSekem: number) => void;
	initialTrackToEdit?: RecommendedTrack | null;
	onSaveCustomTrack?: (track: Record<string, unknown>) => Promise<void>;
	onCancelEdit?: () => void;
}

const SUBJECT_MIN = 0;
const SUBJECT_MAX = 100;
/** Bagrut pass mark. */
const SUBJECT_FAIL_BELOW = 55;
/** Grade a subject added from the catalog starts at (as in the What-If simulator). */
const ADDED_SUBJECT_GRADE = 88;

/** A change lowers a degree's sekem (beyond rounding). */
const lowersAny = (deltas: (number | null)[] | null | undefined) => Boolean(deltas?.some((d) => d !== null && d < -0.005));

/** One tag per degree in the simulator: what the change adds to its sekem. */
function ImpactTags({ deltas, degrees }: { deltas: (number | null)[] | null | undefined; degrees: ProgramGapAnalysis[] }) {
	if (!deltas) return null;
	const institutions = degrees.map((a) => a.target.calculatorId);
	return (
		<>
			{deltas.map((d, i) => {
				if (d === null) return null;
				const a = degrees[i];
				const digits = a.target.calculatorId === 'technion' ? 2 : 1;
				const rounded = Number(d.toFixed(digits));
				const text = `${rounded > 0 ? '+' : ''}${rounded.toFixed(digits)}`;
				const shortName = UNIVERSITIES_META[resolveInstitutionKey(a.target.calculatorId)]?.shortName ?? a.target.institutionName;
				// Two degrees of the same institution: name the degree too
				const who = degrees.length === 1
					? 'לסכם'
					: institutions.filter((c) => c === a.target.calculatorId).length > 1
					? `${shortName}, ${a.target.program.fieldOfStudy}`
					: shortName;
				const tone = rounded > 0 ? 'bg-[#E3F1E7] text-[#205739]' : rounded < 0 ? 'bg-[#FBE3DE] text-[#9B3327]' : 'bg-[#EFEAE0] text-[#66635C]';
				return (
					<span
						key={a.target.program.id}
						title={`${a.target.program.fieldOfStudy} — ${a.target.institutionName}`}
						className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold max-w-full ${tone}`}
					>
						<span className="tabular-nums dir-ltr">{text}</span>
						<span className="truncate">{who}</span>
					</span>
				);
			})}
		</>
	);
}

const unitOptions = (s: ScenarioSubject) => {
	const base = isSameBagrutSubject(s.name, 'מתמטיקה') || isSameBagrutSubject(s.name, 'אנגלית') ? [3, 4, 5] : [2, 3, 4, 5];
	return base.includes(s.units) ? base : [...base, s.units].sort((a, b) => a - b);
};

export default function ScenarioSimulator({
	analysis,
	allAnalyses,
	userProfile,
	institutionResult,
	onApplyScenario,
	initialTrackToEdit,
	onSaveCustomTrack,
	onCancelEdit
}: ScenarioSimulatorProps) {
	const focusedId = analysis.target.program.id;
	const initialScenario = () => (initialTrackToEdit ? scenarioFromTrack(userProfile, initialTrackToEdit) : scenarioFromProfile(userProfile));

	const [scenario, setScenario] = useState<ScenarioState>(initialScenario);
	/** Degrees added from the basket, besides the one in focus (which is always shown). */
	const [addedIds, setAddedIds] = useState<string[]>([]);
	const selectedIds = useMemo(() => [focusedId, ...addedIds.filter((id) => id !== focusedId)], [focusedId, addedIds]);
	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

	const { user, openAuthModal } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// A new track to edit or a changed profile starts the simulation over
	const [startedFrom, setStartedFrom] = useState({ track: initialTrackToEdit, profile: userProfile });
	if (startedFrom.track !== initialTrackToEdit || startedFrom.profile !== userProfile) {
		setStartedFrom({ track: initialTrackToEdit, profile: userProfile });
		setScenario(initialScenario());
		setSaved(false);
		setSaveError(null);
	}

	const basket = useMemo(() => {
		const list = allAnalyses && allAnalyses.length > 0 ? allAnalyses : [analysis];
		return list.some((a) => a.target.program.id === focusedId) ? list : [analysis, ...list];
	}, [allAnalyses, analysis, focusedId]);

	const shown = useMemo(
		() => selectedIds.map((id) => basket.find((a) => a.target.program.id === id)).filter((a): a is ProgramGapAnalysis => Boolean(a)),
		[selectedIds, basket]
	);
	const available = basket.filter((a) => !selectedIds.includes(a.target.program.id));

	const results = useMemo(() => evaluateScenario(shown, userProfile, scenario), [shown, userProfile, scenario]);
	const impacts = useMemo(() => evaluateImpacts(shown, userProfile, scenario), [shown, userProfile, scenario]);
	const focusedResult = results.find((r) => r.programId === focusedId) ?? evaluateScenario([analysis], userProfile, scenario)[0];

	const originalPsych = userProfile.psychometricGeneral || 0;
	const changedSubjects = scenario.subjects.filter(isSubjectChanged);
	const hasChanges = changedSubjects.length > 0 || (originalPsych > 0 && scenario.psychometric !== originalPsych);

	const updateSubject = (id: string, patch: Partial<ScenarioSubject>) => {
		setScenario((s) => ({ ...s, subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
		setSaved(false);
	};
	const removeSubject = (id: string) => {
		setScenario((s) => ({ ...s, subjects: s.subjects.filter((x) => x.id !== id) }));
		setSaved(false);
	};
	const setPsych = (psychometric: number) => {
		setScenario((s) => ({ ...s, psychometric }));
		setSaved(false);
	};

	// The same subject already on the list (e.g. "היסטוריה (מוגבר)" for an existing history) is upgraded, never duplicated
	const handleSelectCatalogSubject = (option: BagrutSubjectOption) => {
		setIsSubjectModalOpen(false);
		setSaved(false);
		setScenario((s) => {
			const existing = s.subjects.find((x) => isSameBagrutSubject(x.name, option.name));
			if (existing) {
				return {
					...s,
					subjects: s.subjects.map((x) =>
						x.id === existing.id ? { ...x, units: Math.max(x.units, option.defaultUnits), grade: Math.max(x.grade, ADDED_SUBJECT_GRADE) } : x
					)
				};
			}
			return {
				...s,
				subjects: [
					...s.subjects,
					{
						id: `added-${Date.now()}-${option.name}`,
						name: option.name,
						units: option.defaultUnits,
						grade: ADDED_SUBJECT_GRADE,
						originalUnits: 0,
						originalGrade: 0,
						isAdded: true
					}
				]
			};
		});
	};

	const subjectInputs = (): SubjectInput[] => scenario.subjects.map((s) => ({ name: s.name, units: s.units, grade: s.grade }));

	// Save the simulation as a custom track of the degree in focus
	const handleSaveCustomTrack = async () => {
		if (!user) {
			openAuthModal('register');
			return;
		}
		setIsSaving(true);
		setSaveError(null);
		try {
			const sim = focusedResult.analysis;
			const status = sim?.status;
			const isScreening = status === 'screening';
			const isAccepted = status === 'accepted' || isScreening;
			const isMissingRequirement = status === 'missing_requirement';
			const digits = analysis.target.calculatorId === 'technion' ? 2 : 1;
			const sekem = focusedResult.currentSekem;
			const threshold = focusedResult.targetSekem;
			const psychImproved = scenario.psychometric > originalPsych;
			const recommendedSubjectImprovements = changedSubjects.map((s) => ({
				subjectName: s.name,
				currentGrade: s.originalGrade,
				currentUnits: s.originalUnits,
				targetGrade: s.grade,
				targetUnits: s.units,
				reason: s.isAdded
					? 'מקצוע מוגבר חדש'
					: s.units !== s.originalUnits
					? `שדרוג היקף מ-${s.originalUnits} ל-${s.units} יח״ל`
					: `שיפור ציון (${s.units} יח״ל)`
			}));
			const exams = recommendedSubjectImprovements.length + (psychImproved ? 1 : 0);
			const payload = {
				id: `track-custom-${Date.now()}`,
				title: initialTrackToEdit ? `מסלול מותאם: ${initialTrackToEdit.title}` : `מסלול מותאם אישית (${exams} בחינות)`,
				badge: isScreening ? 'עובר לשלב המיונים' : isAccepted ? 'עובר את הסף' : isMissingRequirement ? 'חסר תנאי סף' : 'מסלול מותאם',
				badgeColor: isAccepted ? 'emerald' : isMissingRequirement ? 'amber' : 'blue',
				targetSekem: sekem,
				targetPsychometric: scenario.psychometric,
				targetBagrutAverage: focusedResult.bagrutAverage,
				currentPsychometric: originalPsych,
				currentBagrutAverage: institutionResult?.bagrutAverage || 100,
				strategyDescription: `מסלול שיפורים מותאם אישית שנבנה בסימולטור עבור ${analysis.target.program.fieldOfStudy} ב${analysis.target.institutionName}.`,
				estimatedWeeks: exams === 0 ? 12 : exams === 1 ? (psychImproved && recommendedSubjectImprovements.length === 0 ? 12 : 8) : exams <= 3 ? 18 : 28,
				weeklyHours: exams === 0 ? 15 : exams === 1 ? 12 : exams <= 2 ? 16 : 22,
				feasibility: isAccepted ? 'high' : isMissingRequirement ? 'moderate' : 'challenging',
				feasibilityExplanation:
					threshold === null
						? isAccepted
							? 'עומד/ת בתנאי הקבלה של התוכנית (אין לה סף סכם).'
							: `אין לתוכנית סף סכם; חסר תנאי קבלה: ${sim?.admissionNote ?? ''}.`
						: isAccepted
						? `הסכם המשוקלל בסימולציה (${sekem.toFixed(digits)}) עומד בסף הקבלה הנדרש (${threshold.toFixed(digits)}).`
						: isMissingRequirement
						? `הסכם המשוקלל בסימולציה (${sekem.toFixed(digits)}) עומד בסף, אבל חסר תנאי סף רשמי: ${sim?.admissionNote ?? ''}.`
						: `הסכם המשוקלל בסימולציה (${sekem.toFixed(digits)}) מתחת לסף (${threshold.toFixed(digits)}), פער של ${Math.abs(sekem - threshold).toFixed(digits)} נקודות.`,
				keyAdvantage: 'הותאם אישית על פי בחירת המקצועות והיעדים שלך בסימולטור',
				recommendedSubjectImprovements,
				milestones: [
					...(recommendedSubjectImprovements.length > 0
						? [{ title: 'שלב 1: שדרוג מקצועות בגרות', detail: `שיפור ${recommendedSubjectImprovements.length} מקצועות בגרות`, timing: 'מועד חורף / קיץ', type: 'bagrut_core' }]
						: []),
					...(psychImproved
						? [{ title: 'שלב 2: יעד פסיכומטרי', detail: `השגת ציון ${scenario.psychometric} בבחינה הפסיכומטרית`, timing: 'מועד אביב', type: 'psychometric' }]
						: [])
				]
			};

			if (onSaveCustomTrack) {
				await onSaveCustomTrack(payload);
			} else {
				const res = await fetch('/api/tracks/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId: user.id, programId: focusedId, track: payload })
				});
				if (!(res.headers.get('content-type') || '').includes('application/json')) {
					throw new Error('התקבלה תגובה לא תקינה מהשרת');
				}
				const data = await res.json();
				if (!data.success) throw new Error(data.error || 'שגיאה בעת שמירת המסלול במסד הנתונים');
				if (typeof window !== 'undefined' && data.userId) {
					localStorage.setItem('kalis_user_id', data.userId);
					if (data.candidateNumber) localStorage.setItem('kalis_candidate_number', data.candidateNumber);
				}
			}
			setSaved(true);
		} catch (err) {
			console.error('Failed to save custom track:', err);
			setSaveError((err instanceof Error && err.message) || 'אירעה שגיאה בעת שמירת המסלול');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-white border border-[#E5DFD4] rounded-3xl p-3 sm:p-6 shadow-xs space-y-6 dir-rtl text-right">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DA] pb-4">
				<div className="space-y-1">
					<h3 className="text-xl sm:text-2xl font-black text-[#222222]">סימולטור</h3>
					<p className="text-xs sm:text-sm text-[#66635C]">
						גרור כרטיס שמאלה כדי להעלות ציון. כל תואר מחושב במחשבון של המוסד שלו.
					</p>
				</div>
				<div className="flex items-center gap-2 flex-wrap shrink-0">
					{onCancelEdit && (
						<button
							type="button"
							onClick={onCancelEdit}
							className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#222222] text-xs font-bold rounded-xl border border-[#DDD7CB] transition flex items-center gap-1.5 cursor-pointer"
						>
							<ArrowRight className="h-4 w-4 shrink-0" />
							<span>חזור למסלולים</span>
						</button>
					)}
					<button
						type="button"
						onClick={() => {
							setScenario(initialScenario());
							setSaved(false);
						}}
						className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer"
					>
						<RotateCcw className="h-3.5 w-3.5" />
						<span>{initialTrackToEdit ? 'חזור למסלול המקורי' : 'אפס'}</span>
					</button>
				</div>
			</div>

			{/* RTL: the first column (bagrut) is on the right, the degrees on the left; on phones the degrees come first */}
			<div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:items-start">
				<div className="order-2 lg:order-none lg:col-span-7 space-y-3">
					<FillSliderCard
						label="פסיכומטרי"
						value={scenario.psychometric}
						min={PSYCHOMETRIC_MIN}
						max={PSYCHOMETRIC_MAX}
						changed={originalPsych > 0 ? scenario.psychometric !== originalPsych : true}
						hint={originalPsych > 0 ? `הציון שלך: ${originalPsych}` : 'עוד אין לך ציון — הסימולציה מתחילה מ-600'}
						lowers={lowersAny(impacts.psychometric)}
						tags={impacts.psychometric && <ImpactTags deltas={impacts.psychometric} degrees={shown} />}
						size="lg"
						onChange={setPsych}
					/>

					{scenario.subjects.map((s) => {
						const changed = isSubjectChanged(s);
						return (
							<FillSliderCard
								key={s.id}
								label={s.name}
								value={s.grade}
								min={SUBJECT_MIN}
								max={SUBJECT_MAX}
								failBelow={SUBJECT_FAIL_BELOW}
								changed={changed}
								lowers={lowersAny(impacts.subjects[s.id])}
								tags={impacts.subjects[s.id] && <ImpactTags deltas={impacts.subjects[s.id]} degrees={shown} />}
								hint={s.isAdded ? 'מקצוע חדש' : changed ? `במקור: ${s.originalGrade}, ${s.originalUnits} יח״ל` : undefined}
								onChange={(grade) => updateSubject(s.id, { grade })}
							>
								<div className="flex items-center gap-0.5 bg-white/80 p-0.5 rounded-lg border border-[#E5DFD4]" role="group" aria-label={`יחידות לימוד ב${s.name}`}>
									{unitOptions(s).map((u) => (
										<button
											key={u}
											type="button"
											aria-pressed={s.units === u}
											onClick={() => updateSubject(s.id, { units: u })}
											className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
												s.units === u ? 'bg-[#3C3C3C] text-white' : 'text-[#66635C] hover:text-[#222222]'
											}`}
										>
											{u} יח״ל
										</button>
									))}
								</div>
								{s.isAdded ? (
									<button
										type="button"
										onClick={() => removeSubject(s.id)}
										className="p-1 rounded-md text-[#8A847C] hover:text-[#9B3327] hover:bg-white cursor-pointer"
										title="הסר מקצוע"
										aria-label={`הסר את ${s.name}`}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								) : (
									changed && (
										<button
											type="button"
											onClick={() => updateSubject(s.id, { grade: s.originalGrade, units: s.originalUnits })}
											className="p-1 rounded-md text-[#8A847C] hover:text-[#222222] hover:bg-white cursor-pointer"
											title="החזר לציון המקורי"
											aria-label={`החזר את ${s.name} לציון המקורי`}
										>
											<RotateCcw className="h-3.5 w-3.5" />
										</button>
									)
								)}
							</FillSliderCard>
						);
					})}

					<button
						type="button"
						onClick={() => setIsSubjectModalOpen(true)}
						className="w-full py-3 border border-dashed border-[#CFC8BA] hover:border-[#3C3C3C] rounded-2xl text-sm font-bold text-[#44423D] flex items-center justify-center gap-1.5 cursor-pointer transition"
					>
						<Plus className="h-4 w-4" />
						<span>הוסף מקצוע</span>
					</button>
				</div>

				<div className="order-1 lg:order-none lg:col-span-5 space-y-3 sticky top-16 lg:top-20 z-20 bg-white py-2 lg:py-0">
					{available.length > 0 && (
						<select
							value=""
							onChange={(e) => e.target.value && setAddedIds((ids) => [...ids, e.target.value])}
							className="w-full px-3 py-2.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F5] text-sm font-bold text-[#222222] cursor-pointer"
							aria-label="הוסף תואר מהסל לסימולטור"
						>
							<option value="">+ הוסף תואר מהסל ({available.length})</option>
							{available.map((a) => (
								<option key={a.target.program.id} value={a.target.program.id}>
									{a.target.program.fieldOfStudy} — {a.target.institutionName}
								</option>
							))}
						</select>
					)}
					<div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible snap-x pb-1">
						{shown.map((a, idx) => (
							<ProgramResultCard
								key={a.target.program.id}
								analysis={a}
								result={results[idx]}
								onRemove={a.target.program.id === focusedId ? undefined : () => setAddedIds((ids) => ids.filter((id) => id !== a.target.program.id))}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Save / apply (for the degree in focus) */}
			{(hasChanges || onApplyScenario) && (
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-[#EAE5DA] pt-4">
					{saveError && (
						<span className="text-xs font-bold text-[#9B3327] flex items-center gap-1.5 sm:ml-auto">
							<AlertCircle className="h-4 w-4" />
							{saveError}
						</span>
					)}
					{saved && (
						<span className="text-xs font-bold text-[#205739] flex items-center gap-1.5 sm:ml-auto">
							<CheckCircle2 className="h-4 w-4" />
							המסלול נשמר
						</span>
					)}
					{hasChanges && (
						<button
							type="button"
							onClick={handleSaveCustomTrack}
							disabled={isSaving || saved}
							className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] disabled:opacity-60 text-[#222222] text-xs font-bold rounded-xl border border-[#DDD7CB] transition flex items-center justify-center gap-1.5 cursor-pointer"
						>
							{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
							<span>שמור כמסלול ל{analysis.target.program.fieldOfStudy}</span>
						</button>
					)}
					{onApplyScenario && (
						<button
							type="button"
							onClick={() => onApplyScenario(scenario.psychometric, subjectInputs(), focusedResult.currentSekem)}
							className="px-4 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-xl transition cursor-pointer"
						>
							החל על תוכנית העבודה שלי
						</button>
					)}
				</div>
			)}

			<SubjectSelectModal
				isOpen={isSubjectModalOpen}
				onClose={() => setIsSubjectModalOpen(false)}
				onSelectSubject={handleSelectCatalogSubject}
				existingSubjectNames={scenario.subjects.map((s) => s.name)}
				title="הוסף מקצוע לסימולטור"
			/>
		</div>
	);
}
