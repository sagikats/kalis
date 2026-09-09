import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, name, profile, preferences } = body;

		const user = await dbRepository.createUserAsync(email, name);

		let savedProfile = null;
		if (profile) {
			profile.userId = user.id;
			savedProfile = await dbRepository.saveUserProfileAsync(profile);
		}

		let savedPreferences = null;
		if (preferences) {
			preferences.userId = user.id;
			savedPreferences = await dbRepository.saveUserPreferencesAsync(preferences);
		}

		return NextResponse.json({
			success: true,
			user,
			profile: savedProfile,
			preferences: savedPreferences
		});
	} catch (error: any) {
		console.error('[API /api/users POST] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Failed to create user or profile'
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');

		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'Missing required query parameter: userId' },
				{ status: 400 }
			);
		}

		const user = await dbRepository.getUserAsync(userId);
		const profile = await dbRepository.getUserProfileAsync(userId);
		const preferences = await dbRepository.getUserPreferencesAsync(userId);

		return NextResponse.json({
			success: true,
			user,
			profile,
			preferences
		});
	} catch (error: any) {
		console.error('[API /api/users GET] Error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || 'Failed to fetch user'
			},
			{ status: 500 }
		);
	}
}
