import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Mail,
  Search,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

interface ClientStudioManagementProps {
  onSelectCommission?: (commissionId: string) => void;
}

interface ClientDirectoryEntry {
  id: string;
  name: string;
  email: string;
  avatar: string;
  handle?: string;
  contactMethod?: string;
  commissionsCount: number;
  activeCommissionsCount: number;
  latestProject: string | null;
  latestCommissionId: string | null;
  profileRestricted?: boolean;
}

export const ClientStudioManagement: React.FC<ClientStudioManagementProps> = ({
  onSelectCommission,
}) => {
  const {
    commissions = [],
    users = [],
    currentUser,
    usersLoading,
    usersLoadError,
    refreshUsers,
  } = useApp();

  const safeCommissions = commissions || [];
  const safeUsers = users || [];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Build unified Client Directory:
  // 1. All registered client profiles from public.profiles (role === 'client')
  // 2. Fallback entries for any non-admin client_ids found in public.commissions
  //    whose profile row wasn't returned (e.g. if live RLS policy on public.profiles
  //    hasn't granted admins SELECT access to all profiles yet).
  const { clientList, hasRestrictedProfiles, allCommissionsOwnedByAdmin } = useMemo(() => {
    const knownUserIds = new Set(safeUsers.map((u) => u?.id).filter(Boolean));
    const entries: ClientDirectoryEntry[] = [];

    const countActive = (list: typeof safeCommissions) =>
      list.filter((c) => {
        const s = (c.status || '').toLowerCase();
        return (
          !s.includes('completed') &&
          !s.includes('cancelled') &&
          !s.includes('rejected') &&
          c.currentStage !== 8
        );
      }).length;

    // 1. Registered client accounts from public.profiles
    for (const client of safeUsers) {
      if (!client || client.role !== 'client') continue;
      const normalizedEmail = client.email?.trim().toLowerCase() || '';
      const clientComms = safeCommissions.filter(
        (c) =>
          c &&
          (c.clientId === client.id ||
            (Boolean(normalizedEmail) &&
              Boolean(c.clientEmail) &&
              c.clientEmail.trim().toLowerCase() === normalizedEmail))
      );

      entries.push({
        id: client.id,
        name: client.name || (client.email ? client.email.split('@')[0] : 'Client'),
        email: client.email || '',
        avatar:
          client.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        handle: client.handle,
        contactMethod: client.contactMethod,
        commissionsCount: clientComms.length,
        activeCommissionsCount: countActive(clientComms),
        latestProject: clientComms[0]?.projectName || null,
        latestCommissionId: clientComms[0]?.id || null,
        profileRestricted: false,
      });
    }

    // 2. Unresolved client_ids discovered in commissions (excluding the admin's own account)
    const unseenClientMap = new Map<string, typeof safeCommissions>();
    for (const comm of safeCommissions) {
      if (!comm || !comm.clientId) continue;
      if (comm.clientId === currentUser?.id) continue;
      if (knownUserIds.has(comm.clientId)) continue;
      const list = unseenClientMap.get(comm.clientId) || [];
      list.push(comm);
      unseenClientMap.set(comm.clientId, list);
    }

    for (const [clientId, clientComms] of unseenClientMap.entries()) {
      const sample = clientComms[0];
      entries.push({
        id: clientId,
        name:
          sample?.clientName && sample.clientName !== 'Client'
            ? sample.clientName
            : `Client #${clientId.slice(0, 8)}`,
        email: sample?.clientEmail || '',
        avatar:
          sample?.clientAvatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        handle: sample?.clientHandle,
        contactMethod: sample?.contactMethod,
        commissionsCount: clientComms.length,
        activeCommissionsCount: countActive(clientComms),
        latestProject: sample?.projectName || null,
        latestCommissionId: sample?.id || null,
        profileRestricted: !sample?.clientEmail,
      });
    }

    // Sort by most commissions first, then alphabetically
    entries.sort((a, b) => {
      if (b.commissionsCount !== a.commissionsCount) {
        return b.commissionsCount - a.commissionsCount;
      }
      return a.name.localeCompare(b.name);
    });

    const restricted = unseenClientMap.size > 0;
    const onlyAdminCommissions =
      entries.length === 0 &&
      safeCommissions.length > 0 &&
      safeCommissions.every((c) => c.clientId === currentUser?.id);

    return {
      clientList: entries,
      hasRestrictedProfiles: restricted,
      allCommissionsOwnedByAdmin: onlyAdminCommissions,
    };
  }, [safeUsers, safeCommissions, currentUser?.id]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clientList;
    return clientList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.handle || '').toLowerCase().includes(q) ||
        (c.latestProject || '').toLowerCase().includes(q)
    );
  }, [clientList, searchQuery]);

  const handleCopyEmail = async (email: string, id: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmailId(id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedEmailId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Client Directory Header & Search Toolbar */}
      <div className="bg-surface border border-hairline rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#111114] text-white dark:bg-white dark:text-[#111114]">
            <Users className="w-3.5 h-3.5" />
            <span>Clients ({clientList.length})</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, or project..."
              className="w-full bg-surface-secondary border border-hairline rounded-full pl-9 pr-4 py-2 text-xs text-carbon placeholder:text-graphite focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={() => refreshUsers()}
            disabled={usersLoading}
            title="Refresh client directory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-hairline bg-surface-secondary hover:border-accent text-xs font-semibold text-carbon transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Database Error Notice (if any) */}
      {usersLoadError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">Unable to load full client profiles</p>
            <p className="opacity-90">{usersLoadError}</p>
          </div>
        </div>
      )}

      {/* RLS Visibility Notice (only if commission client_ids exist that profiles RLS hid) */}
      {hasRestrictedProfiles && !usersLoadError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5">
            <p className="font-semibold">Some client profile details are hidden by database RLS</p>
            <p className="opacity-90 leading-relaxed">
              Showing clients derived from active commissions. To display full names and email addresses from{' '}
              <code className="font-mono">public.profiles</code>, run the{' '}
              <code className="font-mono">Admins can view all profiles</code> policy in Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* CLIENTS DIRECTORY */}
      <div className="space-y-4 animate-in fade-in duration-150">
        {usersLoading && clientList.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-3xl p-10 text-center space-y-2">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-mono text-graphite">Loading client directory...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-3xl p-10 text-center space-y-2">
            <p className="font-display font-bold text-sm text-carbon">
              {searchQuery.trim()
                ? 'No matching clients found'
                : 'No registered client accounts yet'}
            </p>
            <p className="text-xs text-graphite max-w-md mx-auto leading-relaxed">
              {searchQuery.trim()
                ? 'Try clearing your search query to view all clients.'
                : allCommissionsOwnedByAdmin
                ? `All ${safeCommissions.length} commissions currently in the studio belong to your admin account. External client accounts will appear here as soon as clients register.`
                : 'Registered clients and their active commission counts will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id || client.email}
                className="bg-surface border border-hairline hover:border-accent/40 transition-colors rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={client.avatar}
                      alt={client.name || 'Client Avatar'}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-hairline shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm text-carbon truncate">
                        {client.name}
                      </h4>
                      {client.email ? (
                        <p className="text-xs font-mono text-graphite truncate">
                          {client.email}
                        </p>
                      ) : (
                        <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 truncate">
                          ID: {client.id.slice(0, 8)}…
                        </p>
                      )}
                      {client.handle && (
                        <p className="text-[11px] text-graphite truncate mt-0.5">
                          {client.handle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-hairline space-y-1.5 font-mono text-xs text-graphite">
                    <div className="flex justify-between">
                      <span>Commissions:</span>
                      <span className="font-bold text-carbon">
                        {client.commissionsCount}
                        {client.activeCommissionsCount > 0 && (
                          <span className="font-normal text-accent ml-1">
                            ({client.activeCommissionsCount} active)
                          </span>
                        )}
                      </span>
                    </div>
                    {client.latestProject && (
                      <div className="flex justify-between gap-2">
                        <span className="shrink-0">Latest:</span>
                        <span className="text-carbon truncate">{client.latestProject}</span>
                      </div>
                    )}
                    {client.contactMethod && !client.profileRestricted && (
                      <div className="flex justify-between gap-2">
                        <span className="shrink-0">Contact:</span>
                        <span className="text-carbon truncate">{client.contactMethod}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-hairline flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {client.email ? (
                      <>
                        <a
                          href={`mailto:${client.email}`}
                          className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(client.email, client.id)}
                          className="text-xs font-mono text-graphite hover:text-carbon cursor-pointer"
                        >
                          {copiedEmailId === client.id ? 'Copied' : 'Copy'}
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-mono text-graphite">
                        No email synced
                      </span>
                    )}
                  </div>

                  {client.latestCommissionId && onSelectCommission && (
                    <button
                      type="button"
                      onClick={() => onSelectCommission(client.latestCommissionId!)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-carbon hover:text-accent transition-colors cursor-pointer"
                    >
                      <span>Project</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
