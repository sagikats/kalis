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
	BagrutSubjectRecord,
	UserRecord,
	SekemType
} from './schema';
import { ValidatedProgramSearchQuery } from './validation';
import rawData from '../../data/academicData.json';
import { prisma } from '../../lib/prisma';

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

	private isSyncedFromDB = false;

	public async ensureSyncedFromSQLite(): Promise<void> {
		if (this.isSyncedFromDB) return;
		await this.syncFromSQLite();
	}

	public async syncFromSQLite(): Promise<void> {
		try {
			const [dbInstitutions, dbPrograms] = await Promise.all([
				prisma.institution.findMany(),
				prisma.academicProgram.findMany()
			]);

			if (dbInstitutions.length > 0 && dbPrograms.length > 0) {
				this.institutions.clear();
				this.programsById.clear();
				this.programsByInstitution.clear();
				this.programsByField.clear();

				for (const inst of dbInstitutions) {
					this.institutions.set(inst.id, {
						id: inst.id,
						name: inst.name,
						calculatorId: inst.calculatorId,
						websiteUrl: inst.websiteUrl || '',
						isUniversity: inst.isUniversity,
						defaultMinBagrutUnits: inst.defaultMinBagrutUnits
					});
					this.programsByInstitution.set(inst.id, []);
				}

				for (const p of dbPrograms) {
					const prereq = p.prerequisitesJson ? JSON.parse(p.prerequisitesJson) : {};
					const progRecord: AcademicProgramRecord = {
						id: p.id,
						institutionId: p.institutionId,
						institutionName: p.institutionName,
						facultyName: p.facultyName || p.fieldOfStudy,
						name: p.name,
						fieldOfStudy: p.fieldOfStudy,
						degreeLevel: (p.degreeLevel as any) || 'bachelor',
						minSekemThreshold: p.minSekemThreshold,
						relevantSekemType: p.relevantSekemType as any,
						directBagrutEligible: p.directBagrutEligible,
						directBagrutMinAverage: p.directBagrutMinAverage ?? undefined,
						prerequisites: {
							minMathUnits: prereq.minMathUnits,
							minMathGrade: prereq.minMathGrade,
							minPhysUnits: prereq.minPhysUnits,
							minPhysGrade: prereq.minPhysGrade,
							mustHavePsychometric: Boolean(prereq.mustHavePsychometric),
							mandatorySubjects: prereq.mandatorySubjects
						},
						description: p.description ?? undefined,
						comments: p.comments ?? undefined,
						url: p.url ?? undefined,
						createdAt: p.createdAt,
						updatedAt: p.updatedAt
					};

					this.programsById.set(p.id, progRecord);

					const instList = this.programsByInstitution.get(p.institutionId) || [];
					instList.push(progRecord);
					this.programsByInstitution.set(p.institutionId, instList);

					const fieldToken = p.fieldOfStudy.trim().toLowerCase();
					const fieldList = this.programsByField.get(fieldToken) || [];
					fieldList.push(progRecord);
					this.programsByField.set(fieldToken, fieldList);
				}

				this.isSyncedFromDB = true;
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite sync error (using cached state):', err);
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

	// -------------------------------------------------------------------------
	// Async SQLite / Prisma Persistence Layer
	// -------------------------------------------------------------------------

	private async ensureUserExists(userId: string): Promise<void> {
		const existing = await prisma.user.findUnique({ where: { id: userId } });
		if (!existing) {
			const count = await prisma.user.count();
			await prisma.user.create({
				data: {
					id: userId,
					candidateNumber: `KL-${10001 + count}`
				}
			});
		}
	}

	public async createUserAsync(email?: string, name?: string): Promise<UserRecord> {
		const count = await prisma.user.count();
		const candidateNumber = `KL-${10001 + count}`;
		const created = await prisma.user.create({
			data: {
				candidateNumber,
				email: email ?? null,
				name: name ?? null
			}
		});
		return {
			id: created.id,
			candidateNumber: created.candidateNumber,
			email: created.email ?? undefined,
			name: created.name ?? undefined,
			createdAt: created.createdAt,
			updatedAt: created.updatedAt
		};
	}

	public async getUserAsync(userId: string): Promise<UserRecord | null> {
		try {
			const u = await prisma.user.findUnique({ where: { id: userId } });
			if (!u) return null;
			return {
				id: u.id,
				candidateNumber: u.candidateNumber,
				email: u.email ?? undefined,
				name: u.name ?? undefined,
				createdAt: u.createdAt,
				updatedAt: u.updatedAt
			};
		} catch (err) {
			console.warn('[KalisDatabaseRepository] getUserAsync error:', err);
			return null;
		}
	}

	public async saveUserProfileAsync(profile: UserAcademicProfileRecord): Promise<UserAcademicProfileRecord> {
		profile.updatedAt = new Date();
		this.userProfiles.set(profile.userId, profile);

		try {
			await this.ensureUserExists(profile.userId);

			const savedProfile = await prisma.userAcademicProfile.upsert({
				where: { userId: profile.userId },
				update: {
					mathUnits: profile.mathUnits,
					mathGrade: profile.mathGrade,
					physicsUnits: profile.physicsUnits,
					physicsGrade: profile.physicsGrade,
					psychometricGeneral: profile.psychometricGeneral,
					psychometricQuant: profile.psychometricQuant,
					psychometricVerbal: profile.psychometricVerbal,
					psychometricEnglish: profile.psychometricEnglish,
					hasTakenPsychometric: profile.hasTakenPsychometric,
					estimatedBagrutAverage: profile.estimatedBagrutAverage ?? null
				},
				create: {
					userId: profile.userId,
					mathUnits: profile.mathUnits,
					mathGrade: profile.mathGrade,
					physicsUnits: profile.physicsUnits,
					physicsGrade: profile.physicsGrade,
					psychometricGeneral: profile.psychometricGeneral,
					psychometricQuant: profile.psychometricQuant,
					psychometricVerbal: profile.psychometricVerbal,
					psychometricEnglish: profile.psychometricEnglish,
					hasTakenPsychometric: profile.hasTakenPsychometric,
					estimatedBagrutAverage: profile.estimatedBagrutAverage ?? null
				}
			});

			await prisma.subjectGrade.deleteMany({ where: { profileId: savedProfile.id } });
			if (profile.bagrutSubjects && profile.bagrutSubjects.length > 0) {
				await prisma.subjectGrade.createMany({
					data: profile.bagrutSubjects.map((s) => ({
						profileId: savedProfile.id,
						subjectName: s.subjectName || (s as any).name || 'מקצוע',
						units: s.units,
						grade: s.grade,
						isMandatory: Boolean(s.isMandatory),
						isElective: !s.isMandatory,
						isMath: Boolean(s.isMath || s.subjectName?.includes('מתמטיקה')),
						isPhysics: Boolean(s.isPhysics || s.subjectName?.includes('פיזיקה')),
						coefficientBonus: s.coefficientBonus ?? null
					}))
				});
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite saveUserProfileAsync error:', err);
		}

		return profile;
	}

	public async getUserProfileAsync(userId: string): Promise<UserAcademicProfileRecord | null> {
		try {
			const dbProfile = await prisma.userAcademicProfile.findUnique({
				where: { userId },
				include: { subjectGrades: true }
			});

			if (dbProfile) {
				const profileRecord: UserAcademicProfileRecord = {
					userId: dbProfile.userId,
					mathUnits: dbProfile.mathUnits,
					mathGrade: dbProfile.mathGrade,
					physicsUnits: dbProfile.physicsUnits,
					physicsGrade: dbProfile.physicsGrade,
					psychometricGeneral: dbProfile.psychometricGeneral,
					psychometricQuant: dbProfile.psychometricQuant,
					psychometricVerbal: dbProfile.psychometricVerbal,
					psychometricEnglish: dbProfile.psychometricEnglish,
					hasTakenPsychometric: dbProfile.hasTakenPsychometric,
					estimatedBagrutAverage: dbProfile.estimatedBagrutAverage ?? undefined,
					updatedAt: dbProfile.updatedAt,
					bagrutSubjects: dbProfile.subjectGrades.map((g) => ({
						id: g.id,
						profileId: g.profileId,
						subjectName: g.subjectName,
						units: g.units,
						grade: g.grade,
						isMandatory: g.isMandatory,
						isMath: g.isMath,
						isPhysics: g.isPhysics,
						coefficientBonus: g.coefficientBonus ?? undefined
					}))
				};
				this.userProfiles.set(userId, profileRecord);
				return profileRecord;
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite getUserProfileAsync error:', err);
		}

		return this.userProfiles.get(userId) || null;
	}

	public async saveUserPreferencesAsync(pref: UserPreferencesRecord): Promise<UserPreferencesRecord> {
		pref.updatedAt = new Date();
		this.userPreferences.set(pref.userId, pref);

		try {
			await this.ensureUserExists(pref.userId);

			await prisma.userPreferences.upsert({
				where: { userId: pref.userId },
				update: {
					psychExperience: pref.psychExperience,
					psychFeeling: pref.psychFeeling,
					psychStrongestSection: pref.psychStrongestSection,
					psychStrongestSectionsJson: pref.psychStrongestSections ? JSON.stringify(pref.psychStrongestSections) : null,
					learningOrientation: pref.learningOrientation,
					learningStrength: pref.learningStrength,
					weeklyAvailabilityHours: pref.weeklyAvailabilityHours,
					targetTimeline: pref.targetTimeline
				},
				create: {
					userId: pref.userId,
					psychExperience: pref.psychExperience,
					psychFeeling: pref.psychFeeling,
					psychStrongestSection: pref.psychStrongestSection,
					psychStrongestSectionsJson: pref.psychStrongestSections ? JSON.stringify(pref.psychStrongestSections) : null,
					learningOrientation: pref.learningOrientation,
					learningStrength: pref.learningStrength,
					weeklyAvailabilityHours: pref.weeklyAvailabilityHours,
					targetTimeline: pref.targetTimeline
				}
			});
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite saveUserPreferencesAsync error:', err);
		}

		return pref;
	}

	public async getUserPreferencesAsync(userId: string): Promise<UserPreferencesRecord | null> {
		try {
			const dbPref = await prisma.userPreferences.findUnique({
				where: { userId }
			});

			if (dbPref) {
				const prefRecord: UserPreferencesRecord = {
					userId: dbPref.userId,
					psychExperience: dbPref.psychExperience as any,
					psychFeeling: dbPref.psychFeeling as any,
					psychStrongestSection: dbPref.psychStrongestSection as any,
					psychStrongestSections: dbPref.psychStrongestSectionsJson ? JSON.parse(dbPref.psychStrongestSectionsJson) : undefined,
					learningOrientation: dbPref.learningOrientation as any,
					learningStrength: dbPref.learningStrength as any,
					weeklyAvailabilityHours: dbPref.weeklyAvailabilityHours as any,
					targetTimeline: dbPref.targetTimeline as any,
					updatedAt: dbPref.updatedAt
				};
				this.userPreferences.set(userId, prefRecord);
				return prefRecord;
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite getUserPreferencesAsync error:', err);
		}

		return this.userPreferences.get(userId) || null;
	}

	public async saveActionTracksAsync(userId: string, programId: string, tracks: ActionTrackRecord[]): Promise<void> {
		this.saveActionTracks(userId, programId, tracks);

		try {
			await this.ensureUserExists(userId);

			await prisma.savedTrack.deleteMany({ where: { userId, programId } });

			for (const t of tracks) {
				await prisma.savedTrack.create({
					data: {
						userId,
						programId,
						trackType: t.id || 'track-standard',
						title: t.title,
						badge: t.badge || '',
						badgeColor: t.badgeColor || '',
						targetSekem: t.targetSekem || 0,
						targetPsychometric: t.targetPsychometric ?? null,
						targetBagrutAverage: t.targetBagrutAverage || 0,
						currentPsychometric: t.currentPsychometric ?? null,
						currentBagrutAverage: t.currentBagrutAverage ?? null,
						strategyDescription: t.strategyDescription || '',
						estimatedWeeks: t.estimatedWeeks || 0,
						weeklyHours: t.weeklyHours || 0,
						feasibility: t.feasibility || 'high',
						feasibilityExplanation: t.feasibilityExplanation || null,
						keyAdvantage: t.keyAdvantage || null,
						stepsJson: JSON.stringify(t.milestones || (t as any).steps || []),
						subjectImprovementsJson: JSON.stringify(t.recommendedLevers || (t as any).recommendedSubjectImprovements || [])
					}
				});
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite saveActionTracksAsync error:', err);
		}
	}

	public async getActionTracksAsync(userId: string, programId: string): Promise<ActionTrackRecord[]> {
		try {
			const dbTracks = await prisma.savedTrack.findMany({
				where: { userId, programId }
			});

			if (dbTracks.length > 0) {
				const mapped: ActionTrackRecord[] = dbTracks.map((dt) => ({
					id: dt.trackType,
					userId: dt.userId,
					programId: dt.programId,
					title: dt.title,
					badge: dt.badge,
					badgeColor: dt.badgeColor,
					targetSekem: dt.targetSekem,
					targetPsychometric: dt.targetPsychometric ?? undefined,
					currentPsychometric: dt.currentPsychometric ?? undefined,
					targetBagrutAverage: dt.targetBagrutAverage,
					currentBagrutAverage: dt.currentBagrutAverage ?? undefined,
					strategyDescription: dt.strategyDescription,
					estimatedWeeks: dt.estimatedWeeks,
					weeklyHours: dt.weeklyHours,
					feasibility: dt.feasibility as any,
					feasibilityExplanation: dt.feasibilityExplanation || '',
					keyAdvantage: dt.keyAdvantage || '',
					milestones: dt.stepsJson ? JSON.parse(dt.stepsJson) : [],
					recommendedLevers: dt.subjectImprovementsJson ? JSON.parse(dt.subjectImprovementsJson) : [],
					createdAt: dt.createdAt
				}));
				this.actionTracks.set(`${userId}:${programId}`, mapped);
				return mapped;
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] SQLite getActionTracksAsync error:', err);
		}

		return this.getActionTracks(userId, programId);
	}

	public async clearUserStateAsync(userId: string): Promise<void> {
		this.clearUserState(userId);
		try {
			await prisma.user.deleteMany({ where: { id: userId } });
		} catch (err) {
			console.warn('[KalisDatabaseRepository] clearUserStateAsync error:', err);
		}
	}

	public async getBagrutSubjectsCatalogAsync(): Promise<BagrutSubjectRecord[]> {
		try {
			const dbSubjects = await prisma.bagrutSubject.findMany({
				orderBy: { id: 'asc' }
			});

			if (dbSubjects.length > 0) {
				return dbSubjects.map((s) => ({
					id: s.id,
					name: s.name,
					category: s.category,
					categoryLabel: s.categoryLabel,
					defaultUnits: s.defaultUnits,
					allowedUnits: JSON.parse(s.allowedUnitsJson || '[]'),
					frictionIndex: s.frictionIndex,
					basePrepHours: s.basePrepHours,
					examSessions: s.examSessionsJson ? JSON.parse(s.examSessionsJson) : undefined,
					keywords: s.keywordsJson ? JSON.parse(s.keywordsJson) : undefined
				}));
			}
		} catch (err) {
			console.warn('[KalisDatabaseRepository] getBagrutSubjectsCatalogAsync error:', err);
		}

		return [];
	}
}

export const dbRepository = KalisDatabaseRepository.getInstance();
