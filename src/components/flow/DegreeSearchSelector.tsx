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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 shadow-xs space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#EAE5DA] pb-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
							<GraduationCap className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="text-sm sm:text-base font-black text-[#222222]">
									סל התארים המבוקשים שלך ({selectedPrograms.length})
								</h3>
								{isLoadedFromDb ? (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739]">
										<span className="w-1.5 h-1.5 rounded-full bg-[#205739]" />
										<span>מסד נתונים מסונכרן (SQLite)</span>
									</span>
								) : (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-[#E5DFD4] text-[#66635C]">
										<span>טוען מסד נתונים...</span>
									</span>
								)}
							</div>
							<p className="text-xs text-[#66635C]">
								בחר את כל התארים והמוסדות שמעניין אותך לבדוק סיכויי קבלה אליהם
							</p>
						</div>
					</div>
					{selectedPrograms.length > 0 && (
						<button
							onClick={onClearAll}
							className="text-xs text-[#9B3327] hover:underline transition font-semibold"
						>
							נקה הכל
						</button>
					)}
				</div>

				{selectedPrograms.length === 0 ? (
					<div className="text-center py-6 border-2 border-dashed border-[#E5DFD4] rounded-2xl bg-[#FAF8F5]">
						<p className="text-xs text-[#66635C] font-medium">
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
									className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F6F0] border border-[#DDD7CC] text-xs font-bold text-[#222222] shadow-xs"
								>
									<UniversityLogo institution={target.institutionId} size="xs" shape="circle" />
									<span className="text-[10px] text-[#1E597B] font-extrabold px-1.5 py-0.5 rounded bg-[#EFF6FA] border border-[#C5DFED]">
										{instInfo?.badge || target.institutionName.replace('אוניברסיטת ', '')}
									</span>
									<span>{target.program.fieldOfStudy}</span>
									{target.program.admissionThreshold && (
										<span className="text-[10px] text-[#66635C]">
											(סף: {target.program.admissionThreshold})
										</span>
									)}
									<button
										onClick={() => onRemoveProgram(target.program.id)}
										className="p-0.5 rounded hover:bg-[#EAE5DA] text-[#66635C] hover:text-[#9B3327] transition"
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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DA] pb-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
							<Globe className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-[#222222] flex items-center gap-2">
								<span>השוואת מקצוע רוחבי בין כל האוניברסיטאות</span>
								<span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED]">
									מומלץ
								</span>
							</h3>
							<p className="text-xs text-[#66635C]">
								בחר מקצוע מבוקש (למשל מדעי המחשב) וקבל מיד את כל אפשרויות הלימוד וספי הקבלה מכל המוסדות
							</p>
						</div>
					</div>

					{/* Custom Major Dropdown Selector */}
					<div className="flex items-center gap-2">
						<select
							value={customMajorField}
							onChange={(e) => handleSelectCustomField(e.target.value)}
							className="bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#D5CFC2] text-xs text-[#222222] font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
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
					<span className="text-xs font-bold text-[#66635C] block">
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
									className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs ${
										isActive
											? 'bg-[#3C3C3C] text-white border-[#3C3C3C] font-black scale-105'
											: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#44423D] hover:border-[#D5CFC2] hover:text-[#222222] hover:bg-[#F3EFE8]'
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
					<div className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#DDD7CC] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-2xl">
									{currentSelectedMajor ? currentSelectedMajor.icon : '🎓'}
								</span>
								<h4 className="text-sm sm:text-base font-black text-[#222222]">
									מציג את כל אפשרויות{' '}
									<span className="text-[#1E597B] underline decoration-[#1E597B]/40">
										{currentSelectedMajor ? currentSelectedMajor.title : customMajorField}
									</span>{' '}
									בכל האוניברסיטאות
								</h4>
							</div>
							<p className="text-xs text-[#66635C]">
								נמצאו <strong className="text-[#222222]">{filteredPrograms.length}</strong> מסלולים ב-
								<strong className="text-[#1E597B]">{uniqueInstitutionsCount}</strong> אוניברסיטאות שונות בישראל.
							</p>
						</div>

						<div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
							{/* Bulk Add All Universities Action */}
							{onAddMultiplePrograms && representativePrograms.length > 0 && (
								<button
									type="button"
									onClick={handleSelectAllMajorPrograms}
									disabled={isAllRepresentativesAdded}
									className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
										isAllRepresentativesAdded
											? 'bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] cursor-default'
											: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border border-[#3C3C3C]'
									}`}
								>
									{isAllRepresentativesAdded ? (
										<>
											<CheckCheck className="h-4 w-4 text-[#205739]" />
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
								className="px-3 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer"
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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 shadow-xs space-y-4">
				{/* Search bar */}
				<div className="relative">
					<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8A847C]" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="חפש חוג ספציפי (למשל: מדעי המחשב, הנדסת חשמל, ניהול, משפטים, פסיכולוגיה)..."
						className="w-full bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl pr-12 pl-10 py-3.5 text-sm font-medium text-[#222222] placeholder-[#8A847C] focus:outline-none focus:ring-2 focus:ring-[#222222]/20 focus:border-[#222222] transition"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery('')}
							className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8A847C] hover:text-[#222222]"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Institution Pills */}
				<div className="space-y-1.5">
					<span className="text-xs font-bold text-[#66635C] block">סינון לפי מוסד:</span>
					<div className="flex flex-wrap gap-2">
						{MAJOR_INSTITUTION_CHIPS.map((inst) => {
							const isChipSelected = selectedInstFilter === inst.id;
							return (
								<button
									key={inst.id}
									onClick={() => setSelectedInstFilter(inst.id)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
										isChipSelected
											? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-2xs'
											: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:border-[#D5CFC2] hover:text-[#222222]'
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
					<span className="text-xs font-bold text-[#66635C] block">סינון לפי תחום דעת:</span>
					<div className="flex flex-wrap gap-2">
						{DISCIPLINE_FILTERS.map((disc) => {
							const isDiscSelected = selectedDiscipline === disc.id;
							return (
								<button
									key={disc.id}
									onClick={() => setSelectedDiscipline(disc.id)}
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
										isDiscSelected
											? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-2xs'
											: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:border-[#D5CFC2] hover:text-[#222222]'
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
				<div className="flex items-center justify-between text-xs text-[#66635C] font-semibold px-1">
					<span>
						נמצאו <strong className="text-[#222222]">{filteredPrograms.length}</strong> תוכניות לימוד
						מתאימות ב-<strong className="text-[#1E597B]">{uniqueInstitutionsCount}</strong> מוסדות
					</span>
					<span>מציג {Math.min(filteredPrograms.length, 60)} ראשונות</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
					{filteredPrograms.slice(0, 60).map((item) => {
						const selected = isSelected(item.program.id);
						const threshold = item.program.admissionThreshold;

						return (
							<div
								key={`${item.institutionId}-${item.program.id}`}
								className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
									selected
										? 'bg-[#F9F7F2] border-[#3C3C3C] shadow-xs'
										: 'bg-white border-[#E5DFD4] hover:border-[#D5CFC2] hover:shadow-xs'
								}`}
							>
								<div className="space-y-2">
									<div className="flex items-start justify-between gap-2">
										<h4 className="text-sm font-bold text-[#222222] leading-tight">
											{item.program.fieldOfStudy}
										</h4>
										<span className="text-[10px] font-bold text-[#66635C] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5DFD4] shrink-0">
											{item.program.degreeLevel}
										</span>
									</div>

									{/* Institution & Threshold Bar */}
									<div className="flex items-center justify-between flex-wrap gap-2 text-xs">
										<div className="flex items-center gap-2">
											<UniversityLogo institution={item.institutionId} size="xs" showBadge={true} />
											<span className="text-[#1E597B] font-bold">
												{item.institutionName}
											</span>
										</div>

										{threshold && (
											<span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#FDF6E8] border border-[#ECDAB6] text-[#825B15]">
												סף קבלה: {threshold}
											</span>
										)}
									</div>

									{item.program.comments && (
										<p className="text-[11px] text-[#78716C] line-clamp-1">
											{item.program.comments}
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={() => onToggleProgram(item)}
									className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
										selected
											? 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] hover:bg-[#E2EFE6]'
											: 'bg-[#FAF8F5] hover:bg-[#3C3C3C] hover:text-white text-[#222222] border border-[#E5DFD4]'
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
