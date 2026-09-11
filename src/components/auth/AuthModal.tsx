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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222222]/40 backdrop-blur-sm animate-in fade-in duration-200">
			{/* Backdrop click to close */}
			<div className="absolute inset-0" onClick={closeAuthModal} />

			<div
				dir="rtl"
				className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5DFD4] overflow-hidden z-10 animate-in zoom-in-95 duration-200"
			>
				{/* Top Header Decor */}
				<div className="bg-[#FAF8F5] border-b border-[#E5DFD4] p-6 text-center relative overflow-hidden">
					<button
						onClick={closeAuthModal}
						className="absolute top-4 left-4 p-1.5 rounded-full text-[#66635C] hover:text-[#222222] hover:bg-[#E5DFD4]/50 transition-colors"
						aria-label="סגור"
					>
						<X className="w-5 h-5" />
					</button>

					<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] text-[#222222] shadow-sm mb-3">
						{mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
					</div>

					<h3 className="text-xl font-bold text-[#222222] tracking-tight">
						{mode === 'login' ? 'ברוכים השבים לקליס' : 'הצטרפות לפלטפורמת קליס'}
					</h3>
					<p className="text-xs text-[#66635C] mt-1 max-w-xs mx-auto">
						{mode === 'login'
							? 'התחבר כדי לצפות במסלולים השמורים שלך ולנהל את תוכנית הקבלה'
							: 'הרשמה מהירה מקצה לך מספר מועמד אישי ומסנכרנת את נתוניך'}
					</p>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-[#E5DFD4] bg-[#FAF8F5]/60 p-1">
					<button
						type="button"
						onClick={() => {
							setMode('login');
							setError(null);
						}}
						className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
							mode === 'login'
								? 'bg-white text-[#222222] shadow-xs'
								: 'text-[#66635C] hover:text-[#222222]'
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
								? 'bg-white text-[#222222] shadow-xs'
								: 'text-[#66635C] hover:text-[#222222]'
						}`}
					>
						<UserPlus className="w-4 h-4" />
						הרשמה חדשה
					</button>
				</div>

				{/* Success State */}
				{successData ? (
					<div className="p-8 text-center animate-in zoom-in-95 duration-200">
						<div className="w-16 h-16 bg-[#EBF4EE] text-[#205739] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C6DFCE]">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h4 className="text-lg font-bold text-[#222222] mb-2">
							{mode === 'register' ? 'נרשמת בהצלחה למערכת!' : 'התחברת בהצלחה!'}
						</h4>
						<p className="text-xs text-[#8A847C] mt-3">החלון ייסגר כעת אוטומטית...</p>
					</div>
				) : (
					/* Form Body */
					<form onSubmit={handleSubmit} className="p-6 space-y-4">
						{error && (
							<div className="p-3 bg-[#FDF1EE] border border-[#F1CAC1] rounded-xl text-xs text-[#9B3327] flex items-center gap-2 animate-in fade-in">
								<AlertCircle className="w-4 h-4 shrink-0 text-[#9B3327]" />
								<span>{error}</span>
							</div>
						)}

						{mode === 'register' && (
							<div>
								<label className="block text-xs font-bold text-[#222222] mb-1.5">שם מלא</label>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8A847C]">
										<User className="w-4 h-4" />
									</div>
									<input
										type="text"
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="למשל: דניאל כהן"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:bg-white transition-all"
									/>
								</div>
							</div>
						)}

						<div>
							<label className="block text-xs font-bold text-[#222222] mb-1.5">כתובת אימייל</label>
							<div className="relative">
								<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8A847C]">
									<Mail className="w-4 h-4" />
								</div>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your.email@example.com"
									className="w-full pr-10 pl-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:bg-white transition-all text-left"
									dir="ltr"
								/>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-1.5">
								<label className="text-xs font-bold text-[#222222]">סיסמה</label>
								{mode === 'register' && (
									<span className="text-[10px] text-[#8A847C]">מינימום 6 תווים</span>
								)}
							</div>
							<div className="relative">
								<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8A847C]">
									<Lock className="w-4 h-4" />
								</div>
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pr-10 pl-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:bg-white transition-all text-left"
									dir="ltr"
								/>
							</div>
						</div>

						{mode === 'register' && (
							<div>
								<div className="flex items-center justify-between mb-1.5">
									<label className="text-xs font-bold text-[#222222]">מספר טלפון</label>
									<span className="text-[10px] text-[#8A847C]">רשות</span>
								</div>
								<div className="relative">
									<div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#8A847C]">
										<Phone className="w-4 h-4" />
									</div>
									<input
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="050-1234567"
										className="w-full pr-10 pl-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222] focus:bg-white transition-all text-left"
										dir="ltr"
									/>
								</div>
							</div>
						)}

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full mt-2 py-3 px-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
						<div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#8A847C]">
							<ShieldCheck className="w-3.5 h-3.5 text-[#205739]" />
							<span>המידע מאובטח ומוגן. הנתונים לא מועברים לשום גורם שלישי.</span>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
