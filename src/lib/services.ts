import { supabase } from './supabase';
import { ServiceItem } from '../types';

/**
 * Maps a database row from public.services to frontend ServiceItem.
 */
export function mapDbToServiceItem(row: any): ServiceItem {
  const rawDeliverables: string[] = Array.isArray(row.deliverables) ? row.deliverables : [];
  // Cleanse any legacy unsupported licensing claims from database rows
  const deliverables = rawDeliverables.map((d) => {
    if (typeof d === 'string' && /commercial.*license/i.test(d)) {
      return 'Presentation-ready files';
    }
    return d;
  });

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    shortDesc: row.short_desc,
    startingPrice: Number(row.starting_price) || 0,
    turnaround: row.turnaround,
    revisionsCount: typeof row.revisions_count === 'number' ? row.revisions_count : 2,
    deliverables,
    popular: !!row.popular,
    iconName: row.icon_name || 'Sparkles',
    relatedShopProductIds: Array.isArray(row.related_shop_product_ids) ? row.related_shop_product_ids : [],
  };
}

/**
 * Maps a frontend ServiceItem to database columns for public.services.
 */
export function mapServiceItemToDb(item: ServiceItem, displayOrder: number = 0): any {
  const sanitizedDeliverables = (item.deliverables || []).map((d) => {
    if (typeof d === 'string' && /commercial.*license/i.test(d)) {
      return 'Presentation-ready files';
    }
    return d;
  });

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    short_desc: item.shortDesc,
    starting_price: item.startingPrice,
    turnaround: item.turnaround,
    revisions_count: item.revisionsCount,
    deliverables: sanitizedDeliverables,
    popular: !!item.popular,
    icon_name: item.iconName || 'Sparkles',
    related_shop_product_ids: item.relatedShopProductIds || [],
    display_order: displayOrder,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetches all services from Supabase ordered by display_order asc.
 * Public read access.
 */
export async function fetchServicesFromDb(): Promise<{
  data: ServiceItem[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    const mapped = (data || []).map(mapDbToServiceItem);
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to fetch services from database.' };
  }
}

/**
 * Inserts or updates a service in public.services (Restricted to Admin by RLS).
 */
export async function upsertServiceInDb(
  item: ServiceItem,
  displayOrder: number = 0
): Promise<{ data: ServiceItem | null; error: string | null }> {
  try {
    const payload = mapServiceItemToDb(item, displayOrder);
    const { data, error } = await supabase
      .from('services')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapDbToServiceItem(data), error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to persist service package.' };
  }
}

/**
 * Deletes a service by ID from public.services (Restricted to Admin by RLS).
 */
export async function deleteServiceFromDb(
  serviceId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete service.' };
  }
}
