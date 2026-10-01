import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Admin-only DB download. Requires `Authorization: Bearer <BACKUP_TOKEN>`.
 * If BACKUP_TOKEN is not configured on the server, the endpoint is disabled.
 * Prefer `npm run db:backup` on the server itself.
 */
function isAuthorized(req: NextRequest): boolean {
	const expected = process.env.BACKUP_TOKEN;
	if (!expected || expected.length < 32) return false;

	const header = req.headers.get('authorization') || '';
	const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';

	const a = crypto.createHash('sha256').update(provided).digest();
	const b = crypto.createHash('sha256').update(expected).digest();
	return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
	if (!isAuthorized(req)) {
		return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
	}

	try {
		const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

		if (!fs.existsSync(dbPath)) {
			return NextResponse.json(
				{ success: false, error: 'קובץ הדאתא-בייס לא נמצא בשרת' },
				{ status: 404 }
			);
		}

		const fileBuffer = fs.readFileSync(dbPath);
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		const filename = `kalis_backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.db`;

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/x-sqlite3',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Content-Length': String(fileBuffer.length),
				'Cache-Control': 'no-store'
			}
		});
	} catch (error) {
		console.error('[API /api/backup GET] Error:', error);
		return NextResponse.json(
			{ success: false, error: 'שגיאה ביצירת קובץ הגיבוי' },
			{ status: 500 }
		);
	}
}
