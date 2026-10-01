'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	phone?: string;
	candidateNumber?: string;
	image?: string;
	authProvider?: string;
	savedTracksCount?: number;
}

interface RegisterParams {
	name: string;
	email: string;
	password: string;
	phone?: string;
}

interface AuthContextType {
	user: AuthUser | null;
	profile: any | null;
	preferences: any | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isAuthModalOpen: boolean;
	authModalMode: 'login' | 'register';
	openAuthModal: (mode?: 'login' | 'register') => void;
	closeAuthModal: () => void;
	login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
	loginWithGoogle: (payload: { credential?: string; accessToken?: string }) => Promise<{ success: boolean; error?: string }>;
	register: (params: RegisterParams) => Promise<{ success: boolean; error?: string; candidateNumber?: string }>;
	logout: () => void;
	refreshUser: () => Promise<void>;
	setProfile: (profile: any) => void;
	setPreferences: (preferences: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
	USER: 'kalis_auth_user',
	USER_ID: 'kalis_user_id',
	CANDIDATE_NUMBER: 'kalis_candidate_number'
};

function clearStoredAuth() {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(STORAGE_KEYS.USER);
	localStorage.removeItem(STORAGE_KEYS.USER_ID);
	localStorage.removeItem(STORAGE_KEYS.CANDIDATE_NUMBER);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [profile, setProfile] = useState<any | null>(null);
	const [preferences, setPreferences] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

	// Synchronize stored user on client mount
	useEffect(() => {
		try {
			if (typeof window !== 'undefined') {
				const storedUserJson = localStorage.getItem(STORAGE_KEYS.USER);
				if (storedUserJson) {
					const parsedUser: AuthUser = JSON.parse(storedUserJson);
					setUser(parsedUser);

					// Silently fetch fresh user profile & saved tracks count in background.
					// Identity comes from the HttpOnly session cookie; if it's missing/expired
					// the cached user is stale and must be dropped.
					fetch('/api/auth/me')
						.then(async (res) => {
							if (res.status === 401) {
								clearStoredAuth();
								setUser(null);
								setProfile(null);
								setPreferences(null);
								return null;
							}
							const contentType = res.headers.get('content-type') || '';
							if (!contentType.includes('application/json')) return null;
							return res.json();
						})
						.then(data => {
							if (data && data.success && data.user) {
								setUser(data.user);
								if (data.profile) setProfile(data.profile);
								if (data.preferences) setPreferences(data.preferences);
								localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
								if (data.user.candidateNumber) {
									localStorage.setItem(STORAGE_KEYS.CANDIDATE_NUMBER, data.user.candidateNumber);
								}
							}
						})
						.catch(err => {
							console.warn('[AuthContext] Background profile sync failed:', err);
						});
				}
			}
		} catch (err) {
			console.error('[AuthContext] Error loading cached user:', err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
		setAuthModalMode(mode);
		setIsAuthModalOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsAuthModalOpen(false);
	}, []);

	const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await res.json();
			if (!data.success) {
				return { success: false, error: data.error || 'התחברות נכשלה' };
			}

			const authedUser: AuthUser = data.user;
			setUser(authedUser);
			if (data.profile) setProfile(data.profile);
			if (data.preferences) setPreferences(data.preferences);

			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authedUser));
				localStorage.setItem(STORAGE_KEYS.USER_ID, authedUser.id);
				if (authedUser.candidateNumber) {
					localStorage.setItem(STORAGE_KEYS.CANDIDATE_NUMBER, authedUser.candidateNumber);
				}
			}

			return { success: true };
		} catch (err: any) {
			console.error('[AuthContext] Login error:', err);
			return { success: false, error: 'שגיאת תקשורת עם השרת' };
		}
	}, []);

	const register = useCallback(async (params: RegisterParams): Promise<{ success: boolean; error?: string; candidateNumber?: string }> => {
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});

			const data = await res.json();
			if (!data.success) {
				return { success: false, error: data.error || 'ההרשמה נכשלה' };
			}

			const registeredUser: AuthUser = data.user;
			setUser(registeredUser);
			if (data.profile) setProfile(data.profile);
			if (data.preferences) setPreferences(data.preferences);

			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(registeredUser));
				localStorage.setItem(STORAGE_KEYS.USER_ID, registeredUser.id);
				if (registeredUser.candidateNumber) {
					localStorage.setItem(STORAGE_KEYS.CANDIDATE_NUMBER, registeredUser.candidateNumber);
				}
			}

			return {
				success: true,
				candidateNumber: registeredUser.candidateNumber
			};
		} catch (err: any) {
			console.error('[AuthContext] Register error:', err);
			return { success: false, error: 'שגיאת תקשורת עם השרת' };
		}
	}, []);

	const loginWithGoogle = useCallback(async (payload: { credential?: string; accessToken?: string }): Promise<{ success: boolean; error?: string }> => {
		try {
			const res = await fetch('/api/auth/google', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await res.json();
			if (!data.success) {
				return { success: false, error: data.error || 'התחברות עם Google נכשלה' };
			}

			const authedUser: AuthUser = data.user;
			setUser(authedUser);
			if (data.profile) setProfile(data.profile);
			if (data.preferences) setPreferences(data.preferences);

			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authedUser));
				localStorage.setItem(STORAGE_KEYS.USER_ID, authedUser.id);
				if (authedUser.candidateNumber) {
					localStorage.setItem(STORAGE_KEYS.CANDIDATE_NUMBER, authedUser.candidateNumber);
				}
			}

			return { success: true };
		} catch (err: any) {
			console.error('[AuthContext] loginWithGoogle error:', err);
			return { success: false, error: 'שגיאת תקשורת עם השרת' };
		}
	}, []);

	const logout = useCallback(() => {
		setUser(null);
		setProfile(null);
		setPreferences(null);
		if (typeof window !== 'undefined') {
			// Invalidate the HttpOnly session cookie on the server
			fetch('/api/auth/logout', { method: 'POST' }).catch((err) => {
				console.warn('[AuthContext] Logout request failed:', err);
			});

			clearStoredAuth();

			// Completely wipe all flow and track state from local storage
			localStorage.removeItem('kalis_admission_flow_data');

			try {
				const keysToRemove: string[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key && (key.startsWith('kalis_flow_') || key.startsWith('kalis_admission_flow_'))) {
						keysToRemove.push(key);
					}
				}
				keysToRemove.forEach(k => localStorage.removeItem(k));
			} catch (e) {
				console.warn('[AuthContext] LocalStorage cleanup warning:', e);
			}

			// Broadcast logout event so all mounted pages/components reset to clean blank state immediately
			window.dispatchEvent(new Event('kalis-logout'));
		}
	}, []);

	const refreshUser = useCallback(async () => {
		if (!user?.id) return;
		try {
			const res = await fetch('/api/auth/me');
			if (res.status === 401) {
				clearStoredAuth();
				setUser(null);
				setProfile(null);
				setPreferences(null);
				return;
			}
			const contentType = res.headers.get('content-type') || '';
			if (!res.ok || !contentType.includes('application/json')) return;
			const data = await res.json();
			if (data && data.success && data.user) {
				setUser(data.user);
				if (data.profile) setProfile(data.profile);
				if (data.preferences) setPreferences(data.preferences);
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
				}
			}
		} catch (err) {
			console.error('[AuthContext] Refresh user error:', err);
		}
	}, [user?.id]);

	return (
		<AuthContext.Provider
			value={{
				user,
				profile,
				preferences,
				isAuthenticated: !!user,
				isLoading,
				isAuthModalOpen,
				authModalMode,
				openAuthModal,
				closeAuthModal,
				login,
				loginWithGoogle,
				register,
				logout,
				refreshUser,
				setProfile,
				setPreferences
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
