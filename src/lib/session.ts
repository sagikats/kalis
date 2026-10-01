import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Stateless signed-cookie sessions.
 *
 * The cookie holds `base64url({ uid, exp }).hmacSha256` and is HttpOnly, so the
 * browser can't read or forge it. The server derives the user's identity ONLY
 * from this cookie — never from a userId sent in the request body/query.
 */

export const SESSION_COOKIE = 'kalis_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

let cachedSecret: Buffer | null = null;

/**
 * Secret resolution order:
 * 1. SESSION_SECRET env var (recommended in production).
 * 2. A random secret persisted at prisma/.session_secret (lives on the same
 *    Docker volume as the DB, so it survives restarts and redeploys).
 */
function getSecret(): Buffer {
	if (cachedSecret) return cachedSecret;

	const fromEnv = process.env.SESSION_SECRET;
	if (fromEnv && fromEnv.length >= 32) {
		cachedSecret = Buffer.from(fromEnv, 'utf8');
		return cachedSecret;
	}

	const secretPath = path.join(process.cwd(), 'prisma', '.session_secret');
	try {
		const existing = fs.readFileSync(secretPath, 'utf8').trim();
		if (existing.length >= 64) {
			cachedSecret = Buffer.from(existing, 'hex');
			return cachedSecret;
		}
	} catch {
		// File does not exist yet — generate below
	}

	const generated = crypto.randomBytes(48).toString('hex');
	fs.writeFileSync(secretPath, generated, { mode: 0o600 });
	cachedSecret = Buffer.from(generated, 'hex');
	return cachedSecret;
}

function sign(data: string): string {
	return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createSessionToken(userId: string, ttlSeconds: number = SESSION_TTL_SECONDS): string {
	const payload = Buffer.from(
		JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }),
		'utf8'
	).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
	if (!token || typeof token !== 'string') return null;
	const [payload, signature] = token.split('.');
	if (!payload || !signature) return null;

	const expected = Buffer.from(sign(payload));
	const actual = Buffer.from(signature);
	if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
		return null;
	}

	try {
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		if (typeof data?.uid !== 'string' || typeof data?.exp !== 'number') return null;
		if (data.exp < Math.floor(Date.now() / 1000)) return null;
		return data.uid;
	} catch {
		return null;
	}
}

/** Returns the authenticated user id, or null if there is no valid session. */
export function getSessionUserId(req: NextRequest): string | null {
	return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(res: NextResponse, userId: string): void {
	res.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: SESSION_TTL_SECONDS
	});
}

export function clearSessionCookie(res: NextResponse): void {
	res.cookies.set(SESSION_COOKIE, '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 0
	});
}
