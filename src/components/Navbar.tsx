import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Commission } from '../types';
import { 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Send, 
  Bell, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    studioProfile, 
    currentUser, 
    logout, 
    notifications,
    commissions,
    theme,
    setTheme 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => 
    !n.readStatus && (currentUser?.role === 'admin' ? true : n.userId === currentUser?.id)
  ).length;

  const isCommissionActive = (c: Commission) => {
    const s = (c.status || '').toLowerCase();
    return (
      s !== 'completed' &&
      s !== 'cancelled' &&
      s !== 'rejected' &&
      c.currentStage !== 8
    );
  };

  const clientCommission = commissions.find(
    c => (c.clientId === currentUser?.id || (currentUser?.email && c.clientEmail?.toLowerCase() === currentUser.email.toLowerCase())) &&
         isCommissionActive(c)
  );

  const navLinks = [
    { label: 'Home', view: 'home' as const },
    { label: 'Portfolio', view: 'portfolio' as const },
    { label: 'Services & Pricing', view: 'services' as const },
    { label: 'Shop', view: 'shop' as const },
    { label: 'Commission Request', view: 'commission-form' as const },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E4E2DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Studio Brand Logo */}
          <button
            id="nav-brand-logo"
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
          >
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-display font-bold text-lg text-[#18181B] tracking-tight flex items-center gap-1.5">
                {studioProfile.studioName}
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] inline-block"></span>
              </span>
              <span className="text-[11px] text-[#71717A] block -mt-0.5 tracking-wider uppercase font-mono">
                Multimedia & Graphic Design
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links — Refined Editorial Group */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F4F2ED] p-1 rounded-xl border border-[#E4E2DC]">
            {navLinks.map((link) => (
              <button
                key={link.view}
                id={`nav-link-${link.view}`}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-[#18181B] bg-white shadow-2xs font-semibold'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-white/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Dashboard Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle (Light / Dark / System) */}
            <div 
              className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
              role="group"
              aria-label="Color theme selector"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Light mode"
                aria-label="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="System preference"
                aria-label="System preference"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors relative border border-transparent hover:border-zinc-200"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* Portal / Dashboard CTA */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 transition-all text-sm"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-orange-500/40"
                  />
                  <span className="font-semibold text-zinc-800 text-xs hidden sm:inline max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {showUserDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl py-2 z-50 backdrop-blur-lg"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <div className="px-4 py-2 border-b border-zinc-100">
                      <p className="text-xs font-bold text-zinc-900">{currentUser.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] rounded bg-orange-50 text-orange-600 font-semibold border border-orange-100">
                        {currentUser.role === 'admin' ? 'Studio Director (Admin)' : 'Workspace Member'}
                      </span>
                    </div>

                    {currentUser.role === 'admin' ? (
                      <button
                        type="button"
                        onClick={() => setActiveView('admin-dashboard')}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Admin Dashboard
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveView('client-dashboard')}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2"
                      >
                        <Layers className="w-4 h-4 text-orange-500" />
                        My Commission Portal
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveView('commission-form')}
                      className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 text-zinc-400" />
                      Submit New Commission
                    </button>

                    <div className="border-t border-zinc-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  type="button"
                  onClick={() => setActiveView('auth')}
                  className="px-3.5 py-2 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-start-commission"
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="px-4 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Start Commission</span>
                </button>
              </div>
            )}

            {/* Direct Commission Portal Quick Button (only if client is logged in and has an active commission) */}
            {currentUser?.role === 'client' && clientCommission && activeView !== 'client-dashboard' && (
              <button
                type="button"
                onClick={() => setActiveView('client-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#EA580C] border border-[#FDBA74] text-xs font-semibold transition-all cursor-pointer font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse"></span>
                <span>Active Project ({clientCommission.progress ?? 0}%)</span>
              </button>
            )}

            {/* Direct Admin Studio Quick Button (if admin logged in) */}
            {currentUser?.role === 'admin' && activeView !== 'admin-dashboard' && (
              <button
                type="button"
                id="btn-nav-admin-portal"
                onClick={() => setActiveView('admin-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Admin Studio</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="btn-mobile-menu"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-2 pb-6 space-y-3 shadow-xl">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.view}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-orange-600 bg-orange-50 font-bold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Theme Selector */}
          <div className="pt-2 flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Theme</span>
            <div 
              className="flex items-center p-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-700 text-zinc-500"
              role="group"
              aria-label="Mobile theme selector"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Light mode"
                aria-label="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'system'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="System preference"
                aria-label="System preference"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
            {currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveView('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Open Designer Studio Dashboard
              </button>
            ) : currentUser?.role === 'client' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveView('client-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Layers className="w-4 h-4" />
                Open Client Commission Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveView('auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                Sign In / Register
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveView('commission-form');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              Request a New Commission
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
