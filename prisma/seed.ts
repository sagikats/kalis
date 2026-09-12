/**
 * Comprehensive Database Seeding Script
 * Subagent 1: Architecture & Database Design
 * Seeds Institutions, Academic Programs, and Bagrut Subjects Catalog into SQLite via Prisma
 */

import { PrismaClient } from '@prisma/client';
import rawData from '../src/data/academicData.json';
import { BAGRUT_SUBJECTS_CATALOG } from '../src/data/bagrutSubjects';

const prisma = new PrismaClient();

// Friction and Prep Hours mapping for Bagrut Subjects
const SUBJECT_INTELLIGENCE: Record<string, { friction: number; prepHours: number; sessions: string[] }> = {
	hebrew: { friction: 2.03, prepHours: 120, sessions: ['winter', 'summer'] },
	math: { friction: 1.6, prepHours: 180, sessions: ['winter', 'summer'] },
	physics: { friction: 1.5, prepHours: 170, sessions: ['summer'] },
	chemistry: { friction: 1.3, prepHours: 130, sessions: ['summer'] },
	biology: { friction: 1.3, prepHours: 130, sessions: ['summer'] },
	cs: { friction: 1.2, prepHours: 110, sessions: ['summer'] },
	history: { friction: 1.05, prepHours: 75, sessions: ['winter', 'summer'] },
	bible: { friction: 1.0, prepHours: 70, sessions: ['winter', 'summer'] },
	literature: { friction: 1.0, prepHours: 70, sessions: ['winter', 'summer'] },
	geography: { friction: 0.9, prepHours: 65, sessions: ['winter', 'summer'] },
	civics: { friction: 1.2, prepHours: 60, sessions: ['winter', 'summer'] },
	english: { friction: 1.1, prepHours: 100, sessions: ['winter', 'summer'] },
	arabic_lang: { friction: 1.1, prepHours: 90, sessions: ['winter', 'summer'] },
	jewish_phil: { friction: 1.05, prepHours: 75, sessions: ['winter', 'summer'] }
};

function normalizeInstitutionId(rawName: string): string {
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

function determineSekemType(field: string, institutionId: string): string {
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

async function main() {
	console.log('🚀 Starting Database Seed...');

	// 1. Seed Institutions
	const standardInstitutions = [
		{
			id: 'technion',
			name: 'הטכניון - מכון טכנולוגי לישראל',
			code: 'IIT',
			calculatorId: 'technion',
			websiteUrl: 'https://admissions.technion.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'tau',
			name: 'אוניברסיטת תל אביב',
			code: 'TAU',
			calculatorId: 'tau',
			websiteUrl: 'https://go.tau.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'huji',
			name: 'האוניברסיטה העברית בירושלים',
			code: 'HUJI',
			calculatorId: 'huji',
			websiteUrl: 'https://info.huji.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'bgu',
			name: 'אוניברסיטת בן-גוריון בנגב',
			code: 'BGU',
			calculatorId: 'bgu',
			websiteUrl: 'https://in.bgu.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'haifa',
			name: 'אוניברסיטת חיפה',
			code: 'UOH',
			calculatorId: 'haifa',
			websiteUrl: 'https://www.haifa.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'ariel',
			name: 'אוניברסיטת אריאל בשומרון',
			code: 'AU',
			calculatorId: 'ariel',
			websiteUrl: 'https://www.ariel.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'bar_ilan',
			name: 'אוניברסיטת בר-אילן',
			code: 'BIU',
			calculatorId: 'bar_ilan',
			websiteUrl: 'https://www.biu.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		},
		{
			id: 'reichman',
			name: 'אוניברסיטת רייכמן (הבינתחומי הרצליה)',
			code: 'RUNI',
			calculatorId: 'reichman',
			websiteUrl: 'https://www.runi.ac.il/',
			isUniversity: true,
			defaultMinBagrutUnits: 20
		}
	];

	for (const inst of standardInstitutions) {
		await prisma.institution.upsert({
			where: { id: inst.id },
			update: inst,
			create: inst
		});
	}
	console.log(`✅ Seeded ${standardInstitutions.length} Institutions`);

	// 2. Seed Academic Programs from academicData.json
	const rawInstitutions = (rawData as any[]) || [];
	const programRecords: any[] = [];
	const seenIds = new Set<string>();
	let programCounter = 0;

	for (const rawInst of rawInstitutions) {
		const instId = normalizeInstitutionId(rawInst.name);
		if (instId === 'other') continue;

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

			if (parsedThreshold === 0) continue;

			let progId = p.id || `prog_${instId}_${programCounter++}`;
			if (seenIds.has(progId)) {
				progId = `${progId}_${instId}_${programCounter++}`;
			}
			seenIds.add(progId);

			const field = p.fieldOfStudy || p.name || 'כללי';
			const sekemType = determineSekemType(field, instId);

			const isStem =
				field.includes('מחשב') ||
				field.includes('הנדס') ||
				field.includes('פיזיקה') ||
				field.includes('מתמטיקה') ||
				field.includes('רפואה');

			const requiresPsych = p.requiresPsychometric !== undefined
				? p.requiresPsychometric
				: (instId === 'technion' || isStem);

			const directEligible = p.directBagrutEligible !== undefined
				? p.directBagrutEligible
				: (!requiresPsych && instId !== 'technion' &&
					(instId === 'huji' ||
						instId === 'tau' ||
						instId === 'bgu' ||
						instId === 'haifa' ||
						instId === 'ariel' ||
						instId === 'bar_ilan' ||
						instId === 'reichman'));

			const directThreshold = p.directBagrutMinAverage !== undefined
				? p.directBagrutMinAverage
				: (directEligible
					? instId === 'bgu'
						? 104.0
						: instId === 'bar_ilan'
						? 102.0
						: instId === 'haifa' || instId === 'ariel' || instId === 'reichman'
						? 100.0
						: 105.0
					: null);

			programRecords.push({
				id: progId,
				institutionId: instId,
				institutionName: rawInst.name,
				facultyName: p.description || field,
				name: p.fieldOfStudy || p.name || 'תואר ראשון',
				fieldOfStudy: field,
				degreeLevel: p.degreeLevel || 'bachelor',
				minSekemThreshold: parsedThreshold,
				relevantSekemType: sekemType,
				requiresPsychometric: requiresPsych,
				directBagrutEligible: directEligible,
				directBagrutMinAverage: directThreshold,
				prerequisitesJson: JSON.stringify({
					minMathUnits: isStem ? 4 : undefined,
					minMathGrade: isStem ? 75 : undefined,
					mustHavePsychometric: requiresPsych
				}),
				description: p.description ?? null,
				comments: p.comments ?? null,
				url: p.url ?? null
			});
		}
	}

	// Clean existing programs before re-seeding
	await prisma.academicProgram.deleteMany({});
	for (const prog of programRecords) {
		await prisma.academicProgram.create({
			data: prog
		});
	}
	console.log(`✅ Seeded ${programRecords.length} Academic Programs across 8 Universities`);

	// 3. Seed Bagrut Subjects Catalog
	await prisma.bagrutSubject.deleteMany({});
	for (const subj of BAGRUT_SUBJECTS_CATALOG) {
		const intel = SUBJECT_INTELLIGENCE[subj.id] || {
			friction: subj.category === 'stem' ? 1.3 : 1.0,
			prepHours: subj.category === 'stem' ? 120 : 70,
			sessions: ['winter', 'summer']
		};

		await prisma.bagrutSubject.create({
			data: {
				id: subj.id,
				name: subj.name,
				category: subj.category,
				categoryLabel: subj.categoryLabel,
				defaultUnits: subj.defaultUnits,
				allowedUnitsJson: JSON.stringify(subj.allowedUnits),
				frictionIndex: intel.friction,
				basePrepHours: intel.prepHours,
				examSessionsJson: JSON.stringify(intel.sessions),
				keywordsJson: JSON.stringify(subj.keywords || [])
			}
		});
	}
	console.log(`✅ Seeded ${BAGRUT_SUBJECTS_CATALOG.length} Bagrut Subjects in National Catalog`);

	console.log('🎉 Database Seeding completed successfully!');
}

main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
