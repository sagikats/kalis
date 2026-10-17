/**
 * Re-checks the numeric expectations of the legacy test files (all_institutions_benchmarks,
 * institutionalBonusVariance, calculators.test) against the universities' public calculators.
 *
 *   npx tsx scripts/verification/verifyLegacyBenchmarks.ts
 *
 * Prints ours vs official for every case. One request at a time (BGU rate-limits after ~60 calls).
 */
import { bguGeneralSekem, bguQuantSekem, tauScores, sleep } from './officialClients';
import {
	calculateBguGeneralSekem,
	calculateBguQuantitativeSekem,
	calculateTauGeneralSekem,
	calculateTauEngineeringSekem,
	calculateTauManagementSekem
} from '../../src/modules/calculators';

type Row = { file: string; label: string; ours: number; official: number | string };
const rows: Row[] = [];

async function main() {
	// BGU general sekem: GetSekem(bagrut average, psychometric)
	const bguGeneral: [string, number, number, number][] = [
		['all_institutions_benchmarks', 105, 650, 692],
		['institutionalBonusVariance', 109.06, 616, 695],
		['institutionalBonusVariance', 115, 654, 754],
		['institutionalBonusVariance', 112.5, 616, 716],
		['calculators.test', 105, 700, 724]
	];
	for (const [file, avg, psych] of bguGeneral) {
		rows.push({ file, label: `BGU general (${avg}, ${psych})`, ours: calculateBguGeneralSekem(avg, psych), official: await bguGeneralSekem(avg, psych) });
		await sleep(700);
	}

	// BGU quantitative sekem: GetSekemQuantity(Q, V, E, bagrut average)
	const bguQuant: [string, number][] = [
		['all_institutions_benchmarks', 115],
		['institutionalBonusVariance', 112.5],
		['institutionalBonusVariance', 112]
	];
	for (const [file, avg] of bguQuant) {
		rows.push({ file, label: `BGU quantitative (${avg}; Q135 V125 E100)`, ours: calculateBguQuantitativeSekem(avg, 135, 125, 100), official: await bguQuantSekem(avg, 135, 125, 100) });
		await sleep(700);
	}

	// TAU adjustment scores: go.tau.ac.il calculator (bagrut, psychometric, 10-unit science bonus)
	const tau: [string, number, number, boolean][] = [
		['all_institutions_benchmarks', 107, 698, true],
		['all_institutions_benchmarks', 107, 740, true],
		['all_institutions_benchmarks', 107, 698, false],
		['calculators.test', 105, 700, true]
	];
	for (const [file, avg, psych, reali] of tau) {
		const o = await tauScores(avg, psych, reali);
		rows.push({ file, label: `TAU general (${avg}, ${psych})`, ours: calculateTauGeneralSekem(avg, psych), official: o.general });
		rows.push({ file, label: `TAU engineering (${avg}, ${psych}, reali=${reali})`, ours: calculateTauEngineeringSekem(avg, psych, reali), official: o.engineering });
		rows.push({ file, label: `TAU management (${avg}, ${psych})`, ours: calculateTauManagementSekem(avg, psych), official: o.management });
		await sleep(700);
	}

	for (const r of rows) {
		const ok = String(r.ours) === String(r.official) ? '✓' : '✗';
		console.log(`${ok}  ${r.label.padEnd(44)} ours=${String(r.ours).padEnd(8)} official=${r.official}   [${r.file}]`);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
