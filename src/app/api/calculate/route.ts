import { NextRequest, NextResponse } from 'next/server';
import { CalculateSekemRequestSchema } from '@/modules/db';
import { calculateAllInstitutions, calculateInstitution } from '@/modules/calculators';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parseResult = CalculateSekemRequestSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: 'ולידציית קלט נכשלה',
					details: parseResult.error.flatten()
				},
				{ status: 400 }
			);
		}

		const { profile, institutionIds } = parseResult.data;

		const calcInput = {
			bagrutSubjects: profile.bagrutSubjects.map((s) => ({
				name: s.name,
				units: s.units,
				grade: s.grade
			})),
			psychometricGeneral: profile.psychometricGeneral,
			psychometricQuant: profile.psychometricQuant,
			psychometricVerbal: profile.psychometricVerbal,
			psychometricEnglish: profile.psychometricEnglish,
			mathUnits: profile.mathUnits,
			mathGrade: profile.mathGrade,
			physicsUnits: profile.physicsUnits,
			physicsGrade: profile.physicsGrade
		};

		if (institutionIds && institutionIds.length > 0) {
			const results = institutionIds.map((id) => calculateInstitution(id, calcInput));
			return NextResponse.json({
				success: true,
				results
			});
		}

		const results = calculateAllInstitutions(calcInput);
		return NextResponse.json({
			success: true,
			results
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה פנימית בחישוב הסכם'
			},
			{ status: 500 }
		);
	}
}
