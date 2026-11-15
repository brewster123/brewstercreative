import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { 
  Sun, 
  Moon, 
  Monitor, 
  LogOut, 
  ArrowLeft, 
  Check, 
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    currentUser, 
    updateUserProfile, 
    theme, 
    setTheme, 
    resolvedTheme, 
    logout, 
    setActiveView 
  } = useApp();

  // Profile form state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileHandle, setProfileHandle] = useState(currentUser?.handle || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileContact, setProfileContact] = useState(currentUser?.contactMethod || 'Email & Platform Chat');
  const [profileBio, setProfileBio] = useState(currentUser?.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const isMountedRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileHandle(currentUser.handle || '');
      setProfilePhone(currentUser.phone || '');
      setProfileContact(currentUser.contactMethod || 'Email & Platform Chat');
      setProfileBio(currentUser.bio || '');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const result = await updateUserProfile(currentUser.id, {
        name: profileName.trim() || currentUser.name,
        handle: profileHandle.trim(),
        phone: profilePhone.trim(),
        contactMethod: profileContact,
        bio: profileBio.trim(),
        avatar: profileAvatar || currentUser.avatar,
      });

      if (!isMountedRef.current) return;

      if (result && !result.success) {
        setSaveErrorMsg(result.error || 'Failed to update profile preferences. Please try again.');
        return;
      }

      setSaveSuccessMsg('Profile preferences updated.');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setSaveSuccessMsg('');
        }
      }, 4000);
    } catch (err: any) {
      console.error('[SettingsView] Error updating profile:', err);
      if (isMountedRef.current) {
        setSaveErrorMsg(err?.message || 'An unexpected error occurred while saving profile preferences.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleBackNavigation = () => {
    if (currentUser?.role === 'admin') {
      setActiveView('admin-dashboard');
    } else if (currentUser?.role === 'client') {
      setActiveView('client-dashboard');
    } else {
      setActiveView('home');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 animate-in fade-in duration-300">
      
      {/* Editorial Navigation Backlink & Page Title */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-graphite hover:text-carbon transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {currentUser?.role === 'admin' 
              ? 'Return to Studio Dashboard' 
              : currentUser?.role === 'client' 
              ? 'Return to Creative Projects' 
              : 'Return Home'}
          </span>
        </button>

        <div className="border-b border-hairline pb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-carbon tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-graphite mt-1">
            Personal preferences, studio appearance, and account details.
          </p>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE (Light / Dark / System) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-carbon">
              Appearance
            </h2>
          </div>
          <p className="text-xs text-graphite">
            Choose your preferred studio interface theme. Your selection persists across browser visits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
              theme === 'light'
                ? 'border-accent bg-surface shadow-xs ring-1 ring-accent/25'
                : 'border-hairline bg-surface-secondary hover:border-graphite/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-accent border border-accent/20">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              )}
            </div>
            <div>
              <span className="font-display font-bold text-sm text-carbon block">
                Light
              </span>
              <span className="text-[11px] text-graphite font-mono block mt-0.5">
                Crisp gallery white with dark type
              </span>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
              theme === 'dark'
                ? 'border-accent bg-surface shadow-xs ring-1 ring-accent/25'
                : 'border-hairline bg-surface-secondary hover:border-graphite/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              )}
            </div>
            <div>
              <span className="font-display font-bold text-sm text-carbon block">
                Dark
              </span>
              <span className="text-[11px] text-graphite font-mono block mt-0.5">
                Obsidian studio slate with light type
              </span>
            </div>
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
              theme === 'system'
                ? 'border-accent bg-surface shadow-xs ring-1 ring-accent/25'
                : 'border-hairline bg-surface-secondary hover:border-graphite/40'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <Monitor className="w-4 h-4" />
              </div>
              {theme === 'system' && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-carbon block">
                  System
                </span>
                <span className="text-[10px] font-mono text-graphite">
                  ({resolvedTheme})
                </span>
              </div>
              <span className="text-[11px] text-graphite font-mono block mt-0.5">
                Syncs with your device setting
              </span>
            </div>
          </button>
        </div>
      </section>

      <div className="border-t border-hairline" />

      {/* SECTION 2: PROFILE (If user is signed in) */}
      {currentUser ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-carbon">
                Profile
              </h2>
            </div>
            <p className="text-xs text-graphite">
              Your personal information and communication preferences.
            </p>
          </div>

          {saveErrorMsg && (
            <div role="alert" className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div role="status" className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Avatar uploader */}
            <ProfilePhotoUploader
              userId={currentUser.id}
              currentAvatar={profileAvatar || currentUser.avatar}
              onAvatarUpdated={(newUrl) => setProfileAvatar(newUrl)}
              label="Profile Photo"
              description="Personal photo used in project communications and review feedback."
              avatarSizeClass="w-16 h-16 sm:w-20 sm:h-20"
            />

            <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-profile-name" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold">
                    Full Name
                  </label>
                  <input
                    id="settings-profile-name"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-profile-email" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] font-normal lowercase opacity-75">Read only</span>
                  </label>
                  <div className="relative">
                    <input
                      id="settings-profile-email"
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full bg-surface-secondary/70 border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-graphite font-mono cursor-not-allowed opacity-75"
                    />
                    <Lock className="w-3.5 h-3.5 text-graphite absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-profile-handle" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold">
                    Company / Handle
                  </label>
                  <input
                    id="settings-profile-handle"
                    type="text"
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value)}
                    placeholder="@company or studio"
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-profile-phone" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="settings-profile-phone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-profile-contact" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold">
                  Preferred Contact Method
                </label>
                <select
                  id="settings-profile-contact"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors cursor-pointer"
                >
                  <option value="Email & Platform Chat">Email & Platform Chat (Recommended)</option>
                  <option value="Email Only">Email Only</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram / Social">Instagram / Social DM</option>
                  <option value="Discord">Discord</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings-profile-bio" className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold">
                  Client Bio & Brand Context
                </label>
                <textarea
                  id="settings-profile-bio"
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell DESTALION about your organization, aesthetic values, or ongoing creative initiatives."
                  className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C4F024] disabled:opacity-50 text-[#111114] text-xs font-bold shadow-xs transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Preferences'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="bg-surface border border-hairline rounded-3xl p-6 text-center space-y-3">
          <p className="text-xs text-graphite">
            Sign in to view and personalize your client profile.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('auth')}
            className="px-5 py-2 rounded-full bg-carbon text-canvas text-xs font-semibold cursor-pointer"
          >
            Sign In to Studio
          </button>
        </section>
      )}

      <div className="border-t border-hairline" />

      {/* SECTION 3: ACCOUNT & SESSION */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-carbon">
              Account
            </h2>
          </div>
          <p className="text-xs text-graphite">
            Active session state and security.
          </p>
        </div>

        <div className="bg-surface border border-hairline rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          {currentUser ? (
            <>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-carbon block">
                  Signed in as {currentUser.email}
                </span>
                <span className="text-[11px] font-mono text-graphite block">
                  Role: {currentUser.role === 'admin' ? 'Studio Director' : 'Client Account'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-graphite">
                No active session found.
              </span>
              <button
                type="button"
                onClick={() => setActiveView('auth')}
                className="px-5 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
