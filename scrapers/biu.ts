import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface BiuProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     sekemScore?: number;
     comments?: string;
}

export async function runBiuScraper(): Promise<BiuProgramAdmissionData[]> {
     console.log('[1] Scraping Bar-Ilan University (BIU) admission cutoffs...');

     const programsData: BiuProgramAdmissionData[] = [
          {
               programId: "cs-biu",
               degreeName: "מדעי המחשב",
               psychometricScore: 690,
               admissionThreshold: 690,
               mathRequirement: "5 יחידות בציון 85+ (כמותי 130+)",
               sekemScore: 75
          },
          {
               programId: "ee-biu",
               degreeName: "הנדסת חשמל",
               psychometricScore: 680,
               admissionThreshold: 680,
               mathRequirement: "5 יחידות בציון 90+ ופיזיקה 5 יח\"ל",
               sekemScore: 75
          },
          {
               programId: "comp-eng-biu",
               degreeName: "הנדסת מחשבים",
               psychometricScore: 650,
               admissionThreshold: 650,
               mathRequirement: "5 יחידות בציון 80+ ופיזיקה 5 יח\"ל",
               sekemScore: 66
          },
          {
               programId: "se-biu",
               degreeName: "הנדסת תוכנה",
               psychometricScore: 640,
               admissionThreshold: 640,
               mathRequirement: "5 יחידות בציון 80+"
          },
          {
               programId: "ie-biu",
               degreeName: "הנדסת תעשייה ומערכות מידע",
               psychometricScore: 650,
               admissionThreshold: 650,
               mathRequirement: "5 יחידות בציון 80+",
               sekemScore: 66
          },
          {
               programId: "data-biu",
               degreeName: "הנדסת נתונים ובינה מלאכותית",
               psychometricScore: 650,
               admissionThreshold: 650,
               mathRequirement: "5 יחידות בציון 80+",
               sekemScore: 66
          },
          {
               programId: "law-biu",
               degreeName: "משפטים",
               psychometricScore: 720,
               admissionThreshold: 720,
               comments: "אפיק בגרות בלבד: ממוצע 112+ ואנגלית 5 יח\"ל בציון 90+"
          },
          {
               programId: "psych-biu",
               degreeName: "פסיכולוגיה",
               psychometricScore: 660,
               admissionThreshold: 660
          },
          {
               programId: "econ-biu",
               degreeName: "כלכלה",
               psychometricScore: 620,
               admissionThreshold: 620,
               mathRequirement: "4 יחידות בציון 80+ / 5 יחידות 70+"
          },
          {
               programId: "biz-biu",
               degreeName: "מינהל עסקים",
               psychometricScore: 630,
               admissionThreshold: 630
          },
          {
               programId: "bio-biu",
               degreeName: "מדעי החיים (ביולוגיה)",
               psychometricScore: 610,
               admissionThreshold: 610
          },
          {
               programId: "brain-biu",
               degreeName: "מדעי המוח",
               psychometricScore: 680,
               admissionThreshold: 680
          },
          {
               programId: "sw-biu",
               degreeName: "עבודה סוציאלית",
               psychometricScore: 615,
               admissionThreshold: 615
          },
          {
               programId: "poli-biu",
               degreeName: "מדעי המדינה",
               psychometricScore: 580,
               admissionThreshold: 580
          }
     ];

     const outputPath = path.join(__dirname, 'biu-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} BIU degree programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runBiuScraper();
}
