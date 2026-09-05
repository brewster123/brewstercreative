import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  ChevronDown
} from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';

export const Navbar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    studioProfile, 
    currentUser, 
    logout, 
    notifications,
    commissions 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => 
    !n.readStatus && (currentUser?.role === 'admin' ? true : n.userId === currentUser?.id)
  ).length;

  const clientCommission = commissions.find(c => c.clientId === currentUser?.id);

  const navLinks = [
    { label: 'Home', view: 'home' as const },
    { label: 'Portfolio', view: 'portfolio' as const },
    { label: 'Services & Pricing', view: 'services' as const },
    { label: 'Commission Request', view: 'commission-form' as const },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Studio Brand Logo */}
          <button
            id="nav-brand-logo"
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F48bafc0997de4f0cbe1f0163687e4e1d%2F5f1152145f47462e9c7541115b503221?format=webp&width=800&height=1200"
              alt="Brewster Creative logo"
              className="w-10 h-10 object-contain shrink-0 block select-none group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-display font-bold text-lg text-zinc-900 tracking-tight flex items-center gap-1.5">
                {studioProfile.studioName}
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
              </span>
              <span className="text-[11px] text-zinc-500 block -mt-0.5 tracking-wider uppercase font-mono-code">
                Multimedia & Graphic Design
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-zinc-100/80 p-1.5 rounded-full border border-zinc-200/60">
            {navLinks.map((link) => (
              <button
                key={link.view}
                id={`nav-link-${link.view}`}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeView === link.view
                    ? 'text-zinc-950 bg-white shadow-sm font-bold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Dashboard Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
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
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-start-commission"
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Start Commission</span>
                </button>
              </div>
            )}

            {/* Direct Commission Portal Quick Button (if client logged in) */}
            {currentUser?.role === 'client' && activeView !== 'client-dashboard' && (
              <button
                type="button"
                onClick={() => setActiveView('client-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-semibold transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>Active Project ({clientCommission?.progress || 65}%)</span>
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
                  activeView === link.view
                    ? 'text-orange-600 bg-orange-50 font-bold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
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
