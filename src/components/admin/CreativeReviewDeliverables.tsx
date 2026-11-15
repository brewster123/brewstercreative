import React, { useState, useEffect } from 'react';
import { Commission, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  FolderArchive, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileCheck, 
  Sparkles,
  ChevronRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { AdminCreativeProofsSection } from '../AdminCreativeProofsSection';
import { AdminDeliverablesSection } from '../AdminDeliverablesSection';

interface CreativeReviewDeliverablesProps {
  commissions?: Commission[];
  currentUser?: User | null;
  selectedCommissionId?: string;
  onSelectCommission?: (commissionId: string) => void;
  defaultSubTab?: 'proofs' | 'deliverables';
}

export const CreativeReviewDeliverables: React.FC<CreativeReviewDeliverablesProps> = ({
  commissions: propCommissions,
  currentUser: propUser,
  selectedCommissionId: initialCommissionId,
  onSelectCommission,
  defaultSubTab = 'proofs'
}) => {
  const { commissions: contextCommissions, currentUser: contextUser, activeCommission, setActiveCommissionId } = useApp();
  const commissions = propCommissions || contextCommissions || [];
  const currentUser = propUser !== undefined ? propUser : contextUser;
  
  const [selectedId, setSelectedId] = useState<string>(
    initialCommissionId || activeCommission?.id || commissions[0]?.id || ''
  );
  const [subTab, setSubTab] = useState<'proofs' | 'deliverables'>(defaultSubTab);

  useEffect(() => {
    if (initialCommissionId) {
      setSelectedId(initialCommissionId);
    } else if (!selectedId) {
      const fallbackId = activeCommission?.id || commissions[0]?.id || '';
      if (fallbackId) {
        setSelectedId(fallbackId);
      }
    }
  }, [initialCommissionId, selectedId, activeCommission?.id, commissions]);

  useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  const currentCommission = commissions.find(c => c.id === selectedId) || commissions[0];

  const handleSelectCommission = (id: string) => {
    setSelectedId(id);
    setActiveCommissionId(id);
    if (onSelectCommission) {
      onSelectCommission(id);
    }
  };

  // Check final deliverables security invariant: payment_status === 'Paid' && total_paid === true
  const isDeliveryUnlocked = 
    currentCommission?.paymentStatus === 'Paid' && currentCommission?.totalPaid === true;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Commission Selector Bar */}
      <div className="bg-surface border border-hairline rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
            Production & Delivery Hub
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
            Creative Review & Deliverables
          </h2>
          <p className="text-xs sm:text-sm text-graphite mt-0.5">
            Manage iterative client design proofs, revisions, and final delivery master packages.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="hub4-commission-select" className="font-mono text-xs text-graphite shrink-0 font-medium">
            Project:
          </label>
          <select
            id="hub4-commission-select"
            value={currentCommission?.id || ''}
            onChange={(e) => handleSelectCommission(e.target.value)}
            className="w-full sm:w-auto bg-surface-secondary border border-hairline rounded-xl px-3 py-2 text-xs font-medium text-carbon focus:outline-none focus:border-accent cursor-pointer"
          >
            {commissions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.projectName} — {c.clientName} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentCommission ? (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap border-b border-hairline pb-3 gap-2">
            <button
              type="button"
              onClick={() => setSubTab('proofs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                subTab === 'proofs'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-secondary text-graphite hover:text-carbon border border-hairline'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Creative Proofs & Review Iterations</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('deliverables')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                subTab === 'deliverables'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-secondary text-graphite hover:text-carbon border border-hairline'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>Final Deliverables & Archival Master Files</span>
            </button>
          </div>

          {/* Deliverables Security Gate Banner (Visible when on Deliverables tab) */}
          {subTab === 'deliverables' && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDeliveryUnlocked 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${isDeliveryUnlocked ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {isDeliveryUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm">
                      {isDeliveryUnlocked ? 'Deliverable Access Unlocked' : 'Deliverable Access Locked to Client'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-white/50 dark:bg-black/30">
                      Payment Conjunction Invariant
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {isDeliveryUnlocked
                      ? 'Payment status is marked Paid with full balance confirmed. The client can safely download all deliverable files via 600-second expiring signed URLs.'
                      : `Client is currently locked from downloading final assets (Status: ${currentCommission.paymentStatus}, Total Paid: ${currentCommission.totalPaid ? 'Yes' : 'No'}). Files uploaded here are secured in private storage.`}
                  </p>
                </div>
              </div>

              {!isDeliveryUnlocked && (
                <div className="shrink-0 font-mono text-[11px] px-3 py-1 rounded-full bg-surface text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold self-start sm:self-auto">
                  Requires: Paid & Total Paid
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 1: Creative Proofs Section */}
          {subTab === 'proofs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <AdminCreativeProofsSection
                commission={currentCommission}
                currentUser={currentUser}
              />
            </div>
          )}

          {/* Sub-tab 2: Final Deliverables Section */}
          {subTab === 'deliverables' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <AdminDeliverablesSection
                commission={currentCommission}
                currentUser={currentUser}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border border-dashed border-hairline bg-surface-secondary">
          <p className="text-sm font-mono text-graphite">
            No commissions available in studio pipeline.
          </p>
        </div>
      )}
    </div>
  );
};
