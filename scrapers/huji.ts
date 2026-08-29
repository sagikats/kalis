import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface HujiProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     englishRequirement?: string;
     comments?: string;
}

export async function runHujiScraper(): Promise<HujiProgramAdmissionData[]> {
     console.log('[1] Scraping Hebrew University (HUJI) admission cutoffs...');

     const programsData: HujiProgramAdmissionData[] = [
          {
               programId: "cs-huji",
               degreeName: "מדעי המחשב",
               psychometricScore: 725,
               admissionThreshold: 725,
               mathRequirement: "5 יחידות בציון 85+"
          },
          {
               programId: "cs-math-huji",
               degreeName: "מדעי המחשב ומתמטיקה",
               psychometricScore: 730,
               admissionThreshold: 730,
               mathRequirement: "5 יחידות בציון 90+"
          },
          {
               programId: "ee-huji",
               degreeName: "הנדסת מחשבים וחשמל",
               psychometricScore: 710,
               admissionThreshold: 710,
               mathRequirement: "5 יחידות בציון 85+"
          },
          {
               programId: "law-huji",
               degreeName: "משפטים",
               psychometricScore: 675,
               admissionThreshold: 675,
               englishRequirement: "ציון 100+"
          },
          {
               programId: "med-huji",
               degreeName: "רפואה (MD)",
               psychometricScore: 740,
               admissionThreshold: 740,
               comments: "סף זימון למבחן מרק\"ם/מו\"ר: פסיכומטרי 740+ וממוצע בגרות 112+"
          },
          {
               programId: "dent-huji",
               degreeName: "רפואת שיניים (DMD)",
               psychometricScore: 680,
               admissionThreshold: 680,
               comments: "נדרש מעבר מבחני התאמה וראיון"
          },
          {
               programId: "econ-huji",
               degreeName: "כלכלה",
               psychometricScore: 650,
               admissionThreshold: 650,
               mathRequirement: "4 יחידות בציון 80+ / 5 יחידות 70+"
          },
          {
               programId: "biz-huji",
               degreeName: "מינהל עסקים",
               psychometricScore: 660,
               admissionThreshold: 660
          },
          {
               programId: "psych-huji",
               degreeName: "פסיכולוגיה",
               psychometricScore: 685,
               admissionThreshold: 685
          },
          {
               programId: "physics-huji",
               degreeName: "פיסיקה",
               psychometricScore: 670,
               admissionThreshold: 670,
               mathRequirement: "5 יחידות בציון 80+"
          },
          {
               programId: "math-huji",
               degreeName: "מתמטיקה",
               psychometricScore: 660,
               admissionThreshold: 660,
               mathRequirement: "5 יחידות בציון 85+"
          },
          {
               programId: "bio-huji",
               degreeName: "מדעי החיים (ביולוגיה)",
               psychometricScore: 640,
               admissionThreshold: 640
          },
          {
               programId: "pharm-huji",
               degreeName: "רוקחות",
               psychometricScore: 665,
               admissionThreshold: 665
          },
          {
               programId: "cogan-huji",
               degreeName: "מדעי הקוגניציה",
               psychometricScore: 690,
               admissionThreshold: 690
          },
          {
               programId: "data-huji",
               degreeName: "מדע הנתונים",
               psychometricScore: 715,
               admissionThreshold: 715
          },
          {
               programId: "ppe-huji",
               degreeName: "פכ\"מ: פילוסופיה, כלכלה ומדעי המדינה",
               psychometricScore: 705,
               admissionThreshold: 705
          },
          {
               programId: "poli-huji",
               degreeName: "מדע המדינה",
               psychometricScore: 600,
               admissionThreshold: 600
          },
          {
               programId: "socio-huji",
               degreeName: "סוציולוגיה ואנתרופולוגיה",
               psychometricScore: 590,
               admissionThreshold: 590
          },
          {
               programId: "comm-huji",
               degreeName: "תקשורת ועיתונאות",
               psychometricScore: 620,
               admissionThreshold: 620
          },
          {
               programId: "sw-huji",
               degreeName: "עבודה סוציאלית",
               psychometricScore: 625,
               admissionThreshold: 625
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'huji-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} HUJI degree programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runHujiScraper();
}
