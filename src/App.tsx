import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, Check, X } from 'lucide-react';
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

const DatabaseErrorBanner: React.FC = () => {
  const { databaseError, clearDatabaseError } = useApp();
  const [copied, setCopied] = useState(false);

  if (!databaseError) return null;

  const isPermissionDenied = databaseError.includes('42501') || databaseError.toLowerCase().includes('permission denied');
  const sqlFix = "GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;";

  const copySql = () => {
    navigator.clipboard.writeText(sqlFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <aside aria-label="Database Notice" className="bg-zinc-950 text-white border-b border-rose-900/60 px-4 py-3 text-xs z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-zinc-100 flex items-center gap-2">
              <span>Database Notice:</span>
              <span className="font-normal text-rose-300 font-mono text-[11px] break-all">{databaseError}</span>
            </p>
            {isPermissionDenied && (
              <p className="text-zinc-400 text-[11px]">
                PostgreSQL denied access to <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded">public.profiles</code> for the <code className="bg-zinc-800 text-amber-300 px-1 py-0.5 rounded">authenticated</code> role. Run the fix in your Supabase SQL Editor.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
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

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
                <span className="font-display font-black text-xl">✨</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono-code">
                Hydrating client workspace session...
              </p>
            </div>
          );
        }
        return <ClientDashboardView />;
      case 'admin-dashboard':
        // Guard: Wait for session hydration before deciding admin status
        if (authLoading) {
          return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
                <span className="font-display font-black text-xl">✨</span>
              </div>
              <p className="text-xs text-zinc-500 font-mono-code">
                Hydrating Supabase session & verifying studio director privileges...
              </p>
            </div>
          );
        }
        // Guard: Only users with role === 'admin' in public.profiles can access admin dashboard
        if (currentUser?.role !== 'admin') {
          return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <span className="font-display font-black text-2xl">🔒</span>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
                  Studio Director Access Restricted
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                  This administrative dashboard is restricted to authorized studio directors. To access management tools, your account must have an administrative role assigned in the database.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setActiveView('client-dashboard')}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    Go to My Client Workspace
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveView('auth')}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    Sign In with Studio Credentials
                  </button>
                )}
              </div>
            </div>
          );
        }
        return <AdminDashboardView />;
      case 'auth':
        return <AuthView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F8] text-zinc-900 selection:bg-orange-500 selection:text-white font-sans antialiased relative">
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
