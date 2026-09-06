import { SubjectInput } from './bguCalculator';

export interface TauCalculatorInput {
     bagrutSubjects: SubjectInput[];
     psychometricGeneral: number;
     psychometricQuant?: number;
     psychometricVerbal?: number;
     psychometricEnglish?: number;
     mathGrade: number;
     mathUnits: number;
     physicsGrade?: number;
     physicsUnits?: number;
}

export interface TauCalculatorResult {
     bagrutAverage: number;
     generalSekem: number; // ציון התאמה רב-תחומי / כללי
     quantitativeSekem: number; // ציון התאמה כמותי / הנדסה ומדעים מדויקים
     managementSekem?: number; // ציון התאמה לניהול
     directBagrutEligible: boolean;
     optimalUnits?: number;
     droppedSubjects?: string[];
     hasRealitBonus?: boolean;
}

export interface OptimalTauBagrutResult {
     average: number;
     optimalUnits: number;
     totalUnits: number;
     droppedSubjects: SubjectInput[];
     includedSubjects: SubjectInput[];
}

/**
 * Returns TAU official bonus points for a subject:
 * Bonuses only apply if passing grade >= 60:
 * - Math 5 units: +35 points
 * - Math 4 units: +12.5 points
 * - English 5 units: +25 points
 * - English 4 units: +12.5 points
 * - Physics / Chemistry / Biology / 5u Literature / 5u Bible / 5u History / 5u Arabic: +25 points
 * - Computer Science / Software / other 5-unit electives: +20 points
 * - Other 4-unit electives: +10 points
 */
export function getTauSubjectBonus(sub: SubjectInput): number {
     if (sub.grade < 60) return 0;
     const subName = sub.name.trim();

     if (subName.includes('מתמטיקה')) {
          if (sub.units === 5) return 35;
          if (sub.units === 4) return 12.5;
          return 0;
     }

     if (subName.includes('אנגלית')) {
          if (sub.units === 5) return 25;
          if (sub.units === 4) return 12.5;
          return 0;
     }

     if (sub.units === 5) {
          if (
               subName.includes('פיזיקה') ||
               subName.includes('כימיה') ||
               subName.includes('ביולוגיה') ||
               subName.includes('ספרות') ||
               subName.includes('היסטוריה') ||
               subName.includes('תנ"ך') ||
               subName.includes('ערבית')
          ) {
               return 25;
          }
          return 20; // Computer Science, Social Sciences, Arts, etc.
     }

     if (sub.units === 4) {
          return 10;
     }

     return 0;
}

/**
 * Checks if a subject is mandatory and non-droppable according to TAU regulations:
 * Mandatory:
 * - Hebrew Expression (הבעה עברית)
 * - English (אנגלית)
 * - Civics (אזרחות)
 * - Mathematics (מתמטיקה)
 * - History / Israeli heritage (היסטוריה / תע"י)
 */
export function isTauMandatorySubject(name: string): boolean {
     const n = name.trim();
     if (n.includes('מתמטיקה')) return true;
     if (n.includes('אנגלית')) return true;
     if (n.includes('אזרחות')) return true;
     if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
     if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
     return false;
}

/**
 * Calculates optimal Bagrut average according to Tel Aviv University (TAU) official rules:
 * - Evaluates droppable electives (and 2-unit Literature/Bible when units exceed 20 and an advanced subject exists)
 * - Minimum remaining units must be at least 20
 * - Must include at least one advanced (>= 4 units) subject other than English
 * - Maximizes the overall weighted average
 */
export function calculateOptimalTauBagrut(subjects: SubjectInput[]): OptimalTauBagrutResult {
     if (!subjects || subjects.length === 0) {
          return { average: 0, optimalUnits: 0, totalUnits: 0, droppedSubjects: [], includedSubjects: [] };
     }

     const activeSubs = subjects.filter(s => s.units > 0 && s.grade > 0);
     if (activeSubs.length === 0) {
          return { average: 0, optimalUnits: 0, totalUnits: 0, droppedSubjects: [], includedSubjects: [] };
     }

     const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);

     const mandatorySubs = activeSubs.filter(s => isTauMandatorySubject(s.name));
     const droppableSubs = activeSubs.filter(s => !isTauMandatorySubject(s.name));

     // If active units < 20 or no droppable subjects, calculate raw average without dropping
     if (totalActiveUnits < 20 || droppableSubs.length === 0) {
          let totalScore = 0;
          for (const s of activeSubs) {
               totalScore += (s.grade + getTauSubjectBonus(s)) * s.units;
          }
          const rawAvg = Math.min(125, Math.round((totalScore / totalActiveUnits) * 100) / 100);
          return {
               average: rawAvg,
               optimalUnits: totalActiveUnits,
               totalUnits: totalActiveUnits,
               droppedSubjects: [],
               includedSubjects: activeSubs
          };
     }

     // Limit combinatorial search if user enters too many subjects
     const candidates = droppableSubs.slice(0, 12);
     let bestAvg = 0;
     let bestUnits = 0;
     let bestDropped: SubjectInput[] = [];
     let bestIncluded: SubjectInput[] = activeSubs;

     const numSubsets = 1 << candidates.length;
     for (let mask = 0; mask < numSubsets; mask++) {
          const currentIncluded: SubjectInput[] = [...mandatorySubs];
          const currentDropped: SubjectInput[] = [];

          for (let i = 0; i < candidates.length; i++) {
               if ((mask & (1 << i)) !== 0) {
                    currentIncluded.push(candidates[i]);
               } else {
                    currentDropped.push(candidates[i]);
               }
          }

          const currentUnits = currentIncluded.reduce((sum, s) => sum + s.units, 0);
          if (currentUnits < 20) continue;

          // Check for at least one advanced (>= 4 units) subject besides English
          const hasAdvanced = currentIncluded.some(s => !s.name.includes('אנגלית') && s.units >= 4);
          if (!hasAdvanced) continue;

          let currentScore = 0;
          for (const s of currentIncluded) {
               currentScore += (s.grade + getTauSubjectBonus(s)) * s.units;
          }

          const avg = Math.round((currentScore / currentUnits) * 100) / 100;
          if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
               bestAvg = avg;
               bestUnits = currentUnits;
               bestDropped = currentDropped;
               bestIncluded = currentIncluded;
          }
     }

     return {
          average: Math.min(125, bestAvg),
          optimalUnits: bestUnits,
          totalUnits: totalActiveUnits,
          droppedSubjects: bestDropped,
          includedSubjects: bestIncluded
     };
}

/**
 * Calculates optimal Bagrut average according to TAU official rules
 */
export function calculateTauBagrutAverage(subjects: SubjectInput[]): number {
     return calculateOptimalTauBagrut(subjects).average;
}

/**
 * Calculates TAU Fit Score (ציון התאמה)
 * Official TAU Formula:
 * 1. step1 = min(bagrutAverage, 117) * 9.62 - 349.9
 * 2. step2 = round(step1, 2)
 * 3. rawScore = (step2 + psychometric) * 0.52 - 43.10
 * 4. fitScore = round(rawScore)
 * 
 * Engineering / Exact Sciences:
 * - Uses quantitative psychometric score
 * - +10 bonus points for 5-unit Math (grade >= 55) and 5-unit Physics (grade >= 55)
 */
export function calculateTauAdmission(input: TauCalculatorInput): TauCalculatorResult {
     const optimal = calculateOptimalTauBagrut(input.bagrutSubjects);
     const bagrutAverage = optimal.average;
     const psych = input.psychometricGeneral;
     const quant = input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych;

     if (psych === 0 && bagrutAverage === 0) {
          return {
               bagrutAverage: 0,
               generalSekem: 0,
               quantitativeSekem: 0,
               directBagrutEligible: false,
               optimalUnits: 0,
               droppedSubjects: [],
               hasRealitBonus: false
          };
     }

     const cappedBagrut = Math.min(bagrutAverage, 117);
     const step1 = cappedBagrut * 9.62 - 349.9;
     const step2 = Math.round(step1 * 100) / 100;

     // Resolve math and physics from either input fields or bagrutSubjects
     const mathSub = input.bagrutSubjects.find(s => s.name.includes('מתמטיקה'));
     const effMathUnits = input.mathUnits || (mathSub ? mathSub.units : 0);
     const effMathGrade = input.mathGrade || (mathSub ? mathSub.grade : 0);

     const physSub = input.bagrutSubjects.find(s => s.name.includes('פיזיקה'));
     const effPhysUnits = input.physicsUnits !== undefined ? input.physicsUnits : (physSub ? physSub.units : 0);
     const effPhysGrade = input.physicsGrade !== undefined ? input.physicsGrade : (physSub ? physSub.grade : 0);

     // ריאלית bonus: +10 when Math 5u (≥55) AND Physics 5u (≥55) — applies to quantitative and engineering sekem
     const hasRealitBonus =
          effMathUnits === 5 &&
          effMathGrade >= 55 &&
          effPhysUnits === 5 &&
          effPhysGrade >= 55;

     // TAU General Fit Score (ציון התאמה רב-תחומי / ללא מור)
     let generalSekem = 0;
     if (psych > 0 && bagrutAverage > 0) {
          const rawGeneral = (step2 + psych) * 0.52 - 43.10;
          generalSekem = Math.min(800, Math.max(200, Math.round(rawGeneral)));
     }

     // TAU Engineering / Exact Sciences Fit Score (ציון התאמה הנדסה ומדעים מדויקים)
     // Uses quantitative emphasis psychometric composite if higher, plus +10 ריאלית bonus
     let quantitativeSekem = 0;
     if (psych > 0 && bagrutAverage > 0) {
          const effPsychForQuant = quant > psych ? quant : psych;
          const rawQuant = (step2 + effPsychForQuant) * 0.52 - 43.10;
          quantitativeSekem = Math.min(800, Math.max(200, Math.round(rawQuant + (hasRealitBonus ? 10 : 0))));
     }

     // TAU Management Fit Score (ציון התאמה לניהול - הפקולטה לניהול ע"ש קולר)
     // Verified formula: round(0.3 * step2 + 0.7 * psych - 11.5)
     let managementSekem = 0;
     if (psych > 0 && bagrutAverage > 0) {
          const rawNihul = 0.3 * step2 + 0.7 * psych - 11.5;
          managementSekem = Math.min(800, Math.max(200, Math.round(rawNihul)));
     }

     const directBagrutEligible = bagrutAverage >= 105;

     return {
          bagrutAverage,
          generalSekem,
          quantitativeSekem,
          managementSekem,
          directBagrutEligible,
          optimalUnits: optimal.optimalUnits,
          droppedSubjects: optimal.droppedSubjects.map(s => s.name),
          hasRealitBonus
     };
}

