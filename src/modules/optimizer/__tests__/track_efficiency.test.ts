/**
 * Automated Verification Test Suite for Track Efficiency & Minimum Effort Benchmark
 * Subagent 2: Optimizer & Recommendation Engine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	calculatePsychometricEffortHours,
	calculateSubjectLeverEffortHours,
	BASE_EFFORT_HOURS,
	getVerbalReasoningMultiplier,
	getEnglishExemptionMultiplier
} from '../efficiency/effortCostModel';
import {
	pruneRedundantLeversWithMicroImprovement,
	MICRO_IMPROVEMENT_LIMITS
} from '../efficiency/microImprovementPruner';
import { BENCHMARK_ARCHETYPES } from '../efficiency/archetypes';
import { benchmarkArchetype, evaluateTrackEfficiency } from '../efficiency/efficiencyBenchmarker';
import { generateOptimizedActionTracks } from '../trackEngine';
import type { UserAcademicProfileRecord, SubjectGradeRecord } from '../../db/schema';

describe('Track Efficiency & Minimum Effort Benchmark Suite', () => {
	// ---------------------------------------------------------------------------
	// 1. Calibrated Effort Cost Model Tests
	// ---------------------------------------------------------------------------
	describe('1. Calibrated Effort Cost Model', () => {
		it('enforces psychometric attempt hours: 1st attempt = 220h, 2nd = 75%, 3rd+ = 50%', () => {
			const dummyProfile = {
				userId: 'u1',
				bagrutAverage: 100,
				bagrutSubjects: [],
				mathUnits: 4,
				mathGrade: 80,
				physicsUnits: 0,
				physicsGrade: 0,
				psychometricGeneral: 600,
				psychometricQuant: 120,
				psychometricVerbal: 120,
				psychometricEnglish: 120,
				hasTakenPsychometric: true,
				updatedAt: new Date()
			};

			// 1st attempt (never taken)
			const neverProfile = { ...dummyProfile, hasTakenPsychometric: false, psychometricGeneral: 0 };
			const neverPref = {
				userId: 'u1',
				psychExperience: 'never' as const,
				psychFeeling: 'neutral' as const,
				psychStrongestSection: 'balanced' as const,
				learningOrientation: 'flexible' as const,
				learningStrength: 'analytical_quick' as const,
				weeklyAvailabilityHours: 'part_15_25' as const,
				targetTimeline: 'flexible' as const,
				updatedAt: new Date()
			};
			const res1st = calculatePsychometricEffortHours(650, neverProfile, neverPref);
			assert.equal(res1st.baseHours, 220, '1st attempt base hours must be 220h');

			// 2nd attempt (once) - user rule: exactly 75% of 1st
			const oncePref = { ...neverPref, psychExperience: 'once' as const };
			const res2nd = calculatePsychometricEffortHours(650, dummyProfile, oncePref);
			assert.equal(res2nd.baseHours, 165, '2nd attempt base hours must be 165h (75% of 220h)');
			assert.equal(res2nd.experienceMultiplier, 0.75);

			// 3rd+ attempt (multiple) - user rule: exactly 50% of 1st
			const multiPref = { ...neverPref, psychExperience: 'multiple' as const };
			const res3rd = calculatePsychometricEffortHours(650, dummyProfile, multiPref);
			assert.equal(res3rd.baseHours, 110, '3rd+ attempt base hours must be 110h (50% of 220h)');
			assert.equal(res3rd.experienceMultiplier, 0.50);
		});

		it('applies verbal reasoning excellence bonus (130+) as a general learning speedup', () => {
			const highVerbalProfile = {
				userId: 'u2',
				bagrutAverage: 100,
				bagrutSubjects: [],
				mathUnits: 4,
				mathGrade: 80,
				physicsUnits: 0,
				physicsGrade: 0,
				psychometricGeneral: 650,
				psychometricQuant: 115,
				psychometricVerbal: 135, // High verbal reasoning
				psychometricEnglish: 125,
				hasTakenPsychometric: true,
				updatedAt: new Date()
			};

			const pref = {
				userId: 'u2',
				psychExperience: 'once' as const,
				psychFeeling: 'high_potential' as const,
				psychStrongestSection: 'verbal' as const,
				learningOrientation: 'humanities' as const,
				learningStrength: 'memory_retention' as const,
				weeklyAvailabilityHours: 'part_15_25' as const,
				targetTimeline: 'flexible' as const,
				updatedAt: new Date()
			};

			const multiplier = getVerbalReasoningMultiplier(highVerbalProfile, pref);
			assert.equal(multiplier, 0.85, 'Verbal score 130+ must grant 0.85 multiplier');
		});

		it('applies English exemption bonus (134+) eliminating English prep friction', () => {
			const highEnglishProfile = {
				userId: 'u3',
				bagrutAverage: 100,
				bagrutSubjects: [],
				mathUnits: 4,
				mathGrade: 80,
				physicsUnits: 0,
				physicsGrade: 0,
				psychometricGeneral: 660,
				psychometricQuant: 125,
				psychometricVerbal: 125,
				psychometricEnglish: 140, // Full exemption (Ptor)
				hasTakenPsychometric: true,
				updatedAt: new Date()
			};

			const pref = {
				userId: 'u3',
				psychExperience: 'once' as const,
				psychFeeling: 'high_potential' as const,
				psychStrongestSection: 'english' as const,
				learningOrientation: 'flexible' as const,
				learningStrength: 'analytical_quick' as const,
				weeklyAvailabilityHours: 'part_15_25' as const,
				targetTimeline: 'flexible' as const,
				updatedAt: new Date()
			};

			const multiplier = getEnglishExemptionMultiplier(highEnglishProfile, pref);
			assert.equal(multiplier, 0.85, 'English score 134+ must grant 0.85 multiplier');
		});
	});

	// ---------------------------------------------------------------------------
	// 2. Micro-Improvement Redundancy Pruning Tests
	// ---------------------------------------------------------------------------
	describe('2. Micro-Improvement Redundancy Pruner', () => {
		it('prunes an extra exam if a micro-improvement (<= 3 pts on 5u, <= 7 on psych) closes the gap', () => {
			const sub = (subjectName: string, units: number, grade: number, isMandatory = true): SubjectGradeRecord => ({
				id: `sub_${subjectName}`,
				profileId: 'u_prune',
				subjectName,
				units,
				grade,
				isMandatory
			});

			const profile: UserAcademicProfileRecord = {
				userId: 'u_prune',
				estimatedBagrutAverage: 102.5,
				bagrutSubjects: [
					sub('מתמטיקה', 5, 86, true),
					sub('אנגלית', 5, 90, true),
					sub('תנ״ך', 2, 82, true),
					sub('ספרות', 2, 80, true),
					sub('היסטוריה', 2, 82, true),
					sub('אזרחות', 2, 84, true),
					sub('הבעה', 2, 84, true)
				],
				mathUnits: 5,
				mathGrade: 86,
				physicsUnits: 0,
				physicsGrade: 0,
				psychometricGeneral: 630,
				psychometricQuant: 130,
				psychometricVerbal: 120,
				psychometricEnglish: 130,
				hasTakenPsychometric: true,
				updatedAt: new Date()
			};

			// Levers: Math 5u boost to 90 + extra History 2u to 92
			const levers = [
				{
					id: 'math_5u_boost',
					subjectName: 'מתמטיקה',
					currentGrade: 86,
					currentUnits: 5,
					targetGrade: 90,
					targetUnits: 5,
					priority: 1,
					reason: 'Math boost',
					isMath: true,
					utilityScore: 95,
					leverType: 'bagrut_core' as const
				},
				{
					id: 'history_2u',
					subjectName: 'היסטוריה',
					currentGrade: 82,
					currentUnits: 2,
					targetGrade: 92,
					targetUnits: 2,
					priority: 2,
					reason: 'Extra history exam',
					utilityScore: 80,
					leverType: 'bagrut_core' as const
				}
			];

			// BGU threshold: 658 (between Math 90 alone at 656 and Math 93 with micro-bump at 660)
			const pruneResult = pruneRedundantLeversWithMicroImprovement(
				'bgu',
				'general',
				658,
				profile,
				levers
			);

			// History must be pruned if bumping Math by <= 3 pts closes the gap alone
			assert.ok(pruneResult.didPrune, 'Micro-improvement pruner must prune the extra history exam');
			assert.ok(
				pruneResult.prunedLevers.some((p) => p.subjectName.includes('היסטוריה')),
				'History should be identified as redundant'
			);
			assert.ok(
				pruneResult.survivingLevers.some((s) => s.subjectName.includes('מתמטיקה')),
				'Math must survive with the micro-bump'
			);
		});
	});

	// ---------------------------------------------------------------------------
	// 3. Huge Gap: Long-Term Phased Track + Mechina Recommendation
	// ---------------------------------------------------------------------------
	describe('3. Huge Gap Management (Archetype A8)', () => {
		it('generates both a 36-44 week Long-Term track AND recommends Mechina when gap is huge', () => {
			const a8 = BENCHMARK_ARCHETYPES.find((a) => a.id === 'A8_huge_gap_long_term')!;
			const solution = generateOptimizedActionTracks(a8.targetProgram, a8.profile, a8.preferences);

			// Must recommend Mechina
			assert.equal(solution.mechinaAvailable, true, 'Huge gap candidate must have mechinaAvailable: true');
			assert.ok(solution.mechinaReason, 'Mechina reason must be provided');

			// Must generate Long-Term Track
			const longTermTrack = solution.tracks.find((t) => t.id === 'track-long-term');
			assert.ok(longTermTrack, 'Must generate track-long-term for huge gap');
			assert.ok(longTermTrack!.estimatedWeeks >= 36, 'Long-term track must span at least 36 weeks');
			assert.ok(
				longTermTrack!.badge.includes('שנתי מדורג') || longTermTrack!.badge.includes('פער רחב'),
				'Track badge must reflect multi-phase annual plan'
			);

			// Milestones must include phased sessions
			assert.ok(longTermTrack!.milestones.length >= 3, 'Long-term track must have phased milestones');
		});
	});

	// ---------------------------------------------------------------------------
	// 4. Comprehensive 12 Archetypes Audit
	// ---------------------------------------------------------------------------
	describe('4. Full Audit Across All 12 Benchmark Archetypes', () => {
		for (const archetype of BENCHMARK_ARCHETYPES) {
			it(`Archetype ${archetype.id}: ${archetype.name} meets efficiency criteria`, () => {
				const auditResult = benchmarkArchetype(archetype);
				assert.equal(
					auditResult.failures.length,
					0,
					`Archetype ${archetype.id} failed criteria: ${auditResult.failures.join('; ')}`
				);

				// Verify tracks are non-empty and well formed
				assert.ok(auditResult.reports.length >= 2, 'Must have at least 2 tracks evaluated');
				for (const report of auditResult.reports) {
					assert.ok(report.totalEffortHours > 0, 'Track effort hours must be > 0');
					assert.ok(report.efficiencyIndex >= 0, 'Efficiency index must be non-negative');
					assert.equal(report.meetsReachabilityBounds, true, 'Must adhere to reachability bounds');
				}
			});
		}
	});
});
