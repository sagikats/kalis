import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { email, password, guestUserId } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return NextResponse.json(
				{ success: false, error: 'יש להזין כתובת אימייל תקינה' },
				{ status: 400 }
			);
		}

		if (!password || typeof password !== 'string') {
			return NextResponse.json(
				{ success: false, error: 'יש להזין סיסמה' },
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.authenticateUserAsync(email, password);
		if (!user) {
			return NextResponse.json(
				{ success: false, error: 'כתובת אימייל או סיסמה שגויים' },
				{ status: 401 }
			);
		}

		// Seamless guest migration upon login: if guest had unsaved/guest tracks
		if (guestUserId && typeof guestUserId === 'string' && guestUserId.trim().length > 0 && guestUserId !== user.id) {
			try {
				await prisma.savedTrack.updateMany({
					where: { userId: guestUserId },
					data: { userId: user.id }
				});
			} catch (migrationErr) {
				console.warn('[Auth Login] Guest migration notice:', migrationErr);
			}
		}

		const savedTracksCount = await prisma.savedTrack.count({
			where: { userId: user.id }
		});

		const profile = await dbRepository.getUserProfileAsync(user.id);
		const preferences = await dbRepository.getUserPreferencesAsync(user.id);

		return NextResponse.json({
			success: true,
			message: 'התחברת בהצלחה!',
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				candidateNumber: user.candidateNumber,
				savedTracksCount
			},
			profile,
			preferences
		});
	} catch (error: any) {
		console.error('[API /api/auth/login POST] Error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'שגיאה בהתחברות למערכת' },
			{ status: 500 }
		);
	}
}
