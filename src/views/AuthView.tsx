import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowRight, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  User, 
  CheckCircle2, 
  Sparkles,
  Phone,
  Loader2,
  AlertCircle,
  LogOut,
  X
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const AuthView: React.FC = () => {
  const { 
    currentUser, 
    loginUser, 
    signUpUser, 
    logout, 
    setActiveView,
    emailVerificationStatus,
    clearEmailVerificationStatus,
    resendVerificationEmail,
    studioProfile
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Resend verification email form state (shown in expired/error callback banner)
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendResultMessage, setResendResultMessage] = useState('');

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setIsResending(true);
    setResendResultMessage('');
    await resendVerificationEmail(resendEmail);
    setIsResending(false);
    setResendResultMessage('If an account exists for that email, a new verification link has been sent.');
  };

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Optional Profile Info
  const [regHandle, setRegHandle] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regContact, setRegContact] = useState('Email & Platform Chat');
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  const resetFeedback = () => {
    setAuthError('');
    setAuthSuccess('');
    setInfoMessage('');
    setShowForgotNotice(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    const email = signInEmail.trim();
    const password = signInPassword;

    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success && result.user) {
        setAuthSuccess(`Welcome back, ${result.user.name}.`);
      } else {
        setAuthError(result.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    const name = regName.trim();
    const email = regEmail.trim();
    const password = regPassword;
    const confirmPassword = regConfirmPassword;

    if (!name) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!password) {
      setAuthError('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpUser(
        name,
        email,
        password,
        regHandle.trim() || undefined,
        regContact,
        regPhone.trim() || undefined
      );

      if (result.success) {
        if (result.confirmationRequired) {
          setInfoMessage(
            'Account registered successfully. A confirmation link has been sent to your email. Please verify before signing in.'
          );
          setMode('signin');
          setSignInEmail(email);
        } else if (result.user) {
          setAuthSuccess(`Account created. Welcome to Brewster Creative, ${result.user.name}.`);
        }
      } else {
        setAuthError(result.error || 'Failed to create account. Please check your details and try again.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during account registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-10 animate-in fade-in duration-300">
      
      {/* Small brand mark / logo & Welcome */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <BrandLogo size="md" className="hover:scale-102 transition-transform duration-300" />
        </div>

        <div className="space-y-1">
          <h1 className="font-display font-medium text-3xl sm:text-4xl text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            {mode === 'signin' ? 'Welcome back.' : 'Create an account.'}
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            {mode === 'signin' 
              ? 'Sign in to continue to your studio.'
              : 'Join to collaborate on custom projects and inspect creative proofs.'}
          </p>
        </div>
      </div>

      {/* Email Verification Callback Banner */}
      {emailVerificationStatus && (
        <div
          className={`rounded-lg p-4 border text-xs leading-relaxed ${
            emailVerificationStatus === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {emailVerificationStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <p className="font-bold">
                  {emailVerificationStatus === 'success' && 'Your email has been verified.'}
                  {emailVerificationStatus === 'expired' && 'This verification link has expired.'}
                  {emailVerificationStatus === 'error' && 'This verification link is invalid.'}
                </p>
                <p className="mt-0.5 opacity-90">
                  {emailVerificationStatus === 'success' && 'You can now sign in below.'}
                  {emailVerificationStatus === 'expired' && "Verification links remain valid for a limited period. Request a fresh link below."}
                  {emailVerificationStatus === 'error' && "This link may have already been consumed. Request a fresh link below."}
                </p>
              </div>

              {(emailVerificationStatus === 'expired' || emailVerificationStatus === 'error') && (
                <form onSubmit={handleResendVerification} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    id="input-resend-verification-email"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 bg-white dark:bg-[#18181B] border border-amber-300 dark:border-amber-800 rounded-lg px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                  />
                  <button
                    id="btn-resend-verification"
                    type="submit"
                    disabled={isResending}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>Resend Link</span>
                  </button>
                </form>
              )}

              {resendResultMessage && (
                <p className="font-semibold">{resendResultMessage}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                clearEmailVerificationStatus();
                setResendResultMessage('');
                setResendEmail('');
              }}
              aria-label="Dismiss banner"
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Currently Authenticated Session Card */}
      {currentUser && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E4E2DC] dark:ring-[#27272A] shrink-0"
            />
            <div className="min-w-0 space-y-0.5">
              <span className="font-semibold text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] block truncate">
                {currentUser.name}
              </span>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono truncate">
                {currentUser.role === 'admin' ? 'Studio Director' : 'Client Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView(currentUser.role === 'admin' ? 'admin-dashboard' : 'client-dashboard')}
              className="px-3.5 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Enter Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {authError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span className="leading-relaxed flex-1">{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-relaxed flex-1">{authSuccess}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-orange-900 dark:text-orange-300 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-[#EA580C] mt-0.5" />
          <span className="leading-relaxed flex-1">{infoMessage}</span>
        </div>
      )}

      {showForgotNotice && (
        <div className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed flex items-start justify-between gap-2">
          <span>
            To reset your password, contact Brewster directly via your registered email at <strong>{studioProfile.email}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setShowForgotNotice(false)}
            className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Authentication Form Container */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
        
        {mode === 'signin' ? (
          /* ======================================================== */
          /* SIGN IN FORM                                             */
          /* ======================================================== */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="input-signin-email" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-mono uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="alex@studio.com"
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="input-signin-password" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] font-mono uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(true)}
                  className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-10 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-signin-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-3 border-t border-[#E4E2DC] dark:border-[#27272A]">
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetFeedback();
                  }}
                  className="font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] transition-colors underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* ======================================================== */
          /* REGISTRATION FORM                                        */
          /* ======================================================== */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="input-reg-name" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-mono uppercase tracking-wider">
                Full Name <span className="text-[#EA580C]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-reg-email" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-mono uppercase tracking-wider">
                Email Address <span className="text-[#EA580C]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@studio.com"
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-reg-password" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-mono uppercase tracking-wider">
                  Password <span className="text-[#EA580C]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-9 py-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="input-reg-confirm-password" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-1.5 font-mono uppercase tracking-wider">
                  Confirm <span className="text-[#EA580C]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-confirm-password"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-9 pr-9 py-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]"
                    aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Profile Info Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{showProfileDetails ? '− Hide optional contact fields' : '+ Add optional contact details'}</span>
              </button>

              {showProfileDetails && (
                <div className="mt-3 p-3.5 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-1 uppercase">
                        Handle or Studio
                      </label>
                      <input
                        id="input-reg-handle"
                        type="text"
                        value={regHandle}
                        onChange={(e) => setRegHandle(e.target.value)}
                        placeholder="@alexrivera"
                        className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-md px-2.5 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-1 uppercase">
                        Phone / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-3 h-3 text-[#A1A1AA] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-1 uppercase">
                      Contact Preference
                    </label>
                    <select
                      id="select-reg-contact"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-md px-2.5 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    >
                      <option value="Email & Platform Chat">Email & Platform Chat (Default)</option>
                      <option value="Email Only">Email Only</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram / Social">Instagram / Social DM</option>
                      <option value="Discord">Discord</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                id="btn-register-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-3 border-t border-[#E4E2DC] dark:border-[#27272A]">
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setSignInEmail(regEmail);
                    resetFeedback();
                  }}
                  className="font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] transition-colors underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        )}

      </div>

    </div>
  );
};
