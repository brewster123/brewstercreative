import React, { useState, useEffect } from 'react';
import { Commission, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { AdminPaymentVerificationSection } from '../AdminPaymentVerificationSection';
import { fetchCommissionPaymentProofs, subscribeToPaymentProofs } from '../../lib/payments';

interface PaymentsVerificationProps {
  commissions?: Commission[];
  currentUser?: User | null;
  selectedCommissionId?: string;
  onNavigateToCommission?: (commissionId: string) => void;
}

export const PaymentsVerification: React.FC<PaymentsVerificationProps> = ({
  commissions: propCommissions,
  currentUser: propUser,
  selectedCommissionId,
  onNavigateToCommission: _onNavigateToCommission
}) => {
  const { commissions: contextCommissions, currentUser: contextUser, updatePaymentStatus, studioProfile } = useApp();
  const commissions = propCommissions || contextCommissions || [];
  const currentUser = propUser !== undefined ? propUser : contextUser;
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const { data } = await fetchCommissionPaymentProofs();
        if (data && isMounted) {
          const pending = data.filter(p => p.status === 'pending_verification').length;
          const confirmed = data.filter(p => p.status === 'confirmed').length;
          const rejected = data.filter(p => p.status === 'rejected').length;
          setStats({
            pending,
            confirmed,
            rejected,
            total: data.length
          });
        }
      } catch (err) {
        console.warn('Error loading payment proof stats', err);
      }
    };

    loadStats();
    const unsub = subscribeToPaymentProofs(undefined, () => {
      loadStats();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const gcashName = studioProfile?.gcashDetails?.accountName || 'Brewster Cabando';
  const gcashNumber = studioProfile?.gcashDetails?.accountNumber || '0965-706-4331';
  const depositPercent = studioProfile?.gcashDetails?.depositPercentage || 50;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & GCash Account Instructions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Verification Summary Header */}
        <div className="lg:col-span-2 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-[#EA580C]/10 text-[#EA580C]">
                <ShieldCheck className="w-3 h-3" />
                Manual Verification Ledger
              </span>
              {stats.pending > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  {stats.pending} Action Required
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Payments & Receipt Verification
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl">
              Inspect uploaded client GCash receipts, verify transaction reference codes against official statements, and approve milestone transitions.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-[#E4E2DC] dark:border-[#27272A]">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">Pending Queue</span>
              <p className={`font-mono text-lg font-bold ${stats.pending > 0 ? 'text-amber-500' : 'text-[#18181B] dark:text-[#EDEDEC]'}`}>
                {stats.pending}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">Confirmed</span>
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.confirmed}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">Rejected / Released</span>
              <p className="font-mono text-lg font-bold text-zinc-500">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        {/* GCash Studio Receiving Settings Card */}
        <div className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#EA580C]">
              <Smartphone className="w-4 h-4" />
              <h3 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                Studio GCash Receiving
              </h3>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Official recipient details provided to clients for mobile wallet settlement.
            </p>

            <div className="pt-1 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#E4E2DC]/60 dark:border-[#27272A]/60">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Account Name:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{gcashName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4E2DC]/60 dark:border-[#27272A]/60">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Mobile Number:</span>
                <span className="font-semibold text-[#EA580C]">{gcashNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Standard Deposit:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{depositPercent}% Upfront</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center gap-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
            <HelpCircle className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
            <span>Need to update details? Edit in Client & Studio Management.</span>
          </div>
        </div>
      </div>

      {/* Main Verification Section (Wrapping existing comprehensive component) */}
      <AdminPaymentVerificationSection
        commissions={commissions}
        currentUser={currentUser}
        selectedCommissionId={selectedCommissionId}
        onPaymentConfirmed={async (commissionId, targetStatus) => {
          await updatePaymentStatus(commissionId, targetStatus);
        }}
      />
    </div>
  );
};
