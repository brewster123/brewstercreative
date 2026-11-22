import { supabase } from './supabase';
import { AppNotification, NotificationType } from '../types';

export interface DbNotificationRow {
  id: string;
  user_id: string;
  title?: string;
  message: string;
  type: string;
  is_read: boolean;
  commission_id?: string | null;
  link_tab?: string | null;
  created_at: string;
}

/**
 * Friendly timestamp formatting for notification items.
 */
export function formatNotificationTimestamp(isoDate: string): string {
  if (!isoDate) return 'Just now';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

/**
 * Normalizes notification types to ensure backward and forward compatibility.
 */
export function normalizeNotificationType(rawType: string): NotificationType {
  const t = (rawType || '').toLowerCase();
  switch (t) {
    case 'message':
      return 'message';
    case 'commission_update':
    case 'status':
      return 'commission_update';
    case 'proof_review':
    case 'review':
      return 'proof_review';
    case 'proof_revision':
      return 'proof_revision';
    case 'proof_approved':
      return 'proof_approved';
    case 'commission_completed':
    case 'delivery':
      return 'commission_completed';
    case 'payment_submitted':
      return 'payment_submitted';
    case 'payment_verified':
      return 'payment_verified';
    case 'payment_rejected':
      return 'payment_rejected';
    case 'system':
    default:
      return 'system';
  }
}

/**
 * Converts a database row to the UI AppNotification object.
 */
export function mapDbRowToNotification(row: DbNotificationRow): AppNotification {
  const normType = normalizeNotificationType(row.type);
  const friendlyTime = formatNotificationTimestamp(row.created_at);

  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    recipient_id: row.user_id,
    recipientId: row.user_id,
    commissionId: row.commission_id || undefined,
    commission_id: row.commission_id || undefined,
    title: row.title || 'Studio Notice',
    message: row.message || '',
    type: normType,
    readStatus: Boolean(row.is_read),
    is_read: Boolean(row.is_read),
    timestamp: friendlyTime,
    created_at: row.created_at,
    createdAt: row.created_at,
    linkTab: row.link_tab || undefined,
    link_tab: row.link_tab || undefined,
  };
}

/**
 * Dynamically resolves all studio administrator UUIDs from the database.
 * Tries the SECURITY DEFINER RPC `get_studio_admin_ids` first (works for clients under profiles RLS),
 * then falls back to querying `public.profiles` (works for admins), and finally the canonical fallback UUID.
 */
const FALLBACK_ADMIN_ID = 'd4440c2e-aeea-4a8d-bcaf-7b844ec2be69';
let cachedAdminIds: string[] | null = null;

export function clearResolvedAdminCache(): void {
  cachedAdminIds = null;
}

export async function resolveAdminUserIds(): Promise<string[]> {
  if (cachedAdminIds && cachedAdminIds.length > 0) return cachedAdminIds;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_studio_admin_ids');
    if (!rpcError && Array.isArray(rpcData)) {
      const ids = rpcData
        .map((row: any) => (typeof row === 'string' ? row : row?.id || row?.admin_id))
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      if (ids.length > 0) {
        cachedAdminIds = Array.from(new Set(ids));
        return cachedAdminIds;
      }
    }
  } catch {
    // RPC may not exist yet in older databases; fall through to profiles query
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    const ids = (data || [])
      .map((row: any) => row?.id)
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

    if (ids.length > 0) {
      cachedAdminIds = Array.from(new Set(ids));
      return cachedAdminIds;
    }
  } catch {
    // Non-fatal fallback
  }

  return [FALLBACK_ADMIN_ID];
}

/**
 * Dynamically resolves the primary studio administrator's UUID from the database.
 */
export async function resolveAdminUserId(): Promise<string> {
  const ids = await resolveAdminUserIds();
  return ids[0] || FALLBACK_ADMIN_ID;
}

/**
 * Fetches persistent notifications for the active user from Supabase.
 * Enforces user isolation via Row Level Security (auth.uid() = user_id).
 */
export async function fetchUserNotifications(
  userId: string,
  limit = 50
): Promise<{ data: AppNotification[] | null; error: string | null }> {
  if (!userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message || 'Failed to fetch notifications from database.',
      };
    }

    const mapped = (data as DbNotificationRow[]).map(mapDbRowToNotification);
    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Unexpected network error fetching notifications.',
    };
  }
}

/**
 * Inserts a persistent notification in Supabase public.notifications.
 * Avoids `INSERT ... RETURNING *` (`.select()`) when inserting for another user so
 * SELECT RLS (`auth.uid() = user_id or public.is_admin()`) does not reject cross-user inserts.
 * Includes graceful column fallback for table resilience.
 */
export async function createNotificationInDb(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  commissionId?: string | null;
  linkTab?: string | null;
  callerUserId?: string | null;
}): Promise<{ data: AppNotification | null; error: string | null }> {
  const { recipientId, type, title, message, commissionId, linkTab, callerUserId } = params;

  if (!recipientId?.trim()) {
    return { data: null, error: 'Recipient ID is required for notification.' };
  }
  if (!message?.trim()) {
    return { data: null, error: 'Notification message cannot be empty.' };
  }

  const nowIso = new Date().toISOString();
  const buildSynthesizedNotification = (): AppNotification => ({
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `notif-${Date.now()}`,
    userId: recipientId,
    user_id: recipientId,
    recipientId,
    recipient_id: recipientId,
    commissionId: commissionId || undefined,
    commission_id: commissionId || undefined,
    title: title || 'Studio Notice',
    message: message.trim(),
    type: normalizeNotificationType(type),
    readStatus: false,
    is_read: false,
    timestamp: 'Just now',
    created_at: nowIso,
    createdAt: nowIso,
    linkTab: linkTab || 'overview',
    link_tab: linkTab || 'overview',
  });

  try {
    const basicPayload = {
      user_id: recipientId,
      type,
      title: title || 'Studio Notice',
      message: message.trim(),
      is_read: false,
    };

    const fullPayload: any = { ...basicPayload };
    if (commissionId) {
      fullPayload.commission_id = commissionId;
    }
    if (linkTab) {
      fullPayload.link_tab = linkTab;
    }

    const payloadWithoutLinkTab = {
      ...basicPayload,
      ...(commissionId ? { commission_id: commissionId } : {}),
    };

    const minimalPayload = {
      user_id: recipientId,
      type,
      message: message.trim(),
      is_read: false,
    };

    const isCrossUserInsert = Boolean(callerUserId && callerUserId !== recipientId);

    const insertWithOptionalSelect = async (payloadToInsert: any, useSelect: boolean) => {
      if (useSelect) {
        return supabase.from('notifications').insert(payloadToInsert).select().single();
      }
      return supabase.from('notifications').insert(payloadToInsert);
    };

    const isMissingColumnError = (err: { code?: string; message?: string } | null | undefined) => {
      if (!err) return false;
      return (
        err.code === '42703' ||
        err.code === 'PGRST204' ||
        /could not find.*column/i.test(err.message || '') ||
        /column .* does not exist/i.test(err.message || '')
      );
    };

    let useSelect = !isCrossUserInsert;
    let res = await insertWithOptionalSelect(fullPayload, useSelect);

    // If RETURNING * was blocked by SELECT RLS on a cross-user insert, retry without .select()
    if (
      res.error &&
      useSelect &&
      (res.error.code === '42501' || /row-level security/i.test(res.error.message || ''))
    ) {
      useSelect = false;
      res = await insertWithOptionalSelect(fullPayload, false);
    }

    // Progressive schema fallbacks if link_tab, commission_id, or title columns are absent
    if (isMissingColumnError(res.error) && linkTab) {
      res = await insertWithOptionalSelect(payloadWithoutLinkTab, useSelect);
    }
    if (isMissingColumnError(res.error)) {
      res = await insertWithOptionalSelect(basicPayload, useSelect);
    }
    if (isMissingColumnError(res.error)) {
      res = await insertWithOptionalSelect(minimalPayload, useSelect);
    }

    if (res.error) {
      return {
        data: null,
        error: res.error.message || 'Failed to record notification in database.',
      };
    }

    if (res.data) {
      const mapped = mapDbRowToNotification(res.data as DbNotificationRow);
      return { data: mapped, error: null };
    }

    return { data: buildSynthesizedNotification(), error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Unexpected error creating notification.',
    };
  }
}

/**
 * Marks a single notification as read in Supabase.
 */
export async function markNotificationReadInDb(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!notificationId) {
    return { success: false, error: 'Notification ID required.' };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating notification read status.' };
  }
}

/**
 * Marks all notifications for a specific user as read in Supabase.
 */
export async function markAllNotificationsReadInDb(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!userId) {
    return { success: false, error: 'User ID required.' };
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error updating all notifications read status.' };
  }
}

/**
 * Subscribes to real-time notifications for the active user.
 */
let notifChannelSeq = 0;

export function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (notif: AppNotification) => void
): () => void {
  if (!userId) return () => {};

  const channelId = `realtime-notifs-${userId}-${Date.now()}-${++notifChannelSeq}`;
  const channel = supabase.channel(channelId);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          const mapped = mapDbRowToNotification(payload.new as DbNotificationRow);
          onNewNotification(mapped);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Triggers a native desktop/browser notification when permission has been granted.
 * Silently no-ops in unsupported environments or restricted iframes.
 */
export function showBrowserNotification(params: {
  title: string;
  message: string;
  tag?: string;
  onClick?: () => void;
}): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  try {
    const nativeNotif = new window.Notification(params.title || 'DESTALION Studio Notice', {
      body: params.message,
      icon: '/favicon-32x32.png',
      tag: params.tag,
    });
    nativeNotif.onclick = () => {
      try {
        window.focus();
        params.onClick?.();
        nativeNotif.close();
      } catch {
        // Ignore iframe focus restrictions
      }
    };
  } catch {
    // Native Notification constructor may throw in restricted environments
  }
}

