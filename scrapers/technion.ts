/**
 * Technion Admission Thresholds Scraper
 * Source: https://admissions.technion.ac.il/sechem-for-admission/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%94%D7%9C%D7%99%D7%9E%D7%95%D7%93-%D7%9C%D7%A4%D7%99-%D7%90%D7%A4%D7%99%D7%A7%D7%99-%D7%94%D7%A7%D7%91%D7%9C%D7%94/
 */

import fs from 'fs';
import path from 'path';

export interface TechnionProgram {
     programId: string;
     degreeName: string;
     sekemScore: number;
     excellenceSekemScore?: number;
     mathRequirement?: string;
     englishRequirement?: string;
     registrationStatus?: string;
     comments?: string;
}

export function loadTechnionPrograms(): TechnionProgram[] {
     const jsonPath = path.join(__dirname, 'technion-programs.json');
     if (!fs.existsSync(jsonPath)) {
          throw new Error(`Technion programs JSON not found at ${jsonPath}`);
     }
     const raw = fs.readFileSync(jsonPath, 'utf-8');
     return JSON.parse(raw);
}

if (require.main === module) {
     const programs = loadTechnionPrograms();
     console.log(`Loaded ${programs.length} official Technion degree programs with Sekem thresholds.`);
}
