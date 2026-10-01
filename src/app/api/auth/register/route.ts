import { NextRequest, NextResponse } from 'next/server';
import { dbRepository } from '@/modules/db';
import { buildAuthUserResponse } from '@/lib/authResponse';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ONE_HOUR = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, email, password, phone } = body;

		if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
			return NextResponse.json(
				{ success: false, error: 'כתובת אימייל אינה תקינה' },
				{ status: 400 }
			);
		}

		if (!password || typeof password !== 'string' || password.length < 6 || password.length > 200) {
			return NextResponse.json(
				{ success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
				{ status: 400 }
			);
		}

		if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
			return NextResponse.json(
				{ success: false, error: 'יש להזין שם מלא' },
				{ status: 400 }
			);
		}

		if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 30)) {
			return NextResponse.json(
				{ success: false, error: 'מספר הטלפון אינו תקין' },
				{ status: 400 }
			);
		}

		if (!checkRateLimit(`register:ip:${getClientIp(req)}`, 10, ONE_HOUR)) {
			return NextResponse.json(
				{ success: false, error: 'יותר מדי ניסיונות הרשמה. נסה שוב מאוחר יותר.' },
				{ status: 429 }
			);
		}

		await dbRepository.ensureSyncedFromSQLite();

		const user = await dbRepository.registerUserAsync({
			name,
			email,
			password,
			phone: phone || undefined
		});

		return buildAuthUserResponse(user, { message: 'ההרשמה הושלמה בהצלחה!', startSession: true });
	} catch (error: any) {
		console.error('[API /api/auth/register POST] Error:', error);
		const isDuplicate = error?.message?.includes('כבר רשומה') || error?.code === 'P2002';
		return NextResponse.json(
			{
				success: false,
				error: isDuplicate ? 'כתובת אימייל זו כבר רשומה במערכת' : 'שגיאה ביצירת משתמש'
			},
			{ status: isDuplicate ? 409 : 500 }
		);
	}
}
