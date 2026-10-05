/**
 * The track rules agreed with the user (docs/TRACKS_REDESIGN.md):
 * - Step 0: unmet official bagrut conditions are raised to the required level in every track.
 * - Tested applicants: track 1 is psychometric only when ≤100 points are needed, otherwise psychometric + one bagrut.
 * - Tracks 2 and 3 each lower the psychometric target by 10+ points; track 2 adds up to 2 exams, track 3 reaches up to 6.
 * - Untested applicants: track 1 is psychometric only.
 * - Physics with a course / mechina alternative: the physics bagrut is in every track, with a note that it saves the course.
 * - Every track reaches the threshold in the institution's own calculator.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { generatePersonalizedTracks, RecommendedTrack } from '../../../utils/analysis/trackGenerator';
import { isSubjectMatch } from '../solver';

const CALC: Record<string, string> = {
	'inst-48': 'technion', 'inst-6': 'tau', 'inst-1': 'huji', 'inst-3': 'bgu',
	'inst-5': 'haifa', 'inst-2': 'ariel', 'inst-4': 'bar_ilan', 'inst-38': 'reichman'
};
const program = (instId: string, id: string) =>
	(academicData as any[]).find((i) => i.id === instId).programs.find((p: any) => p.id === id);

function profile(o: { psych?: number; mathU?: number; mathG?: number; physU?: number; physG?: number; grade?: number } = {}): UserAcademicProfile {
	const g = o.grade ?? 85;
	const subjects = [
		{ name: 'מתמטיקה', units: o.mathU ?? 5, grade: o.mathG ?? g },
		{ name: 'אנגלית', units: 5, grade: g },
		{ name: 'היסטוריה', units: 2, grade: g },
		{ name: 'אזרחות', units: 2, grade: g },
		{ name: 'תנ"ך', units: 2, grade: g },
		{ name: 'ספרות', units: 2, grade: g },
		{ name: 'הבעה עברית', units: 2, grade: g },
		...(o.physU ? [{ name: 'פיזיקה', units: o.physU, grade: o.physG ?? g }] : [{ name: 'ביולוגיה', units: 5, grade: g }])
	];
	return {
		bagrutSubjects: subjects,
		psychometricGeneral: o.psych ?? 0,
		psychometricQuant: 0, psychometricVerbal: 0, psychometricEnglish: 0,
		mathUnits: o.mathU ?? 5, mathGrade: o.mathG ?? g,
		physicsUnits: o.physU ?? 0, physicsGrade: o.physU ? o.physG ?? g : 0
	} as UserAcademicProfile;
}

function tracksFor(instId: string, prog: any, p: UserAcademicProfile) {
	const res = calculateMultiInstitutionSekem(p as any, [CALC[instId]])[0];
	const a = analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId: CALC[instId], program: prog }, p, res);
	return { a, tracks: generatePersonalizedTracks(a, p, res) };
}

const exams = (t: RecommendedTrack) => t.recommendedSubjectImprovements.length;
const hasSubject = (t: RecommendedTrack, name: string) => t.recommendedSubjectImprovements.some((l) => isSubjectMatch(l.subjectName, name));

/** The invariants every set of tracks must satisfy. */
function checkInvariants(tracks: RecommendedTrack[], a: ReturnType<typeof analyzeProgramGap>, p: UserAcademicProfile, label: string) {
	assert.ok(tracks.length <= 3, `${label}: ${tracks.length} tracks`);
	for (const t of tracks) {
		assert.ok((t.targetSekem ?? 0) >= (a.threshold ?? 0) - 0.05, `${label} ${t.id}: sekem ${t.targetSekem} < ${a.threshold}`);
		if (p.psychometricGeneral) assert.ok((t.targetPsychometric ?? 0) >= p.psychometricGeneral, `${label} ${t.id}: target below the current psychometric`);
		assert.ok(exams(t) <= 6, `${label} ${t.id}: ${exams(t)} exams`);
		assert.ok(!/%\)|מובטח/.test(`${t.strategyDescription} ${t.feasibilityExplanation}`), `${label} ${t.id}: invented probability / guarantee`);
	}
	for (let i = 1; i < tracks.length; i++) {
		assert.ok(tracks[i].targetPsychometric! <= tracks[i - 1].targetPsychometric! - 10,
			`${label}: track ${i + 1} (${tracks[i].targetPsychometric}) is not 10+ below track ${i} (${tracks[i - 1].targetPsychometric})`);
	}
	const t1 = tracks.find((t) => t.id === 'track-fast');
	const t2 = tracks.find((t) => t.id === 'track-balanced');
	if (t1 && t2) assert.ok(exams(t2) - exams(t1) <= 2, `${label}: track 2 adds ${exams(t2) - exams(t1)} exams`);
}

describe('Track rules (docs/TRACKS_REDESIGN.md)', () => {
	it('invariants hold across programs of all 8 universities, tested and untested applicants', () => {
		let checked = 0;
		let withThree = 0;
		const profiles = [profile({ psych: 600, grade: 82 }), profile({ psych: 540, grade: 75, mathU: 4 }), profile({ grade: 88 }), profile({ psych: 680, grade: 90, physU: 5 })];
		for (const instId of Object.keys(CALC)) {
			const progs = (academicData as any[]).find((i) => i.id === instId).programs.filter((x: any) => !x.notOffered && x.admissionThreshold);
			for (const prog of progs.filter((_: any, i: number) => i % Math.ceil(progs.length / 5) === 0)) {
				for (const p of profiles) {
					const { a, tracks } = tracksFor(instId, prog, p);
					checkInvariants(tracks, a, p, `${instId} ${prog.id} psych=${p.psychometricGeneral}`);
					checked++;
					if (tracks.length === 3) withThree++;
				}
			}
		}
		assert.ok(checked > 100, `checked ${checked}`);
		assert.ok(withThree > 5, `only ${withThree} cases with 3 tracks`);
	});

	it('tested, ≤100 points needed: track 1 is psychometric only', () => {
		const prog = program('inst-6', 'prog-tau-0542-64'); // mechanical engineering, threshold 636
		const p = profile({ psych: 600, grade: 85, physU: 5 });
		const { tracks } = tracksFor('inst-6', prog, p);
		const t1 = tracks.find((t) => t.id === 'track-fast')!;
		assert.ok(t1, 'track 1 exists');
		assert.ok(t1.targetPsychometric! - 600 <= 100);
		assert.equal(exams(t1), 0, t1.recommendedSubjectImprovements.map((l) => l.subjectName).join());
	});

	it('tested, more than 100 points needed: track 1 is psychometric + exactly one bagrut', () => {
		const prog = program('inst-6', 'prog-tau-0512-74'); // electrical engineering, threshold 710
		const p = profile({ psych: 560, grade: 80, physU: 5 });
		const { tracks } = tracksFor('inst-6', prog, p);
		const t1 = tracks.find((t) => t.id === 'track-fast')!;
		assert.ok(t1, 'track 1 exists');
		assert.equal(exams(t1), 1);
		assert.match(t1.title, /בגרות אחת/);
	});

	it('untested: track 1 is psychometric only (no bagrut), never below the official minimum', () => {
		const prog = program('inst-6', 'prog-tau-0512-74'); // official minimum psychometric 660
		const p = profile({ grade: 85, physU: 5 });
		const { tracks } = tracksFor('inst-6', prog, p);
		const t1 = tracks.find((t) => t.id === 'track-fast')!;
		assert.equal(exams(t1), 0);
		for (const t of tracks) assert.ok(t.targetPsychometric! >= 660, `${t.id} ${t.targetPsychometric}`);
	});

	it('an unmet official bagrut condition (math 5u 85+) is in every track', () => {
		const prog = program('inst-3', 'prog-bgu-155');
		const p = profile({ psych: 620, grade: 85, mathU: 4, mathG: 90, physU: 5 });
		const { tracks } = tracksFor('inst-3', prog, p);
		assert.ok(tracks.length > 0);
		for (const t of tracks) {
			const math = t.recommendedSubjectImprovements.find((l) => isSubjectMatch(l.subjectName, 'מתמטיקה'));
			assert.ok(math && math.targetUnits === 5 && math.targetGrade >= 85, `${t.id}: ${JSON.stringify(math)}`);
		}
	});

	it('physics with a summer-course alternative (Bar-Ilan EE): the physics bagrut is in every track, and says what it saves', () => {
		const prog = program('inst-4', 'prog-inst-4-15');
		const p = profile({ psych: 600, grade: 85 });
		const { a, tracks } = tracksFor('inst-4', prog, p);
		assert.notEqual(a.status, 'accepted');
		assert.ok(tracks.length > 0);
		for (const t of tracks) {
			assert.ok(hasSubject(t, 'פיזיקה'), t.id);
			const phys = t.recommendedSubjectImprovements.find((l) => isSubjectMatch(l.subjectName, 'פיזיקה'))!;
			assert.equal(phys.targetUnits, 5);
			assert.ok(phys.targetGrade >= 80);
			assert.match(phys.reason, /חוסכת/);
		}
	});

	it('score already passes, only a psychometric section is missing (BGU medicine, English 110): one "השלמת תנאי סף" track', () => {
		const p = { ...profile({ psych: 720, grade: 95, physU: 5 }), psychometricQuant: 140, psychometricVerbal: 130, psychometricEnglish: 110 } as UserAcademicProfile;
		const res = { ...calculateMultiInstitutionSekem(p as any, ['bgu'])[0], generalSekem: 790 };
		const a = analyzeProgramGap({ institutionId: 'inst-3', institutionName: '', calculatorId: 'bgu', program: program('inst-3', 'prog-bgu-180') }, p, res);
		assert.equal(a.status, 'missing_requirement');
		const tracks = generatePersonalizedTracks(a, p, res);
		assert.equal(tracks.length, 1);
		assert.match(tracks[0].title, /השלמת תנאי סף/);
	});

	it('a condition that combines bagrut with a psychometric section (Bar-Ilan EE: math 5u 75 + quant 130) raises the bagrut part', () => {
		const prog = program('inst-4', 'prog-inst-4-15');
		const p = profile({ grade: 75, mathU: 4 });
		const { tracks } = tracksFor('inst-4', prog, p);
		assert.ok(tracks.length > 0, 'tracks exist');
		for (const t of tracks) {
			const math = t.recommendedSubjectImprovements.find((l) => isSubjectMatch(l.subjectName, 'מתמטיקה'));
			assert.ok(math && math.targetUnits === 5 && math.targetGrade >= 75, `${t.id}: ${JSON.stringify(math)}`);
			assert.ok(hasSubject(t, 'פיזיקה'), t.id);
		}
	});

	it('achieving a track makes the applicant pass in the regular admission analysis', () => {
		let checked = 0;
		const profiles = [profile({ grade: 75, mathU: 4 }), profile({ psych: 560, grade: 85 }), profile({ psych: 620, grade: 90, physU: 5 })];
		for (const instId of Object.keys(CALC)) {
			const progs = (academicData as any[]).find((i) => i.id === instId).programs.filter((x: any) => !x.notOffered && x.admissionThreshold);
			for (const prog of progs.filter((_: any, i: number) => i % Math.ceil(progs.length / 6) === 0)) {
				for (const p of profiles) {
					const { tracks } = tracksFor(instId, prog, p);
					for (const t of tracks) {
						const subjects = p.bagrutSubjects.map((s) => ({ ...s }));
						for (const l of t.recommendedSubjectImprovements) {
							const i = subjects.findIndex((s) => isSubjectMatch(s.name, l.subjectName));
							if (i >= 0) subjects[i] = { ...subjects[i], units: l.targetUnits, grade: l.targetGrade };
							else subjects.push({ name: l.subjectName, units: l.targetUnits, grade: l.targetGrade });
						}
						const math = subjects.find((s) => isSubjectMatch(s.name, 'מתמטיקה'))!;
						const phys = subjects.find((s) => isSubjectMatch(s.name, 'פיזיקה'));
						const after = { ...p, bagrutSubjects: subjects, psychometricGeneral: t.targetPsychometric!, mathUnits: math.units, mathGrade: math.grade, physicsUnits: phys?.units ?? 0, physicsGrade: phys?.grade ?? 0 } as UserAcademicProfile;
						const res = calculateMultiInstitutionSekem(after as any, [CALC[instId]])[0];
						const a = analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId: CALC[instId], program: prog }, after, res);
						assert.ok(['accepted', 'screening'].includes(a.status), `${instId} ${prog.id} ${t.id}: ${a.status} ${a.userSekem}/${a.threshold} ${a.admissionNote ?? ''}`);
						checked++;
					}
				}
			}
		}
		assert.ok(checked > 50, `checked ${checked}`);
	});

	it('the questionnaire is not an input any more', () => {
		assert.equal(generatePersonalizedTracks.length, 3);
	});
});
