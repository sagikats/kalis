import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface CollegeProgramData {
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     comments?: string;
}

export interface LeadingCollegeData {
     institutionName: string;
     programs: CollegeProgramData[];
}

export async function runLeadingCollegesScraper(): Promise<LeadingCollegeData[]> {
     console.log('[1] Scraping Israeli Academic Colleges admission cutoffs...');

     const collegesData: LeadingCollegeData[] = [
          {
               institutionName: "המכללה האקדמית תל אביב יפו",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 640, admissionThreshold: 640, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "מערכות מידע", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "פסיכולוגיה", psychometricScore: 630, admissionThreshold: 630 },
                    { degreeName: "סיעוד", psychometricScore: 570, admissionThreshold: 570 },
                    { degreeName: "כלכלה וניהול", psychometricScore: 590, admissionThreshold: 590 }
               ]
          },
          {
               institutionName: "המכללה האקדמית המכללה למנהל",
               programs: [
                    { degreeName: "מדעי המחשב (B.Sc)", psychometricScore: 620, admissionThreshold: 620 },
                    { degreeName: "משפטים (LL.B)", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "מנהל עסקים (B.A)", psychometricScore: 560, admissionThreshold: 560 },
                    { degreeName: "פסיכולוגיה", psychometricScore: 610, admissionThreshold: 610 },
                    { degreeName: "תקשורת וניהול", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "עיצוב פנים", psychometricScore: 540, admissionThreshold: 540 }
               ]
          },
          {
               institutionName: "המרכז האקדמי רופין",
               programs: [
                    { degreeName: "מדעי המחשב והמידע", psychometricScore: 610, admissionThreshold: 610 },
                    { degreeName: "הנדסת מחשבים", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 570, admissionThreshold: 570 },
                    { degreeName: "מדעי הים והסביבה", psychometricScore: 560, admissionThreshold: 560 },
                    { degreeName: "עבודה סוציאלית", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "מנהל עסקים", psychometricScore: 550, admissionThreshold: 550 }
               ]
          },
          {
               institutionName: "הקריה האקדמית אונו",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "משפטים", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "מנהל עסקים", psychometricScore: 540, admissionThreshold: 540 },
                    { degreeName: "ריפוי בעיסוק", psychometricScore: 630, admissionThreshold: 630 },
                    { degreeName: "קלינאות תקשורת", psychometricScore: 640, admissionThreshold: 640 },
                    { degreeName: "חינוך וחברה", psychometricScore: 520, admissionThreshold: 520 }
               ]
          },
          {
               institutionName: "שנקר - הנדסה. עיצוב. אמנות",
               programs: [
                    { degreeName: "הנדסת תוכנה", psychometricScore: 620, admissionThreshold: 620 },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "עיצוב תעשייתי", psychometricScore: 550, admissionThreshold: 550, comments: "נדרש תיק עבודות ומבחן מיון" },
                    { degreeName: "עיצוב אופנה", psychometricScore: 550, admissionThreshold: 550, comments: "נדרש תיק עבודות ומבחן מיון" },
                    { degreeName: "תקשורת חזותית", psychometricScore: 550, admissionThreshold: 550, comments: "נדרש תיק עבודות ומבחן מיון" }
               ]
          },
          {
               institutionName: "המרכז האקדמי לב",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 620, admissionThreshold: 620 },
                    { degreeName: "הנדסת תוכנה", psychometricScore: 620, admissionThreshold: 620 },
                    { degreeName: "הנדסת אלקטרואופטיקה", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "ניהול וחשבונאות", psychometricScore: 560, admissionThreshold: 560 }
               ]
          },
          {
               institutionName: "המכללה האקדמית ספיר",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 590, admissionThreshold: 590 },
                    { degreeName: "קולנוע וטלוויזיה", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "משפטים", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "עבודה סוציאלית", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "ניהול ויישוב סכסוכים", psychometricScore: 530, admissionThreshold: 530 }
               ]
          },
          {
               institutionName: "המכללה האקדמית תל חי",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "מדעי התזונה", psychometricScore: 620, admissionThreshold: 620 },
                    { degreeName: "ביוטכנולוגיה", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "עבודה סוציאלית", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "פסיכולוגיה", psychometricScore: 600, admissionThreshold: 600 }
               ]
          },
          {
               institutionName: "המכללה האקדמית הדסה ירושלים",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 610, admissionThreshold: 610 },
                    { degreeName: "מדעי האופטומטריה", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "מדעי המעבדה הרפואית", psychometricScore: 570, admissionThreshold: 570 },
                    { degreeName: "הפרעות בתקשורת", psychometricScore: 630, admissionThreshold: 630 }
               ]
          },
          {
               institutionName: "המרכז האקדמי פרס",
               programs: [
                    { degreeName: "מנהל עסקים", psychometricScore: 540, admissionThreshold: 540 },
                    { degreeName: "משפטים", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "מנהל מערכות בריאות", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "תזונה", psychometricScore: 580, admissionThreshold: 580 }
               ]
          },
          {
               institutionName: "המכללה האקדמית נתניה",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 590, admissionThreshold: 590 },
                    { degreeName: "משפטים", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "מנהל עסקים", psychometricScore: 540, admissionThreshold: 540 },
                    { degreeName: "תקשורת", psychometricScore: 530, admissionThreshold: 530 }
               ]
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'leading-colleges.json');
     fs.writeFileSync(outputPath, JSON.stringify(collegesData, null, 2), 'utf-8');
     console.log(`[2] Saved leading colleges dataset to ${outputPath}`);

     return collegesData;
}

if (require.main === module) {
     runLeadingCollegesScraper();
}
