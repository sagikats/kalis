import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { getSessionUserId } from '@/lib/session';
import { unauthorizedResponse } from '@/lib/authResponse';

// The owner of every operation here is the session user — userId params from the client are ignored.

export async function POST(req: NextRequest) {
	try {
		const userId = getSessionUserId(req);
		if (!userId) {
			return unauthorizedResponse('יש להירשם או להתחבר לאתר על מנת לשמור מסלולים');
		}

		const body = await req.json();
		const { programId, track } = body;

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

		const result = await dbRepository.saveSingleTrackAsync(userId, programId, track);

		return NextResponse.json({
			success: true,
			message: 'המסלול נשמר בהצלחה במסד הנתונים',
			savedTrackId: result.id,
			candidateNumber: result.candidateNumber,
			userId,
			track: result.track
		});
	} catch (error: any) {
		console.error('[API /api/tracks/save POST] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'שגיאה בשמירת המסלול במסד הנתונים'
			},
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const userId = getSessionUserId(req);
		if (!userId) return unauthorizedResponse();

		const { searchParams } = new URL(req.url);
		const programId = searchParams.get('programId') || undefined;

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
				error: 'שגיאה באחזור המסלולים השמורים'
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const userId = getSessionUserId(req);
		if (!userId) return unauthorizedResponse();

		const { searchParams } = new URL(req.url);
		const trackId = searchParams.get('trackId');
		const programId = searchParams.get('programId') || undefined;

		if (!trackId) {
			return NextResponse.json(
				{
					success: false,
					error: 'פרמטר trackId נדרש למחיקת מסלול'
				},
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();
		const deleted = await dbRepository.deleteSavedTrackAsync(userId, trackId, programId);

		return NextResponse.json({
			success: true,
			deleted,
			message: deleted ? 'המסלול הוסר בהצלחה מרשימת השמורים' : 'המסלול לא נמצא או שכבר הוסר'
		});
	} catch (error: any) {
		console.error('[API /api/tracks/save DELETE] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'שגיאה במחיקת המסלול השמור'
			},
			{ status: 500 }
		);
	}
}

