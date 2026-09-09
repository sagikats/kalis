import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';

export async function GET(req: NextRequest) {
	try {
		await dbRepository.ensureSyncedFromSQLite();

		const institutions = dbRepository.getAllInstitutions().map((inst) => {
			const programs = dbRepository.getProgramsByInstitution(inst.id);
			return {
				id: inst.id,
				name: inst.name,
				calculatorId: inst.calculatorId,
				websiteUrl: inst.websiteUrl || '',
				isUniversity: inst.isUniversity,
				defaultMinBagrutUnits: inst.defaultMinBagrutUnits,
				programs: programs.map((p) => ({
					id: p.id,
					name: p.name,
					fieldOfStudy: p.fieldOfStudy,
					facultyName: p.facultyName,
					degreeLevel: p.degreeLevel,
					admissionThreshold: p.minSekemThreshold,
					minSekemThreshold: p.minSekemThreshold,
					sekemScore: p.minSekemThreshold,
					relevantSekemType: p.relevantSekemType,
					directBagrutEligible: p.directBagrutEligible,
					directBagrutMinAverage: p.directBagrutMinAverage,
					prerequisites: p.prerequisites,
					description: p.description,
					comments: p.comments,
					url: p.url
				}))
			};
		});

		return NextResponse.json({
			success: true,
			total: institutions.length,
			institutions
		});
	} catch (error: any) {
		console.error('[API /api/institutions GET] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה באחזור נתוני המוסדות'
			},
			{ status: 500 }
		);
	}
}
