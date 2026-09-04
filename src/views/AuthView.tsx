import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Key, 
  Mail, 
  User, 
  CheckCircle2, 
  Briefcase,
  Sparkles,
  Lock,
  Loader2
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
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regContact, setRegContact] = useState('Platform Chat & Email');

  const handleLogin = async (emailToUse?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const email = (emailToUse || inputEmail).trim();
    if (!email) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!inputPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(email, inputPassword);
      if (result.success && result.user) {
        // Role is strictly derived from trusted database profiles.role column
        if (result.user.role === 'admin') {
          setAuthSuccess(`Welcome back, Brewster! Opening Admin Studio...`);
          setTimeout(() => setActiveView('admin-dashboard'), 350);
        } else {
          setAuthSuccess(`Welcome back, ${result.user.name}! Opening Client Portal...`);
          setTimeout(() => setActiveView('client-dashboard'), 350);
        }
      } else {
        setAuthError(result.error || 'Unable to sign in. Please check your credentials.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!regName.trim() || !regEmail.trim()) {
      setAuthError('Please provide your full name and email.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Role is always assigned as 'client' on registration
      const result = await signUpUser(
        regName.trim(),
        regEmail.trim(),
        regPassword,
        regHandle.trim(),
        regContact
      );

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          setAuthSuccess('Account created! Please check your email inbox to confirm your account before signing in.');
        } else {
          setAuthSuccess(`Welcome, ${result.user?.name || regName}! Your workspace is ready.`);
          setTimeout(() => {
            setActiveView('client-dashboard');
          }, 400);
        }
      } else {
        setAuthError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      
      {/* Centered Minimal Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <BrandLogo size="lg" className="hover:scale-105 transition-transform" />
        </div>
        <p className="text-sm sm:text-base text-zinc-500 font-medium">
          Enter your email to access your workspace.
        </p>
      </div>

      {/* Currently Logged In Account Pill */}
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
                  {currentUser.role === 'admin' ? 'Studio Director' : 'Active Account'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-code truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser.role === 'admin' ? (
              <button
                type="button"
                onClick={() => setActiveView('admin-dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('client-dashboard')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Workspace</span>
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-white border border-zinc-200/90 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Toggle Mode: Sign In vs Register */}
        <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/70">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'signin'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {mode === 'signin' ? (
          <div className="space-y-6">
            
            {/* Unified Sign In Form */}
            <form onSubmit={(e) => handleLogin(inputEmail, e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-800">
                    Password / PIN
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Password * (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Company / Social Handle
                </label>
                <input
                  type="text"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  placeholder="@jordandesign"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Preferred Contact
                </label>
                <select
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                >
                  <option value="Platform Chat & Email">Platform Chat & Email</option>
                  <option value="Discord">Discord</option>
                  <option value="Telegram">Telegram</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
};
