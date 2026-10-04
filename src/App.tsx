import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Check, X, RotateCcw, ShieldCheck } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { PortfolioView } from './views/PortfolioView';
import { ServicesView } from './views/ServicesView';
import { CommissionFormView } from './views/CommissionFormView';
import { ClientDashboardView } from './views/ClientDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AuthView } from './views/AuthView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { SettingsView } from './views/SettingsView';
import { ChatView } from './views/ChatView';
import { CaseStudyView } from './views/CaseStudyView';

const DatabaseErrorBanner: React.FC = () => {
  const { databaseError, clearDatabaseError, refreshCurrentUserProfile } = useApp();
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (!databaseError) return null;

  const isNetworkError = databaseError.toLowerCase().includes('network') || databaseError.toLowerCase().includes('failed to fetch');
  const isPermissionDenied = databaseError.includes('42501') || databaseError.toLowerCase().includes('permission denied');
  const sqlFix = "GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;";

  const copySql = () => {
    navigator.clipboard.writeText(sqlFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRetry = async () => {
    setRetrying(true);
    clearDatabaseError();
    await refreshCurrentUserProfile();
    setRetrying(false);
  };

  return (
    <aside aria-label="Database Notice" className="bg-zinc-950 text-white border-b border-rose-900/60 px-4 py-3 text-xs z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-zinc-100 flex items-center gap-2">
              <span>{isNetworkError ? 'Connection Notice:' : 'Database Notice:'}</span>
              <span className="font-normal text-rose-300 font-mono text-[11px] break-all">{databaseError}</span>
            </p>
            {isPermissionDenied && (
              <p className="text-zinc-400 text-[11px]">
                PostgreSQL denied access to <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded">public.profiles</code> for the <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded">authenticated</code> role. Run the fix in your Supabase SQL Editor.
              </p>
            )}
            {isNetworkError && (
              <p className="text-zinc-400 text-[11px]">
                Connection to Supabase timed out or was interrupted. Check your network connection or ad-blocker and click Retry.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {isNetworkError && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-white ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying...' : 'Retry Connection'}</span>
            </button>
          )}
          {isPermissionDenied && (
            <button
              type="button"
              onClick={copySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span>{copied ? 'Copied SQL!' : 'Copy Grant SQL'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={clearDatabaseError}
            aria-label="Dismiss database error notice"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

const MainLayout: React.FC = () => {
  const { activeView, currentUser, authLoading, setActiveView } = useApp();

  // Scroll to top instantly on view changes without animation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeView]);

  const renderCurrentView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'services':
        return <ServicesView />;
      case 'commission-form':
        return <CommissionFormView />;
      case 'client-dashboard':
        if (authLoading) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                Opening studio workspace...
              </p>
            </div>
          );
        }
        return <ClientDashboardView />;
      case 'admin-dashboard':
        // Guard: Wait for session hydration before deciding admin status
        if (authLoading) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                Verifying studio credentials...
              </p>
            </div>
          );
        }
        // Guard: Only users with role === 'admin' can access admin dashboard
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
                  This production area is reserved for authorized studio directors. Please sign in with your studio account to manage commissions and archive records.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setActiveView('client-dashboard')}
                    className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Go to My Client Workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveView('auth')}
                    className="px-6 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] hover:opacity-90 text-white dark:text-[#18181B] font-semibold text-xs transition-all cursor-pointer"
                  >
                    Sign In to Studio
                  </button>
                )}
              </div>
            </div>
          );
        }
        return <AdminDashboardView />;
      case 'auth':
        return <AuthView />;
      case 'shop':
        return <ShopView />;
      case 'product-detail':
        return <ProductDetailView />;
      case 'settings':
        return <SettingsView />;
      case 'chat':
        if (authLoading) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                Connecting to studio conversations...
              </p>
            </div>
          );
        }
        return <ChatView />;
      case 'case-study':
        return <CaseStudyView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200 selection:bg-orange-500 selection:text-white font-sans antialiased relative">
      {/* Database Notice Banner */}
      <DatabaseErrorBanner />

      {/* Primary Sticky Navigation Header */}
      <Navbar />

      {/* Main Page Body View */}
      <main className="flex-1">
        {renderCurrentView()}
      </main>

      {/* Studio Footer */}
      <Footer />
      
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
