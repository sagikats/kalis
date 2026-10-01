import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { getSessionUserId } from '@/lib/session';
import { unauthorizedResponse } from '@/lib/authResponse';

/**
 * Profile & preferences of the CURRENTLY LOGGED-IN user.
 * The user is identified only by the session cookie; userId fields in the request are ignored.
 * (Account creation goes through /api/auth/register or /api/auth/google.)
 */

export async function GET(request: NextRequest) {
	try {
		const userId = getSessionUserId(request);
		if (!userId) return unauthorizedResponse();

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.getUserAsync(userId);
		if (!user) return unauthorizedResponse();

		const profile = await dbRepository.getUserProfileAsync(userId);
		const preferences = await dbRepository.getUserPreferencesAsync(userId);

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				candidateNumber: user.candidateNumber
			},
			profile,
			preferences
		});
	} catch (error) {
		console.error('[API /api/users GET] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch user' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const userId = getSessionUserId(request);
		if (!userId) return unauthorizedResponse();

		const body = await request.json();
		const { profile, preferences } = body;

		await dbRepository.ensureSyncedFromSQLite();

		let savedProfile = null;
		if (profile && typeof profile === 'object') {
			savedProfile = await dbRepository.saveUserProfileAsync({ ...profile, userId });
		}

		let savedPreferences = null;
		if (preferences && typeof preferences === 'object') {
			savedPreferences = await dbRepository.saveUserPreferencesAsync({ ...preferences, userId });
		}

		return NextResponse.json({
			success: true,
			profile: savedProfile,
			preferences: savedPreferences
		});
	} catch (error) {
		console.error('[API /api/users PUT] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'Failed to update user profile' },
			{ status: 500 }
		);
	}
}
