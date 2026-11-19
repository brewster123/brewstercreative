import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  FolderArchive, 
  CreditCard, 
  Users, 
  ShieldCheck
} from 'lucide-react';
import { StudioOverview } from '../components/admin/StudioOverview';
import { CommissionManagement } from '../components/admin/CommissionManagement';
import { PaymentsVerification } from '../components/admin/PaymentsVerification';
import { ClientStudioManagement } from '../components/admin/ClientStudioManagement';
import { fetchCommissionPaymentProofs, subscribeToPaymentProofs } from '../lib/payments';

type AdminHub = 'overview' | 'commissions' | 'payments' | 'studio';

export const AdminDashboardView: React.FC = () => {
  const { 
    commissions, 
    users,
    activeCommission,
    setActiveCommissionId,
    currentUser,
    authLoading,
    setActiveView,
    activeDashboardTab,
    setActiveDashboardTab
  } = useApp();

  const [activeHub, setActiveHub] = useState<AdminHub>('overview');
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>(
    activeCommission?.id || commissions[0]?.id || ''
  );
  const [commissionWorkspaceTab, setCommissionWorkspaceTab] = useState<'proofs' | 'deliverables' | 'payments' | 'specifications'>('proofs');

  // Keep selectedCommissionId synchronized once commissions finish loading asynchronously
  useEffect(() => {
    if (!selectedCommissionId) {
      const fallbackId = activeCommission?.id || commissions[0]?.id || '';
      if (fallbackId) {
        setSelectedCommissionId(fallbackId);
      }
    }
  }, [selectedCommissionId, activeCommission?.id, commissions]);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);

  // Sync real-time pending payments counter
  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const { data } = await fetchCommissionPaymentProofs();
        if (data && isMounted) {
          setPendingPaymentsCount(data.filter((p) => p.status === 'pending_verification').length);
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchPending();
    const unsub = subscribeToPaymentProofs(undefined, () => {
      fetchPending();
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Backward-compatibility synchronization for external tab triggers
  useEffect(() => {
    if (!activeDashboardTab) return;

    switch (activeDashboardTab) {
      case 'overview':
        setActiveHub('overview');
        break;
      case 'commissions':
        setActiveHub('commissions');
        break;
      case 'payment-verification':
      case 'payments':
        setActiveHub('payments');
        break;
      case 'proof-uploader':
      case 'creative':
        setActiveHub('commissions');
        setCommissionWorkspaceTab('proofs');
        break;
      case 'deliverables':
        setActiveHub('commissions');
        setCommissionWorkspaceTab('deliverables');
        break;
      case 'clients':
        setActiveHub('studio');
        break;
      case 'website-info':
      case 'profile':
      case 'typography':
      case 'admin-account':
        setActiveDashboardTab('overview');
        setActiveView('settings');
        break;
      case 'services':
        setActiveDashboardTab('overview');
        setActiveView('services');
        break;
      case 'portfolio':
        setActiveDashboardTab('overview');
        setActiveView('portfolio');
        break;
      case 'studio':
        setActiveHub('studio');
        break;
      default:
        break;
    }
  }, [activeDashboardTab]);

  const handleSelectHub = (hub: AdminHub) => {
    setActiveHub(hub);
    setActiveDashboardTab(hub);
  };

  const handleHubNavigation = (
    hub: 'commissions' | 'payments' | 'studio',
    commissionId?: string,
    subTab?: string
  ) => {
    if (commissionId) {
      setSelectedCommissionId(commissionId);
    }
    if (hub === 'commissions' && subTab) {
      const validWorkspaceTabs = ['proofs', 'deliverables', 'payments', 'specifications'] as const;
      if (validWorkspaceTabs.includes(subTab as any)) {
        setCommissionWorkspaceTab(subTab as 'proofs' | 'deliverables' | 'payments' | 'specifications');
      }
    }
    if (hub === 'studio' && subTab === 'profile') {
      setActiveDashboardTab('overview');
      setActiveView('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (hub === 'studio' && subTab === 'services') {
      setActiveDashboardTab('overview');
      setActiveView('services');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (hub === 'studio' && subTab === 'portfolio') {
      setActiveDashboardTab('overview');
      setActiveView('portfolio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveHub(hub);
    setActiveDashboardTab(hub);
  };

  const clientsCount = useMemo(() => {
    const safeUsers = users || [];
    const safeCommissions = commissions || [];
    const registeredClientsCount = safeUsers.filter((u) => u && u.role === 'client').length;
    const knownUserIds = new Set(safeUsers.map((u) => u?.id).filter(Boolean));
    const unseenCommissionClientIds = new Set(
      safeCommissions
        .map((c) => c?.clientId)
        .filter((id): id is string => Boolean(id) && id !== currentUser?.id && !knownUserIds.has(id))
    );
    return registeredClientsCount + unseenCommissionClientIds.size;
  }, [users, commissions, currentUser?.id]);

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-graphite font-mono">
          Verifying studio director credentials...
        </p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-hairline flex items-center justify-center mx-auto text-graphite">
          <ShieldCheck className="w-5 h-5 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon">
            Studio Director Access
          </h2>
          <p className="text-xs sm:text-sm text-graphite max-w-md mx-auto leading-relaxed">
            This production console is strictly reserved for authorized studio directors.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-6 py-2.5 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] font-semibold text-xs transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Primary Hub Navigation Bar */}
      <nav 
        className="flex items-center gap-2 border-b border-hairline pb-3 overflow-x-auto no-scrollbar" 
        aria-label="Studio administration navigation"
      >
        {[
          { 
            id: 'overview' as const, 
            label: 'Overview', 
            icon: Sparkles,
            badge: undefined
          },
          { 
            id: 'commissions' as const, 
            label: 'Commissions', 
            icon: FolderArchive, 
            count: commissions.length 
          },
          { 
            id: 'payments' as const, 
            label: 'Payments & Verification', 
            icon: CreditCard, 
            badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} pending` : undefined 
          },
          { 
            id: 'studio' as const, 
            label: 'Clients', 
            icon: Users,
            count: clientsCount
          },
        ].map(({ id, label, icon: TabIcon, count, badge }) => {
          const isSelected = activeHub === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectHub(id)}
              aria-selected={isSelected}
              className={`relative px-4 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile ${
                isSelected
                  ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114] shadow-xs'
                  : 'bg-surface border border-hairline text-graphite hover:text-carbon hover:border-accent'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{label}</span>

              {typeof count === 'number' && (
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                  isSelected 
                    ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#111114]' 
                    : 'bg-surface-secondary text-graphite'
                }`}>
                  {count}
                </span>
              )}

              {badge && (
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-accent text-white">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hub 1: Studio Overview */}
      {activeHub === 'overview' && (
        <StudioOverview
          commissions={commissions}
          users={users}
          pendingPaymentsCount={pendingPaymentsCount}
          onNavigate={handleHubNavigation}
          onSelectCommission={(id) => {
            setSelectedCommissionId(id);
            handleHubNavigation('commissions', id);
          }}
        />
      )}

      {/* Hub 2: Commission Management (Level 1 Ledger + Level 2 Project Workspace) */}
      {activeHub === 'commissions' && (
        <CommissionManagement
          selectedCommissionId={selectedCommissionId}
          initialWorkspaceTab={commissionWorkspaceTab}
          onSelectCommission={(id) => setSelectedCommissionId(id)}
          onOpenChat={(commissionId) => {
            if (commissionId) {
              setSelectedCommissionId(commissionId);
              setActiveCommissionId(commissionId);
            }
            setActiveView('chat');
          }}
          onNavigateToPayments={(commissionId) => handleHubNavigation('payments', commissionId)}
        />
      )}

      {/* Hub 3: Payments & Verification (GCash Manual Audit & Review) */}
      {activeHub === 'payments' && (
        <PaymentsVerification
          commissions={commissions}
          currentUser={currentUser}
          selectedCommissionId={selectedCommissionId}
          onNavigateToCommission={(id) => handleHubNavigation('commissions', id)}
        />
      )}

      {/* Hub 4: Clients Directory */}
      {activeHub === 'studio' && (
        <ClientStudioManagement
          onSelectCommission={(id) => {
            setSelectedCommissionId(id);
            handleHubNavigation('commissions', id);
          }}
        />
      )}
    </div>
  );
};
