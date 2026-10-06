/**
 * Runs every official-data import in the order they build on each other, and nothing else.
 *
 *   npx tsx scripts/data/importAll.ts
 *
 * The importers are not independent: a "thresholds" import rewrites admissionRoutes, and later imports add
 * requirements, English rules, routes and the medicine screening model on top. Running one importer alone can drop what
 * a later one added (e.g. importBguThresholds.ts alone removes the BGU English rule). This runner applies them in order;
 * on unchanged sources, a full run leaves src/data/academicData.json byte-identical (checked 2026-10-06).
 */
import { execFileSync } from 'child_process';
import path from 'path';

const ORDER = [
	// Technion
	'importTechnionThresholds', 'importTechnionExcellentBagrut', 'importTechnionMathExam', 'importTechnionGesherHighSchool',
	'importTechnionShortTrack', 'importTechnionPromotion', 'importTechnionRequirements',
	// Tel Aviv
	'importTauThresholds', 'importTauRequirements', 'importTauMinPsychometric', 'importTauPrerequisites',
	// Hebrew University
	'importHujiThresholds', 'importHujiPrerequisites',
	// Ben-Gurion
	'importBguThresholds', 'importBguRequirements', 'importBguEnglishRule',
	// Haifa, Ariel, Bar-Ilan, Reichman
	'importHaifaThresholds', 'importArielThresholds', 'importBarIlanThresholds', 'importReichmanThresholds',
	// Medicine at all universities — last: it owns those programs' routes
	'importMedicine'
];

for (const name of ORDER) {
	console.log(`▶ ${name}`);
	execFileSync('npx', ['tsx', path.join(__dirname, `${name}.ts`)], { stdio: ['ignore', 'ignore', 'inherit'] });
}
console.log('Done. Review the diff of src/data/academicData.json before committing.');
