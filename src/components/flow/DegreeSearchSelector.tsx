'use client';

import React, { useState, useMemo } from 'react';
import {
	Search,
	GraduationCap,
	Landmark,
	ChevronDown,
	Check,
	Plus,
	X,
	ArrowLeft
} from 'lucide-react';
import { useInstitutionsCatalog } from '../../hooks/useInstitutionsCatalog';
import { TargetProgramSelection } from '../../utils/analysis/gapAnalyzer';
import UniversityLogo from '../common/UniversityLogo';

/** Only an official minimum psychometric is shown (the catalog's minPsychometricFloor may be a name-based estimate). */
const officialPsychMin = (program: any): number | undefined =>
	program?.admissionRoutes?.minPsychometric ?? program?.prerequisites?.admissionRoutes?.minPsychometric ?? undefined;

const MAJOR_INSTITUTION_CHIPS = [
	{ id: 'all', name: 'כל המוסדות' },
	{ id: 'tau', name: 'תל אביב', calcId: 'tau', badge: 'TAU', color: 'from-purple-500 to-indigo-600' },
	{ id: 'technion', name: 'הטכניון', calcId: 'technion', badge: 'IIT', color: 'from-blue-600 to-teal-500' },
	{ id: 'bgu', name: 'בן-גוריון', calcId: 'bgu', badge: 'BGU', color: 'from-cyan-500 to-blue-600' },
	{ id: 'huji', name: 'העברית', calcId: 'huji', badge: 'HUJI', color: 'from-amber-500 to-orange-600' },
	{ id: 'bar_ilan', name: 'בר-אילן', calcId: 'bar_ilan', badge: 'BIU', color: 'from-amber-600 to-yellow-500' },
	{ id: 'haifa', name: 'חיפה', calcId: 'haifa', badge: 'UOH', color: 'from-sky-500 to-indigo-500' },
	{ id: 'ariel', name: 'אריאל', calcId: 'ariel', badge: 'AU', color: 'from-emerald-500 to-green-600' },
	{ id: 'reichman', name: 'רייכמן', calcId: 'reichman', badge: 'RUNI', color: 'from-blue-700 to-indigo-800' }
];

const INST_BADGE_MAP: Record<string, { badge: string; color: string; shortName: string }> = {
	'inst-6': { badge: 'TAU', color: 'from-purple-500 to-indigo-600', shortName: 'תל אביב' },
	'inst-48': { badge: 'IIT', color: 'from-blue-600 to-teal-500', shortName: 'הטכניון' },
	'inst-3': { badge: 'BGU', color: 'from-cyan-500 to-blue-600', shortName: 'בן-גוריון' },
	'inst-1': { badge: 'HUJI', color: 'from-amber-500 to-orange-600', shortName: 'העברית' },
	'inst-4': { badge: 'BIU', color: 'from-amber-600 to-yellow-500', shortName: 'בר-אילן' },
	'inst-5': { badge: 'UOH', color: 'from-sky-500 to-indigo-500', shortName: 'חיפה' },
	'inst-2': { badge: 'AU', color: 'from-emerald-500 to-green-600', shortName: 'אריאל' },
	'inst-38': { badge: 'RUNI', color: 'from-blue-700 to-indigo-800', shortName: 'רייכמן' },
	tau: { badge: 'TAU', color: 'from-purple-500 to-indigo-600', shortName: 'תל אביב' },
	technion: { badge: 'IIT', color: 'from-blue-600 to-teal-500', shortName: 'הטכניון' },
	bgu: { badge: 'BGU', color: 'from-cyan-500 to-blue-600', shortName: 'בן-גוריון' },
	huji: { badge: 'HUJI', color: 'from-amber-500 to-orange-600', shortName: 'העברית' },
	bar_ilan: { badge: 'BIU', color: 'from-amber-600 to-yellow-500', shortName: 'בר-אילן' },
	haifa: { badge: 'UOH', color: 'from-sky-500 to-indigo-500', shortName: 'חיפה' },
	ariel: { badge: 'AU', color: 'from-emerald-500 to-green-600', shortName: 'אריאל' },
	reichman: { badge: 'RUNI', color: 'from-blue-700 to-indigo-800', shortName: 'רייכמן' }
};

const DISCIPLINE_FILTERS = [
	{ id: 'all', label: 'כל התחומים' },
	{ id: 'stem', label: 'הנדסה ומדעי המחשב', keywords: ['הנדס', 'מדעי המחשב', 'תוכנה', 'סייבר', 'נתונים'] },
	{ id: 'exact', label: 'מדעים מדויקים', keywords: ['פיזיקה', 'כימיה', 'מתמטיקה', 'גיאופיזיקה', 'ביוטכנולוגיה'] },
	{ id: 'business', label: 'ניהול וכלכלה', keywords: ['ניהול', 'מנהל עסקים', 'כלכלה', 'חשבונאות', 'סטטיסטיקה'] },
	{ id: 'med', label: 'רפואה ומדעי הבריאות', keywords: ['רפואה', 'סיעוד', 'רוקחות', 'פיזיותרפיה', 'ריפוי', 'בריאות'] },
	{ id: 'law_humanities', label: 'משפטים, רוח וחברה', keywords: ['משפטים', 'פסיכולוגיה', 'סוציולוגיה', 'תקשורת', 'היסטוריה', 'פילוסופיה'] }
];

const CALC_ID_MAP: Record<string, string> = {
	'inst-6': 'tau',
	'inst-48': 'technion',
	'inst-3': 'bgu',
	'inst-1': 'huji',
	'inst-4': 'bar_ilan',
	'inst-5': 'haifa',
	'inst-2': 'ariel',
	'inst-38': 'reichman',
	tau: 'tau',
	technion: 'technion',
	bgu: 'bgu',
	huji: 'huji',
	bar_ilan: 'bar_ilan',
	haifa: 'haifa',
	ariel: 'ariel',
	reichman: 'reichman'
};

interface DegreeSearchSelectorProps {
	selectedPrograms: TargetProgramSelection[];
	onToggleProgram: (target: TargetProgramSelection) => void;
	onAddMultiplePrograms?: (targets: TargetProgramSelection[]) => void;
	onRemoveProgram: (programId: string) => void;
	onClearAll: () => void;
	onProceedToNextStep?: () => void;
}

export default function DegreeSearchSelector({
	selectedPrograms,
	onToggleProgram,
	onRemoveProgram,
	onClearAll,
	onProceedToNextStep
}: DegreeSearchSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedInstFilters, setSelectedInstFilters] = useState<string[]>([]);
	const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
	const [isInstFilterOpen, setIsInstFilterOpen] = useState(false);
	const [isDisciplineFilterOpen, setIsDisciplineFilterOpen] = useState(false);
	const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
	const [isBasketOpen, setIsBasketOpen] = useState(false);

	// Full catalog comes from /api/institutions (kept out of the client bundle)
	const { institutions: institutionsList, isLoading: isCatalogLoading, isLoadedFromDb } = useInstitutionsCatalog();

	// Flatten all programs with institution metadata directly from SQLite
	const allFlattenedPrograms = useMemo(() => {
		const list: TargetProgramSelection[] = [];
		for (const inst of institutionsList) {
			const calcId = (inst as any).calculatorId || CALC_ID_MAP[inst.id] || inst.id || 'general';
			for (const prog of inst.programs) {
				// Programs the institution doesn't list this year can't be picked
				if ((prog as any).notOffered || (prog as any).prerequisites?.notOffered) continue;
				list.push({
					institutionId: inst.id,
					institutionName: inst.name,
					calculatorId: calcId,
					program: prog
				});
			}
		}
		return list;
	}, [institutionsList]);

	// Filter programs based on user criteria (multi-institution & multi-discipline support)
	const filteredPrograms = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const activeDisciplineObjs = DISCIPLINE_FILTERS.filter((d) =>
			selectedDisciplines.includes(d.id)
		);

		return allFlattenedPrograms.filter((item) => {
			const field = item.program.fieldOfStudy.toLowerCase();

			// 1. Multi-Institution filter
			if (selectedInstFilters.length > 0) {
				const matchesAnyInst = selectedInstFilters.some(
					(filterId) =>
						item.institutionId === filterId ||
						item.calculatorId === filterId ||
						CALC_ID_MAP[item.institutionId] === filterId ||
						CALC_ID_MAP[filterId] === item.calculatorId
				);
				if (!matchesAnyInst) return false;
			}

			// 2. Multi-Discipline filter
			if (activeDisciplineObjs.length > 0) {
				const matchesAnyDiscipline = activeDisciplineObjs.some((disc) =>
					disc.keywords && disc.keywords.some((kw) => field.includes(kw.toLowerCase()))
				);
				if (!matchesAnyDiscipline) return false;
			}

			// 3. Free text search
			if (q) {
				const inst = item.institutionName.toLowerCase();
				const level = item.program.degreeLevel.toLowerCase();
				if (!field.includes(q) && !inst.includes(q) && !level.includes(q)) {
					return false;
				}
			}

			return true;
		});
	}, [
		allFlattenedPrograms,
		searchQuery,
		selectedInstFilters,
		selectedDisciplines
	]);

	const isSelected = (id: string) => selectedPrograms.some((sp) => sp.program.id === id);

	const toggleExpandCard = (cardKey: string) => {
		setExpandedCardIds((prev) => ({
			...prev,
			[cardKey]: !prev[cardKey]
		}));
	};

	// Toggle individual institution selection
	const handleToggleInstitution = (instId: string) => {
		if (instId === 'all') {
			setSelectedInstFilters([]);
			return;
		}
		setSelectedInstFilters((prev) =>
			prev.includes(instId) ? prev.filter((id) => id !== instId) : [...prev, instId]
		);
	};

	// Toggle individual discipline selection
	const handleToggleDiscipline = (discId: string) => {
		if (discId === 'all') {
			setSelectedDisciplines([]);
			return;
		}
		setSelectedDisciplines((prev) =>
			prev.includes(discId) ? prev.filter((id) => id !== discId) : [...prev, discId]
		);
	};

	// Count how many unique institutions are represented in current filtered list
	const uniqueInstitutionsCount = useMemo(() => {
		const set = new Set(filteredPrograms.map((p) => p.institutionId));
		return set.size;
	}, [filteredPrograms]);

	const instFilterButtonText = useMemo(() => {
		if (selectedInstFilters.length === 0) return 'סינון לפי מוסד';
		if (selectedInstFilters.length === 1) {
			const found = MAJOR_INSTITUTION_CHIPS.find((i) => i.id === selectedInstFilters[0]);
			return `מוסד: ${found ? found.name : selectedInstFilters[0]}`;
		}
		return `מוסדות (${selectedInstFilters.length})`;
	}, [selectedInstFilters]);

	const discFilterButtonText = useMemo(() => {
		if (selectedDisciplines.length === 0) return 'סינון לפי תחום דעת';
		if (selectedDisciplines.length === 1) {
			const found = DISCIPLINE_FILTERS.find((d) => d.id === selectedDisciplines[0]);
			return `תחום: ${found ? found.label : selectedDisciplines[0]}`;
		}
		return `תחומים (${selectedDisciplines.length})`;
	}, [selectedDisciplines]);

	return (
		<div className="flex flex-col h-full space-y-3 min-h-0">
			{/* ========================================================================= */}
			{/* 1. TOP COMPONENT: SEARCH & EXPANDABLE FILTERS (חיפוש וסינון תארים) */}
			{/* ========================================================================= */}
			<div className="bg-white border border-line rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 shrink-0">
				{/* Top Integrated Title Bar */}
				<div className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-3.5">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2.5 py-0.5 rounded-full bg-paper border border-line-strong text-ink-2 text-[11px] font-bold shadow-2xs">
								שלב 2 מתוך 4: הגדרת מטרות
							</span>
						</div>
						<h2 className="text-xl sm:text-2xl font-bold text-ink">
							שלב 2: בחירת תארים מבוקשים
						</h2>
						<p className="text-xs text-ink-2 mt-0.5">
							בחר את התארים והמוסדות שמעניין אותך לבדוק. סל היעדים שלך מתעדכן מיידית.
						</p>
					</div>

					{/* Expandable Basket Trigger Button */}
					<button
						type="button"
						onClick={() => setIsBasketOpen(!isBasketOpen)}
						className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs border ${
							selectedPrograms.length > 0
								? 'bg-ink text-white border-ink hover:bg-black'
								: 'bg-paper text-ink-2 border-line-strong hover:bg-line'
						}`}
						title={isBasketOpen ? 'סגור את סל התארים' : 'פתח את סל התארים שנבחרו'}
					>
						<GraduationCap className="h-4 w-4" />
						<span>סל תארים שנבחרו</span>
						<span
							className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
								selectedPrograms.length > 0 ? 'bg-white text-black' : 'bg-line text-ink-2'
							}`}
						>
							{selectedPrograms.length}
						</span>
					</button>
				</div>

				{/* Search bar */}
				<div className="relative">
					<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-3" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="חפש חוג ספציפי (למשל: מדעי המחשב, הנדסת חשמל, ניהול, משפטים, פסיכולוגיה)..."
						className="w-full bg-paper border border-line rounded-2xl pr-12 pl-10 py-3 text-sm font-medium text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery('')}
							className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink cursor-pointer"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Expandable Filter Action Buttons Bar */}
				<div className="flex flex-wrap items-center gap-2 pt-0.5">
					{/* Institution Filter Expander Button */}
					<button
						type="button"
						onClick={() => setIsInstFilterOpen(!isInstFilterOpen)}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
							isInstFilterOpen || selectedInstFilters.length > 0
								? 'bg-ink border-ink text-white shadow-2xs'
								: 'bg-paper border-line text-ink-2 hover:border-line-strong hover:text-ink'
						}`}
					>
						<Landmark className="w-3.5 h-3.5" />
						<span>{instFilterButtonText}</span>
						{selectedInstFilters.length > 0 && (
							<span
								role="button"
								tabIndex={0}
								onClick={(e) => {
									e.stopPropagation();
									setSelectedInstFilters([]);
								}}
								className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
								title="נקה סינון מוסדות"
							>
								<X className="w-3 h-3" />
							</span>
						)}
						<ChevronDown
							className={`w-3.5 h-3.5 transition-transform duration-200 ${
								isInstFilterOpen ? 'rotate-180' : ''
							}`}
						/>
					</button>

					{/* Discipline Filter Expander Button */}
					<button
						type="button"
						onClick={() => setIsDisciplineFilterOpen(!isDisciplineFilterOpen)}
						className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
							isDisciplineFilterOpen || selectedDisciplines.length > 0
								? 'bg-ink border-ink text-white shadow-2xs'
								: 'bg-paper border-line text-ink-2 hover:border-line-strong hover:text-ink'
						}`}
					>
						<GraduationCap className="w-3.5 h-3.5" />
						<span>{discFilterButtonText}</span>
						{selectedDisciplines.length > 0 && (
							<span
								role="button"
								tabIndex={0}
								onClick={(e) => {
									e.stopPropagation();
									setSelectedDisciplines([]);
								}}
								className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
								title="נקה סינון תחומי דעת"
							>
								<X className="w-3 h-3" />
							</span>
						)}
						<ChevronDown
							className={`w-3.5 h-3.5 transition-transform duration-200 ${
								isDisciplineFilterOpen ? 'rotate-180' : ''
							}`}
						/>
					</button>

					{/* Clear all filters if any active */}
					{(selectedInstFilters.length > 0 || selectedDisciplines.length > 0) && (
						<button
							type="button"
							onClick={() => {
								setSelectedInstFilters([]);
								setSelectedDisciplines([]);
							}}
							className="text-xs font-semibold text-ink-3 hover:text-[#B91C1C] transition cursor-pointer px-2 flex items-center gap-1"
						>
							<X className="w-3.5 h-3.5" />
							<span>איפוס סינונים</span>
						</button>
					)}
				</div>

				{/* Expanded Panel: Institution */}
				{isInstFilterOpen && (
					<div className="pt-3 border-t border-paper-2 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-ink-2 block">
								סינון לפי מוסד (ניתן לבחור מספר מוסדות במקביל):
							</span>
							{selectedInstFilters.length > 0 && (
								<button
									type="button"
									onClick={() => setSelectedInstFilters([])}
									className="text-[11px] text-ink-3 hover:text-ink font-semibold cursor-pointer"
								>
									איפוס לכל המוסדות
								</button>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							{MAJOR_INSTITUTION_CHIPS.map((inst) => {
								const isChipSelected =
									inst.id === 'all'
										? selectedInstFilters.length === 0
										: selectedInstFilters.includes(inst.id);

								return (
									<button
										key={inst.id}
										onClick={() => handleToggleInstitution(inst.id)}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
											isChipSelected
												? 'bg-ink border-ink text-white shadow-2xs'
												: 'bg-paper border-line text-ink-2 hover:border-line-strong hover:text-ink'
										}`}
									>
										{inst.id !== 'all' && (
											<UniversityLogo institution={inst.id} size="xs" shape="circle" />
										)}
										{isChipSelected && inst.id !== 'all' && (
											<Check className="w-3 h-3 text-emerald-400" />
										)}
										<span>{inst.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Expanded Panel: Discipline */}
				{isDisciplineFilterOpen && (
					<div className="pt-3 border-t border-paper-2 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-ink-2 block">
								סינון לפי תחום דעת (ניתן לבחור מספר תחומים במקביל):
							</span>
							{selectedDisciplines.length > 0 && (
								<button
									type="button"
									onClick={() => setSelectedDisciplines([])}
									className="text-[11px] text-ink-3 hover:text-ink font-semibold cursor-pointer"
								>
									איפוס לכל התחומים
								</button>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							{DISCIPLINE_FILTERS.map((disc) => {
								const isDiscSelected =
									disc.id === 'all'
										? selectedDisciplines.length === 0
										: selectedDisciplines.includes(disc.id);

								return (
									<button
										key={disc.id}
										onClick={() => handleToggleDiscipline(disc.id)}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
											isDiscSelected
												? 'bg-ink border-ink text-white shadow-2xs'
												: 'bg-paper border-line text-ink-2 hover:border-line-strong hover:text-ink'
										}`}
									>
										{isDiscSelected && disc.id !== 'all' && (
											<Check className="w-3 h-3 text-emerald-400" />
										)}
										<span>{disc.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* 2. DEGREE CATALOG: FULL-WIDTH GRID WITH INTERNAL SCROLL */}
			{/* ========================================================================= */}
			<div className="w-full flex-1 min-h-0 flex flex-col space-y-2">
				<div className="flex items-center justify-between text-xs text-ink-2 font-semibold px-1 shrink-0">
					{isCatalogLoading ? (
						<span>טוען את קטלוג התארים...</span>
					) : (
						<span>
							נמצאו <strong className="text-ink">{filteredPrograms.length}</strong> תוכניות לימוד
							מתאימות ב-<strong className="text-accent">{uniqueInstitutionsCount}</strong> מוסדות
						</span>
					)}
					<div className="flex items-center gap-3">
						<span>מציג {Math.min(filteredPrograms.length, 80)} ראשונות</span>
						<button
							type="button"
							onClick={() => setIsBasketOpen(true)}
							className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
						>
							<GraduationCap className="w-3.5 h-3.5" />
							<span>צפה בסל ({selectedPrograms.length})</span>
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 overflow-y-auto pr-1 pl-1 custom-scrollbar">
					{filteredPrograms.slice(0, 80).map((item) => {
						const cardKey = `${item.institutionId}-${item.program.id}`;
						const selected = isSelected(item.program.id);
						const threshold = item.program.admissionThreshold;
						const isExpanded = !!expandedCardIds[cardKey];

						return (
							<div
								key={cardKey}
								className={`p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
									selected
										? 'bg-[#F9F7F2] border-ink shadow-2xs ring-1 ring-ink/10'
										: 'bg-white border-line hover:border-line-strong hover:shadow-2xs'
								}`}
							>
								{/* Top Line: Field of Study & Compact Action Button */}
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<h4
											className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-1"
											title={item.program.fieldOfStudy}
										>
											{item.program.fieldOfStudy}
										</h4>
									</div>

									<button
										type="button"
										onClick={() => onToggleProgram(item)}
										className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
											selected
												? 'bg-success-soft text-success border border-success/25 hover:bg-[#FEE2E2] hover:text-[#991B1B] hover:border-[#FECACA]'
												: 'bg-paper text-ink border border-line hover:bg-ink hover:text-white hover:border-ink'
										}`}
										title={selected ? 'הסר מסל היעדים' : 'הוסף לסל היעדים'}
									>
										{selected ? (
											<>
												<Check className="h-3 w-3" />
												<span>נבחר</span>
											</>
										) : (
											<>
												<Plus className="h-3 w-3" />
												<span>הוסף</span>
											</>
										)}
									</button>
								</div>

								{/* Bottom Line: Institution info & Expandable Threshold Button */}
								<div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-paper-2/90 text-xs">
									<div className="flex items-center gap-1.5 min-w-0">
										<UniversityLogo institution={item.institutionId} size="xs" showBadge={false} />
										<span className="text-accent font-bold text-[11px] truncate">
											{item.institutionName.replace('אוניברסיטת ', '')}
										</span>
									</div>

									<button
										type="button"
										onClick={() => toggleExpandCard(cardKey)}
										className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition cursor-pointer shrink-0 ${
											threshold
												? 'bg-warning-soft border-warning/30 text-warning hover:bg-[#F9ECCF]'
												: 'bg-paper border-line text-ink-2 hover:bg-paper-2'
										}`}
										title="לחץ להרחבת פרטי סף ודרישות קבלה"
									>
										<span>{threshold ? `סף: ${threshold}` : 'פרטי סף'}</span>
										<ChevronDown
											className={`w-3 h-3 transition-transform duration-200 ${
												isExpanded ? 'rotate-180' : ''
											}`}
										/>
									</button>
								</div>

								{/* Expandable Admission Details Drawer */}
								{isExpanded && (
									<div className="mt-2.5 pt-2.5 border-t border-line space-y-1.5 text-xs bg-paper -mx-3 -mb-3 p-3 rounded-b-2xl animate-in fade-in-50 duration-200">
										{threshold && (
											<div className="flex items-center justify-between text-ink-2">
												<span>ציון סף קבלה:</span>
												<span className="font-bold text-ink">{threshold}</span>
											</div>
										)}
										{officialPsychMin(item.program) && (
											<div className="flex items-center justify-between text-ink-2">
												<span>פסיכומטרי מינימלי (רשמי):</span>
												<span className="font-bold text-ink">{officialPsychMin(item.program)}</span>
											</div>
										)}
										<div className="flex items-center justify-between text-ink-2">
											<span>אפיק קבלה:</span>
											<span className="font-bold text-ink">
												{item.program.requiresPsychometric === false ? 'בגרות ישירה בלבד' : 'שקלול בגרות ופסיכומטרי'}
											</span>
										</div>
										{item.program.directBagrutEligible && item.program.directBagrutMinAverage && (
											<div className="flex items-center justify-between text-ink-2">
												<span>קבלה ישירה לבגרות:</span>
												<span className="font-bold text-ink">{item.program.directBagrutMinAverage} ומעלה</span>
											</div>
										)}
										{item.program.comments && (
											<div className="text-[11px] text-ink-2 bg-white p-2 rounded-lg border border-line leading-relaxed">
												<span className="font-bold text-ink block mb-0.5">הערות ותנאי קבלה:</span>
												{item.program.comments}
											</div>
										)}
										{(item.program.mathRequirement || item.program.englishRequirement) && (
											<div className="text-[10px] text-[#78716C] pt-0.5 space-y-0.5">
												{item.program.mathRequirement && <div>מתמטיקה: {item.program.mathRequirement}</div>}
												{item.program.englishRequirement && <div>אנגלית: {item.program.englishRequirement}</div>}
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* ========================================================================= */}
			{/* 3. SLIDE-OVER DRAWER: EXPANDABLE SELECTED DEGREES TRAY */}
			{/* ========================================================================= */}
			{isBasketOpen && (
				<div className="fixed inset-0 z-50 overflow-hidden flex justify-start">
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
						onClick={() => setIsBasketOpen(false)}
					/>

					{/* Drawer Panel */}
					<div className="relative w-full max-w-md bg-white shadow-2xl border-l border-line h-full flex flex-col z-10 p-5 dir-rtl text-right animate-in slide-in-from-right">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-line pb-4 shrink-0">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-xl bg-paper border border-line text-ink">
									<GraduationCap className="h-5 w-5 text-accent" />
								</div>
								<div>
									<h3 className="text-base font-bold text-ink">
										סל תארים שנבחרו
									</h3>
									<span className="text-xs text-ink-2">
										{selectedPrograms.length === 0 ? '0 תארים נבחרו' : `${selectedPrograms.length} תארים בסל היעדים`}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{selectedPrograms.length > 0 && (
									<button
										type="button"
										onClick={onClearAll}
										className="text-xs text-danger hover:underline font-semibold cursor-pointer px-2"
									>
										נקה הכל
									</button>
								)}
								<button
									type="button"
									onClick={() => setIsBasketOpen(false)}
									className="p-1.5 rounded-xl hover:bg-paper text-ink-2 hover:text-ink transition border border-transparent hover:border-line cursor-pointer"
									title="סגור סל"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
						</div>

						{/* Selected Programs List */}
						{selectedPrograms.length === 0 ? (
							<div className="my-auto text-center py-12 px-4 border-2 border-dashed border-line rounded-2xl bg-paper space-y-2">
								<GraduationCap className="h-8 w-8 text-ink-3 mx-auto opacity-60" />
								<p className="text-xs font-bold text-ink-2">
									טרם נבחרו תארים
								</p>
								<p className="text-[11px] text-ink-3 leading-relaxed max-w-xs mx-auto">
									לחץ על &quot;+ הוסף&quot; בכרטיסי התארים כדי להוסיף אותם לסל היעדים שלך
								</p>
							</div>
						) : (
							<div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar min-h-0 pr-1 pl-1">
								{selectedPrograms.map((target) => {
									const instInfo = INST_BADGE_MAP[target.institutionId];
									return (
										<div
											key={target.program.id}
											className="p-3 rounded-2xl bg-paper border border-line hover:border-line-strong transition flex items-center justify-between gap-2.5 shadow-2xs group"
										>
											<div className="flex items-center gap-2.5 min-w-0 flex-1">
												<UniversityLogo institution={target.institutionId} size="xs" shape="circle" />
												<div className="min-w-0 flex-1">
													<h5 className="text-xs font-bold text-ink truncate" title={target.program.fieldOfStudy}>
														{target.program.fieldOfStudy}
													</h5>
													<div className="flex items-center gap-1.5 mt-0.5">
														<span className="text-[11px] text-accent font-semibold truncate">
															{instInfo?.shortName || target.institutionName.replace('אוניברסיטת ', '')}
														</span>
														{target.program.admissionThreshold && (
															<span className="text-[10px] text-warning bg-warning-soft border border-warning/30 px-1.5 py-0.5 rounded font-bold">
																סף: {target.program.admissionThreshold}
															</span>
														)}
													</div>
												</div>
											</div>

											<button
												type="button"
												onClick={() => onRemoveProgram(target.program.id)}
												className="p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-[#FEE2E2] transition cursor-pointer shrink-0"
												title="הסר מהסל"
											>
												<X className="h-4 w-4" />
											</button>
										</div>
									);
								})}
							</div>
						)}

						{/* Primary Action Button inside the Drawer */}
						<div className="pt-4 border-t border-line space-y-2 mt-auto shrink-0">
							{onProceedToNextStep && (
								<button
									type="button"
									onClick={() => {
										setIsBasketOpen(false);
										onProceedToNextStep();
									}}
									disabled={selectedPrograms.length === 0}
									className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
										selectedPrograms.length > 0
											? 'bg-ink hover:bg-black text-white shadow-xs cursor-pointer active:scale-[0.99]'
											: 'bg-line text-ink-3 cursor-not-allowed border border-line-strong'
									}`}
								>
									<span>המשך לדוח קבלה אישי ({selectedPrograms.length})</span>
									<ArrowLeft className="h-4 w-4 shrink-0" />
								</button>
							)}

							<div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-2">
								{isLoadedFromDb ? (
									<>
										<span className="w-1.5 h-1.5 rounded-full bg-success" />
										<span>מסד נתונים מסונכרן (SQLite)</span>
									</>
								) : (
									<span>{isCatalogLoading ? 'טוען מסד נתונים...' : 'קטלוג מקומי'}</span>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
