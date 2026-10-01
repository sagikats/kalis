'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Atom, BookMarked, Check, Plus, Sparkles, Compass, Palette, Info } from 'lucide-react';
import { BAGRUT_SUBJECTS_CATALOG, POPULAR_5U_ELECTIVES, BagrutSubjectOption } from '@/data/bagrutSubjects';
import { InstitutionId } from '@/modules/calculators';

interface SubjectSelectModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectSubject: (subject: BagrutSubjectOption) => void;
	existingSubjectNames: string[];
	title?: string;
	targetInstitutionId?: InstitutionId;
}

type SubjectCategoryFilter = 'all' | 'stem' | 'social' | 'humanities' | 'arts' | 'mandatory';

export default function SubjectSelectModal({
	isOpen,
	onClose,
	onSelectSubject,
	existingSubjectNames,
	title = 'בחירת מקצוע בגרות או הגברה',
	targetInstitutionId
}: SubjectSelectModalProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<SubjectCategoryFilter>('all');
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Focus search input when opened
	useEffect(() => {
		if (isOpen) {
			setSearchQuery('');
			setSelectedCategory('all');
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Filter subjects based on search query and category
	const filteredSubjects = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return BAGRUT_SUBJECTS_CATALOG.filter((sub) => {
			// Category filter
			if (selectedCategory !== 'all') {
				if (sub.category !== selectedCategory) {
					return false;
				}
			}
			// Search query
			if (!q) return true;

			const nameMatch = sub.name.toLowerCase().includes(q);
			const labelMatch = sub.categoryLabel.toLowerCase().includes(q);
			const keywordMatch = sub.keywords?.some((k) => k.toLowerCase().includes(q));

			return nameMatch || labelMatch || keywordMatch;
		});
	}, [searchQuery, selectedCategory]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#222222]/40 backdrop-blur-xs animate-in fade-in duration-200">
			{/* Backdrop */}
			<div className="fixed inset-0" onClick={onClose} />

			{/* Modal Card */}
			<div
				dir="rtl"
				className="relative z-10 w-full max-w-2xl bg-white border border-[#E5DFD4] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
			>
				{/* Header */}
				<div className="px-6 pt-6 pb-4 border-b border-[#E5DFD4] space-y-3.5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
								<BookOpen className="h-6 w-6" />
							</div>
							<div>
								<h3 className="text-lg sm:text-xl font-black text-[#222222]">{title}</h3>
								<p className="text-xs text-[#66635C]">
									בחר מקצוע הגברה (5 יח״ל) או מקצוע חובה מתוך הקטלוג הרשמי של משרד החינוך
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-2 rounded-xl text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5] transition cursor-pointer"
							title="סגור"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Search Input Bar */}
					<div className="relative">
						<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A847C] pointer-events-none" />
						<input
							ref={searchInputRef}
							type="text"
							placeholder="חפש מקצוע הגברה (למשל: גיאוגרפיה, פיזיקה, רוסית, דיפלומטיה, כלכלה, סייבר, מחול...)"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl pr-11 pl-10 py-3 text-sm font-bold text-[#222222] placeholder:text-[#8A847C] focus:outline-none focus:ring-2 focus:ring-[#3C3C3C] transition"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A847C] hover:text-[#222222] p-1 cursor-pointer"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>

					{/* Quick-Pick Strip for Top Popular 5U Electives */}
					{!searchQuery && (
						<div className="space-y-1.5 pt-1">
							<div className="flex items-center gap-1.5 text-[11px] font-bold text-[#66635C]">
								<Sparkles className="h-3 w-3 text-amber-600" />
								<span>הגברות נפוצות (5 יח״ל) לבחירה מהירה:</span>
							</div>
							<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
								{POPULAR_5U_ELECTIVES.slice(0, 10).map((pop) => {
									const isAlreadyAdded = existingSubjectNames.some(
										(n) => n.trim().toLowerCase() === pop.name.trim().toLowerCase()
									);
									const catalogItem = BAGRUT_SUBJECTS_CATALOG.find((s) => s.name === pop.name) || {
										id: pop.id,
										name: pop.name,
										category: pop.category as any,
										categoryLabel: 'מוגבר 5 יח״ל',
										defaultUnits: 5,
										allowedUnits: [5],
										bonus: pop.bonus
									};

									return (
										<button
											key={pop.id}
											type="button"
											disabled={isAlreadyAdded}
											onClick={() => {
												onSelectSubject(catalogItem);
												onClose();
											}}
											className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer border ${
												isAlreadyAdded
													? 'bg-[#FAF8F5] text-[#8A847C] border-[#E5DFD4] cursor-not-allowed opacity-60'
													: 'bg-white hover:bg-[#FAF8F5] text-[#222222] border-[#DDD7CC] hover:border-[#3C3C3C] shadow-2xs'
											}`}
											title={pop.description}
										>
											<span>{pop.icon}</span>
											<span>{pop.shortLabel || pop.name}</span>
											{isAlreadyAdded && <Check className="h-3 w-3 text-emerald-600" />}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Category Filter Tabs */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
						<button
							onClick={() => setSelectedCategory('all')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
								selectedCategory === 'all'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							כל המקצועות ({BAGRUT_SUBJECTS_CATALOG.length})
						</button>
						<button
							onClick={() => setSelectedCategory('stem')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
								selectedCategory === 'stem'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<Atom className="h-3.5 w-3.5" />
							<span>מדעי/טכנולוגי (STEM)</span>
						</button>
						<button
							onClick={() => setSelectedCategory('social')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
								selectedCategory === 'social'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<Compass className="h-3.5 w-3.5" />
							<span>חברה וניהול</span>
						</button>
						<button
							onClick={() => setSelectedCategory('humanities')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
								selectedCategory === 'humanities'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<BookMarked className="h-3.5 w-3.5" />
							<span>רוח, הומני ושפות</span>
						</button>
						<button
							onClick={() => setSelectedCategory('arts')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
								selectedCategory === 'arts'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<Palette className="h-3.5 w-3.5" />
							<span>אמנויות ומחול</span>
						</button>
						<button
							onClick={() => setSelectedCategory('mandatory')}
							className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
								selectedCategory === 'mandatory'
									? 'bg-[#3C3C3C] text-white shadow-2xs'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							מקצועות חובה
						</button>
					</div>
				</div>

				{/* Subjects List */}
				<div className="p-5 sm:p-6 overflow-y-auto space-y-2.5 max-h-[50vh]">
					{filteredSubjects.length === 0 ? (
						<div className="py-12 text-center space-y-2">
							<Sparkles className="h-8 w-8 text-[#8A847C] mx-auto" />
							<p className="text-sm font-bold text-[#66635C]">לא נמצאו מקצועות התואמים לחיפוש</p>
							<p className="text-xs text-[#8A847C]">נסה לחפש מילה אחרת או לבחור קטגוריה שונה</p>
						</div>
					) : (
						filteredSubjects.map((sub) => {
							const isAlreadyAdded = existingSubjectNames.some(
								(n) => n.trim().toLowerCase() === sub.name.trim().toLowerCase()
							);

							return (
								<div
									key={sub.id}
									onClick={() => {
										onSelectSubject(sub);
										onClose();
									}}
									className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer group ${
										isAlreadyAdded
											? 'bg-white/60 border-[#E5DFD4]'
											: 'bg-[#FAF8F5] border-[#E5DFD4] hover:border-[#DDD7CC] hover:bg-white shadow-2xs'
									}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div
											className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
												sub.category === 'stem'
													? 'bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]'
													: sub.category === 'social'
													? 'bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED]'
													: sub.category === 'humanities'
													? 'bg-[#FDF6E8] text-[#825B15] border border-[#ECDAB6]'
													: sub.category === 'arts'
													? 'bg-[#FAF0F6] text-[#832662] border border-[#F3CCE4]'
													: 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]'
											}`}
										>
											{sub.defaultUnits}יח׳
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-bold text-[#222222] truncate">
													{sub.name}
												</span>
												{isAlreadyAdded && (
													<span className="text-[10px] font-bold text-[#205739] bg-[#EBF4EE] px-2 py-0.5 rounded-md border border-[#C6DFCE] flex items-center gap-1">
														<Check className="h-2.5 w-2.5" />
														כבר קיים בתעודה
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 mt-0.5 flex-wrap">
												<span className="text-[11px] text-[#66635C]">
													{sub.categoryLabel}
												</span>
											</div>
										</div>
									</div>

									<button className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-[#3C3C3C] text-[#222222] group-hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 border border-[#E5DFD4] shadow-2xs">
										<Plus className="h-3.5 w-3.5" />
										<span>בחר</span>
									</button>
								</div>
							);
						})
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E5DFD4] flex items-center justify-between text-xs text-[#66635C] flex-wrap gap-2">
					<div className="flex items-center gap-2">
						<span className="text-[11px] text-[#44423D] flex items-center gap-1 font-medium">
							<Sparkles className="h-3 w-3 text-amber-600" />
							<span>בונוסים מחושבים ומותאמים לפי כללי הקבלה הרשמיים בכל 8 האוניברסיטאות בישראל</span>
						</span>
					</div>
					<div className="flex items-center gap-3">
						<span>
							נמצאו <strong className="text-[#222222] font-bold">{filteredSubjects.length}</strong> מקצועות בגרות
						</span>
						<span className="text-[#DDD7CB]">|</span>
						<button
							onClick={onClose}
							className="font-bold text-[#66635C] hover:text-[#222222] transition cursor-pointer"
						>
							סגירה
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
