import type { NextRequest } from 'next/server';

/**
 * Minimal in-memory fixed-window rate limiter (single server instance).
 * Used to slow down password brute-forcing and account-creation spam.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest): string {
	const forwarded = req.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	return req.headers.get('x-real-ip') || 'unknown';
}

/** Returns true if the request is allowed, false if the limit was exceeded. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();

	// Opportunistic cleanup so the map doesn't grow without bound
	if (buckets.size > 10_000) {
		for (const [k, b] of buckets) {
			if (b.resetAt <= now) buckets.delete(k);
		}
	}

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	bucket.count += 1;
	return bucket.count <= limit;
}
