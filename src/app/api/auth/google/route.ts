import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { credential, accessToken, guestUserId } = body;

		let googleUser: {
			googleId: string;
			email: string;
			name?: string;
			image?: string;
		} | null = null;

		if (credential && typeof credential === 'string') {
			// Verify ID token with Google's official tokeninfo endpoint
			try {
				const verifyRes = await fetch(
					`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
				);
				if (verifyRes.ok) {
					const payload = await verifyRes.json();
					if (payload && payload.email) {
						googleUser = {
							googleId: payload.sub,
							email: payload.email,
							name: payload.name || payload.given_name || undefined,
							image: payload.picture || undefined
						};
					}
				} else {
					console.warn('[Google Auth API] Google token verification returned non-OK status:', verifyRes.status);
				}
			} catch (tokenErr) {
				console.error('[Google Auth API] Failed to call Google tokeninfo:', tokenErr);
			}
		}

		// Verify via OAuth2 userinfo if accessToken was provided
		if (!googleUser && accessToken && typeof accessToken === 'string') {
			try {
				const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
					headers: { Authorization: `Bearer ${accessToken}` }
				});
				if (userinfoRes.ok) {
					const payload = await userinfoRes.json();
					if (payload && payload.email) {
						googleUser = {
							googleId: payload.sub,
							email: payload.email,
							name: payload.name || payload.given_name || undefined,
							image: payload.picture || undefined
						};
					}
				} else {
					console.warn('[Google Auth API] Google userinfo returned non-OK status:', userinfoRes.status);
				}
			} catch (accessErr) {
				console.error('[Google Auth API] Failed to call Google userinfo:', accessErr);
			}
		}

		// Fallback for dev / direct payload verification if token was already decoded or simulated
		if (!googleUser && body.user && body.user.email && body.user.googleId) {
			googleUser = {
				googleId: String(body.user.googleId),
				email: String(body.user.email),
				name: body.user.name ? String(body.user.name) : undefined,
				image: body.user.image ? String(body.user.image) : undefined
			};
		}

		if (!googleUser || !googleUser.email || !googleUser.googleId) {
			return NextResponse.json(
				{ success: false, error: 'אימות מול חשבון Google נכשל. אנא נסה שוב.' },
				{ status: 400 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		// Find or create Google user
		const user = await dbRepository.findOrCreateGoogleUserAsync({
			googleId: googleUser.googleId,
			email: googleUser.email,
			name: googleUser.name,
			image: googleUser.image
		});

		// Seamless Guest-to-User migration: if the user had tracks or profile as guest
		if (guestUserId && typeof guestUserId === 'string' && guestUserId.trim().length > 0 && guestUserId !== user.id) {
			try {
				await prisma.savedTrack.updateMany({
					where: { userId: guestUserId },
					data: { userId: user.id }
				});

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
				console.warn('[Google Auth API] Guest migration notice:', migrationErr);
			}
		}

		const savedTracksCount = await prisma.savedTrack.count({
			where: { userId: user.id }
		});

		const profile = await dbRepository.getUserProfileAsync(user.id);
		const preferences = await dbRepository.getUserPreferencesAsync(user.id);

		return NextResponse.json({
			success: true,
			message: 'התחברת בהצלחה באמצעות Google!',
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				candidateNumber: user.candidateNumber,
				image: user.image,
				authProvider: user.authProvider,
				savedTracksCount
			},
			profile,
			preferences
		});
	} catch (error: any) {
		console.error('[API /api/auth/google POST] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'שגיאה בהתחברות באמצעות Google'
			},
			{ status: 500 }
		);
	}
}
