import { supabase } from './supabase';
import { Message, MessageAttachment, User, UserRole } from '../types';

export interface DbMessageRow {
  id: string;
  commission_id: string;
  sender_id: string;
  body?: string;
  message?: string;
  created_at: string;
  updated_at?: string;
}

// In-memory cache for profiles during message mapping to avoid repeated DB lookups
const profileCache = new Map<string, { name: string; role: UserRole; avatar: string }>();

/**
 * Enriches a sender ID with actual profile details from Supabase or cache.
 */
async function resolveSenderProfile(
  senderId: string,
  currentUser?: User | null
): Promise<{ name: string; role: UserRole; avatar: string }> {
  if (currentUser && currentUser.id === senderId) {
    return {
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar,
    };
  }

  if (profileCache.has(senderId)) {
    return profileCache.get(senderId)!;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, avatar')
      .eq('id', senderId)
      .maybeSingle();

    if (!error && data) {
      const resolved = {
        name: data.name || 'Studio Participant',
        role: (data.role as UserRole) || 'client',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      };
      profileCache.set(senderId, resolved);
      return resolved;
    }
  } catch (e) {
    // Non-fatal, return sensible fallback
  }

  const fallback = {
    name: 'Studio Participant',
    role: 'client' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  };
  profileCache.set(senderId, fallback);
  return fallback;
}

/**
 * Formats a raw timestamp for friendly display in chat bubbles.
 */
function formatMessageTimestamp(isoDate: string): string {
  if (!isoDate) return 'Just now';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    const todayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${todayStr} · ${timeStr}`;
  } catch {
    return isoDate;
  }
}

/**
 * Maps a database message row to the client-facing Message interface.
 */
export async function mapDbRowToMessage(
  row: DbMessageRow,
  currentUser?: User | null
): Promise<Message> {
  const sender = await resolveSenderProfile(row.sender_id, currentUser);
  const textBody = row.body ?? row.message ?? '';

  return {
    id: row.id,
    commissionId: row.commission_id,
    senderId: row.sender_id,
    senderName: sender.name,
    senderRole: sender.role,
    senderAvatar: sender.avatar,
    message: textBody,
    body: textBody,
    timestamp: formatMessageTimestamp(row.created_at),
    readStatus: true,
    createdAt: row.created_at,
    commission_id: row.commission_id,
    sender_id: row.sender_id,
    created_at: row.created_at,
  };
}

/**
 * Fetches all persistent messages for a specific commission from Supabase using Row-Level Security.
 * Enforces commission isolation: clients only receive messages for their own commissions.
 */
export async function fetchCommissionMessages(
  commissionId: string,
  currentUser?: User | null
): Promise<{ data: Message[] | null; error: string | null }> {
  if (!commissionId) {
    return { data: [], error: null };
  }

  try {
    // Attempt query on 'messages' table first (canonical Phase 5A table)
    let { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('commission_id', commissionId)
      .order('created_at', { ascending: true });

    // Resilient fallback to 'commission_messages' if 'messages' is not yet present
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('commission_messages')
        .select('*')
        .eq('commission_id', commissionId)
        .order('created_at', { ascending: true });

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return {
        data: null,
        error: error.message || 'Failed to fetch conversation history from database.',
      };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const mapped = await Promise.all(
      (data as DbMessageRow[]).map(row => mapDbRowToMessage(row, currentUser))
    );

    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Unexpected network error loading commission messages.',
    };
  }
}

/**
 * Sends a message attached to a commission in Supabase.
 * - Sender identity is enforced against the authenticated user (Step 4 Sender Security).
 * - Validates non-empty message body.
 */
export async function sendCommissionMessageToSupabase(
  commissionId: string,
  sender: User,
  body: string
): Promise<{ data: Message | null; error: string | null }> {
  if (!commissionId?.trim()) {
    return { data: null, error: 'Commission ID is required.' };
  }
  const cleanBody = body?.trim();
  if (!cleanBody) {
    return { data: null, error: 'Message cannot be empty.' };
  }

  try {
    // Attempt insert on 'messages' table first
    const payload = {
      commission_id: commissionId,
      sender_id: sender.id,
      body: cleanBody,
    };

    let { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single();

    // Fallback if 'messages' table not found
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('commission_messages')
        .insert({
          commission_id: commissionId,
          sender_id: sender.id,
          message: cleanBody,
        })
        .select()
        .single();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return {
        data: null,
        error: error.message || 'Failed to deliver message to database.',
      };
    }

    if (!data) {
      return {
        data: null,
        error: 'No message record returned after database insertion.',
      };
    }

    const mapped = await mapDbRowToMessage(data as DbMessageRow, sender);
    return { data: mapped, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Unexpected error while sending message to server.',
    };
  }
}

/**
 * Subscribes to Realtime updates for a commission conversation.
 * Automatically triggers callback on new database row insertion.
 */
export function subscribeToCommissionMessages(
  commissionId: string,
  onNewMessage: (msg: Message) => void,
  currentUser?: User | null
): () => void {
  if (!commissionId) return () => {};

  const channelId = `realtime-messages-${commissionId}-${Date.now()}`;
  const channel = supabase.channel(channelId);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `commission_id=eq.${commissionId}`,
      },
      async (payload) => {
        if (payload.new) {
          const mapped = await mapDbRowToMessage(payload.new as DbMessageRow, currentUser);
          onNewMessage(mapped);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'commission_messages',
        filter: `commission_id=eq.${commissionId}`,
      },
      async (payload) => {
        if (payload.new) {
          const mapped = await mapDbRowToMessage(payload.new as DbMessageRow, currentUser);
          onNewMessage(mapped);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
