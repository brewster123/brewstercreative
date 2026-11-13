import React, { useState } from 'react';
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
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
            Production & Delivery Hub
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Creative Review & Deliverables
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Manage iterative client design proofs, revisions, and final delivery master packages.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="hub4-commission-select" className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] shrink-0 font-medium">
            Project:
          </label>
          <select
            id="hub4-commission-select"
            value={currentCommission?.id || ''}
            onChange={(e) => handleSelectCommission(e.target.value)}
            className="w-full sm:w-auto bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-medium text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
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
          <div className="flex border-b border-[#E4E2DC] dark:border-[#27272A] gap-2">
            <button
              type="button"
              onClick={() => setSubTab('proofs')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                subTab === 'proofs'
                  ? 'border-[#EA580C] text-[#EA580C] bg-[#EA580C]/5'
                  : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Creative Proofs & Review Iterations</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('deliverables')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer ${
                subTab === 'deliverables'
                  ? 'border-[#EA580C] text-[#EA580C] bg-[#EA580C]/5'
                  : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>Final Deliverables & Archival Master Files</span>
            </button>
          </div>

          {/* Deliverables Security Gate Banner (Visible when on Deliverables tab) */}
          {subTab === 'deliverables' && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDeliveryUnlocked 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${isDeliveryUnlocked ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {isDeliveryUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm">
                      {isDeliveryUnlocked ? 'Deliverable Access Unlocked' : 'Deliverable Access Locked to Client'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold bg-white/50 dark:bg-black/30">
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
                <div className="shrink-0 font-mono text-[11px] px-2.5 py-1 rounded bg-white dark:bg-[#18181B] text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold self-start sm:self-auto">
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
        <div className="p-12 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11]">
          <p className="text-sm font-mono text-[#71717A] dark:text-[#A1A1AA]">
            No commissions available in studio pipeline.
          </p>
        </div>
      )}
    </div>
  );
};
