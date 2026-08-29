/**
 * BGU (Ben-Gurion University of the Negev) Official Admission Sekem Calculator
 * 
 * Ben-Gurion University uses two main admission indices:
 * 1. General Sekem (סכם כללי): Combination of optimal Bagrut average and General Psychometric score.
 * 2. Engineering & Exact Sciences Sekem (סכם הנדסה / כמותי): Combination of Quantitative Psychometric score, General Psychometric score, and Math / Physics Bagrut grades.
 */

export interface SubjectInput {
     name: string;
     units: number;
     grade: number;
}

export interface BguCalculationInput {
     bagrutSubjects: SubjectInput[];
     psychometricGeneral: number;
     psychometricQuant?: number;
     mathGrade: number;
     mathUnits: number;
     physicsGrade?: number;
     physicsUnits?: number;
}

export interface BguCalculationResult {
     bagrutAverage: number;
     generalSekem: number;
     engineeringSekem: number;
     directBagrutEligible: boolean;
}

/**
 * Calculates BGU Optimal Bagrut Average with official bonuses:
 * Bonuses are only granted for passing grades (grade >= 60):
 * - 5 units Math: +25 points
 * - 4 units Math: +12.5 points
 * - 5 units English: +25 points
 * - 4 units English: +12.5 points
 * - 5 units Physics / CS / Chemistry / Biology / Cyber: +20 to +25 points
 */
export function calculateBguBagrutAverage(subjects: SubjectInput[]): number {
     if (!subjects || subjects.length === 0) return 0;

     let totalWeightedGrades = 0;
     let totalUnits = 0;

     for (const sub of subjects) {
          let bonus = 0;
          const subName = sub.name.trim();

          // Bonus is only applied if student passed the subject (grade >= 60)
          if (sub.grade >= 60) {
               if (subName.includes('מתמטיקה')) {
                    if (sub.units === 5) bonus = 25;
                    else if (sub.units === 4) bonus = 12.5;
               } else if (subName.includes('אנגלית')) {
                    if (sub.units === 5) bonus = 25;
                    else if (sub.units === 4) bonus = 12.5;
               } else if (sub.units === 5) {
                    if (subName.includes('פיזיקה') || subName.includes('מדעי המחשב') || subName.includes('כימיה') || subName.includes('ביולוגיה') || subName.includes('סייבר')) {
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
     const avg = totalWeightedGrades / totalUnits;
     return Math.min(125, Math.round(avg * 100) / 100);
}

/**
 * Calculates BGU General Sekem (סכם כללי):
 * Formula: Sekem_General = 0.5 * Psychometric_General + 5 * Bagrut_Average
 * Scale: 200 - 800
 */
export function calculateBguGeneralSekem(bagrutAverage: number, psychometricGeneral: number): number {
     if (bagrutAverage <= 0 && psychometricGeneral <= 0) return 0;
     const rawSekem = 0.5 * psychometricGeneral + 5 * bagrutAverage;
     return Math.min(800, Math.max(200, Math.round(rawSekem * 10) / 10));
}

/**
 * Calculates BGU Engineering / Quantitative Sekem (סכם הנדסה):
 * Formula:
 * Sekem_Engineering = (0.45 * Psych_Quant) + (0.25 * Psych_General) + (0.30 * Math_Bagrut_Scaled_Score)
 * Scale: 200 - 800
 */
export function calculateBguEngineeringSekem(
     mathGrade: number,
     mathUnits: number,
     psychometricGeneral: number,
     psychometricQuant: number = psychometricGeneral,
     physicsGrade: number = 0,
     physicsUnits: number = 0
): number {
     if (psychometricGeneral <= 0 && psychometricQuant <= 0 && mathGrade <= 0) return 0;

     // Calculate Math component (converted to 200-800 scale)
     let mathBonus = 0;
     if (mathGrade >= 60) {
          if (mathUnits === 5) mathBonus = 25;
          else if (mathUnits === 4) mathBonus = 12.5;
     }

     const mathFinal = mathGrade > 0 ? Math.min(125, mathGrade + mathBonus) : 0;
     // Scale 100-125 Bagrut to 500-800 equivalent:
     const mathScaled = mathGrade > 0 ? (mathFinal / 125) * 800 : 0;

     // Physics bonus contribution if 5 units and passing grade
     let physicsFactor = 0;
     if (physicsUnits === 5 && physicsGrade >= 70) {
          physicsFactor = (physicsGrade / 100) * 20; // Up to 20 bonus points on Engineering Sekem
     }

     const quantWeight = psychometricQuant > 0 ? psychometricQuant : psychometricGeneral;
     const rawSekem = (0.45 * quantWeight) + (0.25 * psychometricGeneral) + (0.30 * mathScaled) + physicsFactor;

     if (rawSekem <= 0) return 0;
     return Math.min(800, Math.max(200, Math.round(rawSekem * 10) / 10));
}

/**
 * Calculates full BGU Admission Evaluation
 */
export function calculateBguAdmission(input: BguCalculationInput): BguCalculationResult {
     const bagrutAvg = calculateBguBagrutAverage(input.bagrutSubjects);
     const generalSekem = calculateBguGeneralSekem(bagrutAvg, input.psychometricGeneral);
     const engineeringSekem = calculateBguEngineeringSekem(
          input.mathGrade,
          input.mathUnits,
          input.psychometricGeneral,
          input.psychometricQuant,
          input.physicsGrade,
          input.physicsUnits
     );

     // Direct Bagrut admission eligibility (without Psychometric for specific non-STEM programs)
     const directBagrutEligible = bagrutAvg >= 102;

     return {
          bagrutAverage: bagrutAvg,
          generalSekem,
          engineeringSekem,
          directBagrutEligible
     };
}
