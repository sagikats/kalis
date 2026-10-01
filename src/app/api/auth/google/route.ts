import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { buildAuthUserResponse } from '@/lib/authResponse';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface VerifiedGoogleUser {
	googleId: string;
	email: string;
	name?: string;
	image?: string;
}

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

function isTrue(value: unknown): boolean {
	return value === true || value === 'true';
}

/** Verifies a Google ID token (One Tap / Sign-In button) and checks it was issued for OUR client. */
async function verifyIdToken(idToken: string, clientId: string): Promise<VerifiedGoogleUser | null> {
	const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
	if (!res.ok) return null;
	const payload = await res.json();

	if (payload?.aud !== clientId) return null;
	if (!GOOGLE_ISSUERS.has(payload?.iss)) return null;
	if (!payload?.sub || !payload?.email || !isTrue(payload?.email_verified)) return null;

	return {
		googleId: String(payload.sub),
		email: String(payload.email),
		name: payload.name || payload.given_name || undefined,
		image: payload.picture || undefined
	};
}

/**
 * Verifies an OAuth2 access token (initTokenClient popup flow).
 * First checks via tokeninfo that the token was issued to OUR client — otherwise any
 * site could replay a token a user granted to them — then reads the profile from userinfo.
 */
async function verifyAccessToken(accessToken: string, clientId: string): Promise<VerifiedGoogleUser | null> {
	const infoRes = await fetch(
		`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
	);
	if (!infoRes.ok) return null;
	const info = await infoRes.json();
	if (info?.aud !== clientId && info?.azp !== clientId) return null;

	const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!userRes.ok) return null;
	const payload = await userRes.json();

	if (!payload?.sub || !payload?.email || !isTrue(payload?.email_verified)) return null;
	if (info?.sub && info.sub !== payload.sub) return null;

	return {
		googleId: String(payload.sub),
		email: String(payload.email),
		name: payload.name || payload.given_name || undefined,
		image: payload.picture || undefined
	};
}

export async function POST(req: NextRequest) {
	try {
		const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
		if (!clientId) {
			console.error('[Google Auth API] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
			return NextResponse.json(
				{ success: false, error: 'התחברות עם Google אינה זמינה כרגע' },
				{ status: 503 }
			);
		}

		if (!checkRateLimit(`google:ip:${getClientIp(req)}`, 30, 15 * 60 * 1000)) {
			return NextResponse.json(
				{ success: false, error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.' },
				{ status: 429 }
			);
		}

		const body = await req.json();
		const { credential, accessToken } = body;

		let googleUser: VerifiedGoogleUser | null = null;
		try {
			if (credential && typeof credential === 'string') {
				googleUser = await verifyIdToken(credential, clientId);
			} else if (accessToken && typeof accessToken === 'string') {
				googleUser = await verifyAccessToken(accessToken, clientId);
			}
		} catch (verifyErr) {
			console.error('[Google Auth API] Token verification failed:', verifyErr);
		}

		if (!googleUser) {
			return NextResponse.json(
				{ success: false, error: 'אימות מול חשבון Google נכשל. אנא נסה שוב.' },
				{ status: 401 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.findOrCreateGoogleUserAsync(googleUser);

		return buildAuthUserResponse(user, {
			message: 'התחברת בהצלחה באמצעות Google!',
			startSession: true
		});
	} catch (error) {
		console.error('[API /api/auth/google POST] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'שגיאה בהתחברות באמצעות Google' },
			{ status: 500 }
		);
	}
}
