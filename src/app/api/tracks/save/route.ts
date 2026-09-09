import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId, programId, track } = body;

		if (!programId || !track) {
			return NextResponse.json(
				{
					success: false,
					error: 'פרמטרים חסרים: programId ו-track נדרשים לשמירה'
				},
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		const program = dbRepository.findProgramById(programId);
		if (!program) {
			return NextResponse.json(
				{
					success: false,
					error: `חוג הלימודים המבוקש לא נמצא (מזהה: ${programId})`
				},
				{ status: 404 }
			);
		}

		// Use provided userId or fallback to a deterministic / guest userId
		const effectiveUserId = userId && typeof userId === 'string' && userId.trim().length > 0
			? userId.trim()
			: `guest_${Date.now()}`;

		const result = await dbRepository.saveSingleTrackAsync(effectiveUserId, programId, track);

		return NextResponse.json({
			success: true,
			message: 'המסלול נשמר בהצלחה במסד הנתונים',
			savedTrackId: result.id,
			candidateNumber: result.candidateNumber,
			userId: effectiveUserId,
			track: result.track
		});
	} catch (error: any) {
		console.error('[API /api/tracks/save POST] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה בשמירת המסלול במסד הנתונים'
			},
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId');
		const programId = searchParams.get('programId') || undefined;

		if (!userId) {
			return NextResponse.json(
				{
					success: false,
					error: 'פרמטר userId נדרש'
				},
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();
		const tracks = await dbRepository.getActionTracksAsync(userId, programId);

		return NextResponse.json({
			success: true,
			total: tracks.length,
			tracks
		});
	} catch (error: any) {
		console.error('[API /api/tracks/save GET] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה באחזור המסלולים השמורים'
			},
			{ status: 500 }
		);
	}
}
