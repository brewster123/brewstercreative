import { supabase, isSupabaseConfigured } from './supabase';
import { PortfolioProject, ProjectType, CaseStudyContent } from '../types';

export const PORTFOLIO_MEDIA_BUCKET = 'portfolio-media';
export const MAX_PORTFOLIO_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Maps database JSONB case_study column to strongly typed CaseStudyContent.
 */
function mapDbCaseStudy(cs: any): CaseStudyContent | undefined {
  if (!cs || typeof cs !== 'object' || Object.keys(cs).length === 0) {
    return undefined;
  }
  return {
    overview: cs.overview || undefined,
    challenge: cs.challenge || undefined,
    objective: cs.objective || undefined,
    researchInspiration: cs.research_inspiration || cs.researchInspiration || undefined,
    conceptDevelopment: cs.concept_development || cs.conceptDevelopment || undefined,
    designDecisions: cs.design_decisions || cs.designDecisions || undefined,
    finalSolution: cs.final_solution || cs.finalSolution || undefined,
    reflection: cs.reflection || undefined,
    deliverablesSummary: Array.isArray(cs.deliverables_summary || cs.deliverablesSummary)
      ? cs.deliverables_summary || cs.deliverablesSummary
      : undefined,
    media: cs.media && typeof cs.media === 'object' ? cs.media : undefined,
  };
}

/**
 * Maps frontend CaseStudyContent to database JSONB payload.
 */
function mapCaseStudyToDb(cs?: CaseStudyContent): any {
  if (!cs) return {};
  return {
    overview: cs.overview || null,
    challenge: cs.challenge || null,
    objective: cs.objective || null,
    research_inspiration: cs.researchInspiration || null,
    concept_development: cs.conceptDevelopment || null,
    design_decisions: cs.designDecisions || null,
    final_solution: cs.finalSolution || null,
    reflection: cs.reflection || null,
    deliverables_summary: cs.deliverablesSummary || [],
    media: cs.media || {},
  };
}

/**
 * Maps a database row from public.portfolio_projects to frontend PortfolioProject.
 */
export function mapDbToPortfolioProject(row: any): PortfolioProject {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    shortDesc: row.short_desc,
    fullDesc: row.full_desc,
    image: row.image_url,
    gallery: Array.isArray(row.gallery_urls) && row.gallery_urls.length > 0 ? row.gallery_urls : [row.image_url],
    tools: Array.isArray(row.tools) ? row.tools : [],
    date: row.date || '2026',
    client: row.client || '',
    colorPalette: Array.isArray(row.color_palette) ? row.color_palette : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    featured: !!row.featured,
    relatedShopProductIds: Array.isArray(row.related_shop_product_ids) ? row.related_shop_product_ids : [],

    // Phase 5F: Social Portfolio & Case Study Studio
    projectType: (row.project_type === 'concept' ? 'concept' : 'client') as ProjectType,
    serviceId: row.service_id || undefined,
    commissionId: row.commission_id || undefined,
    caseStudy: mapDbCaseStudy(row.case_study),
    likesCount: row.likes_count != null ? Number(row.likes_count) : 0,
    viewsCount: row.views_count != null ? Number(row.views_count) : 0,
  };
}

/**
 * Maps a frontend PortfolioProject to database columns for public.portfolio_projects.
 */
export function mapPortfolioProjectToDb(proj: PortfolioProject, displayOrder: number = 0): any {
  return {
    id: proj.id,
    title: proj.title,
    category: proj.category,
    short_desc: proj.shortDesc,
    full_desc: proj.fullDesc,
    image_url: proj.image,
    gallery_urls: proj.gallery || [proj.image],
    tools: proj.tools || [],
    date: proj.date || '2026',
    client: proj.client || '',
    color_palette: proj.colorPalette || [],
    tags: proj.tags || [],
    featured: !!proj.featured,
    related_shop_product_ids: proj.relatedShopProductIds || [],
    display_order: displayOrder,

    // Phase 5F: Social Portfolio & Case Study Studio
    project_type: proj.projectType || 'client',
    service_id: proj.serviceId || null,
    commission_id: proj.commissionId || null,
    case_study: mapCaseStudyToDb(proj.caseStudy),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetches all portfolio projects from Supabase.
 * Public read access.
 */
export async function fetchPortfolioProjectsFromDb(): Promise<{
  data: PortfolioProject[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    const mapped = (data || []).map(mapDbToPortfolioProject);
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to fetch portfolio projects.' };
  }
}

/**
 * Inserts or updates a portfolio project in public.portfolio_projects (Restricted to Admin by RLS).
 */
export async function upsertPortfolioProjectInDb(
  proj: PortfolioProject,
  displayOrder: number = 0
): Promise<{ data: PortfolioProject | null; error: string | null }> {
  try {
    const payload = mapPortfolioProjectToDb(proj, displayOrder);
    const { data, error } = await supabase
      .from('portfolio_projects')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapDbToPortfolioProject(data), error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to persist portfolio project.' };
  }
}

/**
 * Deletes a portfolio project by ID from public.portfolio_projects (Restricted to Admin by RLS).
 */
export async function deletePortfolioProjectFromDb(
  projectId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete portfolio project.' };
  }
}

/**
 * Uploads an image file to the public 'portfolio-media' Supabase Storage bucket.
 * Restricted to Admin by Storage RLS. Returns direct public URL.
 */
export async function uploadPortfolioMedia(
  fileOrBlob: File | Blob,
  fileName: string = 'showcase.jpg'
): Promise<{ publicUrl: string | null; error: string | null }> {
  if (!fileOrBlob) {
    return { publicUrl: null, error: 'Please choose an image file to upload.' };
  }
  if (fileOrBlob.size > MAX_PORTFOLIO_IMAGE_BYTES) {
    return { publicUrl: null, error: 'File size exceeds the 20 MB limit.' };
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const timestamp = Date.now();
  const filePath = `uploads/${timestamp}-${cleanName}`;
  const contentType = (fileOrBlob as File).type || 'image/jpeg';

  try {
    const { error: uploadError } = await supabase.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .upload(filePath, fileOrBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      return { publicUrl: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { publicUrl: null, error: 'Failed to retrieve public URL for uploaded media.' };
    }

    return { publicUrl: urlData.publicUrl, error: null };
  } catch (err: any) {
    return { publicUrl: null, error: err?.message || 'Unexpected error uploading portfolio media.' };
  }
}

/**
 * Toggles a like for a portfolio project via atomic database RPC.
 * When Supabase is configured, invokes toggle_portfolio_like on the database.
 * If offline or unconfigured, updates locally so user interaction succeeds gracefully.
 */
export async function togglePortfolioLikeRpc(
  projectId: string,
  sessionId: string
): Promise<{ liked: boolean; likesCount: number; error: string | null }> {
  if (!projectId || !sessionId) {
    return { liked: false, likesCount: 0, error: 'Project ID and Session ID are required.' };
  }

  if (!isSupabaseConfigured()) {
    const isLiked = isProjectLikedLocally(projectId);
    const nextLiked = !isLiked;
    let count = 0;
    try {
      const saved = localStorage.getItem('cabando_portfolio_v3');
      if (saved) {
        const list = JSON.parse(saved);
        const item = list.find((p: any) => p.id === projectId);
        if (item && typeof item.likesCount === 'number') {
          count = item.likesCount;
        }
      }
    } catch {}
    const newCount = nextLiked ? count + 1 : Math.max(0, count - 1);
    return {
      liked: nextLiked,
      likesCount: newCount,
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.rpc('toggle_portfolio_like', {
      p_project_id: projectId,
      p_session_id: sessionId,
    });

    if (error) {
      return { liked: false, likesCount: 0, error: error.message };
    }

    return {
      liked: Boolean(data?.liked),
      likesCount: Number(data?.likes_count ?? 0),
      error: null,
    };
  } catch (err: any) {
    return { liked: false, likesCount: 0, error: err?.message || 'Failed to toggle like.' };
  }
}

/**
 * Atomically increments the view count for a portfolio project via database RPC.
 */
export async function recordPortfolioViewRpc(
  projectId: string
): Promise<{ viewsCount: number | null; error: string | null }> {
  if (!projectId) {
    return { viewsCount: null, error: 'Project ID is required.' };
  }

  if (!isSupabaseConfigured()) {
    return { viewsCount: 1, error: null };
  }

  try {
    const { data, error } = await supabase.rpc('record_portfolio_view', {
      p_project_id: projectId,
    });

    if (error) {
      return { viewsCount: null, error: error.message };
    }

    return { viewsCount: Number(data), error: null };
  } catch (err: any) {
    return { viewsCount: null, error: err?.message || 'Failed to record project view.' };
  }
}

// -----------------------------------------------------------------------------
// Phase 5F: Frontend Session & Engagement Helpers
// -----------------------------------------------------------------------------

const VISITOR_SESSION_KEY = 'brewster_visitor_session_id';
const LIKED_PROJECTS_CACHE_KEY = 'brewster_liked_projects_cache';

/**
 * Resolves or creates a persistent visitor UUID from localStorage.
 * Reused on later visits. Never exposed publicly in the UI.
 */
export function getVisitorSessionId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000';
  }
  let sid = localStorage.getItem(VISITOR_SESSION_KEY);
  if (!sid || sid.trim().length < 8) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sid = crypto.randomUUID();
    } else {
      sid = 'v-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    }
    localStorage.setItem(VISITOR_SESSION_KEY, sid);
  }
  return sid;
}

/**
 * Checks whether the current browser session has marked this project as liked.
 */
export function getLocalLikedProjects(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LIKED_PROJECTS_CACHE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function isProjectLikedLocally(projectId: string): boolean {
  return getLocalLikedProjects().has(projectId);
}

export function setLocalProjectLiked(projectId: string, isLiked: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getLocalLikedProjects();
    if (isLiked) {
      set.add(projectId);
    } else {
      set.delete(projectId);
    }
    localStorage.setItem(LIKED_PROJECTS_CACHE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage write issues
  }
}

/**
 * Synchronizes and retrieves the set of project IDs liked by the current user/session.
 */
export async function fetchUserLikedProjectIds(): Promise<string[]> {
  const localSet = getLocalLikedProjects();
  if (!isSupabaseConfigured()) {
    return Array.from(localSet);
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from('portfolio_likes')
        .select('project_id')
        .eq('user_id', session.user.id);

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.project_id) {
            localSet.add(row.project_id);
          }
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(LIKED_PROJECTS_CACHE_KEY, JSON.stringify(Array.from(localSet)));
        }
      }
    }
  } catch {
    // Graceful fallback to local cache
  }
  return Array.from(localSet);
}

/**
 * Extracts the clean project ID from a #case-study-{id} hash string.
 * Supports hashes like "#case-study-proj-1" and "/#case-study-proj-1".
 */
export function extractCaseStudyIdFromHash(hash?: string): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^[#/]+/, '');
  if (clean.startsWith('case-study-')) {
    const id = clean.slice('case-study-'.length).trim();
    return id.length > 0 ? id : null;
  }
  return null;
}

/**
 * Frontend wrapper that invokes the atomic RPC with the visitor session ID
 * and keeps local storage like state in sync.
 */
export async function toggleProjectLike(
  projectId: string
): Promise<{ liked: boolean; likesCount: number; error: string | null }> {
  const sessionId = getVisitorSessionId();
  const res = await togglePortfolioLikeRpc(projectId, sessionId);
  if (!res.error) {
    setLocalProjectLiked(projectId, res.liked);
  }
  return res;
}

/**
 * In-memory session cache to prevent duplicate view increments on React re-renders.
 */
const sessionViewedProjects = new Set<string>();

export async function recordPortfolioViewDebounced(
  projectId: string
): Promise<{ viewsCount: number | null; error: string | null }> {
  if (!projectId || sessionViewedProjects.has(projectId)) {
    return { viewsCount: null, error: null };
  }
  sessionViewedProjects.add(projectId);
  return recordPortfolioViewRpc(projectId);
}

