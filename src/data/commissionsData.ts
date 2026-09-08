import { supabase } from '../lib/supabase';
import { Commission, CommissionPriority, CommissionStatus, User } from '../types';

export interface CreateCommissionInput {
  clientId: string;
  title: string;
  serviceType: string;
  description: string;
  budget: number | string;
  deadline: string;
  purpose?: string;
  targetAudience?: string;
  preferredStyle?: string;
  preferredColors?: string[];
  requiredDimensions?: string;
  referenceLinks?: string[];
  additionalNotes?: string;
}

export interface CommissionDbRow {
  id: string;
  client_id: string;
  title: string;
  service_type: string;
  description: string;
  budget: number | string | null;
  deadline: string | null;
  status: string | null;
  priority?: string | null;
  purpose?: string | null;
  target_audience?: string | null;
  preferred_style?: string | null;
  required_dimensions?: string | null;
  preferred_colors?: string[] | null;
  reference_links?: string[] | null;
  additional_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export const CANONICAL_COMMISSION_STATUSES: readonly CommissionStatus[] = [
  'pending',
  'reviewing',
  'accepted',
  'in_progress',
  'for_review',
  'revision',
  'completed',
  'cancelled',
] as const;

export const CANONICAL_COMMISSION_PRIORITIES: readonly CommissionPriority[] = [
  'low',
  'normal',
  'high',
  'urgent',
] as const;

/**
 * Derives consistent currentStage (1-8) and progress percentage from status.
 * Ensures header status, stage tracker, and progress bar are always aligned.
 */
export function getStageAndProgressFromStatus(statusString?: string | null): { stage: number; progress: number } {
  const s = (statusString || 'pending').toLowerCase().trim();
  switch (s) {
    case 'reviewing':
      return { stage: 2, progress: 25 };
    case 'accepted':
      return { stage: 2, progress: 25 };
    case 'concept_development':
    case 'concept development':
      return { stage: 3, progress: 40 };
    case 'in_progress':
    case 'in progress':
      return { stage: 4, progress: 55 };
    case 'for_review':
    case 'client review':
    case 'review':
      return { stage: 5, progress: 70 };
    case 'revision':
    case 'revision requested':
    case 'revisions':
      return { stage: 6, progress: 85 };
    case 'final approval':
    case 'final_approval':
      return { stage: 7, progress: 95 };
    case 'completed':
      return { stage: 8, progress: 100 };
    case 'cancelled':
    case 'rejected':
    case 'declined':
      return { stage: 1, progress: 0 };
    case 'pending':
    default:
      return { stage: 1, progress: 10 };
  }
}

/**
 * Normalizes existing database priority values into the four canonical lowercase values.
 * Defaults missing or invalid priorities to 'normal'.
 */
export function normalizeCommissionPriority(rawPriority?: string | null): CommissionPriority {
  if (!rawPriority) return 'normal';
  const clean = rawPriority.trim().toLowerCase();
  if (clean === 'low') return 'low';
  if (clean === 'normal') return 'normal';
  if (clean === 'high') return 'high';
  if (clean === 'urgent') return 'urgent';
  return 'normal';
}

/**
 * Maps a Supabase database row from public.commissions into the application's Commission domain model.
 */
export function mapDbCommissionToAppCommission(
  row: CommissionDbRow,
  clientUser?: User | null
): Commission {
  const rawStatus = (row.status || 'pending').toLowerCase().trim();
  const canonicalValid = [
    'pending',
    'reviewing',
    'accepted',
    'in_progress',
    'for_review',
    'revision',
    'completed',
    'cancelled',
  ];
  const status: CommissionStatus = canonicalValid.includes(rawStatus)
    ? (rawStatus as CommissionStatus)
    : 'pending';

  const derived = getStageAndProgressFromStatus(status);
  const progress = derived.progress;
  const currentStage = derived.stage;

  // Parse numeric budget
  let formattedBudget = '₱0';
  if (row.budget !== null && row.budget !== undefined) {
    const num = typeof row.budget === 'number' ? row.budget : parseFloat(String(row.budget).replace(/[^0-9.]/g, ''));
    formattedBudget = !isNaN(num) ? `₱${num.toLocaleString()}` : String(row.budget);
  }

  // Format created date
  let formattedCreatedDate = row.created_at;
  try {
    const d = new Date(row.created_at);
    if (!isNaN(d.getTime())) {
      formattedCreatedDate = d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    formattedCreatedDate = row.created_at;
  }

  return {
    id: row.id,
    clientId: row.client_id,
    clientName: clientUser?.name || 'Client',
    clientEmail: clientUser?.email || '',
    clientAvatar: clientUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    clientHandle: clientUser?.handle,
    contactMethod: clientUser?.contactMethod || 'Platform Chat',

    // Project Details
    projectName: row.title,
    service: row.service_type,
    serviceType: row.service_type,
    description: row.description || '',
    purpose: row.purpose || '',
    targetAudience: row.target_audience || '',
    preferredStyle: row.preferred_style || '',
    preferredColors: Array.isArray(row.preferred_colors) ? row.preferred_colors : [],
    requiredDimensions: row.required_dimensions || '',

    // Timeline & Financials
    budget: formattedBudget,
    currency: 'PHP',
    deadline: row.deadline || 'Flexible',
    paymentStatus: 'Unpaid',
    priority: normalizeCommissionPriority(row.priority),
 
    // Progress & State
    status,
    progress,
    currentStage,

    // References & Notes
    referenceImages: [],
    referenceLinks: Array.isArray(row.reference_links) ? row.reference_links : [],
    referenceDocs: [],
    communicationGoals: '',
    thingsToAvoid: '',
    additionalNotes: row.additional_notes || '',

    // Metadata
    assignedDesigner: 'Brewster Creative',
    depositPaid: false,
    totalPaid: false,
    revisionsAllowed: 2,
    revisionsUsed: 0,

    createdAt: formattedCreatedDate,
    updatedAt: formattedCreatedDate,
  };
}

/**
 * Inserts a commission request into the existing public.commissions table in Supabase.
 * - Uses the authenticated client's user ID as client_id.
 * - Omit status to let the database default ('pending') apply automatically.
 * - Parses budget to numeric value for database compatibility.
 * - Appends additionalNotes to description to guarantee retention without schema changes.
 */
export async function insertCommissionToSupabase(
  input: CreateCommissionInput,
  currentUser?: User | null
): Promise<{ success: boolean; data?: Commission; error?: string; rawRow?: CommissionDbRow }> {
  if (!input.clientId) {
    return {
      success: false,
      error: 'Authentication error: A valid client user ID is required to submit a commission.',
    };
  }

  if (!input.title?.trim()) {
    return {
      success: false,
      error: 'Project title is required.',
    };
  }

  if (!input.serviceType?.trim()) {
    return {
      success: false,
      error: 'Please select a design service package.',
    };
  }

  if (!input.description?.trim()) {
    return {
      success: false,
      error: 'Project description is required.',
    };
  }

  // Parse numeric budget
  let numericBudget = 0;
  if (typeof input.budget === 'number') {
    numericBudget = input.budget;
  } else if (input.budget) {
    const parsed = parseFloat(String(input.budget).replace(/[^0-9.]/g, ''));
    numericBudget = !isNaN(parsed) ? parsed : 0;
  }

  if (numericBudget <= 0) {
    return {
      success: false,
      error: 'Please provide a valid budget greater than 0.',
    };
  }

  if (!input.deadline?.trim()) {
    return {
      success: false,
      error: 'Please select a desired project deadline.',
    };
  }

  // The description field contains ONLY the project's main description (per Phase 3C.1).
  // All structured creative brief fields are saved to their dedicated columns in public.commissions.
  const payload = {
    client_id: input.clientId,
    title: input.title.trim(),
    service_type: input.serviceType.trim(),
    description: input.description.trim(),
    budget: numericBudget,
    deadline: input.deadline.trim(),
    purpose: input.purpose?.trim() || null,
    target_audience: input.targetAudience?.trim() || null,
    preferred_style: input.preferredStyle?.trim() || null,
    required_dimensions: input.requiredDimensions?.trim() || null,
    preferred_colors: input.preferredColors && input.preferredColors.length > 0 ? input.preferredColors : null,
    reference_links: input.referenceLinks && input.referenceLinks.length > 0 ? input.referenceLinks : null,
    additional_notes: input.additionalNotes?.trim() || null,
  };

  try {
    const { data, error } = await supabase
      .from('commissions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Commissions] Insert error:', error);
      return {
        success: false,
        error: error.message || 'Failed to insert commission into database.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No commission record returned by the database after insertion.',
      };
    }

    // Optionally attempt to record additional notes in commission_notes if available
    if (input.additionalNotes?.trim() && data.id) {
      try {
        await supabase.from('commission_notes').insert({
          commission_id: data.id,
          author_id: input.clientId,
          note: input.additionalNotes.trim(),
        });
      } catch (noteErr) {
        // Non-blocking: additional notes are already safely captured in fullDescription
        console.warn('[Supabase Commissions] Notice saving to commission_notes:', noteErr);
      }
    }

    const appCommission = mapDbCommissionToAppCommission(data as CommissionDbRow, currentUser);

    return {
      success: true,
      data: appCommission,
      rawRow: data as CommissionDbRow,
    };
  } catch (err: any) {
    console.error('[Supabase Commissions] Unexpected exception during insert:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while saving the commission to Supabase.',
    };
  }
}

/**
 * Fetches commissions from the existing public.commissions table via Supabase RLS.
 */
export async function fetchCommissionsFromSupabase(
  currentUser?: User | null
): Promise<{ success: boolean; data: Commission[]; error?: string }> {
  if (!currentUser) {
    return { success: true, data: [] };
  }

  try {
    const query = supabase
      .from('commissions')
      .select('*')
      .order('created_at', { ascending: false });

    // Client RLS automatically limits to client_id = auth.uid(), but adding eq filter is good practice
    if (currentUser.role !== 'admin') {
      query.eq('client_id', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase Commissions] Fetch error:', error);
      return { success: false, data: [], error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    const mapped = (data as CommissionDbRow[]).map(row =>
      mapDbCommissionToAppCommission(row, currentUser)
    );

    return { success: true, data: mapped };
  } catch (err: any) {
    console.error('[Supabase Commissions] Unexpected exception during fetch:', err);
    return { success: false, data: [], error: err?.message };
  }
}

/**
 * Updates a commission's status in the Supabase public.commissions table.
 * - Validates that status is one of the 8 canonical database values.
 * - Updates ONLY 'status' and 'updated_at'.
 * - NEVER updates 'client_id'.
 */
export async function updateCommissionStatusInSupabase(
  commissionId: string,
  status: string
): Promise<{ success: boolean; error?: string; data?: CommissionDbRow }> {
  if (!commissionId) {
    return { success: false, error: 'Commission ID is required.' };
  }

  const normalizedStatus = status?.trim().toLowerCase();
  const validStatuses: readonly string[] = [
    'pending',
    'reviewing',
    'accepted',
    'in_progress',
    'for_review',
    'revision',
    'completed',
    'cancelled',
  ];

  if (!validStatuses.includes(normalizedStatus)) {
    return {
      success: false,
      error: `Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}.`,
    };
  }

  try {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Commissions] Update status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update commission status in database.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No updated commission record returned by the database.',
      };
    }

    return {
      success: true,
      data: data as CommissionDbRow,
    };
  } catch (err: any) {
    console.error('[Supabase Commissions] Unexpected exception during update status:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while updating status in Supabase.',
    };
  }
}

/**
 * Updates a commission priority in the Supabase public.commissions table.
 * Validates against canonical priorities ('low' | 'normal' | 'high' | 'urgent').
 * Strictly updates ONLY priority and updated_at, never client_id.
 */
export async function updateCommissionPriorityInSupabase(
  commissionId: string,
  priority: string
): Promise<{ success: boolean; error?: string; data?: CommissionDbRow }> {
  if (!commissionId) {
    return { success: false, error: 'Commission ID is required.' };
  }

  const normalizedPriority = priority?.trim().toLowerCase();
  const validPriorities: readonly string[] = CANONICAL_COMMISSION_PRIORITIES;

  if (!validPriorities.includes(normalizedPriority as any)) {
    return {
      success: false,
      error: `Invalid priority "${priority}". Allowed values: ${validPriorities.join(', ')}.`,
    };
  }

  try {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        priority: normalizedPriority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Commissions] Update priority error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update commission priority in database.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'No updated commission record returned by the database.',
      };
    }

    return {
      success: true,
      data: data as CommissionDbRow,
    };
  } catch (err: any) {
    console.error('[Supabase Commissions] Unexpected exception during update priority:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred while updating priority in Supabase.',
    };
  }
}

