'use client';

import React from 'react';
import { ExternalLink, GraduationCap } from 'lucide-react';
import { BYPASS_ROUTES } from '@/data/bypassRoutes';
import { getUniversityRegistrationInfo } from '@/utils/universityRegistration';

interface BypassRoutesCardProps {
	calculatorId: string;
	institutionName: string;
	/** A very demanding "every bagrut" track is shown above this card. */
	hasMaxTrack: boolean;
}

/** Mechina and Open University transfer routes — shown only when psychometric 800 and 6 bagrut exams don't reach the threshold. */
export default function BypassRoutesCard({ calculatorId, institutionName, hasMaxTrack }: BypassRoutesCardProps) {
	const links = BYPASS_ROUTES[calculatorId] ?? {};
	const inst = institutionName.split(' - ')[0].split(' (')[0].replace('אוניברסיטת ', '').replace(/^ה/, '');
	const admissionsUrl = getUniversityRegistrationInfo(calculatorId, institutionName)?.registrationUrl;

	const linkClass =
		'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#D2CEEB] text-[#453D78] hover:bg-[#F2F1F8] transition';

	return (
		<div className="bg-white border border-[#D2CEEB] rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
			<div className="flex items-center gap-2">
				<GraduationCap className="h-5 w-5 text-[#453D78]" />
				<h4 className="text-lg font-bold text-[#222222]">מכינה או אפיק מעבר</h4>
			</div>
			<p className="text-sm text-[#66635C] leading-relaxed">
				גם עם פסיכומטרי 800 ו-6 בחינות בגרות לא מגיעים לסף של התוכנית הזו
				{hasMaxTrack ? '. המסלול שלמעלה דורש לשפר כמעט את כל הבגרויות.' : '.'} לכן כדאי להכיר גם את הדרכים שלא תלויות בבגרות:
			</p>
			<div className="space-y-3">
				<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-2">
					<div className="font-bold text-sm text-[#222222]">מכינה קדם-אקדמית</div>
					<p className="text-xs text-[#66635C] leading-relaxed">
						לימודים במכינה של האוניברסיטה, שבסופם הציונים במכינה משמשים לקבלה במקום ציוני הבגרות. התוכניות שהמכינה פותחת והציון הנדרש בכל אחת מפורטים באתר המכינה.
					</p>
					{links.mechinaUrl ? (
						<a href={links.mechinaUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
							<span>אתר המכינה ב{inst}</span>
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
					) : (
						admissionsUrl && (
							<a href={admissionsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
								<span>אתר הקבלה ב{inst} (מידע על מכינות)</span>
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
						)
					)}
				</div>
				<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-2">
					<div className="font-bold text-sm text-[#222222]">אפיק מעבר מהאוניברסיטה הפתוחה</div>
					{links.openUniversityUrl ? (
						<>
							<p className="text-xs text-[#66635C] leading-relaxed">
								לומדים קורסים באוניברסיטה הפתוחה (שאין בה דרישות קבלה), ועוברים ל{inst} לפי הציונים בקורסים, בלי בגרות ופסיכומטרי. אילו תוכניות פתוחות למעבר ובאיזה ממוצע — בדף האפיק.
							</p>
							<a href={links.openUniversityUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
								<span>אפיקי המעבר ל{inst}</span>
								<ExternalLink className="h-3.5 w-3.5" />
							</a>
						</>
					) : (
						<p className="text-xs text-[#66635C] leading-relaxed">אין לאוניברסיטה הפתוחה אפיק מעבר ל{inst}.</p>
					)}
				</div>
			</div>
		</div>
	);
}
