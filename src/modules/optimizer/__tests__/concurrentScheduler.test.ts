/**
 * Concurrent & Interleaved Study Roadmap Engine Tests
 * Subagent 2: Optimization, Scheduling & Recommendation Engine
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateConcurrentSchedulePlan } from '../calendarScheduler';

describe('Concurrent & Interleaved Study Roadmap Engine', () => {
	test('1. Single exam (Psychometric only) -> strictly sequential, no concurrency', () => {
		const plan = generateConcurrentSchedulePlan({
			trackId: 'track-psych-only',
			availableWeeklyHours: 16,
			targetPsychometric: 710,
			currentPsychometric: 650,
			subjectLevers: []
		});

		assert.strictEqual(plan.hasConcurrency, false);
		assert.strictEqual(plan.totalWeeks, 12);
		assert.strictEqual(plan.phases.length, 3);
		// All phases have 1 stream and 16 weekly hours
		for (const phase of plan.phases) {
			assert.strictEqual(phase.isConcurrent, false);
			assert.strictEqual(phase.totalWeeklyHours, 16);
			assert.strictEqual(phase.streams.length, 1);
			assert.strictEqual(phase.streams[0].subjectName, 'פסיכומטרי');
		}
	});

	test('2. Single exam (1 Bagrut only) -> strictly sequential, no concurrency', () => {
		const plan = generateConcurrentSchedulePlan({
			trackId: 'track-bagrut-only',
			availableWeeklyHours: 15,
			subjectLevers: [
				{
					subjectName: 'תנ״ך',
					currentGrade: 70,
					currentUnits: 2,
					targetGrade: 92,
					targetUnits: 2
				}
			]
		});

		assert.strictEqual(plan.hasConcurrency, false);
		assert.strictEqual(plan.totalWeeks, 6);
		assert.strictEqual(plan.phases.length, 1);
		assert.strictEqual(plan.phases[0].isConcurrent, false);
		assert.strictEqual(plan.phases[0].totalWeeklyHours, 15);
		assert.strictEqual(plan.phases[0].streams[0].subjectName, 'תנ״ך');
	});

	test('3. Combined Track: Psychometric + 2 Core Bagruts (User Exact Scenario: Tanach Month 1, History Month 2, Month 3 Psychometric Marathon)', () => {
		const plan = generateConcurrentSchedulePlan({
			trackId: 'track-balanced-user-case',
			availableWeeklyHours: 16,
			targetPsychometric: 720,
			currentPsychometric: 660,
			subjectLevers: [
				{
					subjectName: 'תנ״ך',
					currentGrade: 72,
					currentUnits: 2,
					targetGrade: 90,
					targetUnits: 2,
					session: 'winter'
				},
				{
					subjectName: 'היסטוריה',
					currentGrade: 68,
					currentUnits: 2,
					targetGrade: 88,
					targetUnits: 2,
					session: 'winter'
				}
			],
			psychSectionsLabel: 'הפרק הכמותי ופרק האנגלית'
		});

		assert.strictEqual(plan.hasConcurrency, true);
		assert.strictEqual(plan.totalWeeks, 12);
		assert.strictEqual(plan.phases.length, 3);

		// Phase 1 (Weeks 1-4, Month 1): Psychometric + Tanach in parallel
		const p1 = plan.phases[0];
		assert.strictEqual(p1.isConcurrent, true);
		assert.strictEqual(p1.timing, 'שבועות 1–4 (חודש ראשון)');
		assert.strictEqual(p1.streams.length, 2);
		assert.strictEqual(p1.streams[0].subjectName, 'פסיכומטרי');
		assert.strictEqual(p1.streams[1].subjectName, 'תנ״ך');
		// Weekly hours sum to exactly 16
		assert.strictEqual(p1.streams[0].weeklyHours + p1.streams[1].weeklyHours, 16);
		assert.ok(p1.milestoneAtEnd?.title.includes('תנ״ך'));

		// Phase 2 (Weeks 5-8, Month 2): Psychometric + History in parallel
		const p2 = plan.phases[1];
		assert.strictEqual(p2.isConcurrent, true);
		assert.strictEqual(p2.timing, 'שבועות 5–8 (חודש שני)');
		assert.strictEqual(p2.streams.length, 2);
		assert.strictEqual(p2.streams[0].subjectName, 'פסיכומטרי');
		assert.strictEqual(p2.streams[1].subjectName, 'היסטוריה');
		assert.strictEqual(p2.streams[0].weeklyHours + p2.streams[1].weeklyHours, 16);
		assert.ok(p2.milestoneAtEnd?.title.includes('היסטוריה'));

		// Phase 3 (Weeks 9-12, Month 3): 100% Psychometric Simulation Marathon (Zero Bagrut!)
		const p3 = plan.phases[2];
		assert.strictEqual(p3.isConcurrent, false);
		assert.strictEqual(p3.timing, 'שבועות 9–12 (חודש שלישי)');
		assert.strictEqual(p3.streams.length, 1);
		assert.strictEqual(p3.streams[0].subjectName, 'פסיכומטרי');
		assert.strictEqual(p3.streams[0].weeklyHours, 16); // 100% of study budget!
		assert.ok(p3.milestoneAtEnd?.title.includes('פסיכומטרית'));
	});

	test('4. Hours capacity restriction: When available hours < 12, fall back to sequential to avoid sub-critical hours', () => {
		const plan = generateConcurrentSchedulePlan({
			trackId: 'track-limited-hours',
			availableWeeklyHours: 10,
			targetPsychometric: 680,
			currentPsychometric: 620,
			subjectLevers: [
				{
					subjectName: 'אזרחות',
					currentGrade: 75,
					currentUnits: 2,
					targetGrade: 90,
					targetUnits: 2
				}
			]
		});

		assert.strictEqual(plan.hasConcurrency, false);
		// Phases should be strictly sequential
		for (const phase of plan.phases) {
			assert.strictEqual(phase.isConcurrent, false);
		}
	});

	test('5. Direct Bagrut (0 Psychometric, multiple bagruts) generates phased milestones', () => {
		const plan = generateConcurrentSchedulePlan({
			trackId: 'track-direct-bagrut',
			availableWeeklyHours: 16,
			subjectLevers: [
				{
					subjectName: 'תנ״ך',
					currentGrade: 70,
					currentUnits: 2,
					targetGrade: 90,
					targetUnits: 2,
					session: 'winter'
				},
				{
					subjectName: 'היסטוריה',
					currentGrade: 72,
					currentUnits: 2,
					targetGrade: 92,
					targetUnits: 2,
					session: 'winter'
				}
			]
		});

		assert.strictEqual(plan.hasConcurrency, false);
		assert.strictEqual(plan.phases.length, 2);
		assert.strictEqual(plan.milestones.length, 2);
	});
});
