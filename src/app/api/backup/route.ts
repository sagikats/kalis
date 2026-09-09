import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
	try {
		const projectRoot = process.cwd();
		const dbPath = path.join(projectRoot, 'prisma', 'dev.db');

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
				'Content-Length': String(fileBuffer.length)
			}
		});
	} catch (error: any) {
		console.error('[API /api/backup GET] Error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'שגיאה ביצירת קובץ הגיבוי' },
			{ status: 500 }
		);
	}
}
