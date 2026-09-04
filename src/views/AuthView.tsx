import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  User, 
  CheckCircle2, 
  Briefcase,
  Sparkles,
  Phone,
  MessageSquare,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const AuthView: React.FC = () => {
  const { 
    currentUser, 
    loginUser, 
    signUpUser, 
    logout, 
    setActiveView 
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

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
        setAuthSuccess(`Signed in successfully. Welcome, ${result.user.name}!`);
        // Redirection is handled in loginUser according to the role in public.profiles
      } else {
        setAuthError(result.error || 'Invalid email or password. Please check your credentials.');
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
            'Account registered successfully! A confirmation link has been sent to your email. Please verify your email before signing in.'
          );
          setMode('signin');
          setSignInEmail(email);
        } else if (result.user) {
          setAuthSuccess(`Account created successfully! Welcome to Brewster Creative Co., ${result.user.name}.`);
          // Redirected to client workspace automatically
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-6">
      
      {/* Studio Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <BrandLogo size="lg" className="hover:scale-105 transition-transform" />
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-zinc-900 tracking-tight">
          {mode === 'signin' ? 'Sign In to Your Account' : 'Create Client Account'}
        </h1>
        <p className="text-sm text-zinc-500 font-medium max-w-md mx-auto">
          {mode === 'signin' 
            ? 'Sign in with your email and password to access your design commissions, proofs, and studio direct messages.'
            : 'Register your client account to collaborate with Brewster, track design milestones, and access deliverables.'}
        </p>
      </div>

      {/* Currently Authenticated Session Card */}
      {currentUser && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-zinc-900 truncate">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {currentUser.role === 'admin' ? 'Studio Director (Admin)' : 'Client Workspace'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-code truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser.role === 'admin' ? (
              <button
                type="button"
                id="btn-active-session-admin"
                onClick={() => setActiveView('admin-dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-active-session-client"
                onClick={() => setActiveView('client-dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Workspace</span>
              </button>
            )}
            <button
              type="button"
              id="btn-active-session-logout"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-white border border-zinc-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Toggle Mode: Sign In vs Register */}
        <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70">
          <button
            id="tab-auth-signin"
            type="button"
            onClick={() => {
              setMode('signin');
              resetFeedback();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-auth-register"
            type="button"
            onClick={() => {
              setMode('register');
              resetFeedback();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 space-y-2">
              <p>{authError}</p>
              {authError.includes('42501') && (
                <div className="p-3 bg-white rounded-xl border border-rose-200 text-zinc-800 space-y-2 text-left">
                  <p className="font-bold text-zinc-900 text-xs">
                    Quick Fix: Run this query in Supabase Dashboard &rarr; SQL Editor:
                  </p>
                  <pre className="p-2.5 bg-zinc-950 text-emerald-400 rounded-lg text-[11px] font-mono-code select-all overflow-x-auto whitespace-pre">
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
                  </pre>
                  <p className="text-[11px] text-zinc-600 font-normal">
                    This grants table-level privileges to the authenticated role so your RLS policies can evaluate.
                  </p>
                </div>
              )}
              {authError.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setSignInEmail(regEmail);
                    resetFeedback();
                  }}
                  className="mt-1.5 text-xs text-rose-800 font-bold underline hover:no-underline cursor-pointer"
                >
                  Switch to Sign In &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {authSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {mode === 'signin' ? (
          /* ======================================================== */
          /* SIGN IN: EMAIL & PASSWORD */
          /* ======================================================== */
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-signin-password"
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-11 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignInPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-signin-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-zinc-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegEmail(signInEmail);
                    resetFeedback();
                  }}
                  className="font-bold text-orange-600 hover:text-orange-700 underline"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* ======================================================== */
          /* REGISTRATION: FULL NAME, EMAIL, PASSWORD, CONFIRM PW */
          /* ======================================================== */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Email Address <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Confirm Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reg-confirm-password"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                    aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Profile Information Section */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowProfileDetails(!showProfileDetails)}
                className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5 focus:outline-none cursor-pointer"
              >
                <span>{showProfileDetails ? '− Hide optional profile info' : '+ Add optional contact info (handle, phone, contact method)'}</span>
              </button>

              {showProfileDetails && (
                <div className="mt-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Company or Social Handle
                      </label>
                      <input
                        id="input-reg-handle"
                        type="text"
                        value={regHandle}
                        onChange={(e) => setRegHandle(e.target.value)}
                        placeholder="@alexrivera or Studio Co."
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Phone / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="input-reg-phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Preferred Contact Method
                    </label>
                    <select
                      id="select-reg-contact"
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 font-medium"
                    >
                      <option value="Email & Platform Chat">Email & Platform Chat (Default)</option>
                      <option value="Email Only">Email Only</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram / Social">Instagram / Social DM</option>
                      <option value="Discord">Discord</option>
                      <option value="Telegram">Telegram</option>
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
                className="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Client Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-zinc-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setSignInEmail(regEmail);
                    resetFeedback();
                  }}
                  className="font-bold text-orange-600 hover:text-orange-700 underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        )}

      </div>

      {/* Security & Access Notice */}
      <div className="p-4 rounded-2xl bg-zinc-100/70 border border-zinc-200/80 text-zinc-600 text-xs text-center space-y-1">
        <p className="font-semibold text-zinc-700">Brewster Creative Co. Authentication</p>
        <p className="text-[11px] text-zinc-500">
          Client accounts have access to their personal design commissions, proof approvals, and direct messaging.
          Admin privileges are managed securely via Supabase database role assignment.
        </p>
      </div>

    </div>
  );
};
