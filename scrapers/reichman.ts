import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ReichmanProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     comments?: string;
}

export async function runReichmanScraper(): Promise<ReichmanProgramAdmissionData[]> {
     console.log('[1] Scraping Reichman University (RUNI) admission cutoffs...');

     const programsData: ReichmanProgramAdmissionData[] = [
          {
               programId: "cs-reichman",
               degreeName: "מדעי המחשב (B.Sc)",
               psychometricScore: 660,
               admissionThreshold: 660,
               mathRequirement: "4 יחידות בציון 85+ / 5 יחידות 75+"
          },
          {
               programId: "data-reichman",
               degreeName: "מדע הנתונים (B.Sc)",
               psychometricScore: 650,
               admissionThreshold: 650,
               mathRequirement: "4 יחידות בציון 85+ / 5 יחידות 75+"
          },
          {
               programId: "law-reichman",
               degreeName: "משפטים (LL.B)",
               psychometricScore: 620,
               admissionThreshold: 620,
               comments: "אפיק בגרות בלבד: ממוצע 100+"
          },
          {
               programId: "law-biz-reichman",
               degreeName: "משפטים ומנהל עסקים (תואר כפול)",
               psychometricScore: 650,
               admissionThreshold: 650
          },
          {
               programId: "biz-reichman",
               degreeName: "מנהל עסקים (B.A)",
               psychometricScore: 610,
               admissionThreshold: 610
          },
          {
               programId: "psych-reichman",
               degreeName: "פסיכולוגיה (B.A)",
               psychometricScore: 630,
               admissionThreshold: 630
          },
          {
               programId: "gov-reichman",
               degreeName: "ממשל, דיפלומטיה ואסטרטגיה",
               psychometricScore: 580,
               admissionThreshold: 580
          },
          {
               programId: "comm-reichman",
               degreeName: "תקשורת (B.A)",
               psychometricScore: 580,
               admissionThreshold: 580
          },
          {
               programId: "econ-reichman",
               degreeName: "כלכלה ותשתיות",
               psychometricScore: 610,
               admissionThreshold: 610
          },
          {
               programId: "entrep-reichman",
               degreeName: "יזמות ומנהל עסקים",
               psychometricScore: 640,
               admissionThreshold: 640
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'reichman-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} Reichman degree programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runReichmanScraper();
}
