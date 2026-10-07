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
 * Safely normalizes numeric stats (views, likes, shares) so missing, null,
 * undefined, empty string, or non-numeric/NaN values always fall back to a safe number (default 0).
 */
export function normalizeNumericStat(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) && !Number.isNaN(val) ? Math.max(0, Math.floor(val)) : fallback;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && !Number.isNaN(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
  }
  return fallback;
}

/**
 * Safely extracts normalized view count from a project object across camelCase and snake_case properties.
 */
export function getProjectViews(project?: Partial<PortfolioProject> | null): number {
  if (!project) return 0;
  const raw = project.viewsCount ?? project.views_count ?? (project as any).views;
  return normalizeNumericStat(raw, 0);
}

/**
 * Safely extracts normalized like count from a project object across camelCase and snake_case properties.
 */
export function getProjectLikes(project?: Partial<PortfolioProject> | null): number {
  if (!project) return 0;
  const raw = project.likesCount ?? project.likes_count ?? (project as any).likes;
  return normalizeNumericStat(raw, 0);
}

/**
 * Safely extracts normalized share count from a project object across camelCase and snake_case properties.
 */
export function getProjectShares(project?: Partial<PortfolioProject> | null): number {
  if (!project) return 0;
  const raw = project.sharesCount ?? project.shares_count ?? (project as any).shares;
  return normalizeNumericStat(raw, 0);
}

/**
 * Maps a database row from public.portfolio_projects to frontend PortfolioProject.
 */
export function mapDbToPortfolioProject(row: any): PortfolioProject {
  const viewsCount = normalizeNumericStat(row.views_count ?? row.viewsCount ?? row.views, 0);
  const likesCount = normalizeNumericStat(row.likes_count ?? row.likesCount ?? row.likes, 0);
  const sharesCount = normalizeNumericStat(row.shares_count ?? row.sharesCount ?? row.shares, 0);

  const isFictionalSeedClient = 
    row.client === 'Aura Botanica Co.' ||
    row.client === 'Odyssey Live Productions' ||
    row.client === 'Kroma Audio Labs' ||
    row.client === 'Vanguard Literary Press' ||
    row.client === 'Epoch Magazine' ||
    row.client === 'HyperPulse Activewear' ||
    row.client === 'Commission Client';

  const cleanClient = isFictionalSeedClient ? 'Studio Concept' : (row.client || 'Studio Concept');
  const projectType = (isFictionalSeedClient || row.project_type === 'concept' || row.projectType === 'concept' || !row.project_type)
    ? 'concept'
    : ((row.project_type || row.projectType) as ProjectType);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    shortDesc: row.short_desc ?? row.shortDesc ?? '',
    fullDesc: row.full_desc ?? row.fullDesc ?? '',
    image: row.image_url ?? row.image ?? '',
    gallery: Array.isArray(row.gallery_urls) && row.gallery_urls.length > 0 
      ? row.gallery_urls 
      : Array.isArray(row.gallery) && row.gallery.length > 0 
        ? row.gallery 
        : [row.image_url || row.image || ''],
    tools: Array.isArray(row.tools) ? row.tools : [],
    date: row.date || '2026',
    client: cleanClient,
    colorPalette: Array.isArray(row.color_palette) 
      ? row.color_palette 
      : Array.isArray(row.colorPalette) 
        ? row.colorPalette 
        : undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    featured: !!row.featured,
    relatedShopProductIds: Array.isArray(row.related_shop_product_ids) 
      ? row.related_shop_product_ids 
      : Array.isArray(row.relatedShopProductIds) 
        ? row.relatedShopProductIds 
        : [],

    // Phase 5F: Social Portfolio & Case Study Studio
    projectType,
    serviceId: row.service_id || row.serviceId || undefined,
    commissionId: row.commission_id || row.commissionId || undefined,
    caseStudy: mapDbCaseStudy(row.case_study ?? row.caseStudy),
    likesCount,
    viewsCount,
    sharesCount,
    likes_count: likesCount,
    views_count: viewsCount,
    shares_count: sharesCount,
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
    client: proj.client || 'Studio Concept',
    color_palette: proj.colorPalette || [],
    tags: proj.tags || [],
    featured: !!proj.featured,
    related_shop_product_ids: proj.relatedShopProductIds || [],
    display_order: displayOrder,

    // Phase 5F: Social Portfolio & Case Study Studio
    project_type: proj.projectType || 'concept',
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
      console.error('[Portfolio] RPC toggle_portfolio_like error:', error);
      return { liked: false, likesCount: 0, error: error.message };
    }

    // Defensively handle parsed JSON object, JSON string, or array
    let payload = data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr) {
        console.warn('[Portfolio] Could not JSON parse RPC response:', data);
      }
    }
    const resultObj = Array.isArray(payload) ? payload[0] : payload;

    const rawLiked = resultObj?.liked ?? resultObj?.is_liked ?? resultObj?.isLiked ?? false;
    const rawLikesCount = resultObj?.likes_count ?? resultObj?.likesCount ?? resultObj?.likes;
    const finalLikesCount = rawLikesCount != null ? Number(rawLikesCount) : 0;

    return {
      liked: Boolean(rawLiked),
      likesCount: !isNaN(finalLikesCount) ? finalLikesCount : 0,
      error: null,
    };
  } catch (err: any) {
    console.error('[Portfolio] Unexpected error in togglePortfolioLikeRpc:', err);
    return { liked: false, likesCount: 0, error: err?.message || 'Failed to toggle like.' };
  }
}

/**
 * Atomically increments the view count for a portfolio project via database RPC
 * for the authenticated account.
 */
export async function recordPortfolioViewRpc(
  projectId: string
): Promise<{ viewed: boolean; viewsCount: number | null; error: string | null }> {
  if (!projectId) {
    return { viewed: false, viewsCount: null, error: 'Project ID is required.' };
  }

  if (!isSupabaseConfigured()) {
    return { viewed: false, viewsCount: null, error: null };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      // Unauthenticated: do not call RPC, no view recorded
      return { viewed: false, viewsCount: null, error: null };
    }

    const { data, error } = await supabase.rpc('record_portfolio_view', {
      p_project_id: projectId,
    });

    if (error) {
      return { viewed: false, viewsCount: null, error: error.message };
    }

    if (typeof data === 'object' && data !== null) {
      const rawCount = data.views_count ?? data.viewsCount;
      const safeViews = rawCount !== null && rawCount !== undefined ? normalizeNumericStat(rawCount, 0) : null;
      return {
        viewed: Boolean(data.viewed),
        viewsCount: safeViews,
        error: null,
      };
    }

    if (typeof data === 'number' || typeof data === 'string') {
      return { viewed: true, viewsCount: normalizeNumericStat(data, 0), error: null };
    }

    return { viewed: false, viewsCount: null, error: null };
  } catch (err: any) {
    return { viewed: false, viewsCount: null, error: err?.message || 'Failed to record project view.' };
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

const VIEWED_PROJECTS_STORAGE_KEY = 'brewster_viewed_portfolio_projects';

/**
 * Returns the set of project IDs that have been viewed by the visitor session.
 * Reads from localStorage under 'brewster_viewed_portfolio_projects'.
 * Supports both { [sessionId]: string[] } and plain string[] schemas.
 */
export function getLocalViewedProjects(sessionId?: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const sid = sessionId || getVisitorSessionId();
  try {
    const raw = localStorage.getItem(VIEWED_PROJECTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);

    // Schema A: Object mapping sessionId to project ID array: { [sessionId]: string[] }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const list = parsed[sid];
      if (Array.isArray(list)) {
        return new Set(list);
      }
      return new Set();
    }

    // Schema B: Flat array of project IDs: string[]
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }

    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * Checks whether a given project ID has already been recorded as viewed for the visitor session.
 */
export function isProjectViewedLocally(projectId: string, sessionId?: string): boolean {
  if (!projectId) return false;
  return getLocalViewedProjects(sessionId).has(projectId);
}

/**
 * Marks a portfolio project as viewed by the visitor session in persistent localStorage.
 * Only called after the record_portfolio_view RPC succeeds.
 */
export function setLocalProjectViewed(projectId: string, sessionId?: string): void {
  if (typeof window === 'undefined' || !projectId) return;
  const sid = sessionId || getVisitorSessionId();
  try {
    const raw = localStorage.getItem(VIEWED_PROJECTS_STORAGE_KEY);
    let store: Record<string, string[]> = {};
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          store = parsed;
        } else if (Array.isArray(parsed)) {
          store[sid] = parsed;
        }
      } catch {}
    }

    const sessionList = Array.isArray(store[sid]) ? store[sid] : [];
    if (!sessionList.includes(projectId)) {
      sessionList.push(projectId);
    }
    store[sid] = sessionList;
    localStorage.setItem(VIEWED_PROJECTS_STORAGE_KEY, JSON.stringify(store));
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
 * In-flight promise registry to prevent duplicate concurrent calls from
 * React StrictMode mount/remount or fast navigation while an RPC is in flight.
 */
const inFlightViewRequests = new Map<string, Promise<{ viewed: boolean; viewsCount: number | null; error: string | null }>>();

/**
 * Atomically records a project view for the authenticated account.
 * Client in-flight tracking is purely for performance and concurrency deduplication;
 * the database unique ledger (portfolio_views) is the authoritative source of truth.
 */
export async function recordPortfolioViewDebounced(
  projectId: string,
  userId?: string
): Promise<{ viewed: boolean; viewsCount: number | null; error: string | null }> {
  if (!projectId) {
    return { viewed: false, viewsCount: null, error: 'Project ID is required.' };
  }

  // If visitor is unauthenticated, do NOT attempt to record a view
  if (!userId) {
    return { viewed: false, viewsCount: null, error: null };
  }

  // Prevent concurrent duplicate executions (e.g. React StrictMode mount-unmount-mount)
  const flightKey = `${userId}:${projectId}`;
  if (inFlightViewRequests.has(flightKey)) {
    return inFlightViewRequests.get(flightKey)!;
  }

  const flightPromise = (async () => {
    try {
      const res = await recordPortfolioViewRpc(projectId);
      return res;
    } finally {
      inFlightViewRequests.delete(flightKey);
    }
  })();

  inFlightViewRequests.set(flightKey, flightPromise);
  return flightPromise;
}

