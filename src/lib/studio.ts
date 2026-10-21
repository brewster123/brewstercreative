import { supabase } from './supabase';
import { StudioProfile } from '../types';
import { INITIAL_STUDIO_PROFILE } from '../data/initialData';

/**
 * Maps a Supabase database row from public.studio_profile to StudioProfile.
 */
export function mapDbToStudioProfile(row: any): StudioProfile {
  return {
    designerName: row.designer_name || INITIAL_STUDIO_PROFILE.designerName,
    studioName:
      row.studio_name === 'Brewster Creative' || row.studio_name === 'Cabando Studio' || !row.studio_name
        ? 'DESTALION'
        : row.studio_name,
    title: row.title || INITIAL_STUDIO_PROFILE.title,
    bio: row.bio || INITIAL_STUDIO_PROFILE.bio,
    avatar: row.avatar || INITIAL_STUDIO_PROFILE.avatar,
    email: row.email || INITIAL_STUDIO_PROFILE.email,
    location: row.location || INITIAL_STUDIO_PROFILE.location,
    socialLinks: row.social_links || INITIAL_STUDIO_PROFILE.socialLinks,
    currency: row.currency || INITIAL_STUDIO_PROFILE.currency,
    currencySymbol: row.currency_symbol || INITIAL_STUDIO_PROFILE.currencySymbol,
    commissionStatus: (row.commission_status as any) || INITIAL_STUDIO_PROFILE.commissionStatus,
    availableSlots: typeof row.available_slots === 'number' ? row.available_slots : INITIAL_STUDIO_PROFILE.availableSlots,
    gcashDetails: {
      accountName:
        row.gcash_account_name === 'Brewster A. Cabando' || !row.gcash_account_name
          ? 'Brewster Cabando'
          : row.gcash_account_name,
      accountNumber:
        row.gcash_account_number === '+63  965-706-43331' ||
        row.gcash_account_number === '0917-829-4102' ||
        row.gcash_account_number === '0995 979 2858' ||
        !row.gcash_account_number
          ? '0965-706-4331'
          : row.gcash_account_number,
      instructions: row.gcash_instructions || INITIAL_STUDIO_PROFILE.gcashDetails?.instructions || 'Send money via GCash Express Send. Take a screenshot of the completed transaction receipt showing Reference No. and upload it for studio verification.',
      qrCodeUrl: row.gcash_qr_url || INITIAL_STUDIO_PROFILE.gcashDetails?.qrCodeUrl || '',
      depositPercentage: 50,
    },
  };
}

/**
 * Maps StudioProfile frontend object to database columns for public.studio_profile.
 */
export function mapStudioProfileToDb(profile: StudioProfile): any {
  return {
    id: 'default',
    designer_name: profile.designerName,
    studio_name: profile.studioName,
    title: profile.title,
    bio: profile.bio,
    avatar: profile.avatar,
    email: profile.email,
    location: profile.location,
    social_links: profile.socialLinks,
    currency: profile.currency,
    currency_symbol: profile.currencySymbol,
    commission_status: profile.commissionStatus,
    available_slots: profile.availableSlots,
    gcash_account_name: profile.gcashDetails?.accountName,
    gcash_account_number: profile.gcashDetails?.accountNumber,
    gcash_instructions: profile.gcashDetails?.instructions,
    gcash_qr_url: profile.gcashDetails?.qrCodeUrl,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetches the Studio Profile singleton from Supabase.
 * Read access is public (anon & authenticated).
 */
export async function fetchStudioProfileFromDb(): Promise<{
  data: StudioProfile | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('studio_profile')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet in remote schema, return null cleanly without throwing
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return { data: mapDbToStudioProfile(data), error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to fetch studio profile from database.' };
  }
}

/**
 * Upserts the Studio Profile in Supabase (Restricted to authenticated Admins by RLS).
 */
export async function upsertStudioProfileInDb(
  profile: StudioProfile
): Promise<{ data: StudioProfile | null; error: string | null }> {
  try {
    const payload = mapStudioProfileToDb(profile);
    const { data, error } = await supabase
      .from('studio_profile')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapDbToStudioProfile(data), error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to persist studio profile to database.' };
  }
}
