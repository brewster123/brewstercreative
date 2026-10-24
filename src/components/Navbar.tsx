import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  Sun,
  Moon
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
    setActiveDashboardTab,
    theme,
    setTheme
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isDarkMode = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  // Close menus on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserDropdown(false);
        setMobileMenuOpen(false);
        setMobileNotificationsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !document.getElementById('btn-mobile-menu')?.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Unread notifications count
  const unreadCount = notifications.filter(n => 
    !n.readStatus && !n.is_read && (currentUser?.role === 'admin' ? true : (n.userId === currentUser?.id || n.recipient_id === currentUser?.id || n.recipientId === currentUser?.id || n.user_id === currentUser?.id))
  ).length;

  // Unread messages indicator for authenticated user (both client and admin)
  const unreadMessagesCount = currentUser
    ? (currentUser.role === 'admin'
        ? (messages.filter(m => m.senderId !== currentUser.id && m.senderRole !== 'admin' && !m.readStatus).length +
           notifications.filter(n => (!n.readStatus && !n.is_read) && n.type === 'message').length)
        : (messages.filter(m => m.senderId !== currentUser.id && !m.readStatus).length +
           notifications.filter(n => (!n.readStatus && !n.is_read) && (n.userId === currentUser.id || n.recipient_id === currentUser.id || n.recipientId === currentUser.id || n.user_id === currentUser.id) && n.type === 'message').length))
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
    setActiveView('chat');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-[#E4E2DC] dark:border-[#1C1C1F] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Studio Brand Logo — Clean Zone 1 Architectural Wordmark */}
          <button
            id="nav-brand-logo"
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 group text-left focus:outline-hidden cursor-pointer whitespace-nowrap shrink-0"
          >
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
            <span className="font-display font-black text-xl text-[#18181B] dark:text-white tracking-tight whitespace-nowrap">
              {studioProfile.studioName}
            </span>
          </button>

          {/* Desktop Navigation Links — Floating Pill (Visible at lg: 1024px+) */}
          <nav className="hidden lg:flex items-center gap-0.5 lg:gap-1 bg-[#F4F2ED] dark:bg-[#121214] p-1 rounded-xl border border-[#E4E2DC] dark:border-[#222225]">
            {navLinks.map((link) => (
              <button
                key={link.view}
                id={`nav-link-${link.view}`}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 lg:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-[#18181B] dark:text-white bg-white dark:bg-[#1C1C20] shadow-2xs font-semibold'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#18181B]/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Group: Desktop controls (>640px) + Single Mobile Menu Button (<640px) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 1. Chat in Navbar (Desktop / Tablet >= 640px) */}
            {currentUser && (
              <button
                id="btn-chat-navbar"
                type="button"
                onClick={handleOpenChat}
                className="hidden sm:flex p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] transition-colors relative border border-transparent hover:border-[#E4E2DC] dark:hover:border-[#222225] cursor-pointer"
                title={currentUser.role === 'admin' ? "Client Conversations" : "Project Conversation"}
                aria-label={currentUser.role === 'admin' ? "Open client conversations" : "Open project conversation"}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA580C] rounded-full animate-pulse" />
                )}
              </button>
            )}

            {/* 2. Notifications Bell (Desktop / Tablet >= 640px) */}
            <div className="hidden sm:block relative" ref={notificationsRef}>
              <button
                id="btn-notifications-toggle"
                type="button"
                onClick={() => {
                  setShowNotifications(prev => !prev);
                  setShowUserDropdown(false);
                }}
                className="p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] transition-colors relative border border-transparent hover:border-[#E4E2DC] dark:hover:border-[#222225] cursor-pointer btn-tactile"
                title="Notifications"
                aria-label="View notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA580C] rounded-full" />
                )}
              </button>

              {/* Popover Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* Quick Theme Toggle Button (Desktop / Tablet >= 640px) */}
            <button
              id="btn-nav-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] transition-colors border border-transparent hover:border-[#E4E2DC] dark:hover:border-[#222225] cursor-pointer btn-tactile"
              title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-400" />}
            </button>

            {/* 3. Account / Settings Dropdown (Desktop / Tablet >= 640px) */}
            {currentUser ? (
              <div className="hidden sm:block relative" ref={userDropdownRef}>
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(prev => !prev);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-white dark:bg-[#121214] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] border border-[#E4E2DC] dark:border-[#222225] transition-all text-sm cursor-pointer shadow-2xs btn-tactile"
                  aria-expanded={showUserDropdown}
                  aria-haspopup="true"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                    alt={currentUser.name || 'User Profile'}
                    className="w-6 h-6 rounded-md object-cover ring-1 ring-[#EA580C]/40"
                  />
                  <span className="font-semibold text-[#18181B] dark:text-white text-xs hidden sm:inline max-w-[110px] truncate">
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
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <button
                  id="btn-nav-login"
                  type="button"
                  onClick={() => setActiveView('auth')}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-start-commission"
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer btn-tactile"
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFF7ED] dark:bg-[#78350F]/40 hover:bg-[#FFEDD5] text-[#EA580C] dark:text-[#FBBF24] border border-[#FDBA74] dark:border-[#92400E] text-xs font-semibold transition-all cursor-pointer font-mono btn-tactile"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
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

            {/* Single Mobile/Tablet Menu Button (<1024px) */}
            <button
              id="btn-mobile-menu"
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileNotificationsOpen(false);
              }}
              className="lg:hidden p-2.5 rounded-lg text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E] transition-colors cursor-pointer relative min-h-[44px] min-w-[44px] flex items-center justify-center btn-tactile"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {/* Subtle notification indicator dot on mobile when menu is collapsed */}
              {!mobileMenuOpen && (unreadCount > 0 || unreadMessagesCount > 0) && (
                <span className="sm:hidden absolute top-2 right-2 w-2.5 h-2.5 bg-[#EA580C] rounded-full ring-2 ring-white dark:ring-[#09090B]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (Simplified & De-cluttered) */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="lg:hidden bg-white dark:bg-[#121214] border-b border-[#E4E2DC] dark:border-[#222225] px-4 sm:px-6 pt-3 pb-6 space-y-3.5 shadow-lg animate-in fade-in duration-150 max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          {/* User Profile Header in Mobile Drawer if Authenticated */}
          {currentUser && (
            <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                  alt={currentUser.name || 'User Profile'}
                  className="w-9 h-9 rounded-lg object-cover ring-1 ring-[#EA580C]/40 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#18181B] dark:text-[#EDEDEC] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] truncate">
                    {currentUser.email}
                  </p>
                  <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                    currentUser.role === 'admin' 
                      ? 'text-[#059669] dark:text-[#34D399]' 
                      : 'text-[#EA580C]'
                  }`}>
                    {currentUser.role === 'admin' ? 'Studio Director' : 'Client'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.view}
                type="button"
                onClick={() => {
                  setActiveView(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-[#EA580C] bg-[#FFF7ED] dark:bg-[#1C1C20] font-bold'
                    : 'text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#1A1A1E]'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {/* Account, Communication & Theme Controls */}
          {currentUser ? (
            <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-2">
              {/* Primary Dashboard Destination */}
              {currentUser.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs btn-tactile"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Studio Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('client-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs btn-tactile"
                >
                  <Layers className="w-4 h-4" />
                  <span>My Creative Projects</span>
                </button>
              )}

              {/* Chat & Messages Button */}
              <button
                type="button"
                id={currentUser.role === 'admin' ? "btn-admin-mobile-chat" : "btn-client-mobile-chat"}
                onClick={handleOpenChat}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-between cursor-pointer btn-tactile"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#EA580C]" />
                  <span>{currentUser.role === 'admin' ? 'Client Conversations' : 'Project Conversation'}</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EA580C] text-white">
                    {unreadMessagesCount} unread
                  </span>
                )}
              </button>

              {/* Notifications Toggle */}
              <button
                type="button"
                id="btn-mobile-notifications"
                onClick={() => setMobileNotificationsOpen(prev => !prev)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-between cursor-pointer btn-tactile"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#EA580C]" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EA580C] text-white">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">0 unread</span>
                )}
              </button>

              {/* Collapsible Mobile Notifications Panel */}
              {mobileNotificationsOpen && (
                <div className="border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden shadow-xs">
                  <NotificationPanel onClose={() => setMobileNotificationsOpen(false)} />
                </div>
              )}

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('settings');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer btn-tactile"
              >
                <Settings className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                <span>Settings</span>
              </button>

              {/* Theme Toggle Row */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A]">
                <span className="text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] font-semibold">Theme</span>
                <button
                  type="button"
                  id="btn-mobile-theme-toggle"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#121214] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#222225] shadow-2xs cursor-pointer btn-tactile"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sign Out Action */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated Mobile Actions */
            <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-2">
              <button
                type="button"
                id="btn-mobile-start-commission"
                onClick={() => {
                  setActiveView('commission-form');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer btn-tactile"
              >
                <Send className="w-4 h-4" />
                <span>Start a Commission</span>
              </button>

              <button
                type="button"
                id="btn-mobile-login"
                onClick={() => {
                  setActiveView('auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#27272A] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer btn-tactile"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>

              {/* Theme Toggle Row */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A]">
                <span className="text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] font-semibold">Theme</span>
                <button
                  type="button"
                  id="btn-mobile-theme-toggle"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#121214] text-[#18181B] dark:text-[#EDEDEC] border border-[#E4E2DC] dark:border-[#222225] shadow-2xs cursor-pointer btn-tactile"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-zinc-700" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
