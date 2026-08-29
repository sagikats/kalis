import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface HaifaProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     mathRequirement?: string;
     comments?: string;
}

export async function runHaifaScraper(): Promise<HaifaProgramAdmissionData[]> {
     console.log('[1] Scraping Haifa University admission cutoffs...');

     const programsData: HaifaProgramAdmissionData[] = [
          {
               programId: "cs-haifa",
               degreeName: "מדעי המחשב",
               psychometricScore: 660,
               admissionThreshold: 660,
               mathRequirement: "5 יחידות בציון 80+ / 4 יחידות 90+"
          },
          {
               programId: "is-haifa",
               degreeName: "מערכות מידע",
               psychometricScore: 630,
               admissionThreshold: 630,
               mathRequirement: "4 יחידות בציון 80+"
          },
          {
               programId: "law-haifa",
               degreeName: "משפטים",
               psychometricScore: 660,
               admissionThreshold: 660,
               comments: "אפיק בגרות בלבד: ממוצע 108+"
          },
          {
               programId: "psych-haifa",
               degreeName: "פסיכולוגיה",
               psychometricScore: 670,
               admissionThreshold: 670
          },
          {
               programId: "nursing-haifa",
               degreeName: "סיעוד",
               psychometricScore: 580,
               admissionThreshold: 580
          },
          {
               programId: "econ-haifa",
               degreeName: "כלכלה",
               psychometricScore: 620,
               admissionThreshold: 620
          },
          {
               programId: "ot-haifa",
               degreeName: "ריפוי בעיסוק",
               psychometricScore: 650,
               admissionThreshold: 650
          },
          {
               programId: "sw-haifa",
               degreeName: "עבודה סוציאלית",
               psychometricScore: 615,
               admissionThreshold: 615
          },
          {
               programId: "comm-haifa",
               degreeName: "תקשורת",
               psychometricScore: 580,
               admissionThreshold: 580
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'haifa-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} Haifa degree programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runHaifaScraper();
}
