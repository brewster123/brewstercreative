import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Commission } from '../types';
import { 
  Send, 
  Bell, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldCheck, 
  LogOut,
  ChevronDown,
  MessageSquare,
  Settings,
  Layers
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
    messages,
    setActiveDashboardTab
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Unread notifications count
  const unreadCount = notifications.filter(n => 
    !n.readStatus && (currentUser?.role === 'admin' ? true : n.userId === currentUser?.id)
  ).length;

  // Unread messages indicator for authenticated user (both client and admin)
  const unreadMessagesCount = currentUser
    ? (currentUser.role === 'admin'
        ? (messages.filter(m => m.senderId !== currentUser.id && m.senderRole !== 'admin' && !m.readStatus).length +
           notifications.filter(n => !n.readStatus && n.type === 'message').length)
        : (messages.filter(m => m.senderId !== currentUser.id && !m.readStatus).length +
           notifications.filter(n => !n.readStatus && n.userId === currentUser.id && n.type === 'message').length))
    : 0;

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
    ...(currentUser?.role !== 'admin' ? [{ label: 'Commission Request', view: 'commission-form' as const }] : []),
  ];

  const handleOpenChat = () => {
    if (currentUser?.role === 'admin') {
      setActiveView('chat');
    } else {
      setActiveDashboardTab('chat');
      setActiveView('client-dashboard');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 dark:bg-[#0F0F11]/90 backdrop-blur-md border-b border-[#E4E2DC] dark:border-[#27272A] transition-all">
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
              <span className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC] tracking-tight flex items-center gap-1.5">
                {studioProfile.studioName}
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] inline-block"></span>
              </span>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] block -mt-0.5 tracking-wider uppercase font-mono">
                Multimedia & Graphic Design
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links — Refined Editorial Group */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F4F2ED] dark:bg-[#232327] p-1 rounded-xl border border-[#E4E2DC] dark:border-[#27272A]">
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
                    ? 'text-[#18181B] dark:text-[#EDEDEC] bg-white dark:bg-[#18181B] shadow-2xs font-semibold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-white/60 dark:hover:bg-[#18181B]/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Group: [Chat] → [Notifications] → [Account / Settings] */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 1. Chat in Navbar (Both Client and Admin) */}
            {currentUser && (
              <button
                id="btn-chat-navbar"
                type="button"
                onClick={handleOpenChat}
                className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors relative border border-transparent hover:border-[#E4E2DC] dark:hover:border-[#27272A] cursor-pointer"
                title={currentUser.role === 'admin' ? "Client Conversations" : "Project Conversation"}
                aria-label={currentUser.role === 'admin' ? "Open client conversations" : "Open project conversation"}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA580C] rounded-full animate-pulse" />
                )}
              </button>
            )}

            {/* 2. Notifications Bell (Both Client and Admin) */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors relative border border-transparent hover:border-[#E4E2DC] dark:hover:border-[#27272A] cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA580C] rounded-full animate-pulse" />
                )}
              </button>

              {/* Popover Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* 3. Account / Settings Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-white dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] transition-all text-sm cursor-pointer shadow-2xs"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-[#EA580C]/40"
                  />
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC] text-xs hidden sm:inline max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                </button>

                {showUserDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in duration-150"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    {/* User Identity Header */}
                    <div className="px-3.5 py-2.5 border-b border-[#E4E2DC] dark:border-[#27272A] space-y-0.5">
                      <p className="text-xs font-bold text-[#18181B] dark:text-[#EDEDEC] truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {currentUser.email}
                      </p>
                      <p className={`text-[10px] font-mono uppercase tracking-wider pt-0.5 font-semibold ${
                        currentUser.role === 'admin' 
                          ? 'text-[#059669] dark:text-[#34D399]' 
                          : 'text-[#EA580C]'
                      }`}>
                        {currentUser.role === 'admin' ? 'Studio Director' : 'Client'}
                      </p>
                    </div>

                    {/* Navigation Actions */}
                    <div className="py-1">
                      {currentUser.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => setActiveView('admin-dashboard')}
                          className="w-full text-left px-3.5 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                          <span>Admin Studio Dashboard</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveView('client-dashboard')}
                          className="w-full text-left px-3.5 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>My Creative Projects</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveView('settings')}
                        className="w-full text-left px-3.5 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Sign Out Action */}
                    <div className="border-t border-[#E4E2DC] dark:border-[#27272A] pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
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
                  className="px-3.5 py-2 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-start-commission"
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="px-4 py-2 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] hover:opacity-90 text-white dark:text-[#18181B] text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFF7ED] dark:bg-[#78350F]/40 hover:bg-[#FFEDD5] text-[#EA580C] dark:text-[#FBBF24] border border-[#FDBA74] dark:border-[#92400E] text-xs font-semibold transition-all cursor-pointer font-mono"
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#ECFDF5] dark:bg-[#064E3B]/40 hover:bg-[#D1FAE5] text-[#059669] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#065F46] text-xs font-semibold transition-all shadow-2xs cursor-pointer font-mono"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                <span>Admin Studio</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="btn-mobile-menu"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#18181B] border-b border-[#E4E2DC] dark:border-[#27272A] px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in fade-in duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.view}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-[#EA580C] bg-[#FFF7ED] dark:bg-[#78350F]/20 font-bold'
                    : 'text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327]'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E4E2DC] dark:border-[#27272A] flex flex-col gap-2">
            {currentUser?.role === 'admin' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Studio Dashboard</span>
                </button>

                <button
                  type="button"
                  id="btn-admin-mobile-chat"
                  onClick={handleOpenChat}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#EA580C]" />
                  <span>Client Conversations</span>
                  {unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-lg text-red-600 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : currentUser?.role === 'client' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('client-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Layers className="w-4 h-4" />
                  <span>My Creative Projects</span>
                </button>

                <button
                  type="button"
                  id="btn-client-mobile-chat"
                  onClick={handleOpenChat}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#EA580C]" />
                  <span>Project Conversation</span>
                  {unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-lg text-red-600 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('commission-form');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] hover:opacity-90 text-white dark:text-[#18181B] text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Start a Commission</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
