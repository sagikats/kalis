import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface OpenuProgramAdmissionData {
     programId: string;
     degreeName: string;
     psychometricScore: number;
     admissionThreshold: number;
     comments?: string;
}

export async function runOpenuScraper(): Promise<OpenuProgramAdmissionData[]> {
     console.log('[1] Scraping Open University (האוניברסיטה הפתוחה) admission details...');

     const programsData: OpenuProgramAdmissionData[] = [
          {
               programId: "cs-openu",
               degreeName: "מדעי המחשב",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף פסיכומטרי או בגרות. קיימים אפיקי מעבר לטכניון, העברית, תל אביב ובן גוריון."
          },
          {
               programId: "math-openu",
               degreeName: "מתמטיקה",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          },
          {
               programId: "ds-openu",
               degreeName: "מדע הנתונים",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          },
          {
               programId: "psych-openu",
               degreeName: "פסיכולוגיה",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          },
          {
               programId: "econ-openu",
               degreeName: "כלכלה",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          },
          {
               programId: "biz-openu",
               degreeName: "ניהול / מנהל עסקים",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          },
          {
               programId: "is-openu",
               degreeName: "מערכות מידע",
               psychometricScore: 0,
               admissionThreshold: 0,
               comments: "קבלה פתוחה ללא תנאי סף"
          }
     ];

     const outputDir = path.join(__dirname, 'data');
     if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
     const outputPath = path.join(outputDir, 'openu-programs.json');
     fs.writeFileSync(outputPath, JSON.stringify(programsData, null, 2), 'utf-8');
     console.log(`[2] Saved ${programsData.length} Open University programs to ${outputPath}`);

     return programsData;
}

if (require.main === module) {
     runOpenuScraper();
}
