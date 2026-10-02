import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { 
  Sun, 
  Moon, 
  Monitor, 
  LogOut, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  User, 
  Sparkles,
  Layers,
  CheckCircle2,
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

    try {
      await updateUserProfile(currentUser.id, {
        name: profileName.trim() || currentUser.name,
        handle: profileHandle.trim(),
        phone: profilePhone.trim(),
        contactMethod: profileContact,
        bio: profileBio.trim(),
        avatar: profileAvatar || currentUser.avatar,
      });

      setSaveSuccessMsg('Profile preferences updated.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('[SettingsView] Error updating profile:', err);
    } finally {
      setIsSaving(false);
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
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
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

        <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Personal preferences, studio appearance, and account details.
          </p>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE (Light / Dark / System) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Appearance
            </h2>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Choose your preferred studio interface theme. Your selection persists across browser visits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 ${
              theme === 'light'
                ? 'border-[#EA580C] bg-white dark:bg-[#18181B] shadow-2xs'
                : 'border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              )}
            </div>
            <div>
              <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] block">
                Light
              </span>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono block mt-0.5">
                Paper-white canvas with dark type
              </span>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 ${
              theme === 'dark'
                ? 'border-[#EA580C] bg-white dark:bg-[#18181B] shadow-2xs'
                : 'border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              )}
            </div>
            <div>
              <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] block">
                Dark
              </span>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono block mt-0.5">
                Deep charcoal canvas with light type
              </span>
            </div>
          </button>

          {/* System Mode */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-32 ${
              theme === 'system'
                ? 'border-[#EA580C] bg-white dark:bg-[#18181B] shadow-2xs'
                : 'border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                <Monitor className="w-4 h-4" />
              </div>
              {theme === 'system' && (
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] block">
                  System
                </span>
                <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  ({resolvedTheme})
                </span>
              </div>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono block mt-0.5">
                Syncs with your device setting
              </span>
            </div>
          </button>
        </div>
      </section>

      <div className="border-t border-[#E4E2DC] dark:border-[#27272A]" />

      {/* SECTION 2: PROFILE (If user is signed in) */}
      {currentUser ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Profile
              </h2>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Your personal information and communication preferences.
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
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
                  <label htmlFor="settings-profile-name" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold">
                    Full Name
                  </label>
                  <input
                    id="settings-profile-name"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-profile-email" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] font-normal lowercase opacity-75">Read only</span>
                  </label>
                  <div className="relative">
                    <input
                      id="settings-profile-email"
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full bg-[#F4F2ED] dark:bg-[#18181B]/60 border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] font-mono cursor-not-allowed opacity-75"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-profile-handle" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold">
                    Company / Handle
                  </label>
                  <input
                    id="settings-profile-handle"
                    type="text"
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value)}
                    placeholder="@company or studio"
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="settings-profile-phone" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="settings-profile-phone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-profile-contact" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold">
                  Preferred Contact Method
                </label>
                <select
                  id="settings-profile-contact"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] transition-colors cursor-pointer"
                >
                  <option value="Email & Platform Chat">Email & Platform Chat (Recommended)</option>
                  <option value="Email Only">Email Only</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram / Social">Instagram / Social DM</option>
                  <option value="Discord">Discord</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings-profile-bio" className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1.5 font-semibold">
                  Client Bio & Brand Context
                </label>
                <textarea
                  id="settings-profile-bio"
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell Brewster about your organization, aesthetic values, or ongoing creative initiatives."
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Preferences'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 text-center space-y-3">
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Sign in to view and personalize your client profile.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('auth')}
            className="px-4 py-2 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] text-xs font-semibold cursor-pointer"
          >
            Sign In to Studio
          </button>
        </section>
      )}

      <div className="border-t border-[#E4E2DC] dark:border-[#27272A]" />

      {/* SECTION 3: ACCOUNT & SESSION */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Account
            </h2>
          </div>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Active session state and security.
          </p>
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {currentUser ? (
            <>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#18181B] dark:text-[#EDEDEC] block">
                  Signed in as {currentUser.email}
                </span>
                <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] block">
                  Role: {currentUser.role === 'admin' ? 'Studio Director' : 'Client Account'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No active session found.
              </span>
              <button
                type="button"
                onClick={() => setActiveView('auth')}
                className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold cursor-pointer"
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
