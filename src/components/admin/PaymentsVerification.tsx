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
  const { commissions: contextCommissions, currentUser: contextUser, updatePaymentStatus, studioProfile, setActiveView } = useApp();
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
        <div className="lg:col-span-2 bg-surface border border-hairline rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-accent/10 text-accent">
                <ShieldCheck className="w-3 h-3" />
                Manual Verification Ledger
              </span>
              {stats.pending > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  {stats.pending} Action Required
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
              Payments & Receipt Verification
            </h2>
            <p className="text-xs sm:text-sm text-graphite leading-relaxed max-w-2xl">
              Inspect uploaded client GCash receipts, verify transaction reference codes against official statements, and approve milestone transitions.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-hairline">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-graphite uppercase">Pending Queue</span>
              <p className={`font-mono text-lg font-bold ${stats.pending > 0 ? 'text-amber-500' : 'text-carbon'}`}>
                {stats.pending}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-graphite uppercase">Confirmed</span>
              <p className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.confirmed}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-graphite uppercase">Rejected / Released</span>
              <p className="font-mono text-lg font-bold text-graphite">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        {/* GCash Studio Receiving Settings Card */}
        <div className="bg-surface-secondary border border-hairline rounded-3xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-accent">
              <Smartphone className="w-4 h-4" />
              <h3 className="font-display font-bold text-sm text-carbon">
                Studio GCash Receiving
              </h3>
            </div>
            <p className="text-xs text-graphite">
              Official recipient details provided to clients for mobile wallet settlement.
            </p>

            <div className="pt-1 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-hairline">
                <span className="text-graphite">Account Name:</span>
                <span className="font-semibold text-carbon">{gcashName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-hairline">
                <span className="text-graphite">Mobile Number:</span>
                <span className="font-semibold text-accent">{gcashNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-graphite">Standard Deposit:</span>
                <span className="font-semibold text-carbon">{depositPercent}% Upfront</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface border border-hairline flex items-center gap-2 text-[11px] text-graphite">
            <HelpCircle className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              Need to update details?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveView('settings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="font-semibold text-accent hover:underline cursor-pointer"
              >
                Edit in Settings
              </button>
              .
            </span>
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
