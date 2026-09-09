'use client';

import React, { useState, useEffect } from 'react';
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
	const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');

	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successData, setSuccessData] = useState<{ candidateNumber?: string } | null>(null);

	useEffect(() => {
		if (isAuthModalOpen) {
			setMode(authModalMode);
			setError(null);
			setSuccessData(null);
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
			{/* Backdrop click to close */}
			<div className="absolute inset-0" onClick={closeAuthModal} />

			<div
				dir="rtl"
				className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200"
			>
				{/* Top Header Decor */}
				<div className="bg-gradient-to-l from-blue-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden">
					<div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
					<div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-400/20 rounded-full blur-lg pointer-events-none" />

					<button
						onClick={closeAuthModal}
						className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
						aria-label="סגור"
					>
						<X className="w-5 h-5" />
					</button>

					<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mb-3 ring-4 ring-white/10">
						{mode === 'login' ? <LogIn className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
					</div>

					<h3 className="text-xl font-black tracking-tight">
						{mode === 'login' ? 'ברוכים השבים לקליס' : 'הצטרפות לפלטפורמת קליס'}
					</h3>
					<p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
						{mode === 'login'
							? 'התחבר כדי לצפות במסלולים השמורים שלך ולנהל את תוכנית הקבלה'
							: 'הרשמה מהירה מקצה לך מספר מועמד אישי ומסנכרנת את נתוניך'}
					</p>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
					<button
						type="button"
						onClick={() => {
							setMode('login');
							setError(null);
						}}
						className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
							mode === 'login'
								? 'bg-white text-blue-700 shadow-xs'
								: 'text-slate-500 hover:text-slate-800'
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
						}}
						className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
							mode === 'register'
								? 'bg-white text-blue-700 shadow-xs'
								: 'text-slate-500 hover:text-slate-800'
						}`}
					>
						<UserPlus className="w-4 h-4" />
						הרשמה חדשה
					</button>
				</div>

				{/* Success State */}
				{successData ? (
					<div className="p-8 text-center animate-in zoom-in-95 duration-200">
						<div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h4 className="text-lg font-black text-slate-800 mb-2">
							{mode === 'register' ? 'נרשמת בהצלחה למערכת!' : 'התחברת בהצלחה!'}
						</h4>
						{successData.candidateNumber && (
							<div className="my-4 inline-flex flex-col items-center p-3 px-6 bg-blue-50 border border-blue-200/80 rounded-2xl">
								<span className="text-xs text-blue-600 font-semibold">מספר המועמד האישי שלך:</span>
								<span className="text-xl font-black text-blue-800 tracking-wider mt-0.5">
									{successData.candidateNumber}
								</span>
							</div>
						)}
						<p className="text-xs text-slate-500">החלון ייסגר כעת אוטומטית...</p>
					</div>
				) : (
					/* Form Body */
					<form onSubmit={handleSubmit} className="p-6 space-y-4">
						{error && (
							<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
								<AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
								<span>{error}</span>
							</div>
						)}

						{mode === 'register' && (
							<div>
								<label className="block text-xs font-bold text-slate-700 mb-1.5">שם מלא</label>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
										<User className="w-4 h-4" />
									</div>
									<input
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="למשל: דניאל כהן"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
									/>
								</div>
							</div>
						)}

						<div>
							<label className="block text-xs font-bold text-slate-700 mb-1.5">כתובת אימייל</label>
							<div className="relative">
								<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
									<Mail className="w-4 h-4" />
								</div>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your.email@example.com"
									className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left"
									dir="ltr"
								/>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="text-xs font-bold text-slate-700">סיסמה</label>
								{mode === 'register' && (
									<span className="text-[10px] text-slate-400">מינימום 6 תווים</span>
								)}
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
									<Lock className="w-4 h-4" />
								</div>
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left"
									dir="ltr"
								/>
							</div>
						</div>

						{mode === 'register' && (
							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-xs font-bold text-slate-700">מספר טלפון</label>
									<span className="text-[10px] text-slate-400">רשות</span>
								</div>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
										<Phone className="w-4 h-4" />
									</div>
									<input
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="050-1234567"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left"
										dir="ltr"
									/>
								</div>
							</div>
						)}

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full mt-2 py-3 px-4 bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
									<span>צור חשבון והקצה מספר מועמד</span>
								</>
							)}
						</button>

						{/* Security reassurance */}
						<div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
							<span>המידע מאובטח ומוגן. הנתונים לא מועברים לשום גורם שלישי.</span>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
