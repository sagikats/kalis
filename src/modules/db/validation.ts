/**
 * Zod Runtime Validation Schemas for Domain Entities & API Payloads
 * Subagent 1: Architecture & Database Design
 */

import { z } from 'zod';

export const SubjectGradeInputSchema = z.object({
	name: z.string().min(1, 'שם המקצוע נדרש'),
	units: z.number().int().min(1).max(5, 'מספר יחידות חייב להיות בין 1 ל-5'),
	grade: z.number().min(0).max(100, 'ציון חייב להיות בין 0 ל-100')
});

export const UserAcademicProfileInputSchema = z.object({
	userId: z.string().optional(),
	bagrutSubjects: z.array(SubjectGradeInputSchema).min(1, 'נדרש לפחות מקצוע בגרות אחד'),
	mathUnits: z.number().int().min(3).max(5).default(4),
	mathGrade: z.number().min(0).max(100).default(80),
	physicsUnits: z.number().int().min(0).max(5).default(0),
	physicsGrade: z.number().min(0).max(100).default(0),
	psychometricGeneral: z.number().int().min(0).max(800).default(0),
	psychometricQuant: z.number().int().min(0).max(150).default(0),
	psychometricVerbal: z.number().int().min(0).max(150).default(0),
	psychometricEnglish: z.number().int().min(0).max(150).default(0),
	hasTakenPsychometric: z.boolean().default(false)
});

export const UserPreferencesInputSchema = z.object({
	psychExperience: z.enum(['never', 'once', 'multiple']).default('never'),
	psychFeeling: z.enum(['high_potential', 'low_confidence', 'neutral']).default('neutral'),
	psychStrongestSection: z.enum(['quant', 'verbal', 'english', 'balanced']).default('balanced'),
	learningOrientation: z.enum(['stem', 'humanities', 'flexible']).default('flexible'),
	learningStrength: z
		.enum(['analytical_quick', 'memory_retention', 'deep_accuracy_no_rush'])
		.default('analytical_quick'),
	weeklyAvailabilityHours: z.enum(['limited_under_15', 'part_15_25', 'full_30_plus']).default('part_15_25'),
	targetTimeline: z.enum(['immediate_october', 'next_year', 'flexible']).default('flexible')
});

export const ProgramSearchQuerySchema = z.object({
	institutionId: z.string().optional(),
	fieldOfStudy: z.string().optional(),
	text: z.string().optional(),
	minThreshold: z.number().optional(),
	maxThreshold: z.number().optional(),
	directBagrutOnly: z.boolean().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0)
});

export const CalculateSekemRequestSchema = z.object({
	profile: UserAcademicProfileInputSchema,
	institutionIds: z.array(z.string()).optional()
});

export const GenerateTracksRequestSchema = z.object({
	programId: z.string().min(1, 'מזהה תוכנית נדרש'),
	profile: UserAcademicProfileInputSchema,
	preferences: UserPreferencesInputSchema.optional()
});

export type ValidatedSubjectGrade = z.infer<typeof SubjectGradeInputSchema>;
export type ValidatedAcademicProfile = z.infer<typeof UserAcademicProfileInputSchema>;
export type ValidatedUserPreferences = z.infer<typeof UserPreferencesInputSchema>;
export type ValidatedProgramSearchQuery = z.infer<typeof ProgramSearchQuerySchema>;
export type ValidatedGenerateTracksRequest = z.infer<typeof GenerateTracksRequestSchema>;
