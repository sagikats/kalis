'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	phone?: string;
	candidateNumber?: string;
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
	isAuthenticated: boolean;
	isLoading: boolean;
	isAuthModalOpen: boolean;
	authModalMode: 'login' | 'register';
	openAuthModal: (mode?: 'login' | 'register') => void;
	closeAuthModal: () => void;
	login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
	register: (params: RegisterParams) => Promise<{ success: boolean; error?: string; candidateNumber?: string }>;
	logout: () => void;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
	USER: 'kalis_auth_user',
	USER_ID: 'kalis_user_id',
	CANDIDATE_NUMBER: 'kalis_candidate_number'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<AuthUser | null>(null);
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

					// Silently fetch fresh user profile & saved tracks count in background
					fetch(`/api/auth/me?userId=${encodeURIComponent(parsedUser.id)}`)
						.then(res => res.json())
						.then(data => {
							if (data.success && data.user) {
								setUser(data.user);
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
			const guestUserId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || undefined : undefined;

			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, guestUserId })
			});

			const data = await res.json();
			if (!data.success) {
				return { success: false, error: data.error || 'התחברות נכשלה' };
			}

			const authedUser: AuthUser = data.user;
			setUser(authedUser);

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
			const guestUserId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || undefined : undefined;

			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...params,
					guestUserId
				})
			});

			const data = await res.json();
			if (!data.success) {
				return { success: false, error: data.error || 'ההרשמה נכשלה' };
			}

			const registeredUser: AuthUser = data.user;
			setUser(registeredUser);

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

	const logout = useCallback(() => {
		setUser(null);
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEYS.USER);
			localStorage.removeItem(STORAGE_KEYS.USER_ID);
			localStorage.removeItem(STORAGE_KEYS.CANDIDATE_NUMBER);
		}
	}, []);

	const refreshUser = useCallback(async () => {
		if (!user?.id) return;
		try {
			const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(user.id)}`);
			const data = await res.json();
			if (data.success && data.user) {
				setUser(data.user);
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
				isAuthenticated: !!user,
				isLoading,
				isAuthModalOpen,
				authModalMode,
				openAuthModal,
				closeAuthModal,
				login,
				register,
				logout,
				refreshUser
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
