/**
 * High-Performance Repository & Indexed Data Access Layer
 * Subagent 1: Architecture & Database Design
 */

import {
	AcademicProgramRecord,
	InstitutionRecord,
	UserAcademicProfileRecord,
	UserPreferencesRecord,
	ActionTrackRecord,
	SekemType
} from './schema';
import { ValidatedProgramSearchQuery } from './validation';
import rawData from '../../data/academicData.json';

export interface ProgramSearchFilters {
	institutionId?: string;
	fieldOfStudy?: string;
	text?: string;
	minThreshold?: number;
	maxThreshold?: number;
	directBagrutOnly?: boolean;
	limit?: number;
	offset?: number;
}

export class KalisDatabaseRepository {
	private static instance: KalisDatabaseRepository;

	private institutions: Map<string, InstitutionRecord> = new Map();
	private programsById: Map<string, AcademicProgramRecord> = new Map();
	private programsByInstitution: Map<string, AcademicProgramRecord[]> = new Map();
	private programsByField: Map<string, AcademicProgramRecord[]> = new Map();

	private userProfiles: Map<string, UserAcademicProfileRecord> = new Map();
	private userPreferences: Map<string, UserPreferencesRecord> = new Map();
	private actionTracks: Map<string, ActionTrackRecord[]> = new Map(); // Key: `${userId}:${programId}`

	private constructor() {
		this.initializeDatabase();
	}

	public static getInstance(): KalisDatabaseRepository {
		if (!KalisDatabaseRepository.instance) {
			KalisDatabaseRepository.instance = new KalisDatabaseRepository();
		}
		return KalisDatabaseRepository.instance;
	}

	private normalizeInstitutionId(rawName: string): string {
		const lower = (rawName || '').toLowerCase();
		if (lower.includes('טכניון')) return 'technion';
		if (lower.includes('תל אביב') || lower.includes('תל-אביב')) return 'tau';
		if (lower.includes('עברית')) return 'huji';
		if (lower.includes('בן גוריון') || lower.includes('בן-גוריון')) return 'bgu';
		if (lower.includes('חיפה')) return 'haifa';
		if (lower.includes('אריאל')) return 'ariel';
		if (lower.includes('בר אילן') || lower.includes('בר-אילן')) return 'bar_ilan';
		if (lower.includes('רייכמן') || lower.includes('בינתחומי')) return 'reichman';
		return 'other';
	}

	private determineSekemType(field: string, institutionId: string): SekemType {
		if (institutionId === 'technion') return 'technion';
		const lower = field.toLowerCase();
		if (lower.includes('הנדס') || lower.includes('מחשב') || lower.includes('פיזיקה')) {
			return 'engineering';
		}
		if (lower.includes('ניהול') || lower.includes('כלכלה') || lower.includes('חשבונאות')) {
			return 'management';
		}
		return 'general';
	}

	private initializeDatabase(): void {
		// 1. Seed Institutions
		const standardInstitutions: InstitutionRecord[] = [
			{
				id: 'technion',
				name: 'הטכניון - מכון טכנולוגי לישראל',
				calculatorId: 'technion',
				websiteUrl: 'https://admissions.technion.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'tau',
				name: 'אוניברסיטת תל אביב',
				calculatorId: 'tau',
				websiteUrl: 'https://go.tau.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'huji',
				name: 'האוניברסיטה העברית בירושלים',
				calculatorId: 'huji',
				websiteUrl: 'https://info.huji.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'bgu',
				name: 'אוניברסיטת בן-גוריון בנגב',
				calculatorId: 'bgu',
				websiteUrl: 'https://in.bgu.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'haifa',
				name: 'אוניברסיטת חיפה',
				calculatorId: 'haifa',
				websiteUrl: 'https://www.haifa.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'ariel',
				name: 'אוניברסיטת אריאל בשומרון',
				calculatorId: 'ariel',
				websiteUrl: 'https://www.ariel.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'bar_ilan',
				name: 'אוניברסיטת בר-אילן',
				calculatorId: 'bar_ilan',
				websiteUrl: 'https://www.biu.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			},
			{
				id: 'reichman',
				name: 'אוניברסיטת רייכמן (הבינתחומי הרצליה)',
				calculatorId: 'reichman',
				websiteUrl: 'https://www.runi.ac.il/',
				isUniversity: true,
				defaultMinBagrutUnits: 20
			}
		];

		for (const inst of standardInstitutions) {
			this.institutions.set(inst.id, inst);
			this.programsByInstitution.set(inst.id, []);
		}

		// 2. Ingest and Index Academic Programs from Raw JSON
		const rawInstitutions = (rawData as any[]) || [];
		let programCount = 0;

		for (const rawInst of rawInstitutions) {
			const instId = this.normalizeInstitutionId(rawInst.name);
			const instRecord = this.institutions.get(instId);
			const instName = instRecord ? instRecord.name : rawInst.name;

			const rawPrograms = rawInst.programs || [];
			for (const p of rawPrograms) {
				const rawThreshold = p.admissionThreshold ?? p.sekemScore ?? null;
				let parsedThreshold = 0;
				if (typeof rawThreshold === 'number') {
					parsedThreshold = rawThreshold;
				} else if (typeof rawThreshold === 'string') {
					const numMatch = rawThreshold.match(/\d+(\.\d+)?/);
					if (numMatch) {
						parsedThreshold = parseFloat(numMatch[0]);
					}
				}

				if (parsedThreshold === 0) continue; // Skip programs with no numeric threshold

				const progId = p.id || `prog_${instId}_${programCount++}`;
				const field = p.fieldOfStudy || p.name || 'כללי';
				const sekemType = this.determineSekemType(field, instId);

				const isStem =
					field.includes('מחשב') ||
					field.includes('הנדס') ||
					field.includes('פיזיקה') ||
					field.includes('מתמטיקה') ||
					field.includes('רפואה');

				// Direct Bagrut Eligibility: non-STEM degrees at HUJI/TAU (105+), BGU (104+), Bar-Ilan (102+), Haifa/Ariel/Reichman (100+)
				const directEligible =
					!isStem &&
					instId !== 'technion' &&
					(instId === 'huji' ||
						instId === 'tau' ||
						instId === 'bgu' ||
						instId === 'haifa' ||
						instId === 'ariel' ||
						instId === 'bar_ilan' ||
						instId === 'reichman');

				const directThreshold = directEligible
					? instId === 'bgu'
						? 104.0
						: instId === 'bar_ilan'
						? 102.0
						: instId === 'haifa' || instId === 'ariel' || instId === 'reichman'
						? 100.0
						: 105.0
					: null;

				const programRecord: AcademicProgramRecord = {
					id: progId,
					institutionId: instId,
					institutionName: instName,
					facultyName: p.description || field,
					name: p.fieldOfStudy || p.name || 'תואר ראשון',
					fieldOfStudy: field,
					degreeLevel: 'bachelor',
					minSekemThreshold: parsedThreshold,
					relevantSekemType: sekemType,
					directBagrutEligible: directEligible,
					directBagrutMinAverage: directThreshold,
					prerequisites: {
						minMathUnits: isStem ? 4 : undefined,
						minMathGrade: isStem ? 75 : undefined,
						mustHavePsychometric: isStem || instId === 'technion'
					},
					url: p.url,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				this.programsById.set(progId, programRecord);

				// Index by institution
				const instList = this.programsByInstitution.get(instId) || [];
				instList.push(programRecord);
				this.programsByInstitution.set(instId, instList);

				// Index by field of study keyword
				const fieldToken = field.trim().toLowerCase();
				const fieldList = this.programsByField.get(fieldToken) || [];
				fieldList.push(programRecord);
				this.programsByField.set(fieldToken, fieldList);
			}
		}
	}

	// -------------------------------------------------------------------------
	// Read Queries
	// -------------------------------------------------------------------------

	public getAllInstitutions(): InstitutionRecord[] {
		return Array.from(this.institutions.values());
	}

	public getInstitutionById(id: string): InstitutionRecord | null {
		return this.institutions.get(id) || null;
	}

	public findProgramById(id: string): AcademicProgramRecord | null {
		return this.programsById.get(id) || null;
	}

	public getProgramsByInstitution(institutionId: string): AcademicProgramRecord[] {
		return this.programsByInstitution.get(institutionId) || [];
	}

	public searchPrograms(filters: ProgramSearchFilters): {
		programs: AcademicProgramRecord[];
		total: number;
	} {
		let results = Array.from(this.programsById.values());

		if (filters.institutionId) {
			results = results.filter((p) => p.institutionId === filters.institutionId);
		}

		if (filters.fieldOfStudy) {
			const targetField = filters.fieldOfStudy.trim().toLowerCase();
			results = results.filter((p) => p.fieldOfStudy.toLowerCase().includes(targetField));
		}

		if (filters.text) {
			const query = filters.text.trim().toLowerCase();
			results = results.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.fieldOfStudy.toLowerCase().includes(query) ||
					p.institutionName.toLowerCase().includes(query)
			);
		}

		if (filters.minThreshold !== undefined) {
			results = results.filter((p) => p.minSekemThreshold >= (filters.minThreshold as number));
		}

		if (filters.maxThreshold !== undefined) {
			results = results.filter((p) => p.minSekemThreshold <= (filters.maxThreshold as number));
		}

		if (filters.directBagrutOnly) {
			results = results.filter((p) => p.directBagrutEligible);
		}

		const total = results.length;
		const offset = filters.offset || 0;
		const limit = filters.limit || 20;
		const paged = results.slice(offset, offset + limit);

		return { programs: paged, total };
	}

	public findProgramsBySekem(
		institutionId: string,
		userSekem: number,
		options: { tolerance?: number; limit?: number } = {}
	): { eligible: AcademicProgramRecord[]; reachable: AcademicProgramRecord[] } {
		const programs = this.getProgramsByInstitution(institutionId);
		const tolerance = options.tolerance ?? 30;
		const limit = options.limit ?? 15;

		const eligible: AcademicProgramRecord[] = [];
		const reachable: AcademicProgramRecord[] = [];

		for (const p of programs) {
			if (userSekem >= p.minSekemThreshold) {
				eligible.push(p);
			} else if (p.minSekemThreshold - userSekem <= tolerance) {
				reachable.push(p);
			}
		}

		return {
			eligible: eligible.slice(0, limit),
			reachable: reachable.slice(0, limit)
		};
	}

	// -------------------------------------------------------------------------
	// Write & State Persistence (Thread-Safe In-Memory Store)
	// -------------------------------------------------------------------------

	public saveUserProfile(profile: UserAcademicProfileRecord): UserAcademicProfileRecord {
		profile.updatedAt = new Date();
		this.userProfiles.set(profile.userId, profile);
		return profile;
	}

	public getUserProfile(userId: string): UserAcademicProfileRecord | null {
		return this.userProfiles.get(userId) || null;
	}

	public saveUserPreferences(pref: UserPreferencesRecord): UserPreferencesRecord {
		pref.updatedAt = new Date();
		this.userPreferences.set(pref.userId, pref);
		return pref;
	}

	public getUserPreferences(userId: string): UserPreferencesRecord | null {
		return this.userPreferences.get(userId) || null;
	}

	public saveActionTracks(userId: string, programId: string, tracks: ActionTrackRecord[]): void {
		const key = `${userId}:${programId}`;
		this.actionTracks.set(key, tracks);
	}

	public getActionTracks(userId: string, programId: string): ActionTrackRecord[] {
		const key = `${userId}:${programId}`;
		return this.actionTracks.get(key) || [];
	}

	public clearUserState(userId: string): void {
		this.userProfiles.delete(userId);
		this.userPreferences.delete(userId);
		for (const key of this.actionTracks.keys()) {
			if (key.startsWith(`${userId}:`)) {
				this.actionTracks.delete(key);
			}
		}
	}
}

export const dbRepository = KalisDatabaseRepository.getInstance();
