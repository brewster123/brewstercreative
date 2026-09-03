import React, { useEffect } from 'react';
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

const MainLayout: React.FC = () => {
  const { activeView, currentUser, setActiveView } = useApp();

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
        return <ClientDashboardView />;
      case 'admin-dashboard':
        // Guard: Only admin (Brewster) can access admin dashboard
        if (currentUser?.role !== 'admin') {
          return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <span className="font-display font-black text-2xl">🔒</span>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
                  Designer Admin Access Restricted
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Only studio owner <strong className="text-zinc-900">Brewster A. Cabando</strong> has access to edit website content, portfolio projects, services & rates, and manage all commission orders.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setActiveView('client-dashboard')}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                  >
                    Go to My Client Portal
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveView('auth')}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs"
                  >
                    Client Sign In
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveView('auth')}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs"
                >
                  Sign in as Brewster (Admin)
                </button>
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
