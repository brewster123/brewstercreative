import React, { useState } from 'react';
import { useApp, STORAGE_KEYS } from '../context/AppContext';
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

  const hasCommissionDraft = () => {
    try {
      return Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem(STORAGE_KEYS.COMMISSION_DRAFT));
    } catch {
      return false;
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || isResending) return;
    setIsResending(true);
    setResendResultMessage('');
    try {
      await resendVerificationEmail(resendEmail);
      setResendResultMessage('If an account exists for that email, a new verification link has been sent.');
    } catch (err: any) {
      setResendResultMessage(err?.message || 'Unable to send verification link right now. Please try again.');
    } finally {
      setIsResending(false);
    }
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
          setAuthSuccess(`Account created. Welcome to DESTALION, ${result.user.name}.`);
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
          <h1 className="font-display font-medium text-3xl sm:text-4xl text-carbon tracking-tight">
            {mode === 'signin' ? 'Welcome back.' : 'Create an account.'}
          </h1>
          <p className="text-xs sm:text-sm text-graphite leading-relaxed">
            {mode === 'signin' 
              ? 'Sign in to continue to your studio.'
              : 'Join to collaborate on custom projects and inspect creative proofs.'}
          </p>
        </div>
      </div>

      {/* Email Verification Callback Banner */}
      {emailVerificationStatus && (
        <div
          className={`rounded-2xl p-4 border text-xs leading-relaxed ${
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
                    className="flex-1 min-w-0 bg-surface border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent"
                  />
                  <button
                    id="btn-resend-verification"
                    type="submit"
                    disabled={isResending}
                    className="shrink-0 px-4 py-1.5 rounded-full bg-carbon text-canvas text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="bg-surface border border-hairline rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'} 
              alt={currentUser.name || 'User Profile'} 
              className="w-10 h-10 rounded-full object-cover ring-1 ring-hairline shrink-0"
            />
            <div className="min-w-0 space-y-0.5">
              <span className="font-semibold text-xs sm:text-sm text-carbon block truncate">
                {currentUser.name}
              </span>
              <p className="text-[11px] text-graphite font-mono truncate">
                {currentUser.role === 'admin' ? 'Studio Director' : 'Client Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (hasCommissionDraft() && currentUser.role !== 'admin') {
                  setActiveView('commission-form');
                } else {
                  setActiveView(currentUser.role === 'admin' ? 'admin-dashboard' : 'client-dashboard');
                }
              }}
              className="px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>
                {hasCommissionDraft() && currentUser.role !== 'admin'
                  ? 'Return to Brief'
                  : 'Enter Studio'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {authError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span className="leading-relaxed flex-1">{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-relaxed flex-1">{authSuccess}</span>
        </div>
      )}

      {infoMessage && (
        <div className="p-3.5 rounded-xl bg-[#E0F2FE]/60 dark:bg-sky-950/40 border border-accent/30 text-carbon text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-accent mt-0.5" />
          <span className="leading-relaxed flex-1">{infoMessage}</span>
        </div>
      )}

      {showForgotNotice && (
        <div className="p-3.5 rounded-xl bg-surface-secondary border border-hairline text-xs text-graphite leading-relaxed flex items-start justify-between gap-2">
          <span>
            To reset your password, contact Brewster directly via your registered email at <strong>{studioProfile.email}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setShowForgotNotice(false)}
            className="text-graphite hover:text-carbon"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Authentication Form Container */}
      <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        
        {mode === 'signin' ? (
          /* ======================================================== */
          /* SIGN IN FORM                                             */
          /* ======================================================== */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="input-signin-email" className="block text-xs font-semibold text-carbon mb-1.5 font-mono uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="alex@studio.com"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="input-signin-password" className="block text-xs font-semibold text-carbon font-mono uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(true)}
                  className="text-[11px] text-graphite hover:text-accent transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite hover:text-carbon"
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
                className="w-full py-3 px-5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] disabled:opacity-50 text-[#111114] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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

            <div className="text-center pt-3 border-t border-hairline">
              <p className="text-xs text-graphite">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetFeedback();
                  }}
                  className="font-semibold text-carbon hover:text-accent transition-colors underline cursor-pointer"
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
              <label htmlFor="input-reg-name" className="block text-xs font-semibold text-carbon mb-1.5 font-mono uppercase tracking-wider">
                Full Name <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-reg-email" className="block text-xs font-semibold text-carbon mb-1.5 font-mono uppercase tracking-wider">
                Email Address <span className="text-accent">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@studio.com"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-reg-password" className="block text-xs font-semibold text-carbon mb-1.5 font-mono uppercase tracking-wider">
                  Password <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-9 py-2.5 text-xs text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-graphite hover:text-carbon"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="input-reg-confirm-password" className="block text-xs font-semibold text-carbon mb-1.5 font-mono uppercase tracking-wider">
                  Confirm <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-confirm-password"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-surface-secondary border border-hairline rounded-xl pl-10 pr-9 py-2.5 text-xs text-carbon placeholder-[#A1A1AA] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-graphite hover:text-carbon"
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
                className="text-xs font-mono text-graphite hover:text-carbon flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{showProfileDetails ? '− Hide optional contact fields' : '+ Add optional contact details'}</span>
              </button>

              {showProfileDetails && (
                <div className="mt-3 p-3.5 bg-surface-secondary border border-hairline rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-graphite mb-1 uppercase">
                        Handle or Studio
                      </label>
                      <input
                        id="input-reg-handle"
                        type="text"
                        value={regHandle}
                        onChange={(e) => setRegHandle(e.target.value)}
                        placeholder="@alexrivera"
                        className="w-full bg-surface border border-hairline rounded-xl px-2.5 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-graphite mb-1 uppercase">
                        Phone / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-3 h-3 text-graphite absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-surface border border-hairline rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-graphite mb-1 uppercase">
                      Contact Preference
                    </label>
                    <select
                      id="select-reg-contact"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-surface border border-hairline rounded-xl px-2.5 py-1.5 text-xs text-carbon focus:outline-none focus:border-accent"
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
                className="w-full py-3 px-5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] disabled:opacity-50 text-[#111114] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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

            <div className="text-center pt-3 border-t border-hairline">
              <p className="text-xs text-graphite">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setSignInEmail(regEmail);
                    resetFeedback();
                  }}
                  className="font-semibold text-carbon hover:text-accent transition-colors underline cursor-pointer"
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
