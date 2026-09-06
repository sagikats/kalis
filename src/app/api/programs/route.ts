import { NextRequest, NextResponse } from 'next/server';
import { dbRepository, ProgramSearchQuerySchema } from '@/modules/db';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);

		const rawQuery = {
			institutionId: searchParams.get('institutionId') || undefined,
			fieldOfStudy: searchParams.get('fieldOfStudy') || undefined,
			text: searchParams.get('text') || undefined,
			minThreshold: searchParams.get('minThreshold') ? parseFloat(searchParams.get('minThreshold')!) : undefined,
			maxThreshold: searchParams.get('maxThreshold') ? parseFloat(searchParams.get('maxThreshold')!) : undefined,
			directBagrutOnly: searchParams.get('directBagrutOnly') === 'true',
			limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
			offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
		};

		const parseResult = ProgramSearchQuerySchema.safeParse(rawQuery);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: 'פרמטרי חיפוש אינם תקינים',
					details: parseResult.error.flatten()
				},
				{ status: 400 }
			);
		}

		const searchResult = dbRepository.searchPrograms(parseResult.data);

		return NextResponse.json({
			success: true,
			total: searchResult.total,
			limit: parseResult.data.limit,
			offset: parseResult.data.offset,
			programs: searchResult.programs
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה פנימית באחזור החוגים'
			},
			{ status: 500 }
		);
	}
}
