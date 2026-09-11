import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get('userId') || req.headers.get('x-user-id');

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'לא סופק מזהה משתמש' },
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.getUserAsync(userId);
		if (!user) {
			return NextResponse.json(
				{ success: false, error: 'המשתמש לא נמצא' },
				{ status: 404 }
			);
		}

		const savedTracksCount = await prisma.savedTrack.count({
			where: { userId: user.id }
		});

		const profile = await dbRepository.getUserProfileAsync(user.id);
		const preferences = await dbRepository.getUserPreferencesAsync(user.id);

		return NextResponse.json({
			success: true,
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
		console.error('[API /api/auth/me GET] Error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'שגיאה באחזור נתוני משתמש' },
			{ status: 500 }
		);
	}
}
