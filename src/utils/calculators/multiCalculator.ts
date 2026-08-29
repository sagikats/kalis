import { calculateBguAdmission, SubjectInput } from './bguCalculator';

export interface UnifiedCalculationInput {
     bagrutSubjects: SubjectInput[];
     psychometricGeneral: number;
     psychometricQuant: number;
     psychometricVerbal?: number;
     psychometricEnglish?: number;
     mathGrade: number;
     mathUnits: number;
     physicsGrade?: number;
     physicsUnits?: number;
}

export interface InstitutionSekemResult {
     institutionId: string;
     institutionName: string;
     logoText: string;
     badgeColor: string;
     bagrutAverage: number;
     generalSekem: number;
     engineeringSekem?: number;
     directBagrutEligible: boolean;
     notes?: string;
}

/**
 * Calculates optimal Bagrut average according to standard Israeli university bonus system
 */
export function calculateStandardBagrutAverage(subjects: SubjectInput[]): number {
     if (!subjects || subjects.length === 0) return 0;

     let totalWeightedGrades = 0;
     let totalUnits = 0;

     for (const sub of subjects) {
          let bonus = 0;
          const subName = sub.name.trim();

          if (sub.grade >= 60) {
               if (subName.includes('מתמטיקה') || subName.includes('אנגלית')) {
                    if (sub.units === 5) bonus = 25;
                    else if (sub.units === 4) bonus = 12.5;
               } else if (sub.units === 5) {
                    if (subName.includes('פיזיקה') || subName.includes('מדעי המחשב') || subName.includes('כימיה') || subName.includes('ביולוגיה')) {
                         bonus = 25;
                    } else {
                         bonus = 20;
                    }
               }
          }

          const adjustedGrade = sub.grade > 0 ? sub.grade + bonus : 0;
          totalWeightedGrades += adjustedGrade * sub.units;
          totalUnits += sub.units;
     }

     if (totalUnits === 0) return 0;
     return Math.min(125, Math.round((totalWeightedGrades / totalUnits) * 100) / 100);
}

/**
 * Evaluates scores across all requested institutions
 */
export function calculateMultiInstitutionSekem(
     input: UnifiedCalculationInput,
     selectedInstitutionIds: string[]
): InstitutionSekemResult[] {
     const standardBagrut = calculateStandardBagrutAverage(input.bagrutSubjects);
     const psych = input.psychometricGeneral;
     const quant = input.psychometricQuant || psych;

     const bguRes = calculateBguAdmission({
          bagrutSubjects: input.bagrutSubjects,
          psychometricGeneral: psych,
          psychometricQuant: quant,
          mathGrade: input.mathGrade,
          mathUnits: input.mathUnits,
          physicsGrade: input.physicsGrade,
          physicsUnits: input.physicsUnits
     });

     const allInstitutions: Record<string, InstitutionSekemResult> = {
          bgu: {
               institutionId: 'bgu',
               institutionName: 'אוניברסיטת בן-גוריון בנגב',
               logoText: 'BGU',
               badgeColor: 'from-cyan-500 to-blue-600',
               bagrutAverage: bguRes.bagrutAverage,
               generalSekem: bguRes.generalSekem,
               engineeringSekem: bguRes.engineeringSekem,
               directBagrutEligible: bguRes.directBagrutEligible,
               notes: 'סכם כללי וסכם הנדסה רשמי לפי נוסחאות ב"ג'
          },
          tau: {
               institutionId: 'tau',
               institutionName: 'אוניברסיטת תל אביב',
               logoText: 'TAU',
               badgeColor: 'from-purple-500 to-indigo-600',
               bagrutAverage: standardBagrut,
               generalSekem: psych > 0 && standardBagrut > 0 ? Math.min(800, Math.round((0.5 * psych + 5 * standardBagrut) * 10) / 10) : 0,
               engineeringSekem: quant > 0 && input.mathGrade > 0 ? Math.min(800, Math.round((0.6 * quant + 0.4 * (input.mathGrade + (input.mathUnits === 5 ? 25 : 12.5)) * 6.4) * 10) / 10) : 0,
               directBagrutEligible: standardBagrut >= 105,
               notes: 'ציון התאמה רב-תחומי וכמותי'
          },
          technion: {
               institutionId: 'technion',
               institutionName: 'הטכניון - מכון טכנולוגי לישראל',
               logoText: 'IIT',
               badgeColor: 'from-blue-600 to-teal-500',
               bagrutAverage: standardBagrut,
               generalSekem: psych > 0 && standardBagrut > 0 ? Math.min(100, Math.round((0.5 * (psych / 8) + 0.5 * standardBagrut) * 10) / 10) : 0,
               engineeringSekem: quant > 0 && input.mathGrade > 0 ? Math.min(100, Math.round((0.6 * (quant / 8) + 0.4 * standardBagrut) * 10) / 10) : 0,
               directBagrutEligible: standardBagrut >= 108,
               notes: 'סכם טכניוני (סקאלה 0-100)'
          },
          huji: {
               institutionId: 'huji',
               institutionName: 'האוניברסיטה העברית בירושלים',
               logoText: 'HUJI',
               badgeColor: 'from-amber-500 to-orange-600',
               bagrutAverage: standardBagrut,
               generalSekem: psych > 0 && standardBagrut > 0 ? Math.min(800, Math.round((0.5 * psych + 5 * standardBagrut) * 10) / 10) : 0,
               engineeringSekem: quant > 0 ? Math.min(800, Math.round((0.5 * quant * 5.33 + 0.5 * standardBagrut * 4) * 10) / 10) : 0,
               directBagrutEligible: standardBagrut >= 103,
               notes: 'ציון קבלה משוקלל בעברית'
          },
          ariel: {
               institutionId: 'ariel',
               institutionName: 'אוניברסיטת אריאל בשומרון',
               logoText: 'AU',
               badgeColor: 'from-emerald-500 to-green-600',
               bagrutAverage: standardBagrut,
               generalSekem: psych > 0 && standardBagrut > 0 ? Math.min(800, Math.round((0.5 * psych + 5 * standardBagrut) * 10) / 10) : 0,
               engineeringSekem: quant > 0 ? Math.min(800, Math.round((0.55 * quant * 5.33 + 0.45 * standardBagrut * 4) * 10) / 10) : 0,
               directBagrutEligible: standardBagrut >= 100,
               notes: 'סכם קבלה לאריאל'
          },
          haifa: {
               institutionId: 'haifa',
               institutionName: 'אוניברסיטת חיפה',
               logoText: 'UOH',
               badgeColor: 'from-sky-500 to-indigo-500',
               bagrutAverage: standardBagrut,
               generalSekem: psych > 0 && standardBagrut > 0 ? Math.min(800, Math.round((0.5 * psych + 5 * standardBagrut) * 10) / 10) : 0,
               directBagrutEligible: standardBagrut >= 98,
               notes: 'סכם קבלה אוניברסיטת חיפה'
          }
     };

     return selectedInstitutionIds
          .map((id) => allInstitutions[id])
          .filter(Boolean);
}
