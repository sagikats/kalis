/**
 * Duplicate prevention when adding bagrut subjects: the extended ("מוגבר") catalog entry of a subject the
 * applicant already has is the same subject, but subjects that merely share a word are not.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSameBagrutSubject } from '../solver';

describe('isSameBagrutSubject', () => {
	it('treats extended / track variants as the same subject', () => {
		assert.ok(isSameBagrutSubject('היסטוריה / תע"י', 'היסטוריה (מוגבר 5 יח"ל)'));
		assert.ok(isSameBagrutSubject('תנ"ך', 'תנ"ך (מוגבר 5 יח"ל)'));
		assert.ok(isSameBagrutSubject('תנ"ך', 'תנ"ך חמ"ד (מוגבר 5 יח"ל)'));
		assert.ok(isSameBagrutSubject('ספרות עברית', 'ספרות עברית (מוגבר 5 יח"ל)'));
		assert.ok(isSameBagrutSubject('אזרחות', 'אזרחות (מוגבר 5 יח"ל)'));
		assert.ok(isSameBagrutSubject('מדעי המחשב', 'מדעי המחשב'));
	});

	it('does not pair different subjects that share a word', () => {
		assert.ok(!isSameBagrutSubject('מדעי המחשב', 'מחשבת ישראל'));
		assert.ok(!isSameBagrutSubject('מדעי המחשב', 'אלקטרוניקה ומחשבים'));
		assert.ok(!isSameBagrutSubject('ספרות עברית', 'ספרות ערבית (מוגבר 5 יח"ל)'));
		assert.ok(!isSameBagrutSubject('הבעה עברית', 'לשון והבעה ערבית'));
		assert.ok(!isSameBagrutSubject('כימיה', 'ביוכימיה'));
	});
});
