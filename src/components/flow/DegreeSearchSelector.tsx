'use client';

import React, { useState, useMemo } from 'react';
import {
	Search,
	GraduationCap,
	Check,
	Plus,
	X,
	Building2,
	SlidersHorizontal,
	Sparkles,
	BookOpen
} from 'lucide-react';
import { academicInstitutions } from '../../data/academicData';
import { AcademicDegree, AcademicInstitution } from '../../types/academic';
import { TargetProgramSelection } from '../../utils/analysis/gapAnalyzer';

const MAJOR_INSTITUTION_CHIPS = [
	{ id: 'all', name: 'כל המוסדות' },
	{ id: 'inst-6', name: 'תל אביב', calcId: 'tau', badge: 'TAU', color: 'from-purple-500 to-indigo-600' },
	{ id: 'inst-48', name: 'הטכניון', calcId: 'technion', badge: 'IIT', color: 'from-blue-600 to-teal-500' },
	{ id: 'inst-3', name: 'בן-גוריון', calcId: 'bgu', badge: 'BGU', color: 'from-cyan-500 to-blue-600' },
	{ id: 'inst-1', name: 'העברית', calcId: 'huji', badge: 'HUJI', color: 'from-amber-500 to-orange-600' },
	{ id: 'inst-5', name: 'חיפה', calcId: 'haifa', badge: 'UOH', color: 'from-sky-500 to-indigo-500' },
	{ id: 'inst-2', name: 'אריאל', calcId: 'ariel', badge: 'AU', color: 'from-emerald-500 to-green-600' }
];

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
	'inst-5': 'haifa',
	'inst-2': 'ariel'
};

interface DegreeSearchSelectorProps {
	selectedPrograms: TargetProgramSelection[];
	onToggleProgram: (target: TargetProgramSelection) => void;
	onRemoveProgram: (programId: string) => void;
	onClearAll: () => void;
}

export default function DegreeSearchSelector({
	selectedPrograms,
	onToggleProgram,
	onRemoveProgram,
	onClearAll
}: DegreeSearchSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedInstFilter, setSelectedInstFilter] = useState('all');
	const [selectedDiscipline, setSelectedDiscipline] = useState('all');

	// Flatten all programs with institution metadata
	const allFlattenedPrograms = useMemo(() => {
		const list: TargetProgramSelection[] = [];
		for (const inst of academicInstitutions) {
			const calcId = CALC_ID_MAP[inst.id] || 'general';
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
	}, []);

	// Filter programs based on user criteria
	const filteredPrograms = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		const currentDiscipline = DISCIPLINE_FILTERS.find((d) => d.id === selectedDiscipline);

		return allFlattenedPrograms.filter((item) => {
			// Institution filter
			if (selectedInstFilter !== 'all' && item.institutionId !== selectedInstFilter) {
				return false;
			}

			// Discipline filter
			if (currentDiscipline && currentDiscipline.keywords) {
				const field = item.program.fieldOfStudy.toLowerCase();
				const matchesDiscipline = currentDiscipline.keywords.some((kw) => field.includes(kw.toLowerCase()));
				if (!matchesDiscipline) return false;
			}

			// Text search
			if (q) {
				const field = item.program.fieldOfStudy.toLowerCase();
				const inst = item.institutionName.toLowerCase();
				const level = item.program.degreeLevel.toLowerCase();
				if (!field.includes(q) && !inst.includes(q) && !level.includes(q)) {
					return false;
				}
			}

			return true;
		});
	}, [allFlattenedPrograms, searchQuery, selectedInstFilter, selectedDiscipline]);

	const isSelected = (id: string) => selectedPrograms.some((sp) => sp.program.id === id);

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
							<h3 className="text-sm sm:text-base font-black text-white">
								סל התארים המבוקשים שלך ({selectedPrograms.length})
							</h3>
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
							טרם בחרת תארים. חפש או סנן מהרשימה למטה ולחץ על ״+ הוסף לסל״
						</p>
					</div>
				) : (
					<div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-1">
						{selectedPrograms.map((target) => (
							<div
								key={target.program.id}
								className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 text-xs font-bold text-slate-200 shadow-sm"
							>
								<span className="text-[10px] text-cyan-300 font-extrabold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
									{target.institutionName.replace('אוניברסיטת ', '')}
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
						))}
					</div>
				)}
			</div>

			{/* Search & Filters Controls */}
			<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
				{/* Search bar */}
				<div className="relative">
					<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="חפש חוג או תחום לימוד (למשל: מדעי המחשב, הנדסת חשמל, ניהול, משפטים)..."
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
									className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
										isChipSelected
											? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
											: 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
									}`}
								>
									{inst.name}
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

			{/* Programs Catalog Grid */}
			<div className="space-y-3">
				<div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
					<span>נמצאו {filteredPrograms.length} תוכניות לימוד מתאימות</span>
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
										? 'bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border-blue-500/50 shadow-md shadow-blue-500/10'
										: 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
								}`}
							>
								<div className="space-y-1.5">
									<div className="flex items-start justify-between gap-2">
										<h4 className="text-sm font-bold text-white leading-tight">
											{item.program.fieldOfStudy}
										</h4>
										<span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 shrink-0">
											{item.program.degreeLevel}
										</span>
									</div>

									<div className="flex items-center gap-2 text-xs">
										<span className="text-cyan-400 font-semibold">{item.institutionName}</span>
										{threshold && (
											<>
												<span className="text-slate-600">·</span>
												<span className="text-slate-300 font-bold">
													סף קבלה: <span className="text-amber-300">{threshold}</span>
												</span>
											</>
										)}
									</div>

									{item.program.comments && (
										<p className="text-[11px] text-slate-400 line-clamp-1">{item.program.comments}</p>
									)}
								</div>

								<button
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
