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
  Moon,
  ArrowUpRight
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

  // Unread messages indicator for authenticated user
  const unreadMessagesCount = currentUser
    ? (currentUser.role === 'admin'
        ? Math.max(
            messages.filter(m => m.senderId !== currentUser.id && m.senderRole !== 'admin' && !m.readStatus).length,
            notifications.filter(n => (!n.readStatus && !n.is_read) && n.type === 'message').length
          )
        : Math.max(
            messages.filter(m => m.senderId !== currentUser.id && !m.readStatus).length,
            notifications.filter(n => (!n.readStatus && !n.is_read) && (n.userId === currentUser.id || n.recipient_id === currentUser.id || n.recipientId === currentUser.id || n.user_id === currentUser.id) && n.type === 'message').length
          ))
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
    { label: 'Services', view: 'services' as const },
    { label: 'Shop', view: 'shop' as const },
    ...(currentUser?.role !== 'admin' ? [{ label: 'Commission', view: 'commission-form' as const }] : []),
  ];

  const handleOpenChat = () => {
    setActiveView('chat');
    setMobileMenuOpen(false);
  };

  const userInitials = (currentUser?.name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  return (
    <header className="fixed inset-x-0 top-0 z-40 w-full bg-canvas/90 backdrop-blur-md border-b border-hairline transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16 sm:h-20">
          
          {/* Zone 1: Clean Studio Wordmark */}
          <button
            id="nav-brand-logo"
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 group text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-lg text-carbon tracking-tight whitespace-nowrap">
              {studioProfile.studioName}
            </span>
          </button>

          {/* Zone 2: Minimalist Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = activeView === link.view || (link.view === 'shop' && activeView === 'product-detail');
              return (
                <button
                  key={link.view}
                  id={`nav-link-${link.view}`}
                  type="button"
                  onClick={() => {
                    setActiveView(link.view);
                    setMobileMenuOpen(false);
                  }}
                  className={`relative py-1.5 text-xs uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap shrink-0 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent rounded ${
                    isActive
                      ? 'text-carbon font-bold'
                      : 'text-graphite-strong hover:text-carbon font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 inset-x-0 h-0.5 rounded-full bg-[#0284C7] dark:bg-[#38BDF8]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Workspace Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Chat in Navbar */}
            {currentUser && (
              <button
                id="btn-chat-navbar"
                type="button"
                onClick={handleOpenChat}
                className="hidden sm:flex p-2 rounded-full text-graphite-strong hover:text-carbon hover:bg-surface-secondary transition-colors relative cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                title={currentUser.role === 'admin' ? "Client Conversations" : "Project Conversation"}
                aria-label={currentUser.role === 'admin' ? "Open client conversations" : "Open project conversation"}
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0284C7] rounded-full" />
                )}
              </button>
            )}

            {/* Notifications Bell */}
            <div className="hidden sm:block relative" ref={notificationsRef}>
              <button
                id="btn-notifications-toggle"
                type="button"
                onClick={() => {
                  setShowNotifications(prev => !prev);
                  setShowUserDropdown(false);
                }}
                className="p-2 rounded-full text-graphite-strong hover:text-carbon hover:bg-surface-secondary transition-colors relative cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                title="Notifications"
                aria-label="View notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0284C7] rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              id="btn-nav-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="hidden sm:flex p-2 rounded-full text-graphite-strong hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#D4FF38]" /> : <Moon className="w-4 h-4 text-graphite-strong" />}
            </button>

            {/* Quick Role Portal Access */}
            {currentUser?.role === 'client' && clientCommission && activeView !== 'client-dashboard' && (
              <button
                type="button"
                onClick={() => setActiveView('client-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 hover:bg-[#BAE6FD] text-[#0369A1] dark:text-[#38BDF8] text-xs font-semibold transition-all cursor-pointer btn-tactile whitespace-nowrap shrink-0 tabular-nums"
              >
                <span>Active · {clientCommission.progress ?? 0}%</span>
              </button>
            )}

            {currentUser?.role === 'admin' && activeView !== 'admin-dashboard' && (
              <button
                type="button"
                id="btn-nav-admin-portal"
                onClick={() => setActiveView('admin-dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </button>
            )}

            {/* Account Dropdown or Guest CTA */}
            {currentUser ? (
              <div className="hidden sm:block relative" ref={userDropdownRef}>
                <button
                  id="btn-user-profile-menu"
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(prev => !prev);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-surface-secondary hover:bg-[#EAECEF] dark:hover:bg-[#232635] border border-hairline transition-all text-sm cursor-pointer btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  aria-expanded={showUserDropdown}
                  aria-haspopup="true"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || 'User Profile'}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-surface text-carbon border border-hairline flex items-center justify-center text-[10px] font-bold shrink-0">
                      {userInitials}
                    </span>
                  )}
                  <span className="font-semibold text-carbon text-xs hidden sm:inline max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-graphite" />
                </button>

                {showUserDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-60 bg-surface border border-hairline rounded-2xl shadow-lg py-1.5 z-50 animate-in fade-in duration-150"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-hairline space-y-0.5">
                      <p className="text-xs font-bold text-carbon truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-graphite truncate">
                        {currentUser.email}
                      </p>
                      <p className={`text-[10px] uppercase tracking-wider pt-0.5 font-semibold ${
                        currentUser.role === 'admin' 
                          ? 'text-[#059669] dark:text-[#34D399]' 
                          : 'text-accent'
                      }`}>
                        {currentUser.role === 'admin' ? 'Studio Director' : 'Client'}
                      </p>
                    </div>

                    <div className="py-1">
                      {currentUser.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => setActiveView('admin-dashboard')}
                          className="w-full text-left px-4 py-2 text-xs text-carbon hover:bg-surface-secondary flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
                          <span>Admin Studio Dashboard</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveView('client-dashboard')}
                          className="w-full text-left px-4 py-2 text-xs text-carbon hover:bg-surface-secondary flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-accent" />
                          <span>My Creative Projects</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveView('settings')}
                        className="w-full text-left px-4 py-2 text-xs text-carbon hover:bg-surface-secondary flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-graphite" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-hairline pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  type="button"
                  onClick={() => setActiveView('auth')}
                  className="px-3.5 py-2 text-xs font-semibold text-graphite-strong hover:text-carbon transition-colors cursor-pointer whitespace-nowrap shrink-0 rounded-full"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-start-commission"
                  type="button"
                  onClick={() => setActiveView('commission-form')}
                  className="pl-4 pr-2 py-1.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer btn-tactile whitespace-nowrap shrink-0"
                >
                  <span>Start Commission</span>
                  <span className="w-6 h-6 rounded-full bg-[#111114] text-white flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            )}

            {/* Mobile/Tablet Menu Button (<1024px) */}
            <button
              id="btn-mobile-menu"
              type="button"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileNotificationsOpen(false);
              }}
              className="lg:hidden p-2.5 rounded-full text-graphite-strong hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer relative min-h-[44px] min-w-[44px] flex items-center justify-center btn-tactile focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {!mobileMenuOpen && (unreadCount > 0 || unreadMessagesCount > 0) && (
                <span className="sm:hidden absolute top-2 right-2 w-2.5 h-2.5 bg-[#0284C7] rounded-full ring-2 ring-surface" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="lg:hidden bg-surface border-b border-hairline px-4 sm:px-6 pt-3 pb-6 space-y-3.5 shadow-lg animate-in fade-in duration-150 max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          {currentUser && (
            <div className="p-3 rounded-2xl bg-surface-secondary border border-hairline flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || 'User Profile'}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-surface text-carbon border border-hairline flex items-center justify-center text-xs font-bold shrink-0">
                    {userInitials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-carbon truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-graphite truncate">
                    {currentUser.email}
                  </p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${
                    currentUser.role === 'admin' 
                      ? 'text-[#059669] dark:text-[#34D399]' 
                      : 'text-accent'
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
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between cursor-pointer min-h-[44px] ${
                  activeView === link.view || (link.view === 'shop' && activeView === 'product-detail')
                    ? 'text-accent bg-surface-secondary font-bold'
                    : 'text-carbon hover:bg-surface-secondary'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </div>

          {currentUser ? (
            <div className="pt-2 border-t border-hairline space-y-2">
              {currentUser.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs btn-tactile"
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
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs btn-tactile"
                >
                  <Layers className="w-4 h-4" />
                  <span>My Creative Projects</span>
                </button>
              )}

              <button
                type="button"
                id={currentUser.role === 'admin' ? "btn-admin-mobile-chat" : "btn-client-mobile-chat"}
                onClick={handleOpenChat}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-surface-secondary text-carbon border border-hairline text-sm font-semibold flex items-center justify-between cursor-pointer btn-tactile"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>{currentUser.role === 'admin' ? 'Client Conversations' : 'Project Conversation'}</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white tabular-nums">
                    {unreadMessagesCount} unread
                  </span>
                )}
              </button>

              <button
                type="button"
                id="btn-mobile-notifications"
                onClick={() => setMobileNotificationsOpen(prev => !prev)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-surface-secondary text-carbon border border-hairline text-sm font-semibold flex items-center justify-between cursor-pointer btn-tactile"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white tabular-nums">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[11px] text-graphite">0 unread</span>
                )}
              </button>

              {mobileNotificationsOpen && (
                <div className="border border-hairline rounded-2xl overflow-hidden shadow-xs">
                  <NotificationPanel onClose={() => setMobileNotificationsOpen(false)} />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveView('settings');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-surface-secondary text-carbon border border-hairline text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer btn-tactile"
              >
                <Settings className="w-4 h-4 text-graphite" />
                <span>Settings</span>
              </button>

              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-secondary border border-hairline">
                <span className="text-xs uppercase text-graphite font-semibold">Theme</span>
                <button
                  type="button"
                  id="btn-mobile-theme-toggle"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface text-carbon border border-hairline shadow-2xs cursor-pointer btn-tactile"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#D4FF38]" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-graphite-strong" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-hairline space-y-2">
              <button
                type="button"
                id="btn-mobile-start-commission"
                onClick={() => {
                  setActiveView('commission-form');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer btn-tactile"
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
                className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-surface-secondary text-carbon border border-hairline text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer btn-tactile"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>

              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-secondary border border-hairline">
                <span className="text-xs uppercase text-graphite font-semibold">Theme</span>
                <button
                  type="button"
                  id="btn-mobile-theme-toggle"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface text-carbon border border-hairline shadow-2xs cursor-pointer btn-tactile"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#D4FF38]" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-graphite-strong" />
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
