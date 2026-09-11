import { supabase } from './supabase';
import { CommissionProof, ProofStatus } from '../types';

export const COMMISSION_PROOFS_BUCKET = 'commission-proofs';

/**
 * Fetches proofs belonging to an accessible commission using Supabase SELECT RLS.
 * Row-Level Security automatically ensures clients only receive proofs for their own commissions.
 */
export async function fetchCommissionProofs(
  commissionId: string
): Promise<{ data: CommissionProof[] | null; error: string | null }> {
  if (!commissionId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('commission_proofs')
      .select('*')
      .eq('commission_id', commissionId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message || 'Failed to fetch creative proofs.' };
    }

    return { data: (data as CommissionProof[]) || [], error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'An unexpected error occurred while fetching proofs.',
    };
  }
}

/**
 * Generates a short-lived signed URL for a proof file in the private 'commission-proofs' bucket.
 * Never constructs or exposes public storage URLs.
 */
export async function getProofSignedUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string | null; error: string | null }> {
  if (!filePath) {
    return { signedUrl: null, error: 'Proof file path is missing.' };
  }

  let cleanPath = filePath.trim();
  if (cleanPath.startsWith('commission-proofs/')) {
    cleanPath = cleanPath.replace(/^commission-proofs\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    const { data, error } = await supabase.storage
      .from(COMMISSION_PROOFS_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return {
        signedUrl: null,
        error: error?.message || 'Failed to generate signed URL for proof.',
      };
    }

    return { signedUrl: data.signedUrl, error: null };
  } catch (err: any) {
    return {
      signedUrl: null,
      error: err?.message || 'An unexpected error occurred while signing proof URL.',
    };
  }
}

/**
 * Submits a client review action via the verified SECURITY DEFINER RPC.
 * 
 * SECURITY BOUNDARY:
 * - All reviews MUST go through supabase.rpc('client_review_commission_proof', ...).
 * - NEVER performs direct supabase.from('commission_proofs').update(...).
 */
export async function submitClientReviewRpc(
  proofId: string,
  status: 'approved' | 'revision_requested',
  revisionNote?: string | null
): Promise<{ data: CommissionProof | null; error: string | null }> {
  if (!proofId) {
    return { data: null, error: 'Proof ID is required for review.' };
  }

  const trimmedNote = revisionNote ? revisionNote.trim() : null;

  if (status === 'revision_requested') {
    if (!trimmedNote || trimmedNote.length === 0) {
      return {
        data: null,
        error: 'A revision note is required when requesting revisions.',
      };
    }
  }

  try {
    const { data, error } = await supabase.rpc('client_review_commission_proof', {
      p_proof_id: proofId,
      p_status: status,
      p_revision_note: status === 'revision_requested' ? trimmedNote : null,
    });

    if (error) {
      return {
        data: null,
        error: error.message || `Failed to submit review as "${status}".`,
      };
    }

    return { data: data as CommissionProof, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'An unexpected error occurred during review submission.',
    };
  }
}

/**
 * Formats bytes into a human-readable file size string (KB, MB).
 */
export function formatProofFileSize(bytes: number | string | undefined | null): string {
  if (bytes === undefined || bytes === null) return '0 KB';
  const num = typeof bytes === 'number' ? bytes : parseFloat(String(bytes));
  if (isNaN(num) || num <= 0) return '0 KB';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Normalizes and formats proof file types for badge display (PNG, JPG, PDF, SVG, etc.).
 */
export function formatProofFileType(fileType: string | undefined | null, fileName?: string): string {
  if (!fileType && fileName) {
    const ext = fileName.split('.').pop()?.toUpperCase();
    if (ext) return ext;
  }
  if (!fileType) return 'FILE';

  const lower = fileType.toLowerCase();
  if (lower.includes('png')) return 'PNG';
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'JPG';
  if (lower.includes('pdf')) return 'PDF';
  if (lower.includes('svg')) return 'SVG';
  if (lower.includes('webp')) return 'WEBP';
  if (lower.includes('gif')) return 'GIF';
  if (lower.includes('illustrator') || lower.includes('ai')) return 'AI';
  if (lower.includes('photoshop') || lower.includes('psd')) return 'PSD';

  return fileType.split('/').pop()?.toUpperCase() || 'FILE';
}

/**
 * Returns human-readable status labels and styling tokens for ProofStatus.
 */
export function getProofStatusMeta(status: ProofStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'revision_requested':
      return {
        label: 'Revision Requested',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'pending_review':
    default:
      return {
        label: 'Pending Review',
        bgClass: 'bg-orange-50',
        textClass: 'text-orange-700',
        borderClass: 'border-orange-200',
        dotClass: 'bg-orange-500',
      };
  }
}
