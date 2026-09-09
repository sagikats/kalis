'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Atom, BookMarked, Check, Plus, Sparkles } from 'lucide-react';
import { BAGRUT_SUBJECTS_CATALOG, BagrutSubjectOption } from '@/data/bagrutSubjects';

interface SubjectSelectModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectSubject: (subject: BagrutSubjectOption) => void;
	existingSubjectNames: string[];
	title?: string;
}

export default function SubjectSelectModal({
	isOpen,
	onClose,
	onSelectSubject,
	existingSubjectNames,
	title = 'בחירת מקצוע בגרות או הגברה'
}: SubjectSelectModalProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<'all' | 'stem' | 'humanities' | 'mandatory'>('all');
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
			if (selectedCategory !== 'all' && sub.category !== selectedCategory) {
				return false;
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#222222]/40 backdrop-blur-sm animate-in fade-in duration-200">
			{/* Backdrop */}
			<div className="fixed inset-0" onClick={onClose} />

			{/* Modal Card */}
			<div
				dir="rtl"
				className="relative z-10 w-full max-w-2xl bg-white border border-[#E5DFD4] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
			>
				{/* Header */}
				<div className="px-6 pt-6 pb-4 border-b border-[#E5DFD4] space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
								<BookOpen className="h-6 w-6" />
							</div>
							<div>
								<h3 className="text-lg sm:text-xl font-bold text-[#222222]">{title}</h3>
								<p className="text-xs text-[#66635C]">
									בחר מקצוע מתוך הרשימה הרשמית או חפש לפי שם או מילת מפתח
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="p-2 rounded-xl text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5] transition"
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
							placeholder="חפש מקצוע (למשל: פיזיקה, מדעי המחשב, ספרות, סייבר...)"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl pr-11 pl-10 py-3 text-sm font-bold text-[#222222] placeholder:text-[#8A847C] focus:outline-none focus:ring-2 focus:ring-[#222222] transition"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A847C] hover:text-[#222222] p-1"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>

					{/* Category Filter Tabs */}
					<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
						<button
							onClick={() => setSelectedCategory('all')}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
								selectedCategory === 'all'
									? 'bg-[#3C3C3C] text-white shadow-sm'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							כל המקצועות ({BAGRUT_SUBJECTS_CATALOG.length})
						</button>
						<button
							onClick={() => setSelectedCategory('stem')}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
								selectedCategory === 'stem'
									? 'bg-[#3C3C3C] text-white shadow-sm'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<Atom className="h-3.5 w-3.5" />
							<span>מוגבר מדעי/טכנולוגי (STEM)</span>
						</button>
						<button
							onClick={() => setSelectedCategory('humanities')}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
								selectedCategory === 'humanities'
									? 'bg-[#3C3C3C] text-white shadow-sm'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							<BookMarked className="h-3.5 w-3.5" />
							<span>מדעי החברה, רוח ואמנויות</span>
						</button>
						<button
							onClick={() => setSelectedCategory('mandatory')}
							className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
								selectedCategory === 'mandatory'
									? 'bg-[#3C3C3C] text-white shadow-sm'
									: 'bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] border border-[#E5DFD4]'
							}`}
						>
							מקצועות חובה
						</button>
					</div>
				</div>

				{/* Subjects List */}
				<div className="p-6 overflow-y-auto space-y-2.5 max-h-[50vh]">
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
											: 'bg-[#FAF8F5] border-[#E5DFD4] hover:border-[#DDD7CC] hover:bg-white shadow-sm'
									}`}
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
												sub.category === 'stem'
													? 'bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]'
													: sub.category === 'humanities'
													? 'bg-[#FDF6E8] text-[#825B15] border border-[#ECDAB6]'
													: 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]'
											}`}
										>
											{sub.defaultUnits}יח׳
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-bold text-[#222222] transition">
													{sub.name}
												</span>
												{isAlreadyAdded && (
													<span className="text-[10px] font-bold text-[#205739] bg-[#EBF4EE] px-2 py-0.5 rounded-md border border-[#C6DFCE] flex items-center gap-1">
														<Check className="h-2.5 w-2.5" />
														כבר קיים בתעודה
													</span>
												)}
											</div>
											<span className="text-[11px] text-[#66635C] block mt-0.5">
												{sub.categoryLabel}
											</span>
										</div>
									</div>

									<button className="px-3 py-1.5 rounded-xl bg-white group-hover:bg-[#3C3C3C] text-[#222222] group-hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 border border-[#E5DFD4]">
										<Plus className="h-3.5 w-3.5" />
										<span>בחר</span>
									</button>
								</div>
							);
						})
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E5DFD4] flex items-center justify-between text-xs text-[#66635C]">
					<span>
						נמצאו <strong className="text-[#222222] font-bold">{filteredSubjects.length}</strong> מקצועות בגרות מוכרים
					</span>
					<button
						onClick={onClose}
						className="font-bold text-[#66635C] hover:text-[#222222] transition"
					>
						ביטול
					</button>
				</div>
			</div>
		</div>
	);
}
