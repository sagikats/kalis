/**
 * Kalis Database Backup Utility
 * Creates a timestamped snapshot of the SQLite database in prisma/backups/
 */

import fs from 'fs';
import path from 'path';

function runBackup() {
	const projectRoot = process.cwd();
	const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
	const backupsDir = path.join(projectRoot, 'prisma', 'backups');

	if (!fs.existsSync(dbPath)) {
		console.error('❌ שגיאה: קובץ הדאתא-בייס לא נמצא בנתיב:', dbPath);
		process.exit(1);
	}

	if (!fs.existsSync(backupsDir)) {
		fs.mkdirSync(backupsDir, { recursive: true });
	}

	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
	
	const backupFileName = `kalis_backup_${timestamp}.db`;
	const targetPath = path.join(backupsDir, backupFileName);
	const latestPath = path.join(backupsDir, 'kalis_backup_latest.db');

	fs.copyFileSync(dbPath, targetPath);
	fs.copyFileSync(dbPath, latestPath);

	const stats = fs.statSync(targetPath);
	const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

	console.log('\n=============================================');
	console.log('🎉 גיבוי הדאתא-בייס הושלם בהצלחה!');
	console.log('=============================================');
	console.log(`📁 שם קובץ הגיבוי: ${backupFileName}`);
	console.log(`💾 גודל הקובץ:     ${sizeMb} MB (${stats.size.toLocaleString()} בתים)`);
	console.log(`📍 נתיב מלא במחשב: ${targetPath}`);
	console.log(`⭐ עותק עדכני:     ${latestPath}`);
	console.log('=============================================\n');
}

runBackup();
