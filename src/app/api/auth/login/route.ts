import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { buildAuthUserResponse } from '@/lib/authResponse';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { email, password } = body;

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

		const ip = getClientIp(req);
		const normalizedEmail = email.trim().toLowerCase();
		if (
			!checkRateLimit(`login:ip:${ip}`, 30, FIFTEEN_MINUTES) ||
			!checkRateLimit(`login:email:${normalizedEmail}`, 10, FIFTEEN_MINUTES)
		) {
			return NextResponse.json(
				{ success: false, error: 'יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.' },
				{ status: 429 }
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

		return buildAuthUserResponse(user, { message: 'התחברת בהצלחה!', startSession: true });
	} catch (error) {
		console.error('[API /api/auth/login POST] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'שגיאה בהתחברות למערכת' },
			{ status: 500 }
		);
	}
}
