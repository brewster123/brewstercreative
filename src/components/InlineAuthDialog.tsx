import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface InlineAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'signin' | 'register';
  subtitle?: string;
}

export const InlineAuthDialog: React.FC<InlineAuthDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
  subtitle = 'Sign in or create an account to link your commission brief to your private studio portal.'
}) => {
  const { loginUser, signUpUser, currentUser } = useApp();
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  
  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setInfoMessage(null);
    }
  }, [isOpen, initialMode]);

  // If user becomes authenticated while dialog is open, trigger success
  useEffect(() => {
    if (isOpen && currentUser) {
      onSuccess();
      onClose();
    }
  }, [currentUser, isOpen, onSuccess, onClose]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'signin') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await loginUser(cleanEmail, password);
        if (res.success && res.user) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || 'Invalid credentials. Please verify your email and password.');
        }
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred during sign in.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your full name.');
        return;
      }
      if (!regPassword) {
        setError('Please create a password.');
        return;
      }
      if (regPassword.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await signUpUser(cleanName, cleanEmail, regPassword);
        if (res.success) {
          if (res.confirmationRequired) {
            setInfoMessage('Account created! A confirmation email has been dispatched. Please check your inbox or sign in below.');
            setMode('signin');
          } else if (res.user) {
            onSuccess();
            onClose();
          }
        } else {
          setError(res.error || 'Registration failed. Please check your details or try signing in.');
        }
      } catch (err: any) {
        setError(err?.message || 'An unexpected error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-[#18181B] dark:text-[#EDEDEC]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Studio Identity</span>
          </div>
          <h2 id="auth-dialog-title" className="font-display text-xl sm:text-2xl font-black tracking-tight">
            {mode === 'signin' ? 'Sign In to Proceed' : 'Create Client Account'}
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex p-1 bg-[#FAF9F6] dark:bg-[#18181B] rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#121214] text-[#EA580C] shadow-2xs'
                : 'text-[#71717A] dark:text-[#A1A1AA]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-[#121214] text-[#EA580C] shadow-2xs'
                : 'text-[#71717A] dark:text-[#A1A1AA]'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error / Feedback Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                Full Name <span className="text-[#EA580C]">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexis Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg pl-9 pr-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
              Email Address <span className="text-[#EA580C]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg pl-9 pr-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
              Password <span className="text-[#EA580C]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={mode === 'signin' ? password : regPassword}
                onChange={(e) => mode === 'signin' ? setPassword(e.target.value) : setRegPassword(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg pl-9 pr-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block font-mono uppercase tracking-wider text-[10px] text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                Confirm Password <span className="text-[#EA580C]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg pl-9 pr-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In & Continue' : 'Create Account & Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-[#71717A] dark:text-[#A1A1AA] pt-1 font-mono">
          Your commission draft is preserved in this browser session.
        </p>
      </div>
    </div>
  );
};
