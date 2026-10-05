/**
 * Medicine is screened at every Israeli university: meeting the threshold invites to MOR / interviews, it is never an
 * admission. Pinned to src/data/sources/medicine-admission-2026-10-05.json (official pages, 2026-10-05).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { generatePersonalizedTracks } from '../../../utils/analysis/trackGenerator';

const UNIVERSITIES: Record<string, string> = {
	'inst-48': 'technion', 'inst-6': 'tau', 'inst-1': 'huji', 'inst-3': 'bgu',
	'inst-5': 'haifa', 'inst-2': 'ariel', 'inst-4': 'bar_ilan', 'inst-38': 'reichman'
};
const program = (instId: string, id: string) =>
	(academicData as any[]).find((i) => i.id === instId).programs.find((p: any) => p.id === id);

function profile(over: Partial<UserAcademicProfile> & { math?: [number, number] } = {}): UserAcademicProfile {
	const [mu, mg] = over.math ?? [5, 95];
	return {
		bagrutSubjects: [
			{ name: 'מתמטיקה', units: mu, grade: mg }, { name: 'אנגלית', units: 5, grade: 95 }, { name: 'פיזיקה', units: 5, grade: 95 },
			{ name: 'ביולוגיה', units: 5, grade: 95 }, { name: 'היסטוריה', units: 2, grade: 95 }, { name: 'אזרחות', units: 2, grade: 95 },
			{ name: 'תנ"ך', units: 2, grade: 95 }, { name: 'ספרות', units: 2, grade: 95 }, { name: 'הבעה עברית', units: 2, grade: 95 }
		],
		psychometricGeneral: 740, psychometricQuant: 145, psychometricVerbal: 140, psychometricEnglish: 140,
		mathUnits: mu, mathGrade: mg, physicsUnits: 5, physicsGrade: 95,
		...over
	} as UserAcademicProfile;
}

function analyze(instId: string, id: string, p: UserAcademicProfile, pin?: Record<string, number>) {
	const calc = UNIVERSITIES[instId];
	const res = { ...calculateMultiInstitutionSekem(p as any, [calc])[0], ...(pin ?? {}) };
	return analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId: calc, program: program(instId, id) }, p, res);
}

describe('Medicine: screening, never "accepted"', () => {
	it('every active 6-year medicine / dental program of the 8 universities is modelled as screened', () => {
		const md = /רפואה \(M\.?D\.?\)|\(MD\)|דוקטור ברפואה|דוקטור לרפואת שיניים|רפואת שיניים|מגמת רפואה|רפואה על שם|מדעי הרפואה ו/;
		const found: string[] = [];
		for (const inst of academicData as any[]) {
			if (!UNIVERSITIES[inst.id]) continue;
			for (const p of inst.programs) {
				if (!md.test(p.fieldOfStudy) || p.notOffered) continue;
				found.push(p.id);
				assert.ok(p.admissionRoutes?.screening, `${inst.id} ${p.fieldOfStudy} has no screening`);
			}
		}
		assert.ok(found.length >= 12, `found ${found.length}`);
	});

	it('HUJI medicine above the official threshold (25.186) with psychometric 700+ -> "screening", with the official process', () => {
		const a = analyze('inst-1', 'prog-huji-5', profile(), { quantitativeSekem: 760, generalSekem: 760 });
		assert.equal(a.status, 'screening');
		assert.match(a.admissionNote ?? '', /מו"ר/);
		assert.match(a.admissionNote ?? '', /זו לא קבלה/);
	});

	it('HUJI medicine: below 700 psychometric is a missing condition even above the threshold', () => {
		const a = analyze('inst-1', 'prog-huji-5', profile({ psychometricGeneral: 690 }), { quantitativeSekem: 760, generalSekem: 760 });
		assert.equal(a.status, 'missing_requirement');
	});

	it('HUJI medicine below the threshold -> not accepted, and the note says it is the MOR invitation threshold', () => {
		const a = analyze('inst-1', 'prog-huji-5', profile(), { quantitativeSekem: 650, generalSekem: 650 });
		assert.equal(a.status, 'not_accepted');
		assert.match(a.admissionNote ?? '', /סף הזימון/);
	});

	it('Technion medicine: 92 is the MOR invitation threshold -> "screening"', () => {
		const a = analyze('inst-48', 'prog-inst-48-46', profile(), { engineeringSekem: 95, generalSekem: 95 });
		assert.equal(a.status, 'screening');
	});

	it('Bar-Ilan 6-year track exists: 680+ / average 101+ / math 5u 80+ / English 120+ -> "screening"; psychometric 650 -> not met', () => {
		const p = program('inst-4', 'prog-inst-4-95');
		assert.equal(p.notOffered, undefined);
		assert.equal(analyze('inst-4', 'prog-inst-4-95', profile(), { bagrutAverage: 105 }).status, 'screening');
		const low = analyze('inst-4', 'prog-inst-4-95', profile({ psychometricGeneral: 650 }), { bagrutAverage: 105 });
		assert.equal(low.status, 'not_accepted');
		assert.match(low.admissionNote ?? '', /פסיכומטרי 680/);
		assert.equal(analyze('inst-4', 'prog-inst-4-95', profile(), { bagrutAverage: 100 }).status, 'not_accepted');
		assert.equal(analyze('inst-4', 'prog-inst-4-95', profile({ math: [5, 75] }), { bagrutAverage: 105 }).status, 'not_accepted');
		// Hebrew: 107+ in the verbal section (track page, medicine.biu.ac.il/tracks/8154)
		assert.equal(analyze('inst-4', 'prog-inst-4-95', profile({ psychometricVerbal: 100 }), { bagrutAverage: 105 }).status, 'not_accepted');
	});

	it('Ariel 6-year: psychometric 680, math 4u 80 / 5u 70, English 120; threshold not published', () => {
		assert.equal(program('inst-2', 'prog-inst-2-39').admissionThreshold, null);
		assert.equal(analyze('inst-2', 'prog-inst-2-39', profile()).status, 'screening');
		assert.equal(analyze('inst-2', 'prog-inst-2-39', profile({ psychometricGeneral: 670 })).status, 'not_accepted');
		assert.equal(analyze('inst-2', 'prog-inst-2-39', profile({ psychometricEnglish: 110 })).status, 'not_accepted');
	});

	it('BGU: סכם 735 and psychometric 680 (official degree page) invite to the computerized test; English Advanced B', () => {
		const p = program('inst-3', 'prog-bgu-180');
		assert.equal(p.admissionThreshold, 735);
		assert.equal(p.admissionRoutes.minPsychometric, 680);
		assert.equal(analyze('inst-3', 'prog-bgu-180', profile(), { generalSekem: 760 }).status, 'screening');
		assert.equal(analyze('inst-3', 'prog-bgu-180', profile(), { generalSekem: 720 }).status, 'not_accepted');
		assert.equal(analyze('inst-3', 'prog-bgu-180', profile({ psychometricGeneral: 670 }), { generalSekem: 760 }).status, 'missing_requirement');
		assert.equal(analyze('inst-3', 'prog-bgu-180', profile({ psychometricEnglish: 110 }), { generalSekem: 760 }).status, 'missing_requirement');
	});

	it('Tel Aviv: conditions not verified yet -> "separate admission", never a guessed status', () => {
		for (const id of ['prog-tau-0111-18', 'prog-tau-0102-35', 'prog-tau-0191-83']) {
			const a = analyze('inst-6', id, profile());
			assert.equal(a.status, 'no_threshold');
			assert.match(a.admissionNote ?? '', /טרם אומתו/);
		}
	});

	it('Reichman M.D. is a 4-year program for degree holders -> not offered to high-school graduates', () => {
		assert.match(program('inst-38', 'prog-inst-38-13').notOffered.note, /ארבע-שנתית/);
	});

	it('tracks for medicine never promise admission and end with the screening stage; no tracks without a threshold', () => {
		const p = profile({ psychometricGeneral: 700, psychometricQuant: 130, psychometricVerbal: 130, psychometricEnglish: 130 });
		const res = calculateMultiInstitutionSekem(p as any, ['huji'])[0];
		const a = analyzeProgramGap({ institutionId: 'inst-1', institutionName: 'העברית', calculatorId: 'huji', program: program('inst-1', 'prog-huji-5') }, p, res);
		for (const t of generatePersonalizedTracks(a, p, res)) {
			assert.ok(!JSON.stringify(t).includes('קבלה מובטחת'), t.title);
			assert.match(t.steps[t.steps.length - 1].title, /מו"ר/);
		}
		const ariel = calculateMultiInstitutionSekem(p as any, ['ariel'])[0];
		const b = analyzeProgramGap({ institutionId: 'inst-2', institutionName: 'אריאל', calculatorId: 'ariel', program: program('inst-2', 'prog-inst-2-39') }, p, ariel);
		assert.deepEqual(generatePersonalizedTracks(b, p, ariel), []);
	});
});

describe('Balanced track', () => {
	it('is only offered when it lowers the psychometric target of the fast track', () => {
		let checked = 0;
		const cases: [string, string][] = [['inst-1', 'prog-huji-5'], ['inst-48', 'prog-inst-48-46'], ['inst-6', 'prog-tau-0910-103'], ['inst-3', 'prog-bgu-168']];
		for (const [instId, id] of cases) {
			for (const psych of [580, 616, 650]) {
				const base = profile({ psychometricGeneral: psych, psychometricQuant: 0, psychometricVerbal: 0, psychometricEnglish: 0 });
				const p = { ...base, bagrutSubjects: base.bagrutSubjects.map((s) => (s.name === 'הבעה עברית' ? { ...s, grade: 72 } : s)) };
				const res = calculateMultiInstitutionSekem(p as any, [UNIVERSITIES[instId]])[0];
				const a = analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId: UNIVERSITIES[instId], program: program(instId, id) }, p, res);
				const tracks = generatePersonalizedTracks(a, p, res);
				const fast = tracks.find((t) => t.id === 'track-fast');
				const balanced = tracks.find((t) => t.id === 'track-balanced');
				if (!fast || !balanced || (fast.targetPsychometric ?? 0) <= psych) continue;
				assert.ok((balanced.targetPsychometric ?? 0) < (fast.targetPsychometric ?? 0),
					`${id} @${psych}: balanced ${balanced.targetPsychometric} vs fast ${fast.targetPsychometric}`);
				checked++;
			}
		}
		assert.ok(checked >= 3, `checked ${checked}`);
	});
});
