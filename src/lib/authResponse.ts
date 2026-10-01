import { NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';
import type { UserRecord } from '@/modules/db/schema';

/**
 * Builds the standard authenticated-user response (safe user fields + profile + preferences).
 * When `startSession` is true, also issues the signed HttpOnly session cookie.
 */
export async function buildAuthUserResponse(
	user: UserRecord,
	options: { message?: string; startSession?: boolean } = {}
): Promise<NextResponse> {
	const savedTracksCount = await prisma.savedTrack.count({ where: { userId: user.id } });
	const profile = await dbRepository.getUserProfileAsync(user.id);
	const preferences = await dbRepository.getUserPreferencesAsync(user.id);

	const res = NextResponse.json({
		success: true,
		...(options.message ? { message: options.message } : {}),
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

	if (options.startSession) {
		setSessionCookie(res, user.id);
	}
	return res;
}

export function unauthorizedResponse(error = 'יש להתחבר לאתר כדי לבצע פעולה זו'): NextResponse {
	return NextResponse.json({ success: false, error }, { status: 401 });
}
