import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  FolderArchive, 
  CreditCard, 
  Layers, 
  Settings, 
  ShieldCheck, 
  ArrowLeft,
  Clock,
  Briefcase
} from 'lucide-react';
import { StudioOverview } from '../components/admin/StudioOverview';
import { CommissionManagement } from '../components/admin/CommissionManagement';
import { PaymentsVerification } from '../components/admin/PaymentsVerification';
import { CreativeReviewDeliverables } from '../components/admin/CreativeReviewDeliverables';
import { ClientStudioManagement } from '../components/admin/ClientStudioManagement';
import { fetchCommissionPaymentProofs, subscribeToPaymentProofs } from '../lib/payments';

type AdminHub = 'overview' | 'commissions' | 'payments' | 'creative' | 'studio';

export const AdminDashboardView: React.FC = () => {
  const { 
    commissions, 
    users,
    activeCommission,
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
  const [creativeSubTab, setCreativeSubTab] = useState<'proofs' | 'deliverables'>('proofs');
  const [studioSubTab, setStudioSubTab] = useState<'clients' | 'profile' | 'services' | 'portfolio' | 'account'>('clients');

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
        setActiveHub('creative');
        setCreativeSubTab('proofs');
        break;
      case 'deliverables':
        setActiveHub('creative');
        setCreativeSubTab('deliverables');
        break;
      case 'creative':
        setActiveHub('creative');
        break;
      case 'clients':
        setActiveHub('studio');
        setStudioSubTab('clients');
        break;
      case 'website-info':
      case 'profile':
        setActiveHub('studio');
        setStudioSubTab('profile');
        break;
      case 'services':
        setActiveHub('studio');
        setStudioSubTab('services');
        break;
      case 'portfolio':
        setActiveHub('studio');
        setStudioSubTab('portfolio');
        break;
      case 'typography':
      case 'admin-account':
        setActiveHub('studio');
        setStudioSubTab('account');
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
    hub: 'commissions' | 'payments' | 'creative' | 'studio',
    commissionId?: string,
    subTab?: string
  ) => {
    if (commissionId) {
      setSelectedCommissionId(commissionId);
    }
    if (hub === 'creative' && subTab) {
      setCreativeSubTab(subTab as 'proofs' | 'deliverables');
    }
    if (hub === 'studio' && subTab) {
      setStudioSubTab(subTab as any);
    }
    setActiveHub(hub);
    setActiveDashboardTab(hub);
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          Verifying studio director credentials...
        </p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
          <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Studio Director Access
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            This production console is strictly reserved for authorized studio directors.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-6 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold text-xs transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const activeCommissionsCount = commissions.filter(
    (c) => c.status !== 'completed' && c.status !== 'cancelled' && c.status !== 'Rejected'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Console Header */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
            alt="Studio Director"
            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#EA580C] shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
                Director Console
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Phase 3 Unified Hub
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              DESTALION Studio Administration
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Production pipeline, GCash settlement verification, creative proofs, and archival deliverables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-[#E4E2DC] dark:border-[#27272A]">
          <div className="px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
            <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Active Orders</span>
            <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] text-sm font-display">
              {activeCommissionsCount}
            </span>
          </div>
          {pendingPaymentsCount > 0 && (
            <button
              type="button"
              onClick={() => handleSelectHub('payments')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer text-left"
            >
              <span className="text-[10px] block uppercase font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending Verification
              </span>
              <span className="font-bold text-sm font-display">
                {pendingPaymentsCount} Receipts
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Primary 5-Hub Navigation Bar */}
      <nav 
        className="flex items-center gap-2 border-b border-[#E4E2DC] dark:border-[#27272A] pb-2 overflow-x-auto no-scrollbar" 
        aria-label="Studio 5-hub administration navigation"
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
            id: 'creative' as const, 
            label: 'Creative & Deliverables', 
            icon: Layers 
          },
          { 
            id: 'studio' as const, 
            label: 'Client & Studio', 
            icon: Settings 
          },
        ].map(({ id, label, icon: TabIcon, count, badge }) => {
          const isSelected = activeHub === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectHub(id)}
              aria-selected={isSelected}
              className={`relative px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] btn-tactile ${
                isSelected
                  ? 'bg-[#18181B] text-white dark:bg-[#EDEDEC] dark:text-[#18181B] shadow-sm'
                  : 'bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{label}</span>

              {typeof count === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  isSelected 
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#18181B]' 
                    : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA]'
                }`}>
                  {count}
                </span>
              )}

              {badge && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-[#EA580C] text-white">
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
          onSelectCommission={(id) => setSelectedCommissionId(id)}
          onOpenChat={(_commissionId) => setActiveView('chat')}
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

      {/* Hub 4: Creative Review & Deliverables (Proofs + Final Archival Deliverables) */}
      {activeHub === 'creative' && (
        <CreativeReviewDeliverables
          commissions={commissions}
          currentUser={currentUser}
          selectedCommissionId={selectedCommissionId}
          onSelectCommission={(id) => setSelectedCommissionId(id)}
          defaultSubTab={creativeSubTab}
        />
      )}

      {/* Hub 5: Client & Studio Management */}
      {activeHub === 'studio' && (
        <ClientStudioManagement
          initialSubTab={studioSubTab}
        />
      )}
    </div>
  );
};
