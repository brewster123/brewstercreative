import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StudioProfile } from '../../types';
import { CreditCard, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { StudioPhotoUploader } from '../StudioPhotoUploader';

const DEFAULT_GCASH_INSTRUCTIONS =
  '1. Open your GCash app and tap "Send Money" > "Express Send".\n2. Enter the studio mobile number and the deposit amount.\n3. Complete transfer and screenshot the official receipt.\n4. Upload below with the Reference No. clearly visible.';

const buildProfileFormState = (sp?: StudioProfile): StudioProfile => ({
  designerName: sp?.designerName || 'Brewster Cabando',
  studioName: sp?.studioName || 'DESTALION',
  title: sp?.title || 'Experimental Multimedia Artist & Brand Designer',
  bio: sp?.bio || '',
  avatar: sp?.avatar || '',
  email: sp?.email || 'contact@destalion.com',
  location: sp?.location || 'Cebu City',
  currency: sp?.currency || 'PHP',
  currencySymbol: sp?.currencySymbol || '₱',
  commissionStatus: sp?.commissionStatus || 'open',
  availableSlots: sp?.availableSlots ?? 4,
  socialLinks: {
    ...(sp?.socialLinks || {}),
    instagram: sp?.socialLinks?.instagram || '',
    behance: sp?.socialLinks?.behance || '',
    dribbble: sp?.socialLinks?.dribbble || '',
    twitter: sp?.socialLinks?.twitter || '',
  },
  gcashDetails: {
    accountName: sp?.gcashDetails?.accountName || 'Brewster Cabando',
    accountNumber: sp?.gcashDetails?.accountNumber || '0965-706-4331',
    qrCodeUrl: sp?.gcashDetails?.qrCodeUrl,
    instructions: sp?.gcashDetails?.instructions || '',
    depositPercentage: sp?.gcashDetails?.depositPercentage || 50,
  },
});

export const StudioProfileSettingsSection: React.FC = () => {
  const { currentUser, studioProfile, updateStudioProfile } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [profileForm, setProfileForm] = useState<StudioProfile>(() =>
    buildProfileFormState(studioProfile)
  );
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (studioProfile) {
      setProfileForm(buildProfileFormState(studioProfile));
    }
  }, [studioProfile]);

  if (!isAdmin) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    try {
      const res = await updateStudioProfile(profileForm);
      if (!isMountedRef.current) return;
      if (res && !res.success) {
        setProfileSaveError(res.error || 'Failed to update studio profile.');
        return;
      }
      setProfileSaveSuccess(true);
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
      profileTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setProfileSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      if (isMountedRef.current) {
        setProfileSaveError(err?.message || 'Failed to update studio profile.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSavingProfile(false);
      }
    }
  };

  return (
    <section id="studio-profile-settings" className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-carbon">
            Studio Profile &amp; GCash
          </h2>
        </div>
        <p className="text-xs text-graphite">
          Public studio bio, lead portrait, GCash settlement instructions, and social links displayed across the website.
        </p>
      </div>

      {profileSaveError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{profileSaveError}</span>
        </div>
      )}

      {profileSaveSuccess && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Studio profile updated successfully.</span>
        </div>
      )}

      <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="pb-3 border-b border-hairline">
          <h3 className="font-display text-lg font-bold text-carbon">
            Public Studio Profile
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <StudioPhotoUploader
            adminUserId={currentUser?.id || ''}
            currentPhoto={profileForm.avatar}
            currentPhotoUrl={profileForm.avatar}
            onPhotoUpdated={(newUrl) => setProfileForm((prev) => ({ ...prev, avatar: newUrl }))}
            label="Studio Lead Photo"
            description="Professional portrait displayed on the public website homepage 'Meet The Designer' section. Represents Brewster A. Cabando (Studio Lead)."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="studio-designer-name"
                className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
              >
                Designer Name
              </label>
              <input
                id="studio-designer-name"
                type="text"
                value={profileForm.designerName}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, designerName: e.target.value }))
                }
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label
                htmlFor="studio-public-email"
                className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
              >
                Studio Email
              </label>
              <input
                id="studio-public-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="studio-public-bio"
              className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
            >
              Studio Bio
            </label>
            <textarea
              id="studio-public-bio"
              rows={4}
              value={profileForm.bio}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent leading-relaxed resize-none"
            />
          </div>

          {/* GCash Payment Instructions Configuration */}
          <div className="pt-4 border-t border-hairline space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              <h4 className="font-display font-bold text-sm text-carbon">
                GCash Payment Instructions
              </h4>
            </div>
            <p className="text-[11px] text-graphite">
              Configured details displayed to clients during direct GCash transfer and manual verification intake.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="studio-gcash-name"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  GCash Account Name
                </label>
                <input
                  id="studio-gcash-name"
                  type="text"
                  value={profileForm.gcashDetails?.accountName || 'Brewster Cabando'}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      gcashDetails: {
                        ...prev.gcashDetails,
                        accountName: e.target.value,
                        accountNumber: prev.gcashDetails?.accountNumber || '0965-706-4331',
                        instructions: prev.gcashDetails?.instructions || '',
                        depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                      },
                    }))
                  }
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-gcash-number"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  GCash Mobile Number
                </label>
                <input
                  id="studio-gcash-number"
                  type="text"
                  value={profileForm.gcashDetails?.accountNumber || '0965-706-4331'}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      gcashDetails: {
                        ...prev.gcashDetails,
                        accountName: prev.gcashDetails?.accountName || 'Brewster Cabando',
                        accountNumber: e.target.value,
                        instructions: prev.gcashDetails?.instructions || '',
                        depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                      },
                    }))
                  }
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="studio-gcash-instructions"
                className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
              >
                Client Transfer Instructions
              </label>
              <textarea
                id="studio-gcash-instructions"
                rows={3}
                value={profileForm.gcashDetails?.instructions || DEFAULT_GCASH_INSTRUCTIONS}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    gcashDetails: {
                      ...prev.gcashDetails,
                      accountName: prev.gcashDetails?.accountName || 'Brewster Cabando',
                      accountNumber: prev.gcashDetails?.accountNumber || '0965-706-4331',
                      instructions: e.target.value,
                      depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                    },
                  }))
                }
                className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Social Media & External Profiles Configuration */}
          <div className="pt-4 border-t border-hairline space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              <h4 className="font-display font-bold text-sm text-carbon">
                Social &amp; External Profiles
              </h4>
            </div>
            <p className="text-[11px] text-graphite">
              Official studio handles and profiles displayed dynamically across website footers and contact areas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="studio-social-instagram"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  Instagram Handle / URL
                </label>
                <input
                  id="studio-social-instagram"
                  type="text"
                  value={profileForm.socialLinks?.instagram || ''}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        instagram: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. instagram.com/brewster.cabando"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-social-behance"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  Behance Portfolio / URL
                </label>
                <input
                  id="studio-social-behance"
                  type="text"
                  value={profileForm.socialLinks?.behance || ''}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        behance: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. behance.net/brewstercabando"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-social-dribbble"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  Dribbble Profile / URL
                </label>
                <input
                  id="studio-social-dribbble"
                  type="text"
                  value={profileForm.socialLinks?.dribbble || ''}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        dribbble: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. dribbble.com/brewstercabando"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-social-twitter"
                  className="block text-xs font-mono uppercase text-graphite mb-1.5 font-semibold"
                >
                  Twitter / X Profile / URL
                </label>
                <input
                  id="studio-social-twitter"
                  type="text"
                  value={profileForm.socialLinks?.twitter || ''}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      socialLinks: {
                        ...prev.socialLinks,
                        twitter: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. x.com/brewstercabando"
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="btn-tactile px-6 py-2.5 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSavingProfile ? 'Saving...' : 'Save Studio Profile'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
