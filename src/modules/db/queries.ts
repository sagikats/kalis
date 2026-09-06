/**
 * Specialized Aggregation & Analytical Queries for Admission Intelligence
 * Subagent 1: Architecture & Database Design
 */

import { dbRepository } from './repository';
import { AcademicProgramRecord } from './schema';

export interface AdmissionDistributionStats {
	institutionId: string;
	totalPrograms: number;
	minSekem: number;
	maxSekem: number;
	averageSekem: number;
	directBagrutCount: number;
	engineeringCount: number;
}

/**
 * Retrieves all programs officially eligible for Direct Bagrut Admission (zero psychometric)
 */
export function getDirectAdmissionPrograms(institutionId?: string): AcademicProgramRecord[] {
	const searchRes = dbRepository.searchPrograms({
		institutionId,
		directBagrutOnly: true,
		limit: 100
	});
	return searchRes.programs;
}

/**
 * Retrieves STEM / Engineering programs requiring enhanced mathematics or physics
 */
export function getSTEMPrograms(institutionId?: string): AcademicProgramRecord[] {
	const searchRes = dbRepository.searchPrograms({
		institutionId,
		limit: 100
	});
	return searchRes.programs.filter((p) => p.relevantSekemType === 'engineering' || p.relevantSekemType === 'technion');
}

/**
 * Generates statistical cutoff distribution for an institution
 */
export function getInstitutionDistributionStats(institutionId: string): AdmissionDistributionStats | null {
	const programs = dbRepository.getProgramsByInstitution(institutionId);
	if (programs.length === 0) return null;

	let minSekem = Infinity;
	let maxSekem = -Infinity;
	let totalSekem = 0;
	let directBagrutCount = 0;
	let engineeringCount = 0;

	for (const p of programs) {
		if (p.minSekemThreshold < minSekem) minSekem = p.minSekemThreshold;
		if (p.minSekemThreshold > maxSekem) maxSekem = p.minSekemThreshold;
		totalSekem += p.minSekemThreshold;
		if (p.directBagrutEligible) directBagrutCount++;
		if (p.relevantSekemType === 'engineering' || p.relevantSekemType === 'technion') {
			engineeringCount++;
		}
	}

	return {
		institutionId,
		totalPrograms: programs.length,
		minSekem: minSekem === Infinity ? 0 : minSekem,
		maxSekem: maxSekem === -Infinity ? 0 : maxSekem,
		averageSekem: Math.round((totalSekem / programs.length) * 10) / 10,
		directBagrutCount,
		engineeringCount
	};
}
