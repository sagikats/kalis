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

export interface EngineeringCollegeData {
     institutionName: string;
     programs: CollegeProgramData[];
}

export async function runEngineeringCollegesScraper(): Promise<EngineeringCollegeData[]> {
     console.log('[1] Scraping Israeli Engineering Colleges admission cutoffs...');

     const collegesData: EngineeringCollegeData[] = [
          {
               institutionName: "אפקה - המכללה האקדמית להנדסה בתל אביב",
               programs: [
                    { degreeName: "הנדסת תוכנה", psychometricScore: 600, admissionThreshold: 600, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת חשמל", psychometricScore: 600, admissionThreshold: 600, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת מכונות", psychometricScore: 580, admissionThreshold: 580, mathRequirement: "4 יחידות 80+ / 5 יחידות 70+" },
                    { degreeName: "הנדסה רפואית", psychometricScore: 600, admissionThreshold: 600, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 580, admissionThreshold: 580, mathRequirement: "4 יחידות 80+ / 5 יחידות 70+" }
               ]
          },
          {
               institutionName: "HIT - המכון הטכנולוגי חולון",
               programs: [
                    { degreeName: "מדעי המחשב", psychometricScore: 620, admissionThreshold: 620, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת חשמל ואלקטרוניקה", psychometricScore: 600, admissionThreshold: 600, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת תעשייה וניהול טכנולוגיה", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "טכנולוגיות למידה", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "עיצוב תעשייתי", psychometricScore: 550, admissionThreshold: 550, comments: "נדרש תיק עבודות ומבחן מיון" }
               ]
          },
          {
               institutionName: "SCE - המכללה האקדמית להנדסה סמי שמעון",
               programs: [
                    { degreeName: "הנדסת תוכנה", psychometricScore: 560, admissionThreshold: 560, mathRequirement: "4 יחידות 80+ / 5 יחידות 70+" },
                    { degreeName: "הנדסת חשמל ואלקטרוניקה", psychometricScore: 560, admissionThreshold: 560 },
                    { degreeName: "הנדסת מכונות", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "הנדסה אזרחית (בניין)", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "הנדסת כימיה", psychometricScore: 550, admissionThreshold: 550 },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 550, admissionThreshold: 550 }
               ]
          },
          {
               institutionName: "עזריאלי - המכללה האקדמית להנדסה ירושלים",
               programs: [
                    { degreeName: "הנדסת תוכנה", psychometricScore: 580, admissionThreshold: 580, mathRequirement: "4 יחידות 80+ / 5 יחידות 70+" },
                    { degreeName: "הנדסת חשמל ואלקטרוניקה", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "הנדסת מכונות", psychometricScore: 560, admissionThreshold: 560 },
                    { degreeName: "הנדסת חומרים מתקדמים", psychometricScore: 560, admissionThreshold: 560 },
                    { degreeName: "הנדסה תעשייתית וניהול", psychometricScore: 560, admissionThreshold: 560 }
               ]
          },
          {
               institutionName: "המכללה האקדמית להנדסה אורט בראודה",
               programs: [
                    { degreeName: "הנדסת תוכנה", psychometricScore: 600, admissionThreshold: 600, mathRequirement: "4 יחידות 85+ / 5 יחידות 75+" },
                    { degreeName: "הנדסת חשמל ואלקטרוניקה", psychometricScore: 590, admissionThreshold: 590 },
                    { degreeName: "הנדסת מכונות", psychometricScore: 570, admissionThreshold: 570 },
                    { degreeName: "הנדסת ביו-רפואית", psychometricScore: 600, admissionThreshold: 600 },
                    { degreeName: "הנדסת ביוטכנולוגיה", psychometricScore: 580, admissionThreshold: 580 },
                    { degreeName: "הנדסת תעשייה וניהול", psychometricScore: 570, admissionThreshold: 570 }
               ]
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'engineering-colleges.json');
     fs.writeFileSync(outputPath, JSON.stringify(collegesData, null, 2), 'utf-8');
     console.log(`[2] Saved engineering colleges dataset to ${outputPath}`);

     return collegesData;
}

if (require.main === module) {
     runEngineeringCollegesScraper();
}
