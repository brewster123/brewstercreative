import { supabase } from './supabase';
import { PortfolioProject } from '../types';

export const PORTFOLIO_MEDIA_BUCKET = 'portfolio-media';
export const MAX_PORTFOLIO_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

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
