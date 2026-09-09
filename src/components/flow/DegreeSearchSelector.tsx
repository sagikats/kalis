'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
	Search,
	GraduationCap,
	Check,
	Plus,
	X,
	Building2,
	SlidersHorizontal,
	Sparkles,
	BookOpen,
	Globe,
	Layers,
	CheckCheck
} from 'lucide-react';
import { academicInstitutions } from '../../data/academicData';
import { AcademicDegree, AcademicInstitution } from '../../types/academic';
import { TargetProgramSelection } from '../../utils/analysis/gapAnalyzer';
import UniversityLogo from '../common/UniversityLogo';

export interface CrossUniversityMajor {
	id: string;
	title: string;
	shortTitle: string;
	icon: string;
	keywords: string[];
	excludeKeywords?: string[];
	badgeColor: string;
}

export const POPULAR_CROSS_MAJORS: CrossUniversityMajor[] = [
	{
		id: 'cs',
		title: 'מדעי המחשב והייטק',
		shortTitle: 'מדעי המחשב',
		icon: '💻',
		keywords: ['מדעי המחשב', 'הנדסת תוכנה', 'הנדסת מחשבים'],
		excludeKeywords: ['מחשבת'],
		badgeColor: 'from-cyan-500 to-blue-600'
	},
	{
		id: 'electrical_eng',
		title: 'הנדסת חשמל ואלקטרוניקה',
		shortTitle: 'הנדסת חשמל',
		icon: '⚡',
		keywords: ['הנדסת חשמל', 'חשמל ואלקטרוניקה', 'חשמל ומחשבים'],
		badgeColor: 'from-amber-500 to-orange-600'
	},
	{
		id: 'medicine',
		title: 'רפואה ומקצועות הבריאות',
		shortTitle: 'רפואה',
		icon: '🩺',
		keywords: ['רפואה', 'רפואת שיניים', 'סיעוד', 'רוקחות', 'פיזיותרפיה', 'מדעי הרפואה'],
		excludeKeywords: ['רפואי -'],
		badgeColor: 'from-rose-500 to-pink-600'
	},
	{
		id: 'law',
		title: 'משפטים',
		shortTitle: 'משפטים',
		icon: '⚖️',
		keywords: ['משפטים'],
		badgeColor: 'from-blue-600 to-indigo-600'
	},
	{
		id: 'psychology',
		title: 'פסיכולוגיה ומדעי המוח',
		shortTitle: 'פסיכולוגיה',
		icon: '🧠',
		keywords: ['פסיכולוגיה', 'מדעי המוח', 'מדעי ההתנהגות'],
		badgeColor: 'from-purple-500 to-violet-600'
	},
	{
		id: 'business_econ',
		title: 'כלכלה, מנהל עסקים וניהול',
		shortTitle: 'כלכלה וניהול',
		icon: '📊',
		keywords: ['כלכלה', 'מנהל עסקים', 'ניהול', 'חשבונאות'],
		badgeColor: 'from-emerald-500 to-teal-600'
	},
	{
		id: 'industrial_data',
		title: 'הנדסת תעשייה ומערכות מידע',
		shortTitle: 'תעשייה ומערכות מידע',
		icon: '⚙️',
		keywords: ['תעשייה וניהול', 'מערכות מידע', 'הנדסת נתונים'],
		badgeColor: 'from-amber-600 to-yellow-500'
	},
	{
		id: 'life_sciences',
		title: 'מדעי החיים וביולוגיה',
		shortTitle: 'מדעי החיים',
		icon: '🧬',
		keywords: ['מדעי החיים', 'ביולוגיה', 'ביוטכנולוגיה', 'ביואינפורמטיקה'],
		badgeColor: 'from-green-500 to-emerald-600'
	},
	{
		id: 'exact_sciences',
		title: 'מתמטיקה, פיזיקה וכימיה',
		shortTitle: 'מדעים מדויקים',
		icon: '📐',
		keywords: ['מתמטיקה', 'פיזיקה', 'כימיה', 'סטטיסטיקה'],
		badgeColor: 'from-sky-500 to-blue-500'
	},
	{
		id: 'mechanical_civil',
		title: 'הנדסת מכונות ובניין',
		shortTitle: 'מכונות ואזרחית',
		icon: '🏗️',
		keywords: ['הנדסת מכונות', 'הנדסה אזרחית', 'הנדסת בניין'],
		badgeColor: 'from-orange-500 to-amber-600'
	}
];

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
}

export default function DegreeSearchSelector({
	selectedPrograms,
	onToggleProgram,
	onAddMultiplePrograms,
	onRemoveProgram,
	onClearAll
}: DegreeSearchSelectorProps) {
	const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
	const [customMajorField, setCustomMajorField] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedInstFilter, setSelectedInstFilter] = useState('all');
	const [selectedDiscipline, setSelectedDiscipline] = useState('all');

	// Dynamic SQLite Data state (fallback to bundled academicInstitutions during initial fetch)
	const [institutionsList, setInstitutionsList] = useState<AcademicInstitution[]>(academicInstitutions);
	const [isLoadedFromDb, setIsLoadedFromDb] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;
		async function fetchFromSQLite() {
			try {
				const res = await fetch('/api/institutions');
				const data = await res.json();
				if (isMounted && data.success && Array.isArray(data.institutions) && data.institutions.length > 0) {
					setInstitutionsList(data.institutions);
					setIsLoadedFromDb(true);
				}
			} catch (err) {
				console.warn('[DegreeSearchSelector] Fallback to pre-bundled data:', err);
			}
		}
		fetchFromSQLite();
		return () => {
			isMounted = false;
		};
	}, []);

	// Flatten all programs with institution metadata directly from SQLite
	const allFlattenedPrograms = useMemo(() => {
		const list: TargetProgramSelection[] = [];
		for (const inst of institutionsList) {
			const calcId = (inst as any).calculatorId || CALC_ID_MAP[inst.id] || inst.id || 'general';
			for (const prog of inst.programs) {
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

	// Extract unique fields that exist across at least 2 institutions for the dropdown
	const commonCrossFields = useMemo(() => {
		const fieldMap = new Map<string, Set<string>>();
		for (const item of allFlattenedPrograms) {
			const f = item.program.fieldOfStudy.trim();
			if (!fieldMap.has(f)) fieldMap.set(f, new Set());
			fieldMap.get(f)!.add(item.institutionId);
		}
		return Array.from(fieldMap.entries())
			.filter(([_, insts]) => insts.size >= 2)
			.map(([field, insts]) => ({ field, count: insts.size }))
			.sort((a, b) => b.count - a.count);
	}, [allFlattenedPrograms]);

	const currentSelectedMajor = useMemo(() => {
		if (!selectedMajorId) return null;
		return POPULAR_CROSS_MAJORS.find((m) => m.id === selectedMajorId) || null;
	}, [selectedMajorId]);

	// Filter programs based on user criteria
	const filteredPrograms = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const currentDiscipline = DISCIPLINE_FILTERS.find((d) => d.id === selectedDiscipline);

		return allFlattenedPrograms.filter((item) => {
			const field = item.program.fieldOfStudy.toLowerCase();

			// 1. Cross-University Major Filter (if active)
			if (currentSelectedMajor) {
				// Must match at least one major keyword
				const matchesKeyword = currentSelectedMajor.keywords.some((kw) =>
					field.includes(kw.toLowerCase())
				);
				if (!matchesKeyword) return false;

				// Must not match any excluded keywords (e.g. מחשבת ישראל for מדעי המחשב)
				if (currentSelectedMajor.excludeKeywords) {
					const hasExcluded = currentSelectedMajor.excludeKeywords.some((ex) =>
						field.includes(ex.toLowerCase())
					);
					if (hasExcluded) return false;
				}
			} else if (customMajorField) {
				if (!field.includes(customMajorField.toLowerCase())) {
					return false;
				}
			}

			// 2. Institution filter
			if (selectedInstFilter !== 'all') {
				const matchesInst =
					item.institutionId === selectedInstFilter ||
					item.calculatorId === selectedInstFilter ||
					CALC_ID_MAP[item.institutionId] === selectedInstFilter ||
					CALC_ID_MAP[selectedInstFilter] === item.calculatorId;
				if (!matchesInst) return false;
			}

			// 3. Discipline filter
			if (currentDiscipline && currentDiscipline.keywords) {
				const matchesDiscipline = currentDiscipline.keywords.some((kw) =>
					field.includes(kw.toLowerCase())
				);
				if (!matchesDiscipline) return false;
			}

			// 4. Free text search
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
		currentSelectedMajor,
		customMajorField,
		searchQuery,
		selectedInstFilter,
		selectedDiscipline
	]);

	const isSelected = (id: string) => selectedPrograms.some((sp) => sp.program.id === id);

	// Count how many unique institutions are represented in current filtered list
	const uniqueInstitutionsCount = useMemo(() => {
		const set = new Set(filteredPrograms.map((p) => p.institutionId));
		return set.size;
	}, [filteredPrograms]);

	// Extract the cleanest representative program per institution for bulk selection
	const representativePrograms = useMemo(() => {
		const map = new Map<string, TargetProgramSelection>();
		for (const item of filteredPrograms) {
			const existing = map.get(item.institutionId);
			if (!existing) {
				map.set(item.institutionId, item);
			} else {
				const curField = item.program.fieldOfStudy.trim();
				const exField = existing.program.fieldOfStudy.trim();
				const isExactCur =
					curField === 'מדעי המחשב' ||
					curField === 'תואר ראשון במדעי המחשב' ||
					curField === 'משפטים' ||
					curField === 'פסיכולוגיה' ||
					curField === 'רפואה';
				const isExactEx =
					exField === 'מדעי המחשב' ||
					exField === 'תואר ראשון במדעי המחשב' ||
					exField === 'משפטים' ||
					exField === 'פסיכולוגיה' ||
					exField === 'רפואה';

				if (isExactCur && !isExactEx) {
					map.set(item.institutionId, item);
				} else if (!isExactEx && curField.length < exField.length) {
					map.set(item.institutionId, item);
				}
			}
		}
		return Array.from(map.values());
	}, [filteredPrograms]);

	// How many representative programs are already added in user wishlist
	const alreadyAddedRepresentativeCount = useMemo(() => {
		return representativePrograms.filter((p) => isSelected(p.program.id)).length;
	}, [representativePrograms, selectedPrograms]);

	const isAllRepresentativesAdded =
		representativePrograms.length > 0 &&
		alreadyAddedRepresentativeCount === representativePrograms.length;

	const handleToggleMajor = (majorId: string) => {
		if (selectedMajorId === majorId) {
			setSelectedMajorId(null);
		} else {
			setSelectedMajorId(majorId);
			setCustomMajorField('');
			setSelectedInstFilter('all'); // Reset institution filter so all universities appear
		}
	};

	const handleSelectCustomField = (field: string) => {
		if (!field) {
			setCustomMajorField('');
		} else {
			setCustomMajorField(field);
			setSelectedMajorId(null);
			setSelectedInstFilter('all');
		}
	};

	const handleClearMajor = () => {
		setSelectedMajorId(null);
		setCustomMajorField('');
	};

	const handleSelectAllMajorPrograms = () => {
		if (!onAddMultiplePrograms || representativePrograms.length === 0) return;
		onAddMultiplePrograms(representativePrograms);
	};

	return (
		<div className="space-y-6">
			{/* Selected Programs Sticky / Top Tray */}
			<div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
							<GraduationCap className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="text-sm sm:text-base font-black text-white">
									סל התארים המבוקשים שלך ({selectedPrograms.length})
								</h3>
								{isLoadedFromDb ? (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
										<span>מסד נתונים מסונכרן (SQLite)</span>
									</span>
								) : (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
										<span>טוען מסד נתונים...</span>
									</span>
								)}
							</div>
							<p className="text-xs text-slate-400">
								בחר את כל התארים והמוסדות שמעניין אותך לבדוק סיכויי קבלה אליהם
							</p>
						</div>
					</div>
					{selectedPrograms.length > 0 && (
						<button
							onClick={onClearAll}
							className="text-xs text-rose-400 hover:text-rose-300 transition underline font-semibold"
						>
							נקה הכל
						</button>
					)}
				</div>

				{selectedPrograms.length === 0 ? (
					<div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
						<p className="text-xs text-slate-400 font-medium">
							טרם בחרת תארים. בחר מקצוע להשוואה רוחבית בין כל האוניברסיטאות או סנן מהרשימה למטה.
						</p>
					</div>
				) : (
					<div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-1">
						{selectedPrograms.map((target) => {
							const instInfo = INST_BADGE_MAP[target.institutionId];
							return (
								<div
									key={target.program.id}
									className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 text-xs font-bold text-slate-200 shadow-sm"
								>
									<UniversityLogo institution={target.institutionId} size="xs" shape="circle" />
									<span className="text-[10px] text-cyan-300 font-extrabold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
										{instInfo?.badge || target.institutionName.replace('אוניברסיטת ', '')}
									</span>
									<span>{target.program.fieldOfStudy}</span>
									{target.program.admissionThreshold && (
										<span className="text-[10px] text-slate-400">
											(סף: {target.program.admissionThreshold})
										</span>
									)}
									<button
										onClick={() => onRemoveProgram(target.program.id)}
										className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-300 transition"
										title="הסר מהסל"
									>
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* FEATURE: CROSS-UNIVERSITY MAJOR SELECTOR (השוואת מקצוע בכל האוניברסיטאות) */}
			{/* ========================================================================= */}
			<div className="bg-gradient-to-b from-slate-900/95 to-slate-950/90 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
				{/* Background subtle glow */}
				<div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
							<Globe className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
								<span>השוואת מקצוע רוחבי בין כל האוניברסיטאות</span>
								<span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
									מומלץ
								</span>
							</h3>
							<p className="text-xs text-slate-300">
								בחר מקצוע מבוקש (למשל מדעי המחשב) וקבל מיד את כל אפשרויות הלימוד וספי הקבלה מכל המוסדות
							</p>
						</div>
					</div>

					{/* Custom Major Dropdown Selector */}
					<div className="flex items-center gap-2">
						<select
							value={customMajorField}
							onChange={(e) => handleSelectCustomField(e.target.value)}
							className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
						>
							<option value="">בחר מקצוע נוסף מכלל המאגר...</option>
							{commonCrossFields.map((cf) => (
								<option key={cf.field} value={cf.field}>
									{cf.field} ({cf.count} מוסדות)
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Popular Major Quick-Select Chips */}
				<div className="space-y-2">
					<span className="text-xs font-bold text-slate-400 block">
						מקצועות מובילים לבחירה ולהשוואה מהירה:
					</span>
					<div className="flex flex-wrap gap-2">
						{POPULAR_CROSS_MAJORS.map((major) => {
							const isActive = selectedMajorId === major.id;
							return (
								<button
									key={major.id}
									type="button"
									onClick={() => handleToggleMajor(major.id)}
									className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
										isActive
											? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-cyan-500/25 font-black scale-105'
											: 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900'
									}`}
								>
									<span className="text-sm">{major.icon}</span>
									<span>{major.shortTitle}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* ACTIVE MAJOR COMPARISON BANNER & BULK ACTION */}
				{(currentSelectedMajor || customMajorField) && (
					<div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-indigo-950/70 to-slate-950 border border-cyan-500/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-2xl">
									{currentSelectedMajor ? currentSelectedMajor.icon : '🎓'}
								</span>
								<h4 className="text-sm sm:text-base font-black text-white">
									מציג את כל אפשרויות{' '}
									<span className="text-cyan-300 underline decoration-cyan-500/40">
										{currentSelectedMajor ? currentSelectedMajor.title : customMajorField}
									</span>{' '}
									בכל האוניברסיטאות
								</h4>
							</div>
							<p className="text-xs text-slate-300">
								נמצאו <strong className="text-white">{filteredPrograms.length}</strong> מסלולים ב-
								<strong className="text-cyan-300">{uniqueInstitutionsCount}</strong> אוניברסיטאות שונות בישראל.
							</p>
						</div>

						<div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
							{/* Bulk Add All Universities Action */}
							{onAddMultiplePrograms && representativePrograms.length > 0 && (
								<button
									type="button"
									onClick={handleSelectAllMajorPrograms}
									disabled={isAllRepresentativesAdded}
									className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ${
										isAllRepresentativesAdded
											? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 cursor-default'
											: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border border-cyan-300 shadow-cyan-500/20'
									}`}
								>
									{isAllRepresentativesAdded ? (
										<>
											<CheckCheck className="h-4 w-4 text-emerald-400" />
											<span>כל המוסדות ({representativePrograms.length}) כבר בסל היעדים</span>
										</>
									) : (
										<>
											<Plus className="h-4 w-4" />
											<span>
												הוסף את כל {representativePrograms.length} המוסדות לסל היעדים
											</span>
										</>
									)}
								</button>
							)}

							<button
								type="button"
								onClick={handleClearMajor}
								className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
							>
								<X className="h-3.5 w-3.5" />
								<span>נקה סינון מקצוע</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* ========================================================================= */}
			{/* SEARCH & DETAILED FILTERS (סינון מוסד, תחום וחיפוש טקסט חופשי) */}
			{/* ========================================================================= */}
			<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
				{/* Search bar */}
				<div className="relative">
					<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="חפש חוג ספציפי (למשל: מדעי המחשב, הנדסת חשמל, ניהול, משפטים, פסיכולוגיה)..."
						className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-12 pl-10 py-3.5 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery('')}
							className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Institution Pills */}
				<div className="space-y-1.5">
					<span className="text-xs font-bold text-slate-400 block">סינון לפי מוסד:</span>
					<div className="flex flex-wrap gap-2">
						{MAJOR_INSTITUTION_CHIPS.map((inst) => {
							const isChipSelected = selectedInstFilter === inst.id;
							return (
								<button
									key={inst.id}
									onClick={() => setSelectedInstFilter(inst.id)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
										isChipSelected
											? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
											: 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
									}`}
								>
									{inst.id !== 'all' && (
										<UniversityLogo institution={inst.id} size="xs" shape="circle" />
									)}
									<span>{inst.name}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Discipline Tabs */}
				<div className="space-y-1.5">
					<span className="text-xs font-bold text-slate-400 block">סינון לפי תחום דעת:</span>
					<div className="flex flex-wrap gap-2">
						{DISCIPLINE_FILTERS.map((disc) => {
							const isDiscSelected = selectedDiscipline === disc.id;
							return (
								<button
									key={disc.id}
									onClick={() => setSelectedDiscipline(disc.id)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
										isDiscSelected
											? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
											: 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
									}`}
								>
									{disc.label}
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* PROGRAMS CATALOG GRID */}
			{/* ========================================================================= */}
			<div className="space-y-3">
				<div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
					<span>
						נמצאו <strong className="text-white">{filteredPrograms.length}</strong> תוכניות לימוד
						מתאימות ב-<strong className="text-cyan-400">{uniqueInstitutionsCount}</strong> מוסדות
					</span>
					<span>מציג {Math.min(filteredPrograms.length, 60)} ראשונות</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
					{filteredPrograms.slice(0, 60).map((item) => {
						const selected = isSelected(item.program.id);
						const threshold = item.program.admissionThreshold;
						const instInfo = INST_BADGE_MAP[item.institutionId];

						return (
							<div
								key={`${item.institutionId}-${item.program.id}`}
								className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
									selected
										? 'bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10'
										: 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
								}`}
							>
								<div className="space-y-2">
									<div className="flex items-start justify-between gap-2">
										<h4 className="text-sm font-bold text-white leading-tight">
											{item.program.fieldOfStudy}
										</h4>
										<span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 shrink-0">
											{item.program.degreeLevel}
										</span>
									</div>

									{/* Institution & Threshold Bar */}
									<div className="flex items-center justify-between flex-wrap gap-2 text-xs">
										<div className="flex items-center gap-2">
											<UniversityLogo institution={item.institutionId} size="xs" showBadge={true} />
											<span className="text-cyan-400 font-bold">
												{item.institutionName}
											</span>
										</div>

										{threshold && (
											<span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300">
												סף קבלה: {threshold}
											</span>
										)}
									</div>

									{item.program.comments && (
										<p className="text-[11px] text-slate-400 line-clamp-1">
											{item.program.comments}
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={() => onToggleProgram(item)}
									className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
										selected
											? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
											: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
									}`}
								>
									{selected ? (
										<>
											<Check className="h-3.5 w-3.5" />
											<span>נבחר בסל היעדים</span>
										</>
									) : (
										<>
											<Plus className="h-3.5 w-3.5" />
											<span>הוסף לסל היעדים</span>
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
