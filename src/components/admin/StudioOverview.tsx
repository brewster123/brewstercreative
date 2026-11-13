import React, { useState, useEffect } from 'react';
import { Commission, User, COMMISSION_STAGES } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCommissionDate } from '../../utils/dateUtils';
import { fetchCommissionPaymentProofs, subscribeToPaymentProofs } from '../../lib/payments';
import { 
  FolderArchive, 
  CreditCard, 
  Eye, 
  Users, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check
} from 'lucide-react';

interface StudioOverviewProps {
  commissions?: Commission[];
  users?: User[];
  pendingPaymentsCount?: number;
  onNavigate?: (hub: 'commissions' | 'payments' | 'creative' | 'studio', commissionId?: string, subTab?: string) => void;
  onNavigateHub?: (hub: 'commissions' | 'payments' | 'creative' | 'studio', filter?: string) => void;
  onSelectCommission?: (commissionId: string) => void;
}

export const StudioOverview: React.FC<StudioOverviewProps> = ({
  commissions: propCommissions,
  users: propUsers,
  pendingPaymentsCount: propPendingCount,
  onNavigate,
  onNavigateHub,
  onSelectCommission,
}) => {
  const appContext = useApp();
  
  // Safe fallbacks from props or context
  const commissions: Commission[] = propCommissions || appContext?.commissions || [];
  const users: User[] = propUsers || appContext?.users || [];

  const [internalPendingCount, setInternalPendingCount] = useState<number>(0);

  useEffect(() => {
    if (typeof propPendingCount === 'number') {
      return;
    }
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const { data } = await fetchCommissionPaymentProofs();
        if (data && isMounted) {
          setInternalPendingCount(data.filter(p => p.status === 'pending_verification').length);
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchCount();
    const unsub = subscribeToPaymentProofs(undefined, () => {
      fetchCount();
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [propPendingCount]);

  const pendingPaymentsCount = typeof propPendingCount === 'number' 
    ? propPendingCount 
    : internalPendingCount;

  // Navigation dispatcher supporting both handler signatures
  const triggerNavigation = (
    hub: 'commissions' | 'payments' | 'creative' | 'studio', 
    param?: string, 
    subTab?: string
  ) => {
    if (onNavigate) {
      onNavigate(hub, param, subTab);
    } else if (onNavigateHub) {
      onNavigateHub(hub, param);
    }
  };

  // Real data calculations with defensive null-checks
  const activeCommissions = commissions.filter(c => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase();
    return !s.includes('completed') && !s.includes('cancelled') && !s.includes('rejected') && c.currentStage !== 8;
  });

  const completedCommissions = commissions.filter(c => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase();
    return s.includes('completed') || c.currentStage === 8;
  });

  const clients = users.filter(u => u && u.role === 'client');

  const pendingIntakeCommissions = commissions.filter(c => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'reviewing';
  });

  const inReviewCommissions = commissions.filter(c => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase();
    return s === 'for_review' || s === 'client review' || c.currentStage === 5;
  });

  // Calculate attention-needed projects
  const attentionCommissions = commissions.filter(c => {
    if (!c) return false;
    const s = (c.status || '').toLowerCase();
    const isCompleted = s.includes('completed') || c.currentStage === 8;
    const isCancelled = s.includes('cancelled') || s.includes('rejected');
    if (isCompleted || isCancelled) return false;

    const isUrgent = c.priority === 'urgent' || c.priority === 'high';
    const isPendingIntake = s === 'pending';
    const isAwaitingDeposit = !c.depositPaid && c.paymentStatus !== 'Paid';
    const isAwaitingReview = s === 'for_review' || c.currentStage === 5;
    const isAwaitingBalance = (c.depositPaid || c.paymentStatus === 'Partial') && !c.totalPaid && (c.currentStage >= 7 || s === 'final_approval');

    return isUrgent || isPendingIntake || isAwaitingDeposit || isAwaitingReview || isAwaitingBalance;
  });

  // Most recently updated commissions (sorted by deadline or existing order)
  const recentCommissions = [...commissions]
    .sort((a, b) => new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Studio Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Pipeline */}
        <div 
          onClick={() => triggerNavigation('commissions', 'active')}
          className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/60 dark:hover:border-[#EA580C]/60 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Active Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#EA580C] flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-display font-black text-3xl text-[#18181B] dark:text-[#EDEDEC] block">
              {activeCommissions.length}
            </span>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#EA580C] transition-colors">
              <span>View active commissions</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 2: Pending Payments */}
        <div 
          onClick={() => triggerNavigation('payments', 'pending_verification')}
          className={`p-5 rounded-xl bg-white dark:bg-[#121214] border transition-all cursor-pointer group shadow-2xs ${
            pendingPaymentsCount > 0 
              ? 'border-amber-500/60 dark:border-amber-500/40 bg-amber-500/5' 
              : 'border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/60'
          }`}
        >
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Pending Payments
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              pendingPaymentsCount > 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-3xl text-[#18181B] dark:text-[#EDEDEC]">
                {pendingPaymentsCount}
              </span>
              {pendingPaymentsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
                  Action
                </span>
              )}
            </div>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#EA580C] transition-colors">
              <span>Verify GCash receipts</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 3: Proofs in Review */}
        <div 
          onClick={() => triggerNavigation('creative', undefined, 'proofs')}
          className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/60 dark:hover:border-[#EA580C]/60 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Proofs in Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-display font-black text-3xl text-[#18181B] dark:text-[#EDEDEC] block">
              {inReviewCommissions.length}
            </span>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#EA580C] transition-colors">
              <span>Inspect draft feedback</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 4: Client Accounts */}
        <div 
          onClick={() => triggerNavigation('studio', undefined, 'clients')}
          className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/60 dark:hover:border-[#EA580C]/60 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
              Client Directory
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-display font-black text-3xl text-[#18181B] dark:text-[#EDEDEC] block">
              {clients.length}
            </span>
            <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 group-hover:text-[#EA580C] transition-colors">
              <span>Manage client profiles</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Administrative Alerts & Directives */}
      {pendingPaymentsCount > 0 && (
        <div className="p-5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                Action Required · Payment Queue
              </span>
              <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                {pendingPaymentsCount} GCash payment receipt{pendingPaymentsCount > 1 ? 's' : ''} awaiting administrator audit
              </h4>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Verify transaction reference numbers against official studio GCash records to advance commission stages and release final deliverables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerNavigation('payments', 'pending_verification')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Audit Receipts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Projects Requiring Attention & Recent Production Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Projects Requiring Attention */}
        <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
                Active Directives
              </span>
              <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                Projects Requiring Attention ({attentionCommissions.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => triggerNavigation('commissions', 'active')}
              className="text-xs font-mono text-[#EA580C] hover:underline"
            >
              View All Pipeline →
            </button>
          </div>

          {attentionCommissions.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">All projects in good standing</p>
              <p>No critical bottlenecks or overdue verification items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionCommissions.slice(0, 5).map(c => {
                const isUrgent = c.priority === 'urgent' || c.priority === 'high';
                const isAwaitingDeposit = !c.depositPaid && c.paymentStatus !== 'Paid';
                const isAwaitingReview = c.status === 'for_review' || c.currentStage === 5;
                const isAwaitingBalance = (c.depositPaid || c.paymentStatus === 'Partial') && !c.totalPaid && (c.currentStage >= 7 || c.status === 'final_approval');

                return (
                  <div 
                    key={c.id} 
                    className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] truncate">
                          {c.projectName}
                        </span>
                        <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                          #{c.id.slice(0, 8)}
                        </span>
                        {isUrgent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-900">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                        <span>Client: {c.clientName}</span>
                        <span>·</span>
                        {isAwaitingDeposit && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Deposit Pending</span>
                        )}
                        {isAwaitingReview && (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">In Client Review</span>
                        )}
                        {isAwaitingBalance && (
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">Balance Outstanding</span>
                        )}
                        <span>·</span>
                        <span>Stage 0{c.currentStage || 1}/08</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectCommission) {
                          onSelectCommission(c.id);
                        }
                        triggerNavigation('commissions', c.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C] bg-white dark:bg-[#121214] text-[11px] font-mono text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recently Updated Commissions */}
        <div className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#222225]">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                Production Queue
              </span>
              <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                Recently Active Commissions
              </h3>
            </div>
            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {commissions.length} Total Projects
            </span>
          </div>

          <div className="space-y-3">
            {recentCommissions.map(c => {
              const stageInfo = COMMISSION_STAGES.find(s => s.number === (c.currentStage || 1));
              return (
                <div 
                  key={c.id} 
                  className="p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] truncate">
                        {c.projectName}
                      </span>
                      <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                        {c.serviceType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      <span className="text-[#EA580C] font-semibold">
                        Stage 0{c.currentStage || 1}: {stageInfo?.name || 'Production'}
                      </span>
                      <span>·</span>
                      <span>Progress {c.progress}%</span>
                      <span>·</span>
                      <span>{formatCommissionDate(c.deadline)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectCommission) {
                        onSelectCommission(c.id);
                      }
                      triggerNavigation('commissions', c.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C] bg-white dark:bg-[#121214] text-[11px] font-mono text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C] transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Quick Studio Operations Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => triggerNavigation('studio', undefined, 'profile')}
          className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/50 transition-colors cursor-pointer flex items-center gap-3.5 group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-[#EA580C] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors">
              GCash Settlement Policy
            </h4>
            <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Configure mobile settlement credentials
            </p>
          </div>
        </div>

        <div 
          onClick={() => triggerNavigation('studio', undefined, 'services')}
          className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/50 transition-colors cursor-pointer flex items-center gap-3.5 group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors">
              Services & Pricing Packages
            </h4>
            <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Manage deliverables & turnaround times
            </p>
          </div>
        </div>

        <div 
          onClick={() => triggerNavigation('studio', undefined, 'portfolio')}
          className="p-4 rounded-xl bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] hover:border-[#EA580C]/50 transition-colors cursor-pointer flex items-center gap-3.5 group shadow-2xs"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] group-hover:text-[#EA580C] transition-colors">
              Portfolio Showcase Works
            </h4>
            <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Curate case studies & gallery media
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
