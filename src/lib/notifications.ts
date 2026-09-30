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
 * Dynamically resolves the primary studio administrator's UUID from the database.
 */
let cachedAdminId: string | null = null;
export async function resolveAdminUserId(): Promise<string> {
  if (cachedAdminId) return cachedAdminId;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      cachedAdminId = data.id;
      return data.id;
    }
  } catch {
    // Non-fatal fallback
  }
  return 'd4440c2e-aeea-4a8d-bcaf-7b844ec2be69';
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
 * Includes graceful column fallback for table resilience.
 */
export async function createNotificationInDb(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  commissionId?: string | null;
  linkTab?: string | null;
}): Promise<{ data: AppNotification | null; error: string | null }> {
  const { recipientId, type, title, message, commissionId, linkTab } = params;

  if (!recipientId?.trim()) {
    return { data: null, error: 'Recipient ID is required for notification.' };
  }
  if (!message?.trim()) {
    return { data: null, error: 'Notification message cannot be empty.' };
  }

  try {
    // Try complete payload with commission_id and link_tab
    const payload: any = {
      user_id: recipientId,
      type,
      title: title || 'Studio Notice',
      message: message.trim(),
      is_read: false,
    };

    if (commissionId) {
      payload.commission_id = commissionId;
    }
    if (linkTab) {
      payload.link_tab = linkTab;
    }

    let { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    // If commission_id or link_tab column does not exist in schema, retry with core columns
    if (error && error.code === '42703') {
      const basicPayload = {
        user_id: recipientId,
        type,
        title: title || 'Studio Notice',
        message: message.trim(),
        is_read: false,
      };

      const fallback = await supabase
        .from('notifications')
        .insert(basicPayload)
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return {
        data: null,
        error: error.message || 'Failed to record notification in database.',
      };
    }

    if (!data) {
      return { data: null, error: 'No notification data returned from database insert.' };
    }

    const mapped = mapDbRowToNotification(data as DbNotificationRow);
    return { data: mapped, error: null };
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
export function subscribeToUserNotifications(
  userId: string,
  onNewNotification: (notif: AppNotification) => void
): () => void {
  if (!userId) return () => {};

  const channelId = `realtime-notifs-${userId}-${Date.now()}`;
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
