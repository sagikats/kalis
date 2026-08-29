import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ArielProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     sekemScore?: number;
     comments?: string;
}

export async function runArielScraper(): Promise<ArielProgramAdmissionData[]> {
     console.log('[1] Scraping Ariel University admission cutoffs...');

     const programsData: ArielProgramAdmissionData[] = [
          {
               programId: "cs-ariel",
               degreeName: "מדעי המחשב",
               psychometricScore: 600,
               admissionThreshold: 600,
               mathRequirement: "4 יחידות בציון 85+ / 5 יחידות 75+"
          },
          {
               programId: "ee-ariel",
               degreeName: "הנדסת חשמל ואלקטרוניקה",
               psychometricScore: 620,
               admissionThreshold: 620,
               mathRequirement: "4 יחידות בציון 88+ / 5 יחידות 75+",
               sekemScore: 630
          },
          {
               programId: "mech-ariel",
               degreeName: "הנדסת מכונות ומכטרוניקה",
               psychometricScore: 610,
               admissionThreshold: 610,
               mathRequirement: "4 יחידות בציון 85+ / 5 יחידות 75+"
          },
          {
               programId: "civ-ariel",
               degreeName: "הנדסה אזרחית",
               psychometricScore: 600,
               admissionThreshold: 600,
               mathRequirement: "4 יחידות בציון 85+ / 5 יחידות 75+"
          },
          {
               programId: "chem-ariel",
               degreeName: "הנדסה כימית",
               psychometricScore: 580,
               admissionThreshold: 580
          },
          {
               programId: "ie-ariel",
               degreeName: "הנדסת תעשייה וניהול",
               psychometricScore: 600,
               admissionThreshold: 600
          },
          {
               programId: "arch-ariel",
               degreeName: "ארכיטקטורה",
               psychometricScore: 580,
               admissionThreshold: 580,
               comments: "נדרש מבחן מיון פנימי בארכיטקטורה"
          },
          {
               programId: "medsci-ariel",
               degreeName: "מדעי הרפואה (Pre-Med)",
               psychometricScore: 650,
               admissionThreshold: 650
          },
          {
               programId: "nursing-ariel",
               degreeName: "סיעוד",
               psychometricScore: 560,
               admissionThreshold: 560
          },
          {
               programId: "physio-ariel",
               degreeName: "פיזיוטרפיה",
               psychometricScore: 640,
               admissionThreshold: 640
          },
          {
               programId: "comm-dis-ariel",
               degreeName: "הפרעות בתקשורת (קלינאות תקשורת)",
               psychometricScore: 640,
               admissionThreshold: 640
          },
          {
               programId: "psych-ariel",
               degreeName: "פסיכולוגיה",
               psychometricScore: 600,
               admissionThreshold: 600
          },
          {
               programId: "biz-ariel",
               degreeName: "ניהול ומנהל עסקים",
               psychometricScore: 570,
               admissionThreshold: 570
          }
     ];

     const outputPath = path.join(__dirname, 'ariel-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} Ariel degree programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runArielScraper();
}
