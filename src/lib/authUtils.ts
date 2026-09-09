import crypto from 'crypto';

/**
 * Hash a plain password with a random salt using scrypt
 */
export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

/**
 * Verify a plain password against a stored salted scrypt hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
	try {
		const [salt, key] = storedHash.split(':');
		if (!salt || !key) return false;
		const keyBuffer = Buffer.from(key, 'hex');
		const derivedKey = crypto.scryptSync(password, salt, 64);
		return crypto.timingSafeEqual(keyBuffer, derivedKey);
	} catch {
		return false;
	}
}
