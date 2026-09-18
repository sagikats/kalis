/**
 * Subagent 5: Automated QA & Track Quality Auditor
 * CLI Entrypoint
 */

import fs from 'fs';
import path from 'path';
import { runBatchAudit, formatAuditMarkdownReport } from './runner';

console.log('🚀 הפעלת סוכן בדיקות איכות ובקרת מסלולים — Subagent 5: QA Auditor...');
const summary = runBatchAudit();
const reportMarkdown = formatAuditMarkdownReport(summary);

// Write to artifact directory
const artifactDir = process.env.ARTIFACT_DIR || '/Users/sagikats/.gemini/antigravity-ide/brain/5818b513-7a00-4269-826a-4fcfab52e64f';
const artifactPath = path.join(artifactDir, 'track_qa_audit_report.md');
try {
	if (fs.existsSync(artifactDir)) {
		fs.writeFileSync(artifactPath, reportMarkdown, 'utf-8');
		console.log(`📄 הדוח המלא נשמר כ-Artifact בנתיב: ${artifactPath}`);
	}
	// Also save a persistent copy in docs/
	const docsDir = path.join(process.cwd(), 'docs');
	if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
	fs.writeFileSync(path.join(docsDir, 'track_qa_audit_report.md'), reportMarkdown, 'utf-8');
	console.log(`📄 עותק נשמר ב: docs/track_qa_audit_report.md`);
} catch (e) {
	console.error('Failed to write artifact:', e);
}

console.log(`\n======================================================`);
console.log(`✅ סוכן QA השלים את הסריקה על כלל המוסדות!`);
console.log(`📊 תרחישים שנבדקו: ${summary.totalScenariosTested}`);
console.log(`🛣️ מסלולי פעולה שנותחו: ${summary.totalTracksAudited}`);
console.log(`⭐ ציון איכות ממוצע: ${summary.averageQualityScore} מתוך 100`);
console.log(`✨ שיעור מסלולים ללא רבב: ${summary.cleanTracksPercentage}%`);
console.log(`❌ שגיאות קריטיות: ${summary.criticalIssuesTotal}`);
console.log(`⚠️ הערות ואזהרות: ${summary.warningsTotal}`);
console.log(`======================================================\n`);
