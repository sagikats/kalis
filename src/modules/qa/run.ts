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
const artifactDir = '/Users/sagikats/.gemini/antigravity-ide/brain/1fe02994-97b5-48a3-81cf-039ad169d76a';
const artifactPath = path.join(artifactDir, 'track_qa_audit_report.md');
try {
	fs.writeFileSync(artifactPath, reportMarkdown, 'utf-8');
	console.log(`📄 הדוח המלא נשמר כ-Artifact בנתיב: ${artifactPath}`);
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
