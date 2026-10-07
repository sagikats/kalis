'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
	X,
	Mail,
	Lock,
	User,
	Phone,
	Sparkles,
	CheckCircle2,
	AlertCircle,
	ArrowRight,
	LogIn,
	UserPlus,
	ShieldCheck
} from 'lucide-react';

export default function AuthModal() {
	const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, loginWithGoogle } = useAuth();

	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [agreeToTerms, setAgreeToTerms] = useState(false);

	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
	const [termsHighlight, setTermsHighlight] = useState(false);
	const [successData, setSuccessData] = useState<{ candidateNumber?: string } | null>(null);

	useEffect(() => {
		if (isAuthModalOpen) {
			setMode(authModalMode);
			setError(null);
			setSuccessData(null);
			setAgreeToTerms(false);
			setTermsHighlight(false);
		}
	}, [isAuthModalOpen, authModalMode]);

	// Handle ESC key to close
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isAuthModalOpen) {
				closeAuthModal();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isAuthModalOpen, closeAuthModal]);

	if (!isAuthModalOpen) return null;

	const handleGoogleLogin = () => {
		// Strict Terms gating in registration mode
		if (mode === 'register' && !agreeToTerms) {
			setError('יש לסמן את תיבת אישור תנאי השימוש ומדיניות הפרטיות כדי להירשם');
			setTermsHighlight(true);
			setTimeout(() => setTermsHighlight(false), 2500);
			return;
		}

		setError(null);
		setIsGoogleSubmitting(true);

		const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
		if (!clientId) {
			setError('מזהה התחברות Google טרם הוגדר במערכת');
			setIsGoogleSubmitting(false);
			return;
		}

		if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
			try {
				const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
					client_id: clientId,
					scope: 'openid email profile',
					callback: async (tokenResponse: any) => {
						if (tokenResponse.error) {
							console.error('[Google SSO] OAuth error:', tokenResponse.error);
							setIsGoogleSubmitting(false);
							if (tokenResponse.error !== 'popup_closed_by_user') {
								setError('ההתחברות עם Google בוטלה או נכשלה. אנא נסה שוב.');
							}
							return;
						}

						if (tokenResponse.access_token) {
							try {
								const res = await loginWithGoogle({ accessToken: tokenResponse.access_token });
								if (!res.success) {
									setError(res.error || 'שגיאה בהתחברות עם Google');
								} else {
									setSuccessData({});
									setTimeout(() => {
										closeAuthModal();
									}, 1200);
								}
							} catch (err: any) {
								console.error('[Google SSO] API call failed:', err);
								setError('שגיאת תקשורת באימות מול Google');
							} finally {
								setIsGoogleSubmitting(false);
							}
						} else {
							setIsGoogleSubmitting(false);
						}
					},
					error_callback: (errorDetails: any) => {
						console.error('[Google SSO] TokenClient error:', errorDetails);
						setIsGoogleSubmitting(false);
						setError('אירעה שגיאה בפתיחת חלון ההתחברות של Google');
					}
				});

				tokenClient.requestAccessToken({ prompt: 'select_account' });
			} catch (clientErr) {
				console.error('[Google SSO] initTokenClient failed:', clientErr);
				setIsGoogleSubmitting(false);
				setError('שגיאה באתחול שירות Google');
			}
		} else {
			// Fallback: If Google SDK hasn't finished loading yet, retry after 600ms
			setTimeout(() => {
				if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
					setIsGoogleSubmitting(false);
					handleGoogleLogin();
				} else {
					setIsGoogleSubmitting(false);
					setError('שירותי Google עדיין בטעינה. אנא נסה שוב בעוד רגע.');
				}
			}, 600);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			if (mode === 'login') {
				const res = await login(email, password);
				if (!res.success) {
					setError(res.error || 'שגיאה בהתחברות למערכת');
				} else {
					setSuccessData({});
					setTimeout(() => {
						closeAuthModal();
					}, 1200);
				}
			} else {
				if (!name.trim()) {
					setError('יש להזין שם מלא');
					setIsSubmitting(false);
					return;
				}
				if (password.length < 6) {
					setError('הסיסמה חייבת להכיל לפחות 6 תווים');
					setIsSubmitting(false);
					return;
				}
				if (!agreeToTerms) {
					setError('יש לסמן את תיבת אישור תנאי השימוש ומדיניות הפרטיות כדי להירשם');
					setTermsHighlight(true);
					setTimeout(() => setTermsHighlight(false), 2500);
					setIsSubmitting(false);
					return;
				}

				const res = await register({ name, email, password, phone: phone.trim() || undefined });
				if (!res.success) {
					setError(res.error || 'שגיאה בהרשמה למערכת');
				} else {
					setSuccessData({ candidateNumber: res.candidateNumber });
					setTimeout(() => {
						closeAuthModal();
					}, 2200);
				}
			}
		} catch (err: any) {
			setError('אירעה שגיאה בלתי צפויה');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
			{/* Backdrop click to close */}
			<div className="absolute inset-0" onClick={closeAuthModal} />

			<div
				dir="rtl"
				className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-line overflow-hidden z-10 animate-in zoom-in-95 duration-200"
			>
				{/* Top Header Decor */}
				<div className="bg-paper border-b border-line p-6 text-center relative overflow-hidden">
					<button
						onClick={closeAuthModal}
						className="absolute top-4 left-4 p-1.5 rounded-full text-ink-2 hover:text-ink hover:bg-line/50 transition-colors cursor-pointer"
						aria-label="סגור"
					>
						<X className="w-5 h-5" />
					</button>

					<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-line text-ink shadow-sm mb-3">
						{mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
					</div>

					<h3 className="text-xl font-bold text-ink tracking-tight">
						{mode === 'login' ? 'ברוכים השבים למתקבלים' : 'הצטרפות לפלטפורמת מתקבלים'}
					</h3>
					<p className="text-xs text-ink-2 mt-1 max-w-xs mx-auto">
						{mode === 'login'
							? 'התחבר כדי לצפות במסלולים השמורים שלך ולנהל את תוכנית הקבלה'
							: 'הרשמה מהירה מאפשרת לשמור את המסלולים שלך ולסנכרן את הנתונים'}
					</p>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-line bg-paper/60 p-1">
					<button
						type="button"
						onClick={() => {
							setMode('login');
							setError(null);
							setTermsHighlight(false);
						}}
						className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
							mode === 'login'
								? 'bg-white text-ink shadow-xs'
								: 'text-ink-2 hover:text-ink'
						}`}
					>
						<LogIn className="w-4 h-4" />
						התחברות
					</button>
					<button
						type="button"
						onClick={() => {
							setMode('register');
							setError(null);
							setTermsHighlight(false);
						}}
						className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
							mode === 'register'
								? 'bg-white text-ink shadow-xs'
								: 'text-ink-2 hover:text-ink'
						}`}
					>
						<UserPlus className="w-4 h-4" />
						הרשמה חדשה
					</button>
				</div>

				{/* Success State */}
				{successData ? (
					<div className="p-8 text-center animate-in zoom-in-95 duration-200">
						<div className="w-16 h-16 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/25">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h4 className="text-lg font-bold text-ink mb-2">
							{mode === 'register' ? 'נרשמת בהצלחה למערכת!' : 'התחברת בהצלחה!'}
						</h4>
						<p className="text-xs text-ink-3 mt-3">החלון ייסגר כעת אוטומטית...</p>
					</div>
				) : (
					/* Form Body */
					<div className="p-6">
						{error && (
							<div className="mb-4 p-3 bg-danger-soft border border-danger/25 rounded-xl text-xs text-danger flex items-center gap-2 animate-in fade-in">
								<AlertCircle className="w-4 h-4 shrink-0 text-danger" />
								<span>{error}</span>
							</div>
						)}

						{/* Google SSO Button */}
						<button
							type="button"
							onClick={handleGoogleLogin}
							disabled={isGoogleSubmitting || isSubmitting}
							className={`w-full py-3 px-4 bg-white hover:bg-paper border border-line-strong hover:border-ink/50 text-ink font-semibold text-xs sm:text-sm rounded-2xl shadow-2xs transition-all duration-150 flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer ${
								isGoogleSubmitting ? 'opacity-70 cursor-wait' : ''
							}`}
						>
							{isGoogleSubmitting ? (
								<div className="w-4 h-4 border-2 border-ink-3 border-t-ink rounded-full animate-spin" />
							) : (
								<>
									{/* Official Google 4-color SVG G Logo */}
									<svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
										<path
											fill="#4285F4"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="#34A853"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="#FBBC05"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
										/>
										<path
											fill="#EA4335"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
										/>
									</svg>
									<span>{mode === 'login' ? 'התחבר באמצעות Google' : 'הירשם באמצעות Google'}</span>
								</>
							)}
						</button>

						{/* In Register mode: Prominent Terms of Service Checkbox */}
						{mode === 'register' && (
							<div
								className={`mt-3.5 p-3.5 bg-paper border rounded-2xl transition-all duration-300 ${
									termsHighlight
										? 'border-ink ring-2 ring-ink/20 bg-paper-2'
										: 'border-line'
								}`}
							>
								<label className="flex items-start gap-2.5 cursor-pointer select-none">
									<input
										type="checkbox"
										id="agree-to-terms-checkbox"
										checked={agreeToTerms}
										onChange={(e) => {
											setAgreeToTerms(e.target.checked);
											if (error) setError(null);
											if (termsHighlight) setTermsHighlight(false);
										}}
										className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong text-ink focus:ring-ink accent-ink cursor-pointer"
									/>
									<span className="text-[11px] text-ink-2 leading-relaxed">
										קראתי ואני מאשר/ת את{' '}
										<Link
											href="/terms"
											target="_blank"
											className="underline text-ink hover:text-black font-bold"
										>
											תנאי השימוש
										</Link>{' '}
										ואת{' '}
										<Link
											href="/privacy"
											target="_blank"
											className="underline text-ink hover:text-black font-bold"
										>
											מדיניות הפרטיות
										</Link>
										. אני מסכים/ה לשמירת פרטיי במערכת וידוע לי שהאתר אינו מוכר או מעביר את הנתונים שלי לשום גורם חיצוני.
									</span>
								</label>
							</div>
						)}

						{/* Divider */}
						<div className="my-4 flex items-center gap-3">
							<div className="flex-1 border-t border-line" />
							<span className="text-[11px] text-ink-3 font-medium shrink-0">
								{mode === 'login' ? 'או התחבר באמצעות אימייל' : 'או הרשמה באמצעות אימייל'}
							</span>
							<div className="flex-1 border-t border-line" />
						</div>

						{/* Email / Password Form */}
						<form onSubmit={handleSubmit} className="space-y-3.5">
							{mode === 'register' && (
								<div>
									<label className="block text-xs font-bold text-ink mb-1.5">שם מלא</label>
									<div className="relative">
										<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-3">
											<User className="w-4 h-4" />
										</div>
										<input
											type="text"
											required
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="למשל: דניאל כהן"
											className="w-full pr-10 pl-4 py-2.5 text-sm bg-paper border border-line text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-ink focus:bg-white transition-all"
										/>
									</div>
								</div>
							)}

							<div>
								<label className="block text-xs font-bold text-ink mb-1.5">כתובת אימייל</label>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-3">
										<Mail className="w-4 h-4" />
									</div>
									<input
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="your.email@example.com"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-paper border border-line text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-ink focus:bg-white transition-all text-left"
										dir="ltr"
									/>
								</div>
							</div>

							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-xs font-bold text-ink">סיסמה</label>
									{mode === 'register' && (
										<span className="text-[10px] text-ink-3">מינימום 6 תווים</span>
									)}
								</div>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-3">
										<Lock className="w-4 h-4" />
									</div>
									<input
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-paper border border-line text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-ink focus:bg-white transition-all text-left"
										dir="ltr"
									/>
								</div>
							</div>

							{mode === 'register' && (
								<div>
									<div className="flex items-center justify-between mb-1.5">
										<label className="text-xs font-bold text-ink">מספר טלפון</label>
										<span className="text-[10px] text-ink-3">רשות</span>
									</div>
									<div className="relative">
										<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-ink-3">
											<Phone className="w-4 h-4" />
										</div>
										<input
											type="tel"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder="050-1234567"
											className="w-full pr-10 pl-4 py-2.5 text-sm bg-paper border border-line text-ink rounded-xl focus:outline-none focus:ring-2 focus:ring-ink focus:bg-white transition-all text-left"
											dir="ltr"
										/>
									</div>
								</div>
							)}

							<button
								type="submit"
								disabled={isSubmitting || isGoogleSubmitting || (mode === 'register' && !agreeToTerms)}
								className={`w-full mt-2 py-3 px-4 bg-ink text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
									isSubmitting || isGoogleSubmitting || (mode === 'register' && !agreeToTerms)
										? 'opacity-50 cursor-not-allowed'
										: 'hover:bg-black cursor-pointer'
								}`}
							>
								{isSubmitting ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								) : mode === 'login' ? (
									<>
										<span>התחבר עכשיו</span>
										<ArrowRight className="w-4 h-4 rotate-180" />
									</>
								) : (
									<>
										<Sparkles className="w-4 h-4" />
										<span>צור חשבון</span>
									</>
								)}
							</button>

							{/* Security reassurance */}
							<div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-ink-3">
								<ShieldCheck className="w-3.5 h-3.5 text-success" />
								<span>המידע מאובטח ומוגן. הנתונים לא מועברים לשום גורם שלישי.</span>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
