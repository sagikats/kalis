import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, email, password, phone, guestUserId } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return NextResponse.json(
				{ success: false, error: 'כתובת אימייל אינה תקינה' },
				{ status: 400 }
			);
		}

		if (!password || typeof password !== 'string' || password.length < 6) {
			return NextResponse.json(
				{ success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
				{ status: 400 }
			);
		}

		if (!name || typeof name !== 'string' || name.trim().length === 0) {
			return NextResponse.json(
				{ success: false, error: 'יש להזין שם מלא' },
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		// Register user
		const user = await dbRepository.registerUserAsync({
			name,
			email,
			password,
			phone
		});

		// Seamless Guest-to-User migration: if the user previously saved tracks or a profile as guest
		if (guestUserId && typeof guestUserId === 'string' && guestUserId.trim().length > 0 && guestUserId !== user.id) {
			try {
				// Re-assign saved tracks to the registered user
				await prisma.savedTrack.updateMany({
					where: { userId: guestUserId },
					data: { userId: user.id }
				});

				// Re-assign profile if registered user doesn't already have one
				const guestProfile = await prisma.userAcademicProfile.findUnique({
					where: { userId: guestUserId },
					include: { subjectGrades: true }
				});

				if (guestProfile) {
					await prisma.userAcademicProfile.deleteMany({ where: { userId: user.id } });
					await prisma.userAcademicProfile.update({
						where: { id: guestProfile.id },
						data: { userId: user.id }
					});
				}

				// Re-assign preferences
				const guestPrefs = await prisma.userPreferences.findUnique({
					where: { userId: guestUserId }
				});
				if (guestPrefs) {
					await prisma.userPreferences.deleteMany({ where: { userId: user.id } });
					await prisma.userPreferences.update({
						where: { id: guestPrefs.id },
						data: { userId: user.id }
					});
				}
			} catch (migrationErr) {
				console.warn('[Auth Register] Guest migration notice:', migrationErr);
			}
		}

		const savedTracksCount = await prisma.savedTrack.count({
			where: { userId: user.id }
		});

		const profile = await dbRepository.getUserProfileAsync(user.id);
		const preferences = await dbRepository.getUserPreferencesAsync(user.id);

		return NextResponse.json({
			success: true,
			message: 'ההרשמה הושלמה בהצלחה!',
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
		console.error('[API /api/auth/register POST] Error:', error);
		const isDuplicate = error.message?.includes('כבר רשומה') || error.code === 'P2002';
		return NextResponse.json(
			{
				success: false,
				error: isDuplicate ? 'כתובת אימייל זו כבר רשומה במערכת' : (error.message || 'שגיאה ביצירת משתמש')
			},
			{ status: isDuplicate ? 409 : 500 }
		);
	}
}
