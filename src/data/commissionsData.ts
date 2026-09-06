import { supabase } from '../lib/supabase';
import { Commission, CommissionStatus, User } from '../types';

export interface CreateCommissionInput {
  clientId: string;
  title: string;
  serviceType: string;
  description: string;
  budget: number | string;
  deadline: string;
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

/**
 * Maps a Supabase database row from public.commissions into the application's Commission domain model.
 */
export function mapDbCommissionToAppCommission(
  row: CommissionDbRow,
  clientUser?: User | null
): Commission {
  const rawStatus = (row.status || 'pending').toLowerCase().trim();
  let status: CommissionStatus = 'pending';
  let progress = 10;
  let currentStage = 1;

  if (rawStatus === 'reviewing') {
    status = 'reviewing';
    progress = 25;
    currentStage = 2;
  } else if (rawStatus === 'accepted') {
    status = 'accepted';
    progress = 30;
    currentStage = 2;
  } else if (rawStatus === 'in_progress' || rawStatus === 'in progress') {
    status = 'in_progress';
    progress = 55;
    currentStage = 4;
  } else if (rawStatus === 'for_review' || rawStatus === 'client review' || rawStatus === 'review') {
    status = 'for_review';
    progress = 70;
    currentStage = 5;
  } else if (rawStatus === 'revision' || rawStatus === 'revision requested') {
    status = 'revision';
    progress = 85;
    currentStage = 6;
  } else if (rawStatus === 'completed') {
    status = 'completed';
    progress = 100;
    currentStage = 8;
  } else if (rawStatus === 'cancelled' || rawStatus === 'rejected' || rawStatus === 'declined') {
    status = 'cancelled';
    progress = 0;
    currentStage = 1;
  } else {
    status = 'pending';
    progress = 10;
    currentStage = 1;
  }

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
    description: row.description,
    purpose: 'Commercial brand & creative project',
    targetAudience: 'Target market',
    preferredStyle: 'Modern Minimalist',
    preferredColors: ['#0F172A', '#F97316'],
    requiredDimensions: 'Vector SVG + High-Res PNG',

    // Timeline & Financials
    budget: formattedBudget,
    currency: 'PHP',
    deadline: row.deadline || 'Flexible',
    paymentStatus: 'Unpaid',
    priority: row.priority || 'Normal',

    // Progress & State
    status,
    progress,
    currentStage,

    // References & Notes
    referenceImages: [],
    referenceLinks: [],
    referenceDocs: [],
    communicationGoals: '',
    thingsToAvoid: '',
    additionalNotes: '',

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

  // Format description with additional notes if provided
  const fullDescription = input.additionalNotes?.trim()
    ? `${input.description.trim()}\n\nAdditional Notes:\n${input.additionalNotes.trim()}`
    : input.description.trim();

  // Insert payload matching existing public.commissions table schema
  // Notice: 'status' is omitted so database default ('pending') is applied
  const payload = {
    client_id: input.clientId,
    title: input.title.trim(),
    service_type: input.serviceType.trim(),
    description: fullDescription,
    budget: numericBudget,
    deadline: input.deadline.trim(),
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

