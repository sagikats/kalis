import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { getSessionUserId, clearSessionCookie } from '@/lib/session';
import { buildAuthUserResponse, unauthorizedResponse } from '@/lib/authResponse';

export async function GET(req: NextRequest) {
	try {
		// Identity comes only from the signed session cookie — any userId in the query is ignored
		const userId = getSessionUserId(req);
		if (!userId) {
			return unauthorizedResponse('לא נמצא חיבור פעיל');
		}

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.getUserAsync(userId);
		if (!user) {
			const res = unauthorizedResponse('המשתמש לא נמצא');
			clearSessionCookie(res);
			return res;
		}

		return buildAuthUserResponse(user);
	} catch (error) {
		console.error('[API /api/auth/me GET] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'שגיאה באחזור נתוני משתמש' },
			{ status: 500 }
		);
	}
}
