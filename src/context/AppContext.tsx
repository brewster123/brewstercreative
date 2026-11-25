import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  UserRole,
  Commission,
  Message,
  ProgressUpdate,
  ProjectFile,
  AppNotification,
  StudioProfile,
  ServiceItem,
  PortfolioProject,
  CommissionStatus,
  CommissionPriority,
  COMMISSION_STAGES,
  FinalFilesPackage,
  MessageAttachment,
  ShopProduct,
  ShopCategoryName,
} from '../types';
import {
  INITIAL_STUDIO_PROFILE,
  INITIAL_SERVICES,
  INITIAL_USERS,
  INITIAL_COMMISSIONS,
  INITIAL_MESSAGES,
  INITIAL_TIMELINE,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { SHOP_PRODUCTS } from '../data/shopData';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase';
import {
  insertCommissionToSupabase,
  fetchCommissionsFromSupabase,
  updateCommissionStatusInSupabase,
  updateCommissionPriorityInSupabase,
  updateCommissionPaymentInSupabase,
  requestCommissionRevisionInSupabase,
  approveCommissionInSupabase,
  deleteCommissionInSupabase,
  subscribeToCommissionsChange,
  mapDbCommissionToAppCommission,
  getStageAndProgressFromStatus,
  getLifecycleFromStage,
  cacheClientProfiles,
  getCachedClientProfile,
  fetchClientProfile,
  fetchAllProfilesFromSupabase,
} from '../data/commissionsData';
import {
  fetchCommissionMessages,
  sendCommissionMessageToSupabase,
  subscribeToCommissionMessages,
} from '../lib/messages';
import {
  fetchUserNotifications,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  subscribeToUserNotifications,
  resolveAdminUserId,
  resolveAdminUserIds,
  clearResolvedAdminCache,
  showBrowserNotification,
} from '../lib/notifications';
import { NotificationType } from '../types';
import {
  fetchStudioProfileFromDb,
  upsertStudioProfileInDb,
  fetchServicesFromDb,
  upsertServiceInDb,
  deleteServiceFromDb,
  fetchPortfolioProjectsFromDb,
  upsertPortfolioProjectInDb,
  deletePortfolioProjectFromDb,
  subscribeToPublicContentChanges,
} from '../lib/studioContent';
import {
  toggleProjectLike,
  recordPortfolioViewDebounced,
  fetchUserLikedProjectIds,
  extractCaseStudyIdFromLocation,
  buildCaseStudyShareUrl,
  normalizeNumericStat,
} from '../lib/portfolio';
import { syncDocumentSeoForProject } from '../lib/seo';

export type AppView = 
  | 'home'
  | 'portfolio'
  | 'services'
  | 'commission-form'
  | 'client-dashboard'
  | 'admin-dashboard'
  | 'auth'
  | 'shop'
  | 'product-detail'
  | 'settings'
  | 'chat'
  | 'case-study'
  | 'creative-studio';

export type AppTheme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface AppContextType {
  // Theme System
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  resolvedTheme: ResolvedTheme;

  // Navigation & View
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedCommissionId: string;
  setSelectedCommissionId: (id: string) => void;
  setActiveCommissionId: (id: string) => void;
  selectedPortfolioProject: PortfolioProject | null;
  setSelectedPortfolioProject: (p: PortfolioProject | null) => void;
  openCaseStudy: (project: PortfolioProject) => void;
  closeCaseStudy: () => void;
  toggleProjectLikeInContext: (projectId: string) => Promise<{ liked: boolean; likesCount: number; error: string | null }>;
  recordProjectViewInContext: (projectId: string) => Promise<{ viewed: boolean; viewsCount: number | null; error: string | null }>;
  preselectedService: string | null;
  setPreselectedService: (serviceName: string | null) => void;
  selectedShopProduct: ShopProduct | null;
  setSelectedShopProduct: (product: ShopProduct | null) => void;
  selectedShopCategory: ShopCategoryName;
  setSelectedShopCategory: (category: ShopCategoryName) => void;
  
  // Auth & Roles
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  authLoading: boolean;
  databaseError: string | null;
  clearDatabaseError: () => void;
  refreshCurrentUserProfile: () => Promise<User | null>;
  users: User[];
  usersLoading: boolean;
  usersLoadError: string | null;
  refreshUsers: () => Promise<void>;
  loginUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signUpUser: (name: string, email: string, password?: string, handle?: string, contactMethod?: string, phone?: string) => Promise<{ success: boolean; error?: string; user?: User; confirmationRequired?: boolean }>;
  emailVerificationStatus: 'success' | 'expired' | 'error' | null;
  clearEmailVerificationStatus: () => void;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  registerClient: (name: string, email: string, handle?: string, contactMethod?: string, phone?: string) => User;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Data entities
  studioProfile: StudioProfile;
  services: ServiceItem[];
  portfolio: PortfolioProject[];
  shopProducts: ShopProduct[];
  commissions: Commission[];
  currentUserCommissions: Commission[];
  activeCommission?: Commission;
  messages: Message[];
  timelineUpdates: ProgressUpdate[];
  projectFiles: ProjectFile[];
  // Notifications
  notifications: AppNotification[];
  liveAlert: AppNotification | null;
  dismissLiveAlert: () => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  dispatchNotification: (params: {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    commissionId?: string;
    linkTab?: string;
  }) => Promise<void>;
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
  
  // Studio & Settings (Phase 5D Persistent Studio Content)
  updateStudioProfile: (updates: Partial<StudioProfile>) => Promise<{ success: boolean; error?: string }>;
  updateServicePrice: (serviceId: string, newPrice: number) => Promise<{ success: boolean; error?: string }>;
  addServiceItem: (service: ServiceItem) => Promise<{ success: boolean; error?: string }>;
  updateServiceItem: (serviceId: string, updates: Partial<ServiceItem>) => Promise<{ success: boolean; error?: string }>;
  deleteServiceItem: (serviceId: string) => Promise<{ success: boolean; error?: string }>;
  addPortfolioProject: (project: PortfolioProject) => Promise<{ success: boolean; error?: string }>;
  updatePortfolioProject: (projectId: string, updates: Partial<PortfolioProject>) => Promise<{ success: boolean; error?: string }>;
  deletePortfolioProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  addShopProduct: (product: ShopProduct) => Promise<{ success: boolean; error?: string }>;
  updateShopProduct: (productId: string, updates: Partial<ShopProduct>) => Promise<{ success: boolean; error?: string }>;
  deleteShopProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  resetShopCatalog: () => Promise<{ success: boolean; error?: string }>;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const STORAGE_KEYS = {
  THEME: 'brewster_theme',
  PROFILE: 'cabando_studio_profile_v3',
  SERVICES: 'cabando_services_v3',
  PORTFOLIO: 'cabando_portfolio_v3',
  USERS: 'cabando_users_v3',
  COMMISSIONS: 'cabando_commissions_v3',
  MESSAGES: 'cabando_messages_v3',
  TIMELINE: 'cabando_timeline_v3',
  FILES: 'cabando_files_v3',
  NOTIFICATIONS: 'cabando_notifications_v3',
  COMMISSION_DRAFT: 'brewster_commission_form_draft_v1',
  SHOP_PRODUCTS: 'destalion_shop_products_v1',
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: crisp light gallery mode is the default for first-time visitors
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      if (saved === 'system') {
        return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    } catch (e) {
      return 'light';
    }
  });

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      const activeResolved: ResolvedTheme = isDark ? 'dark' : 'light';
      setResolvedTheme(activeResolved);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const [activeView, setActiveViewRaw] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const hash = (window.location.hash || '').toLowerCase();
      const pathname = (window.location.pathname || '').toLowerCase();
      if (hash === '#creative-studio' || hash === '#admin-creative-studio' || pathname === '/admin/creative-studio') {
        return 'creative-studio';
      }
      const caseStudyId = extractCaseStudyIdFromLocation(window.location);
      if (caseStudyId) {
        return 'case-study';
      }
    }
    return 'home';
  });

  const setActiveView = useCallback((view: AppView) => {
    setActiveViewRaw(view);
    if (view !== 'case-study') {
      setSelectedPortfolioProject(null);
      if (typeof window !== 'undefined') {
        const hasCaseStudyPath = window.location.pathname.toLowerCase().startsWith('/case-study/');
        const hasCaseStudyHash = window.location.hash.startsWith('#case-study-');
        if (hasCaseStudyPath) {
          window.history.replaceState(null, '', '/');
        } else if (hasCaseStudyHash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  }, []);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>('');
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<PortfolioProject | null>(() => {
    if (typeof window !== 'undefined') {
      const caseStudyId = extractCaseStudyIdFromLocation(window.location);
      if (caseStudyId) {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
          if (saved) {
            const list: PortfolioProject[] = JSON.parse(saved);
            const found = list.find((p) => p.id === caseStudyId);
            if (found) return found;
          }
        } catch {}
      }
    }
    return null;
  });
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [selectedShopProduct, setSelectedShopProduct] = useState<ShopProduct | null>(null);
  const [selectedShopCategory, setSelectedShopCategory] = useState<ShopCategoryName>('All');

  // Initialize state with LocalStorage fallback
  const [studioProfile, setStudioProfile] = useState<StudioProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.studioName === 'Cabando Studio' || parsed.studioName === 'Brewster Creative' || !parsed.studioName) {
            parsed.studioName = 'DESTALION';
          }
          if (parsed.email?.toLowerCase().includes('cabandobrewster') || !parsed.email) {
            parsed.email = 'brewstercreates@gmail.com';
          }
          if (
            !parsed.location ||
            /manila/i.test(parsed.location) ||
            parsed.location === 'Cebu City / Remote Worldwide'
          ) {
            parsed.location = 'Cebu City';
          }
          return { ...INITIAL_STUDIO_PROFILE, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[AppContext] Failed to parse cached studioProfile, falling back to default:', e);
    }
    return INITIAL_STUDIO_PROFILE;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved) {
      try {
        const parsed: ServiceItem[] = JSON.parse(saved);
        return parsed.map((s) => {
          const init = INITIAL_SERVICES.find((is) => is.id === s.id);
          const sanitizedDeliverables = (s.deliverables || []).map((d) =>
            typeof d === 'string' && /commercial.*license/i.test(d) ? 'Presentation-ready files' : d
          );
          const item = { ...s, deliverables: sanitizedDeliverables };
          if (init?.relatedShopProductIds && !s.relatedShopProductIds) {
            item.relatedShopProductIds = init.relatedShopProductIds;
          }
          return item;
        });
      } catch (e) {
        return INITIAL_SERVICES;
      }
    }
    return INITIAL_SERVICES;
  });

  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    if (saved) {
      try {
        const parsed: PortfolioProject[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently eliminate legacy demo IDs (proj-1 through proj-6)
          const demoIds = new Set(['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6']);
          const cleaned = parsed.filter((p) => !demoIds.has(p.id));
          return cleaned.map((p) => {
            const rawLikes = p.likesCount ?? (p as any).likes_count ?? (p as any).likes ?? 0;
            const rawViews = p.viewsCount ?? (p as any).views_count ?? (p as any).views ?? 0;
            const rawShares = p.sharesCount ?? (p as any).shares_count ?? (p as any).shares ?? 0;
            const likesCount = normalizeNumericStat(rawLikes, 0);
            const viewsCount = normalizeNumericStat(rawViews, 0);
            const sharesCount = normalizeNumericStat(rawShares, 0);

            const resolvedType = p.projectType || 'concept';
            const resolvedClassification =
              p.projectClassification ||
              p.caseStudy?.projectClassification ||
              (resolvedType === 'client' ? 'client' : 'personal');
            const item: PortfolioProject = {
              ...p,
              likesCount,
              viewsCount,
              sharesCount,
              likes_count: likesCount,
              views_count: viewsCount,
              shares_count: sharesCount,
              projectType: resolvedType,
              projectClassification: resolvedClassification,
              client: p.client || '',
              fullDesc: p.fullDesc,
            };
            return item;
          });
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [shopProducts, setShopProducts] = useState<ShopProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOP_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return SHOP_PRODUCTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map(u => {
          if (u.id === 'd4440c2e-aeea-4a8d-bcaf-7b844ec2be69' || u.email?.toLowerCase().includes('cabandobrewster')) {
            return { ...u, email: 'brewstercreates@gmail.com' };
          }
          return u;
        });
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  // Outcome of returning from an email-confirmation link, if any. Only ever
  // set to one of these three clean, pre-written states — never a raw
  // Supabase URL/error string, so no technical detail is ever surfaced.
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<
    'success' | 'expired' | 'error' | null
  >(null);
  const clearEmailVerificationStatus = () => setEmailVerificationStatus(null);

  const clearDatabaseError = () => setDatabaseError(null);

  // Legacy demo commission IDs that used to ship as seed data (Alex Rivera,
  // Maya, Liam, Sophia). A browser that visited before this cleanup may
  // still have them cached in localStorage — this strips them out on load
  // so they can never resurface, even before any Supabase fetch runs.
  const LEGACY_DEMO_COMMISSION_IDS = new Set([
    'comm-sample-alex',
    'comm-maya-poster',
    'comm-liam-logo',
    'comm-sophia-completed',
  ]);

  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    if (saved) {
      try {
        const parsed: Commission[] = JSON.parse(saved);
        return parsed
          .filter(c => !LEGACY_DEMO_COMMISSION_IDS.has(c.id))
          .map(c => {
            if (c.clientEmail?.toLowerCase().includes('cabandobrewster')) {
              return { ...c, clientEmail: 'brewstercreates@gmail.com' };
            }
            return c;
          });
      } catch (e) {
        return INITIAL_COMMISSIONS;
      }
    }
    return INITIAL_COMMISSIONS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!saved) return INITIAL_MESSAGES;
    try {
      const parsed: Message[] = JSON.parse(saved);
      return parsed.filter(m => !LEGACY_DEMO_COMMISSION_IDS.has(m.commissionId));
    } catch (e) {
      return INITIAL_MESSAGES;
    }
  });

  const [timelineUpdates, setTimelineUpdates] = useState<ProgressUpdate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    if (!saved) return INITIAL_TIMELINE;
    try {
      const parsed: ProgressUpdate[] = JSON.parse(saved);
      return parsed.filter(t => !LEGACY_DEMO_COMMISSION_IDS.has(t.commissionId));
    } catch (e) {
      return INITIAL_TIMELINE;
    }
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!saved) return INITIAL_FILES;
    try {
      const parsed: ProjectFile[] = JSON.parse(saved);
      return parsed.filter(f => !LEGACY_DEMO_COMMISSION_IDS.has(f.commissionId));
    } catch (e) {
      return INITIAL_FILES;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [liveAlert, setLiveAlert] = useState<AppNotification | null>(null);
  const [notificationsHydratedForUserId, setNotificationsHydratedForUserId] = useState<string | null>(null);
  const [commissionsHydratedForUserId, setCommissionsHydratedForUserId] = useState<string | null>(null);
  const [activeDashboardTab, setActiveDashboardTab] = useState<string>('overview');

  const notificationsRef = useRef<AppNotification[]>([]);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const intakeInFlightRef = useRef<Set<string>>(new Set());
  const sessionNotifiedIntakeIdsRef = useRef<Set<string>>(new Set());
  const lastBackgroundSyncRef = useRef<number>(0);

  const dismissLiveAlert = useCallback(() => {
    setLiveAlert(null);
  }, []);

  const hasSeenIntakeLocally = useCallback((adminId: string, commissionId: string): boolean => {
    try {
      const raw = localStorage.getItem(`destalion_intake_notified_${adminId}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.includes(commissionId);
    } catch {
      return false;
    }
  }, []);

  const markSeenIntakeLocally = useCallback((adminId: string, commissionId: string): void => {
    try {
      const key = `destalion_intake_notified_${adminId}`;
      const raw = localStorage.getItem(key);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) {
        localStorage.setItem(key, JSON.stringify([commissionId]));
        return;
      }
      if (!existing.includes(commissionId)) {
        const next = [commissionId, ...existing].slice(0, 200);
        localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const ensureAdminIntakeNotification = useCallback(
    async (
      commission: Commission,
      options: { triggerLiveAlert?: boolean; skipLocalSeenCheck?: boolean } = {}
    ) => {
      if (!currentUser || currentUser.role !== 'admin' || !isSupabaseConfigured()) return;
      if (!commission?.id) return;

      const adminId = currentUser.id;
      const alreadyInMemory = notificationsRef.current.some(
        (n) =>
          (n.commissionId === commission.id || n.commission_id === commission.id) &&
          (n.title === 'New Commission Intake' || n.type === 'commission_update' || n.type === 'status')
      );
      if (alreadyInMemory) {
        sessionNotifiedIntakeIdsRef.current.add(commission.id);
        return;
      }

      if (sessionNotifiedIntakeIdsRef.current.has(commission.id)) {
        return;
      }

      if (!options.skipLocalSeenCheck && hasSeenIntakeLocally(adminId, commission.id)) {
        return;
      }

      if (intakeInFlightRef.current.has(commission.id)) return;
      intakeInFlightRef.current.add(commission.id);
      sessionNotifiedIntakeIdsRef.current.add(commission.id);

      try {
        const clientLabel =
          commission.clientName && commission.clientName !== 'Client'
            ? commission.clientName
            : 'a client';
        const intakeMessage = `New commission requested: "${commission.projectName}" by ${clientLabel}.`;
        const { data } = await createNotificationInDb({
          recipientId: adminId,
          callerUserId: adminId,
          type: 'commission_update',
          title: 'New Commission Intake',
          message: intakeMessage,
          commissionId: commission.id,
          linkTab: 'commissions',
        });

        const nowIso = new Date().toISOString();
        const resolvedNotif: AppNotification = data ?? {
          id: `local-intake-${commission.id}`,
          userId: adminId,
          user_id: adminId,
          recipientId: adminId,
          recipient_id: adminId,
          commissionId: commission.id,
          commission_id: commission.id,
          title: 'New Commission Intake',
          message: intakeMessage,
          type: 'commission_update',
          readStatus: false,
          is_read: false,
          timestamp: 'Just now',
          created_at: nowIso,
          createdAt: nowIso,
          linkTab: 'commissions',
          link_tab: 'commissions',
        };

        if (data) {
          markSeenIntakeLocally(adminId, commission.id);
        }

        setNotifications((prev) => {
          const exists = prev.some(
            (n) =>
              n.id === resolvedNotif.id ||
              ((n.commissionId === commission.id || n.commission_id === commission.id) &&
                n.title === 'New Commission Intake')
          );
          if (exists) return prev;
          return [resolvedNotif, ...prev];
        });

        if (options.triggerLiveAlert) {
          setLiveAlert(resolvedNotif);
          showBrowserNotification({
            title: resolvedNotif.title || 'New Commission Intake',
            message: resolvedNotif.message,
            tag: `commission-intake-${commission.id}`,
            onClick: () => {
              setSelectedCommissionId(commission.id);
              setActiveDashboardTab('commissions');
              setActiveView('admin-dashboard');
            },
          });
        }
      } finally {
        intakeInFlightRef.current.delete(commission.id);
      }
    },
    [currentUser, hasSeenIntakeLocally, markSeenIntakeLocally]
  );

  // Supabase Notification Persistence & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    const { data, error } = await fetchUserNotifications(currentUser.id);
    if (!error && data) {
      setNotifications(data);
      setNotificationsHydratedForUserId(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) {
      // Clear notifications if logged out
      if (!currentUser) {
        setNotifications([]);
        setLiveAlert(null);
        setNotificationsHydratedForUserId(null);
        setCommissionsHydratedForUserId(null);
        sessionNotifiedIntakeIdsRef.current.clear();
      }
      return;
    }

    let isMounted = true;
    const activeUserId = currentUser.id;
    setNotificationsHydratedForUserId(null);

    fetchUserNotifications(activeUserId).then(({ data, error }) => {
      if (!isMounted) return;
      if (!error && data) {
        setNotifications(data);
      }
      setNotificationsHydratedForUserId(activeUserId);
    });

    const unsubscribe = subscribeToUserNotifications(activeUserId, (newNotif) => {
      if (!isMounted) return;
      if (currentUser.role === 'admin' && (newNotif.commissionId || newNotif.commission_id) && newNotif.title === 'New Commission Intake') {
        const targetCommId = (newNotif.commissionId || newNotif.commission_id)!;
        sessionNotifiedIntakeIdsRef.current.add(targetCommId);
        markSeenIntakeLocally(activeUserId, targetCommId);
      }
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        // Replace optimistic local intake notification with authoritative DB row if same commission
        if (
          newNotif.title === 'New Commission Intake' &&
          (newNotif.commissionId || newNotif.commission_id)
        ) {
          const targetCommId = newNotif.commissionId || newNotif.commission_id;
          const withoutDuplicate = prev.filter(
            (n) =>
              !(
                (n.commissionId === targetCommId || n.commission_id === targetCommId) &&
                n.title === 'New Commission Intake'
              )
          );
          return [newNotif, ...withoutDuplicate];
        }
        return [newNotif, ...prev];
      });
      if (!newNotif.readStatus && !newNotif.is_read) {
        setLiveAlert(newNotif);
        showBrowserNotification({
          title: newNotif.title || 'Studio Notice',
          message: newNotif.message,
          tag: newNotif.id,
          onClick: () => {
            const targetCommId = newNotif.commissionId || newNotif.commission_id;
            if (targetCommId) setSelectedCommissionId(targetCommId);
            if (currentUser.role === 'admin') {
              setActiveDashboardTab(
                newNotif.linkTab || newNotif.link_tab || (targetCommId ? 'commissions' : 'overview')
              );
              setActiveView('admin-dashboard');
            } else {
              if (newNotif.linkTab || newNotif.link_tab) {
                setActiveDashboardTab(newNotif.linkTab || newNotif.link_tab || 'overview');
              }
              setActiveView('client-dashboard');
            }
          },
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser?.id, currentUser?.role, markSeenIntakeLocally]);

  // Phase 5D & 5F: Mount query to hydrate Studio Profile, Services, and Portfolio from Supabase
  useEffect(() => {
    let isMounted = true;

    // Helper to resolve deep-link path/query/hash against hydrated projects
    const resolveHashProject = (projects: PortfolioProject[]) => {
      if (typeof window === 'undefined') return;
      const requestedId = extractCaseStudyIdFromLocation(window.location);
      if (!requestedId) return;

      const found = projects.find((p) => p.id === requestedId);
      if (found) {
        setSelectedPortfolioProject(found);
        setActiveView('case-study');
      } else {
        // Nonexistent project link -> return gracefully to home
        setActiveView('home');
        window.history.replaceState(null, '', '/');
      }
    };

    if (!isSupabaseConfigured()) {
      // Offline / unconfigured environment: resolve hash against local portfolio
      resolveHashProject(portfolio);
      return;
    }

    // 1. Fetch Studio Profile
    fetchStudioProfileFromDb().then(({ data, error }) => {
      if (!error && data && isMounted) {
        setStudioProfile(data);
      }
    });

    // 2. Fetch Services
    fetchServicesFromDb().then(({ data, error }) => {
      if (!error && data && data.length > 0 && isMounted) {
        setServices(data);
      }
    });

    // 3. Fetch Portfolio Projects
    fetchPortfolioProjectsFromDb().then(({ data, error }) => {
      if (!isMounted) return;
      if (!error && data !== null && data !== undefined) {
        const demoIds = new Set(['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6']);
        const cleaned = data.filter((p) => !demoIds.has(p.id)).map((fromDb) => {
          const likesCount = normalizeNumericStat(
            fromDb.likesCount ?? fromDb.likes_count,
            0
          );
          const viewsCount = normalizeNumericStat(
            fromDb.viewsCount ?? fromDb.views_count,
            0
          );
          const sharesCount = normalizeNumericStat(
            fromDb.sharesCount ?? fromDb.shares_count,
            0
          );
          return {
            ...fromDb,
            likesCount,
            viewsCount,
            sharesCount,
            likes_count: likesCount,
            views_count: viewsCount,
            shares_count: sharesCount,
          };
        });
        setPortfolio(cleaned);
        try {
          localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(cleaned));
        } catch {}
        resolveHashProject(cleaned);
      } else {
        // Fallback to local portfolio without demo resurrection
        resolveHashProject(portfolio);
      }
    });

    // Hydrate user liked project IDs for authenticated accounts
    fetchUserLikedProjectIds();

    // Realtime changes listener for public content
    const unsubscribe = subscribeToPublicContentChanges({
      onProfileChanged: () => {
        fetchStudioProfileFromDb().then(({ data }) => {
          if (data && isMounted) setStudioProfile(data);
        });
      },
      onServicesChanged: () => {
        fetchServicesFromDb().then(({ data }) => {
          if (data && isMounted) setServices(data);
        });
      },
      onPortfolioChanged: () => {
        fetchPortfolioProjectsFromDb().then(({ data, error }) => {
          if (!error && data !== null && data !== undefined && isMounted) {
            const demoIds = new Set(['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6']);
            const cleaned = data.filter((p) => !demoIds.has(p.id)).map((fromDb) => {
              const likesCount = normalizeNumericStat(
                fromDb.likesCount ?? fromDb.likes_count,
                0
              );
              const viewsCount = normalizeNumericStat(
                fromDb.viewsCount ?? fromDb.views_count,
                0
              );
              const sharesCount = normalizeNumericStat(
                fromDb.sharesCount ?? fromDb.shares_count,
                0
              );
              return {
                ...fromDb,
                likesCount,
                viewsCount,
                sharesCount,
                likes_count: likesCount,
                views_count: viewsCount,
                shares_count: sharesCount,
              };
            });
            setPortfolio(cleaned);
            try {
              localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(cleaned));
            } catch {}
            setSelectedPortfolioProject((prev) => {
              if (!prev) return null;
              const refreshed = cleaned.find((p) => p.id === prev.id);
              if (!refreshed) return null;
              return refreshed;
            });
          }
        });
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync to LocalStorage (acting as offline cache fallback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(studioProfile));
  }, [studioProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_PRODUCTS, JSON.stringify(shopProducts));
    } catch {}
  }, [shopProducts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(timelineUpdates));
  }, [timelineUpdates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(projectFiles));
  }, [projectFiles]);

  // Keep track of pending profile fetches to deduplicate concurrent requests for the same user ID (e.g. on mount race conditions)
  const pendingProfileFetches = useRef<Map<string, Promise<{ profile: User | null; error?: string; rawError?: any }>>>(new Map());
  const currentUserRef = useRef<User | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  currentUserRef.current = currentUser;
  messagesRef.current = messages;

  // Securely query profile from Supabase profiles table using the authenticated user's UUID
  // Admin role is strictly derived from the database 'public.profiles.role' column
  const fetchUserProfileFromDb = async (
    userId: string, 
    fallbackEmail: string, 
    metadataPhone?: string
  ): Promise<{ profile: User | null; error?: string; rawError?: any }> => {
    // Deduplicate in-flight requests for the exact same userId
    const inFlight = pendingProfileFetches.current.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const executeFetch = async (): Promise<{ profile: User | null; error?: string; rawError?: any }> => {
      // 1. Log authenticated user's ID and email
      console.log('[Supabase Auth] Fetching profile for authenticated user:', {
        userId,
        email: fallbackEmail,
      });

      // 2. Log the Supabase URL being used (DO NOT log or expose the API key)
      console.log('[Supabase Config] Supabase project URL being used:', supabaseUrl);

      const maxRetries = 2;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const { data, error, status, statusText } = await supabase
            .from('profiles')
            .select('id, name, email, role, avatar, handle, contact_method, bio')
            .eq('id', userId)
            .maybeSingle();

          const isNetworkFailure = Boolean(
            error && (
              error.message?.includes('Failed to fetch') ||
              error.details?.includes('Failed to fetch') ||
              status === 0
            )
          );

          if (isNetworkFailure && attempt < maxRetries) {
            attempt++;
            console.warn(`[Supabase Auth] Network fetch failed for UUID (${userId}), retrying (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 600));
            continue;
          }

          // 3. Log whether the profile query returns data, null, or an error
          console.log('[Supabase Auth] Query response status:', {
            returnsData: Boolean(data),
            isNull: data === null,
            hasError: Boolean(error),
            httpStatus: status,
            statusText,
            roleFromDb: data?.role ?? null,
          });

          // 4. Log the complete Supabase query error (message, code, details, hint)
          if (error) {
            console.error(`[Supabase Auth] Complete query error for UUID (${userId}):`, {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            });

            // 5. Do not fall back silently to client when the database query fails. Return the real error.
            const isNetworkErr = error.message?.includes('Failed to fetch') || error.details?.includes('Failed to fetch');
            const formattedErr = isNetworkErr
              ? 'Unable to connect to Supabase network. Please check your internet connection or ad-blocker.'
              : `[Code: ${error.code || 'UNKNOWN'}] ${error.message}${error.details ? ` (Details: ${error.details})` : ''}${error.hint ? ` (Hint: ${error.hint})` : ''}`;

            setDatabaseError(formattedErr);
            return {
              profile: null,
              error: formattedErr,
              rawError: error,
            };
          }

          if (!data) {
            console.warn(`[Supabase Auth] No profile record found in public.profiles for UUID (${userId}). Query returned null.`);
            return {
              profile: null,
              error: `No record found in public.profiles matching user UUID "${userId}".`,
              rawError: null,
            };
          }

          // Success: clear previous database errors
          setDatabaseError(null);

          // Determine role STRICTLY from public.profiles.role column in Supabase
          const assignedRole: UserRole = data.role === 'admin' ? 'admin' : 'client';

          const userProfile: User = {
            id: data.id,
            name: data.name || fallbackEmail.split('@')[0] || 'User',
            // IMPORTANT: the authenticated Supabase Auth session email
            // (`fallbackEmail`, passed in from `session.user.email` at every
            // call site) is the source of truth for the user's email — never
            // `public.profiles.email`, and never a hardcoded value keyed off
            // role or user ID. Changing a user's email in Supabase Auth does
            // not automatically update the `profiles.email` column (there is
            // no trigger syncing it), so that column can silently go stale.
            // `data.email` is only used as a last-resort fallback for the rare
            // case where the session itself has no email on it. This must stay
            // role-agnostic: hardcoding a specific email for "the admin" breaks
            // the moment that account's email changes again, or a second admin
            // is added.
            email: fallbackEmail || data.email || '',
            role: assignedRole,
            avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            handle: data.handle || `@${(fallbackEmail.split('@')[0] || 'user').toLowerCase()}`,
            phone: metadataPhone || (data as any).phone || undefined,
            contactMethod: data.contact_method || 'Platform Chat & Email',
            bio: data.bio || '',
          };

          console.log(`[Supabase Auth] Profile loaded successfully from Supabase. Role from public.profiles: "${assignedRole}"`);

          return { profile: userProfile, error: undefined, rawError: null };
        } catch (err: any) {
          const isNetworkFailure = Boolean(err?.message?.includes('Failed to fetch') || err?.name === 'TypeError');
          if (isNetworkFailure && attempt < maxRetries) {
            attempt++;
            console.warn(`[Supabase Auth] Caught network exception for UUID (${userId}), retrying (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 600));
            continue;
          }

          console.error('[Supabase Auth] Unexpected exception in fetchUserProfileFromDb:', err);
          const formattedErr = isNetworkFailure
            ? 'Unable to connect to Supabase network. Please check your internet connection or ad-blocker.'
            : (err?.message || 'Unexpected exception during profile query.');
          setDatabaseError(formattedErr);
          return {
            profile: null,
            error: formattedErr,
            rawError: err,
          };
        }
      }

      const finalErr = 'Unable to connect to Supabase network after multiple attempts. Please check your internet connection.';
      setDatabaseError(finalErr);
      return { profile: null, error: finalErr, rawError: null };
    };

    const task = executeFetch().finally(() => {
      pendingProfileFetches.current.delete(userId);
    });

    pendingProfileFetches.current.set(userId, task);
    return task;
  };

  // Explicit helper to refresh the current user's profile and latest role from Supabase
  const refreshCurrentUserProfile = async (): Promise<User | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return null;
      }
      const { profile, error: profileErr } = await fetchUserProfileFromDb(
        session.user.id, 
        session.user.email || '', 
        session.user.user_metadata?.phone
      );
      if (profile) {
        setCurrentUser(profile);
      } else if (profileErr) {
        console.error('[Supabase Auth] Failed to refresh profile:', profileErr);
      }
      return profile;
    } catch (err) {
      console.error('[Supabase Auth] Error refreshing profile:', err);
      return null;
    }
  };

  // Sync Supabase Auth Session on mount and after page refresh
  useEffect(() => {
    let isMounted = true;

    // Detect a return trip from a Supabase email-confirmation link. Supabase
    // appends outcome info to the URL hash on redirect:
    //   success: #access_token=...&type=signup&...
    //   expired/invalid: #error=...&error_code=otp_expired&...
    // We only ever branch on `type`/`error_code` to pick one of our own
    // pre-written messages below — the raw `error_description` from the
    // URL is intentionally never read into any user-facing text.
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const type = hashParams.get('type');
      const errorCode = hashParams.get('error_code');
      const hasError = hashParams.has('error');

      if (hasError) {
        setEmailVerificationStatus(errorCode === 'otp_expired' ? 'expired' : 'error');
        setActiveView('auth');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (type === 'signup') {
        setEmailVerificationStatus('success');
        setActiveView('auth');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    // Hydrate existing session from Supabase before deciding user role
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('[Supabase Auth] Error hydrating session on mount:', error.message);
      }
      if (session?.user) {
        const { profile, error: profileErr } = await fetchUserProfileFromDb(
          session.user.id, 
          session.user.email || '', 
          session.user.user_metadata?.phone
        );
        if (profile && isMounted) {
          setCurrentUser(profile);
        } else if (profileErr) {
          console.warn('[Supabase Auth] Hydration notice:', profileErr);
        }
      }
      if (isMounted) {
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          const { profile, error: profileErr } = await fetchUserProfileFromDb(
            session.user.id, 
            session.user.email || '', 
            session.user.user_metadata?.phone
          );
          if (profile && isMounted) {
            setCurrentUser(profile);
          } else if (profileErr) {
            console.warn('[Supabase Auth] Auth state change profile notice:', profileErr);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearResolvedAdminCache();
        if (isMounted) {
          setCurrentUser(null);
          setLiveAlert(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load registered client profiles from public.profiles when an admin is logged in
  const refreshUsers = useCallback(async () => {
    if (currentUser?.role !== 'admin' || !isSupabaseConfigured()) return;
    setUsersLoading(true);
    setUsersLoadError(null);
    try {
      const { data: dbUsers, error } = await fetchAllProfilesFromSupabase();
      if (error || !dbUsers) {
        const msg = error || 'Failed to load client profiles from Supabase.';
        console.warn('[Supabase Profiles] Error loading client directory:', msg);
        setUsersLoadError(msg);
        return;
      }

      setUsers(dbUsers);
      cacheClientProfiles(dbUsers);

      // Enrich any already-loaded commissions that fell back to generic "Client" metadata
      const profileById = new Map(dbUsers.map(u => [u.id, u]));
      setCommissions(prev =>
        prev.map(comm => {
          const matched = profileById.get(comm.clientId);
          if (!matched) return comm;
          const needsEnrichment =
            !comm.clientEmail ||
            comm.clientName === 'Client' ||
            comm.clientName !== matched.name ||
            comm.clientAvatar !== matched.avatar;
          if (!needsEnrichment) return comm;
          return {
            ...comm,
            clientName: matched.name || comm.clientName,
            clientEmail: matched.email || comm.clientEmail,
            clientAvatar: matched.avatar || comm.clientAvatar,
            clientHandle: matched.handle || comm.clientHandle,
            contactMethod: matched.contactMethod || comm.contactMethod,
          };
        })
      );
    } finally {
      setUsersLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role !== 'admin' || !isSupabaseConfigured()) return;
    refreshUsers();

    // Keep Client Directory synchronized in realtime when new clients sign up or update profiles
    const channel = supabase
      .channel(`admin-profiles-sync-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          refreshUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.role, refreshUsers]);

  // Fetch real commissions from public.commissions in Supabase when user is authenticated
  const refreshCommissions = async () => {
    if (!currentUser || !isSupabaseConfigured()) return;
    try {
      const { success, data, error } = await fetchCommissionsFromSupabase(currentUser);
      if (success) {
        // Supabase is the sole source of truth once a user is authenticated.
        // Replace local state entirely rather than merging with whatever
        // was previously cached — merging allowed local-only/demo records
        // (whose IDs never exist in the database) to survive every refresh
        // forever, and also meant a real empty result never actually
        // cleared stale local data.
        setCommissions(data || []);
        setCommissionsHydratedForUserId(currentUser.id);
      } else if (error) {
        console.warn('[Supabase Commissions] Notice fetching commissions:', error);
      }
    } catch (err) {
      console.error('[Supabase Commissions] Error in refreshCommissions:', err);
    }
  };

  useEffect(() => {
    if (currentUser && isSupabaseConfigured()) {
      setCommissionsHydratedForUserId(null);
      refreshCommissions();

      // Phase 5E-1: Centralized Realtime subscription for public.commissions
      const unsubscribe = subscribeToCommissionsChange({
        onInsert: async (row) => {
          // If admin, or if the inserted commission belongs to current authenticated client
          if (currentUser.role === 'admin' || row.client_id === currentUser.id) {
            let clientProfile: User | undefined;
            if (row.client_id === currentUser.id) {
              clientProfile = currentUser;
            } else if (currentUser.role === 'admin') {
              clientProfile = (await fetchClientProfile(row.client_id)) || undefined;
            }
            const mapped = mapDbCommissionToAppCommission(row, clientProfile);
            setCommissions(prev => {
              if (prev.some(c => c.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });

            // Guarantee the studio admin receives an instant persistent intake notification & live alert
            if (currentUser.role === 'admin') {
              ensureAdminIntakeNotification(mapped, {
                triggerLiveAlert: true,
                skipLocalSeenCheck: true,
              });
            }
          }
        },
        onUpdate: (row) => {
          if (currentUser.role === 'admin' || row.client_id === currentUser.id) {
            setCommissions(prev => {
              const existing = prev.find(c => c.id === row.id);
              let clientProfile: Partial<User> | undefined;
              if (row.client_id === currentUser.id) {
                clientProfile = currentUser;
              } else if (existing && existing.clientId === row.client_id) {
                clientProfile = {
                  id: existing.clientId,
                  name: existing.clientName,
                  email: existing.clientEmail,
                  avatar: existing.clientAvatar,
                  handle: existing.clientHandle,
                  contactMethod: existing.contactMethod,
                  role: 'client',
                };
              } else {
                clientProfile = getCachedClientProfile(row.client_id);
              }
              const mapped = mapDbCommissionToAppCommission(row, clientProfile);

              // Preserve clientReviewData, timelineUpdates, and proofs from existing state if present
              const merged: Commission = {
                ...mapped,
                clientReviewData: existing?.clientReviewData,
                timelineUpdates: existing?.timelineUpdates,
                proofs: existing?.proofs,
                finalFiles: existing?.finalFiles,
              };

              if (!existing) {
                return [merged, ...prev];
              }
              return prev.map(c => (c.id === row.id ? merged : c));
            });
          }
        },
        onDelete: (id) => {
          setCommissions(prev => prev.filter(c => c.id !== id));
        },
      });

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser?.id, currentUser?.role, ensureAdminIntakeNotification]);

  // Offline / catch-up guarantee for admins: if a pending commission arrived while the admin
  // was offline and has no intake notification row in DB yet, create it once after hydration.
  useEffect(() => {
    if (
      !currentUser ||
      currentUser.role !== 'admin' ||
      !isSupabaseConfigured() ||
      notificationsHydratedForUserId !== currentUser.id ||
      commissionsHydratedForUserId !== currentUser.id
    ) {
      return;
    }

    const pendingUnnotified = commissions.filter((c) => {
      const normalizedStatus = (c.status || '').toLowerCase().trim();
      if (normalizedStatus !== 'pending') return false;
      const alreadyHasNotif = notificationsRef.current.some(
        (n) =>
          (n.commissionId === c.id || n.commission_id === c.id) &&
          (n.title === 'New Commission Intake' || n.type === 'commission_update' || n.type === 'status')
      );
      if (alreadyHasNotif) return false;
      if (sessionNotifiedIntakeIdsRef.current.has(c.id)) return false;
      return !hasSeenIntakeLocally(currentUser.id, c.id);
    });

    if (pendingUnnotified.length === 0) return;

    pendingUnnotified.forEach((comm, index) => {
      ensureAdminIntakeNotification(comm, { triggerLiveAlert: index === 0 });
    });
  }, [
    currentUser,
    commissions,
    notificationsHydratedForUserId,
    commissionsHydratedForUserId,
    hasSeenIntakeLocally,
    ensureAdminIntakeNotification,
  ]);

  // Tab-focus, visibility, and lightweight periodic sync so admins receive commission intake
  // notifications within seconds even when Supabase Realtime publications/WebSockets are inactive.
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;

    let isMounted = true;

    const runBackgroundSync = async (force = false) => {
      if (!isMounted) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      const now = Date.now();
      if (!force && now - lastBackgroundSyncRef.current < 4000) return;
      lastBackgroundSyncRef.current = now;

      const prevNotifIds = new Set(notificationsRef.current.map((n) => n.id));
      const { data: freshNotifs, error: notifErr } = await fetchUserNotifications(currentUser.id);
      if (!isMounted) return;

      if (!notifErr && freshNotifs) {
        setNotifications((prev) => {
          const dbIds = new Set(freshNotifs.map((n) => n.id));
          const localFallbacks = prev.filter(
            (n) =>
              n.id.startsWith('local-intake-') &&
              !freshNotifs.some(
                (dn) =>
                  (dn.commissionId === n.commissionId || dn.commission_id === n.commission_id) &&
                  dn.title === 'New Commission Intake'
              ) &&
              !dbIds.has(n.id)
          );
          return [...localFallbacks, ...freshNotifs];
        });

        const newlyArrivedUnread = freshNotifs.find(
          (n) => !prevNotifIds.has(n.id) && !n.readStatus && !n.is_read
        );
        if (newlyArrivedUnread) {
          setLiveAlert(newlyArrivedUnread);
          showBrowserNotification({
            title: newlyArrivedUnread.title || 'Studio Notice',
            message: newlyArrivedUnread.message,
            tag: newlyArrivedUnread.id,
          });
        }
      }

      if (currentUser.role === 'admin') {
        const { success, data: freshComms } = await fetchCommissionsFromSupabase(currentUser);
        if (!isMounted || !success) return;

        setCommissions(freshComms || []);
        setCommissionsHydratedForUserId(currentUser.id);

        const unnotifiedPending = (freshComms || []).filter((c) => {
          const normalizedStatus = (c.status || '').toLowerCase().trim();
          if (normalizedStatus !== 'pending') return false;
          const alreadyNotified =
            sessionNotifiedIntakeIdsRef.current.has(c.id) ||
            hasSeenIntakeLocally(currentUser.id, c.id) ||
            notificationsRef.current.some(
              (n) =>
                (n.commissionId === c.id || n.commission_id === c.id) &&
                (n.title === 'New Commission Intake' || n.type === 'commission_update' || n.type === 'status')
            );
          return !alreadyNotified;
        });

        unnotifiedPending.forEach((comm, index) => {
          ensureAdminIntakeNotification(comm, { triggerLiveAlert: index === 0 });
        });
      }
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        runBackgroundSync(false);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const intervalId = window.setInterval(() => {
      runBackgroundSync(false);
    }, 12000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [currentUser, hasSeenIntakeLocally, ensureAdminIntakeNotification]);

  const loginUser = async (
    email: string, 
    password?: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter your password.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please check your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          msg = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          msg = 'Please verify your email address to sign in.';
        }
        return { success: false, error: msg };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      // Retrieve authenticated user's UUID
      const authUserId = data.user.id;
      const authUserEmail = data.user.email || cleanEmail;

      // Role MUST come strictly from public.profiles.role using user UUID
      const { profile, error: profileError } = await fetchUserProfileFromDb(authUserId, authUserEmail, data.user.user_metadata?.phone);
      if (!profile) {
        return { 
          success: false, 
          error: `Signed in successfully, but failed to load your user profile from Supabase: ${profileError || 'No profile record found.'}` 
        };
      }

      setCurrentUser(profile);

      // Route strictly based on the database role from public.profiles
      if (profile.role === 'admin') {
        setActiveView('admin-dashboard');
      } else {
        let hasDraft = false;
        try {
          hasDraft = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem(STORAGE_KEYS.COMMISSION_DRAFT));
        } catch {}

        if (hasDraft) {
          setActiveView('commission-form');
        } else {
          const clientComm = commissions.find(c => c.clientId === profile.id || c.clientEmail.toLowerCase() === cleanEmail);
          if (clientComm) setSelectedCommissionId(clientComm.id);
          setActiveView('client-dashboard');
        }
      }

      return { success: true, user: profile };
    } catch (err: any) {
      return { success: false, error: err?.message || 'An unexpected error occurred during sign in.' };
    }
  };

  const signUpUser = async (
    name: string,
    email: string,
    password?: string,
    handle?: string,
    contactMethod?: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string; user?: User; confirmationRequired?: boolean }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Please enter a password.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please check your environment variables.',
      };
    }

    try {
      const cleanHandle = handle?.trim() || `@${cleanName.toLowerCase().replace(/\s+/g, '_')}`;
      const cleanContact = contactMethod || 'Platform Chat & Email';

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          // Redirects back to whichever origin the signup actually happened
          // on — the live production URL when signing up there, or
          // localhost during local development — without hardcoding either
          // one. Note: Supabase only honors this if the target origin is
          // also listed in the project's Dashboard "Redirect URLs" allow
          // list (see the deployment notes for exactly what to add there).
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          data: {
            name: cleanName,
            full_name: cleanName,
            handle: cleanHandle,
            contactMethod: cleanContact,
            phone: phone?.trim() || '',
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes('user already registered') || error.message.toLowerCase().includes('already exists')) {
          msg = 'An account with this email address already exists. Please sign in instead.';
        } else if (error.message.toLowerCase().includes('password should be at least')) {
          msg = 'Password must be at least 6 characters long.';
        }
        return { success: false, error: msg };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create account. Please try again.' };
      }

      // Check if email confirmation is required by Supabase project settings
      if (!data.session) {
        return {
          success: true,
          confirmationRequired: true,
          user: {
            id: data.user.id,
            name: cleanName,
            email: cleanEmail,
            role: 'client', // Strictly client
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            handle: cleanHandle,
            contactMethod: cleanContact,
            phone: phone?.trim(),
          },
        };
      }

      // Retrieve profile from public.profiles to verify role
      const { profile } = await fetchUserProfileFromDb(data.user.id, data.user.email || cleanEmail, phone?.trim());
      const finalUser: User = profile || {
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        role: 'client', // Strictly client
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        handle: cleanHandle,
        contactMethod: cleanContact,
        phone: phone?.trim(),
      };

      setCurrentUser(finalUser);

      let hasDraft = false;
      try {
        hasDraft = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem(STORAGE_KEYS.COMMISSION_DRAFT));
      } catch {}

      if (hasDraft) {
        setActiveView('commission-form');
      } else {
        const clientComm = commissions.find(c => c.clientEmail.toLowerCase() === cleanEmail);
        if (clientComm) setSelectedCommissionId(clientComm.id);
        setActiveView('client-dashboard');
      }

      return { success: true, user: finalUser };
    } catch (err: any) {
      return { success: false, error: err?.message || 'An unexpected error occurred during registration.' };
    }
  };

  const resendVerificationEmail = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase authentication is not configured.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        // Deliberately generic: never confirm/deny whether an account
        // exists for this email, and never surface Supabase's raw message.
        console.warn('[Supabase Auth] Resend verification notice:', error.message);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Supabase Auth] Error resending verification email:', err);
      return { success: true };
    }
  };

  const registerClient = (
    name: string, 
    email: string, 
    handle?: string, 
    contactMethod?: string,
    phone?: string
  ): User => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updated: User = {
        ...existing,
        name: cleanName || existing.name,
        handle: handle || existing.handle,
        contactMethod: contactMethod || existing.contactMethod,
        phone: phone || existing.phone,
      };
      setUsers(prev => prev.map(u => (u.id === existing.id ? updated : u)));
      return updated;
    }

    const newUser: User = {
      id: `usr-client-${Date.now()}`,
      name: cleanName || 'New Client',
      email: cleanEmail || `client-${Date.now()}@example.com`,
      role: 'client',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
      handle: handle || `@${(cleanName || 'client').toLowerCase().replace(/\s+/g, '_')}`,
      contactMethod: contactMethod || 'Platform Chat & Email',
      phone: phone,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const logout = async () => {
    clearResolvedAdminCache();
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out from Supabase:', err);
      }
    }
    setLiveAlert(null);
    setCurrentUser(null);
    setActiveView('home');
  };


  const submitCommission = (formData: any): string => {
    let client = currentUser;
    if (!client || client.role === 'admin') {
      client = registerClient(
        formData.fullName || 'Valued Client',
        formData.email || 'client@example.com',
        formData.socialHandle,
        formData.preferredContact
      );
    }

    const newId = `comm-${Date.now()}`;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const newCommission: Commission = {
      id: newId,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientAvatar: client.avatar,
      clientHandle: client.handle,
      contactMethod: formData.preferredContact || client.contactMethod || 'Platform Chat',
      projectName: formData.projectName || 'Custom Design Project',
      service: formData.serviceType || 'Custom Graphic Design',
      description: formData.description || '',
      purpose: formData.purpose || 'Brand & Commercial Use',
      targetAudience: formData.targetAudience || 'Target market',
      preferredStyle: formData.preferredStyle || 'Modern Minimalist',
      preferredColors: formData.preferredColors || ['#0F172A', '#F97316'],
      requiredDimensions: formData.requiredDimensions || 'Vector SVG & High-Res PNG',
      budget: formData.budget ? (formData.budget.startsWith('₱') ? formData.budget : `₱${formData.budget}`) : '₱4,500',
      currency: studioProfile.currency,
      deadline: formData.deadline || 'Within 2 weeks',
      status: 'Pending',
      progress: 10,
      currentStage: 1, // Commission Received
      referenceImages: formData.referenceImages || [],
      referenceLinks: formData.referenceLinks || [],
      referenceDocs: formData.referenceDocs || [],
      communicationGoals: formData.communicationGoals || '',
      thingsToAvoid: formData.thingsToAvoid || '',
      additionalNotes: formData.additionalNotes || '',
      assignedDesigner: studioProfile.designerName,
      depositPaid: false,
      totalPaid: false,
      revisionsAllowed: 2,
      revisionsUsed: 0,
      createdAt: todayStr,
      updatedAt: todayStr,
    };

    setCommissions(prev => [newCommission, ...prev]);
    setSelectedCommissionId(newId);

    // Add initial timeline event
    const newTimelineUpdate: ProgressUpdate = {
      id: `upd-${Date.now()}`,
      commissionId: newId,
      stage: 'Commission Received',
      stageNumber: 1,
      percentage: 10,
      note: `Commission submitted by ${client.name}. Request queued for designer review.`,
      timestamp: todayStr,
      updatedBy: 'System',
    };
    setTimelineUpdates(prev => [...prev, newTimelineUpdate]);

    // Initial welcoming message
    const welcomeMsg: Message = {
      id: `msg-${Date.now()}`,
      commissionId: newId,
      senderId: 'usr-admin-1',
      senderName: studioProfile.designerName,
      senderRole: 'admin',
      senderAvatar: studioProfile.avatar,
      message: `Hello ${client.name}! Thanks for submitting your commission request for "${newCommission.projectName}". I'm reviewing your specifications and will confirm project discussion shortly. Feel free to leave any additional thoughts or questions here!`,
      timestamp: `${todayStr} · Just now`,
      readStatus: false,
    };
    setMessages(prev => [...prev, welcomeMsg]);

    // Notification for client
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: client.id,
      commissionId: newId,
      message: `Your commission request for "${newCommission.projectName}" was successfully submitted!`,
      type: 'status',
      readStatus: false,
      timestamp: todayStr,
      linkTab: 'overview',
    };
    setNotifications(prev => [newNotif, ...prev]);

    setActiveView('client-dashboard');
    return newId;
  };

  const submitCommissionRequest = async (data: {
    serviceType: string;
    title: string;
    description: string;
    budget: number | string;
    deadline: string;
    purpose?: string;
    targetAudience?: string;
    preferredStyle?: string;
    preferredColors?: string[];
    requiredDimensions?: string;
    referenceLinks?: string[];
    additionalNotes?: string;
  }): Promise<{ success: boolean; commission?: Commission; error?: string }> => {
    if (!currentUser) {
      return {
        success: false,
        error: 'You must be signed in to submit a commission request. Please sign in or create an account.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please check your environment variables.',
      };
    }

    // Insert directly into public.commissions table in Supabase
    // Uses currently authenticated user's id as client_id (cannot be modified by client)
    const result = await insertCommissionToSupabase(
      {
        clientId: currentUser.id,
        title: data.title,
        serviceType: data.serviceType,
        description: data.description,
        budget: data.budget,
        deadline: data.deadline,
        purpose: data.purpose,
        targetAudience: data.targetAudience,
        preferredStyle: data.preferredStyle,
        preferredColors: data.preferredColors,
        requiredDimensions: data.requiredDimensions,
        referenceLinks: data.referenceLinks,
        additionalNotes: data.additionalNotes,
      },
      currentUser
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to submit commission to Supabase.',
      };
    }

    const newCommission = result.data;

    // Update in-memory state so it appears immediately in all views
    setCommissions(prev => [newCommission, ...prev.filter(c => c.id !== newCommission.id)]);
    setSelectedCommissionId(newCommission.id);

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Add initial timeline event
    const newTimelineUpdate: ProgressUpdate = {
      id: `upd-${Date.now()}`,
      commissionId: newCommission.id,
      stage: 'Commission Received',
      stageNumber: 1,
      percentage: 10,
      note: `Commission submitted by ${currentUser.name}. Request queued in Supabase database with default status (pending).`,
      timestamp: todayStr,
      updatedBy: 'System',
    };
    setTimelineUpdates(prev => [...prev, newTimelineUpdate]);

    // Initial welcoming message
    const welcomeMsg: Message = {
      id: `msg-${Date.now()}`,
      commissionId: newCommission.id,
      senderId: 'usr-admin-1',
      senderName: studioProfile.designerName,
      senderRole: 'admin',
      senderAvatar: studioProfile.avatar,
      message: `Hello ${currentUser.name}! Thanks for submitting your commission request for "${newCommission.projectName}". Your request has been recorded in our Supabase commissions table. I will review your design brief and scope shortly!`,
      timestamp: `${todayStr} · Just now`,
      readStatus: false,
    };
    setMessages(prev => [...prev, welcomeMsg]);

    // Dispatch persistent notifications for both Client confirmation and Admin intake
    dispatchNotification({
      recipientId: currentUser.id,
      type: 'commission_update',
      title: 'Commission Request Submitted',
      message: `Your commission request for "${newCommission.projectName}" was successfully submitted!`,
      commissionId: newCommission.id,
      linkTab: 'overview',
    });

    resolveAdminUserIds().then(adminIds => {
      adminIds.forEach(adminId => {
        dispatchNotification({
          recipientId: adminId,
          type: 'commission_update',
          title: 'New Commission Intake',
          message: `New commission requested: "${newCommission.projectName}" by ${currentUser.name}.`,
          commissionId: newCommission.id,
          linkTab: 'commissions',
        });
      });
    });

    return { success: true, commission: newCommission };
  };

  const updateCommissionStage = async (
    commissionId: string,
    newStageNumber: number,
    stageNameOrNote?: string,
    optionalNote?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Derive canonical status, stage, and progress from centralized lifecycle mapping
    const lifecycle = getLifecycleFromStage(newStageNumber);

    // 2. Persist canonical status through existing Supabase status-update helper
    const res = await updateCommissionStatusInSupabase(commissionId, lifecycle.status);
    if (!res.success) {
      console.error('[AppContext] Failed to update commission stage in Supabase:', res.error);
      return { success: false, error: res.error || 'Failed to update commission stage in database.' };
    }

    // 3. Only update local state after the Supabase update succeeds
    const stageInfo = COMMISSION_STAGES.find(s => s.number === lifecycle.stage) || COMMISSION_STAGES[0];
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const noteText = optionalNote || stageNameOrNote || `Project moved to Stage ${lifecycle.stage}: ${stageInfo.name}.`;

    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            currentStage: lifecycle.stage,
            progress: lifecycle.progress,
            status: lifecycle.status,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    // Add timeline record
    const newTimelineUpdate: ProgressUpdate = {
      id: `upd-${Date.now()}`,
      commissionId,
      stage: stageInfo.name,
      stageNumber: lifecycle.stage,
      percentage: lifecycle.progress,
      note: noteText,
      timestamp: todayStr,
      updatedBy: studioProfile.designerName,
    };
    setTimelineUpdates(prev => [...prev, newTimelineUpdate]);

    // Notify client
    const targetComm = commissions.find(c => c.id === commissionId);
    if (targetComm) {
      const isCompleted = lifecycle.stage === 8;
      dispatchNotification({
        recipientId: targetComm.clientId,
        type: isCompleted ? 'commission_completed' : 'commission_update',
        title: isCompleted ? 'Commission Completed' : 'Commission Update',
        message: isCompleted
          ? `Your project "${targetComm.projectName}" has been completed and final deliverables are ready!`
          : `Your project "${targetComm.projectName}" has moved to ${stageInfo.name}.`,
        commissionId,
        linkTab: (lifecycle.stage === 5 || lifecycle.stage === 7) ? 'review' : (lifecycle.stage === 8 ? 'delivery' : 'timeline'),
      });
    }

    return { success: true };
  };

  const updateCommissionStatus = async (
    commissionId: string,
    status: CommissionStatus
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Persist status update to Supabase public.commissions
    const res = await updateCommissionStatusInSupabase(commissionId, status);
    if (!res.success) {
      console.error('[AppContext] Failed to update commission status in Supabase:', res.error);
      return { success: false, error: res.error || 'Failed to update commission status in database.' };
    }

    // 2. Derive corresponding currentStage and progress from canonical status
    const lifecycle = getStageAndProgressFromStatus(status);

    // 3. Only update local React state after Supabase successfully updates
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            status: lifecycle.status,
            currentStage: lifecycle.stage,
            progress: lifecycle.progress,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    return { success: true };
  };

  const updateCommissionPriority = async (
    commissionId: string,
    priority: CommissionPriority
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Persist priority update to Supabase public.commissions
    const res = await updateCommissionPriorityInSupabase(commissionId, priority);
    if (!res.success) {
      console.error('[AppContext] Failed to update commission priority in Supabase:', res.error);
      return { success: false, error: res.error || 'Failed to update commission priority in database.' };
    }

    // 2. Only update local React state after Supabase successfully updates
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            priority,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    return { success: true };
  };

  const updateCommissionDetails = (commissionId: string, updates: Partial<Commission>) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    setCommissions(prev =>
      prev.map(c => (c.id === commissionId ? { ...c, ...updates, updatedAt: todayStr } : c))
    );
  };

  const updatePaymentStatus = async (
    commissionId: string, 
    status: 'Unpaid' | 'Partial' | 'Paid'
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Persist payment status update to Supabase public.commissions
    if (isSupabaseConfigured()) {
      const res = await updateCommissionPaymentInSupabase(commissionId, status);
      if (!res.success) {
        console.error('[AppContext] Failed to update payment status in Supabase:', res.error);
        return { success: false, error: res.error || 'Failed to update payment status in database.' };
      }
    }

    // 2. Update React state and local cache
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const depositPaid = status === 'Partial' || status === 'Paid';
    const totalPaid = status === 'Paid';

    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            paymentStatus: status,
            depositPaid,
            totalPaid,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    return { success: true };
  };

  const acceptCommission = async (commissionId: string): Promise<{ success: boolean; error?: string }> => {
    return await updateCommissionStage(
      commissionId,
      2,
      'Project Discussion',
      'Commission brief accepted by designer. Moving to project scope and discussion.'
    );
  };

  const declineCommission = async (commissionId: string): Promise<{ success: boolean; error?: string }> => {
    return await updateCommissionStatus(commissionId, 'cancelled');
  };

  const deleteCommission = async (commissionId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can remove commissions.' };
    }
    if (!commissionId) {
      return { success: false, error: 'Commission ID is required.' };
    }

    if (isSupabaseConfigured()) {
      const res = await deleteCommissionInSupabase(commissionId);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to remove commission.' };
      }
    }

    setCommissions(prev => prev.filter(c => c.id !== commissionId));
    setMessages(prev => prev.filter(m => m.commissionId !== commissionId));
    setTimelineUpdates(prev => prev.filter(t => t.commissionId !== commissionId));
    setProjectFiles(prev => prev.filter(f => f.commissionId !== commissionId));
    setNotifications(prev => prev.filter(n => n.commissionId !== commissionId));

    if (selectedCommissionId === commissionId) {
      setSelectedCommissionId('');
    }

    return { success: true };
  };

  const approveCommissionWithProof = async (
    commissionId: string,
    proofId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return await submitClientReviewAction(commissionId, 'approve', undefined, proofId);
  };

  const submitClientReviewAction = async (
    commissionId: string, 
    action: 'approve' | 'revision', 
    feedback?: string,
    proofId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const comm = commissions.find(c => c.id === commissionId);
    if (!comm) return { success: false, error: 'Commission not found.' };

    if (action === 'approve') {
      // Phase 5E-3: Atomic client approval via SECURITY DEFINER RPC
      // Validates client ownership, checks 'for_review', marks proof 'approved',
      // advances commission status to 'final_approval', and inserts Stage 7 milestone.
      if (isSupabaseConfigured()) {
        if (!proofId) {
          console.error('[AppContext] Proof ID is required for atomic client proof approval.');
          return { success: false, error: 'Proof ID is required for client approval.' };
        }

        const approveRes = await approveCommissionInSupabase(commissionId, proofId);
        if (!approveRes.success) {
          console.error('[AppContext] Supabase client_approve_commission RPC rejected:', approveRes.error);
          return { success: false, error: approveRes.error || 'Failed to approve creative proof in database.' };
        }
      }

      // Move to Final Approval (Stage 7)
      setCommissions(prev =>
        prev.map(c => {
          if (c.id === commissionId) {
            return {
              ...c,
              currentStage: 7,
              progress: 95,
              status: 'final_approval',
              clientReviewData: c.clientReviewData ? {
                ...c.clientReviewData,
                clientStatus: 'Approved',
              } : undefined,
              updatedAt: todayStr,
            };
          }
          return c;
        })
      );

      // Add timeline
      setTimelineUpdates(prev => [
        ...prev,
        {
          id: `upd-${Date.now()}`,
          commissionId,
          stage: 'Final Approval',
          stageNumber: 7,
          percentage: 95,
          note: 'Design approved by client! Preparing full production package and asset exports.',
          timestamp: todayStr,
          updatedBy: comm.clientName,
        },
      ]);

      // Message in chat
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          commissionId,
          senderId: comm.clientId,
          senderName: comm.clientName,
          senderRole: 'client',
          senderAvatar: comm.clientAvatar,
          message: '🎉 I have approved the design! Everything looks fantastic. Ready for the final deliverables.',
          timestamp: `${todayStr} · Just now`,
          readStatus: false,
        },
      ]);

      // Notify Studio Director of approval
      resolveAdminUserId().then(adminId => {
        dispatchNotification({
          recipientId: adminId,
          type: 'proof_approved',
          title: 'Creative Proof Approved',
          message: `${comm.clientName} approved Creative Proof for "${comm.projectName}". Moving to Final Approval.`,
          commissionId,
          linkTab: 'proofs',
        });
      });

      return { success: true };
    } else {
      // Phase 5E-1: Request Revision -> Authoritative Supabase RPC FIRST
      let updatedRevisionsUsed = (comm.revisionsUsed || 0) + 1;

      if (isSupabaseConfigured()) {
        const rpcRes = await requestCommissionRevisionInSupabase(commissionId, feedback);
        if (!rpcRes.success) {
          console.error('[AppContext] Supabase revision request RPC rejected:', rpcRes.error);
          return {
            success: false,
            error: rpcRes.error || 'Failed to request revision in database.',
          };
        }

        // Use the atomic revision count returned by the database if present
        if (rpcRes.data && typeof rpcRes.data.revisions_used === 'number') {
          updatedRevisionsUsed = rpcRes.data.revisions_used;
        }
      }

      // Supabase RPC succeeded -> commit state update locally
      setCommissions(prev =>
        prev.map(c => {
          if (c.id === commissionId) {
            return {
              ...c,
              currentStage: 6,
              progress: 85,
              status: 'revision',
              revisionsUsed: updatedRevisionsUsed,
              clientReviewData: c.clientReviewData ? {
                ...c.clientReviewData,
                clientStatus: 'Revision Requested',
                revisionFeedback: feedback,
                revisionDate: todayStr,
              } : undefined,
              updatedAt: todayStr,
            };
          }
          return c;
        })
      );

      // Add timeline
      setTimelineUpdates(prev => [
        ...prev,
        {
          id: `upd-${Date.now()}`,
          commissionId,
          stage: 'Revisions',
          stageNumber: 6,
          percentage: 80,
          note: `Revision #${updatedRevisionsUsed} requested: ${feedback ? feedback.substring(0, 80) + '...' : 'Client requested adjustments'}`,
          timestamp: todayStr,
          updatedBy: comm.clientName,
        },
      ]);

      // Message in chat
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          commissionId,
          senderId: comm.clientId,
          senderName: comm.clientName,
          senderRole: 'client',
          senderAvatar: comm.clientAvatar,
          message: `Requested Revision: "${feedback || 'Please see my requested changes in the review tab.'}"`,
          timestamp: `${todayStr} · Just now`,
          readStatus: false,
        },
      ]);

      // Notify Studio Director of revision request
      resolveAdminUserId().then(adminId => {
        dispatchNotification({
          recipientId: adminId,
          type: 'proof_revision',
          title: 'Proof Revision Requested',
          message: `${comm.clientName} requested revisions on "${comm.projectName}": "${(feedback || 'Client requested adjustments').slice(0, 50)}..."`,
          commissionId,
          linkTab: 'proofs',
        });
      });

      return { success: true };
    }
  };

  const uploadDesignForReview = (commissionId: string, previewImages: string[], reviewNotes: string) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            currentStage: 5,
            progress: 70,
            status: 'for_review',
            clientReviewData: {
              previewImages: previewImages.length ? previewImages : [
                'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&auto=format&fit=crop&q=80',
              ],
              reviewNotes: reviewNotes || 'Here is the latest design proof for your review!',
              submissionDate: todayStr,
              clientStatus: 'Pending Review',
            },
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    // Persist canonical for_review status to Supabase
    updateCommissionStatusInSupabase(commissionId, 'for_review').catch(err => {
      console.error('[AppContext] Failed to persist for_review to Supabase:', err);
    });

    // Timeline update
    setTimelineUpdates(prev => [
      ...prev,
      {
        id: `upd-${Date.now()}`,
        commissionId,
        stage: 'Client Review',
        stageNumber: 5,
        percentage: 70,
        note: `New design proof uploaded by ${studioProfile.designerName} for client review.`,
        timestamp: todayStr,
        updatedBy: studioProfile.designerName,
      },
    ]);

    // Chat notification message
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        commissionId,
        senderId: 'usr-admin-1',
        senderName: studioProfile.designerName,
        senderRole: 'admin',
        senderAvatar: studioProfile.avatar,
        message: `I've uploaded a new design draft in the Review tab: "${reviewNotes}"`,
        timestamp: `${todayStr} · Just now`,
        readStatus: false,
      },
    ]);
  };

  const deliverFinalFiles = (commissionId: string, finalPackage: FinalFilesPackage) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            currentStage: 8,
            progress: 100,
            status: 'completed',
            finalFiles: finalPackage,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

    // Persist canonical completed status to Supabase
    updateCommissionStatusInSupabase(commissionId, 'completed').catch(err => {
      console.error('[AppContext] Failed to persist completed to Supabase:', err);
    });

    // Timeline update
    setTimelineUpdates(prev => [
      ...prev,
      {
        id: `upd-${Date.now()}`,
        commissionId,
        stage: 'Final Delivery',
        stageNumber: 8,
        percentage: 100,
        note: `All final production deliverables packaged and delivered to client!`,
        timestamp: todayStr,
        updatedBy: studioProfile.designerName,
      },
    ]);

    // Notify client of final completion & deliverables
    const comm = commissions.find(c => c.id === commissionId);
    if (comm) {
      dispatchNotification({
        recipientId: comm.clientId,
        type: 'commission_completed',
        title: 'Commission Completed — Final Delivery',
        message: `All final production files for "${comm.projectName}" have been delivered! Download your deliverables from the Final Delivery tab.`,
        commissionId,
        linkTab: 'delivery',
      });
    }

    // Chat message
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        commissionId,
        senderId: 'usr-admin-1',
        senderName: studioProfile.designerName,
        senderRole: 'admin',
        senderAvatar: studioProfile.avatar,
        message: `🎉 All final production files have been compiled and delivered! You can download your complete package from the Deliverables tab. Thank you so much for an incredible collaboration!`,
        timestamp: `${todayStr} · Just now`,
        readStatus: false,
      },
    ]);
  };

  const fetchMessagesForCommission = useCallback(async (
    commissionId: string
  ): Promise<{ data: Message[] | null; error: string | null }> => {
    if (!commissionId?.trim()) return { data: [], error: null };

    const activeUser = currentUserRef.current;
    // If Supabase is configured and a user is signed in, load from Supabase database
    if (isSupabaseConfigured() && activeUser) {
      const { data, error } = await fetchCommissionMessages(commissionId, activeUser);
      if (error) {
        console.warn('[Supabase Messages] Fetch notice:', error);
        return { data: null, error };
      }
      if (data) {
        setMessages(prev => {
          const other = prev.filter(m => m.commissionId !== commissionId);
          return [...other, ...data];
        });
      }
      return { data, error: null };
    }

    // Local fallback for offline/development
    const local = messagesRef.current.filter(m => m.commissionId === commissionId);
    return { data: local, error: null };
  }, []);

  const sendMessage = async (
    commissionId: string,
    text: string,
    attachment?: MessageAttachment,
    attachmentFile?: File
  ): Promise<{ success: boolean; error?: string; message?: Message }> => {
    const cleanText = text?.trim() || '';
    if (!cleanText && !attachment && !attachmentFile) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    const sender = currentUser || INITIAL_USERS[1];
    if (!sender) {
      return { success: false, error: 'You must be signed in to send messages.' };
    }

    const effectiveBody = cleanText || (attachment?.name ? `Shared attachment: ${attachment.name}` : (attachmentFile?.name ? `Shared attachment: ${attachmentFile.name}` : 'Shared an attachment'));
    if (!effectiveBody) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    // Real Supabase persistence when user has an active session
    if (isSupabaseConfigured() && currentUser) {
      const { data, error } = await sendCommissionMessageToSupabase(
        commissionId,
        currentUser,
        effectiveBody,
        attachment,
        attachmentFile
      );
      if (error || !data) {
        console.error('[Supabase Messages] Send error:', error);
        return { success: false, error: error || 'Failed to deliver message to database.' };
      }

      const messageWithAttachment: Message = data;

      setMessages(prev => {
        // Prevent duplicate if realtime also delivered it
        if (prev.some(m => m.id === data.id)) {
          return prev.map(m => m.id === data.id ? { ...m, attachment: m.attachment || data.attachment || attachment } : m);
        }
        return [...prev, messageWithAttachment];
      });

      // Generate persistent in-app notification for recipient
      const comm = commissions.find(c => c.id === commissionId);
      if (comm) {
        const isSenderAdmin = sender.role === 'admin';
        resolveAdminUserId().then(adminId => {
          const recipientId = isSenderAdmin ? comm.clientId : adminId;
          const notifTitle = isSenderAdmin ? 'Message from DESTALION' : `New message from ${sender.name}`;
          const notifMsg = isSenderAdmin
            ? `${sender.name} sent you a message: "${effectiveBody.slice(0, 45)}..."`
            : `New message on "${comm.projectName}": "${effectiveBody.slice(0, 45)}..."`;

          dispatchNotification({
            recipientId,
            type: 'message',
            title: notifTitle,
            message: notifMsg,
            commissionId,
            linkTab: 'chat',
          });
        });
      }

      return { success: true, message: messageWithAttachment };
    }

    // Local fallback for offline/demo preview
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      commissionId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      message: effectiveBody,
      body: effectiveBody,
      attachment,
      timestamp: `${todayStr} · ${timeStr}`,
      readStatus: false,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);

    const comm = commissions.find(c => c.id === commissionId);
    if (comm) {
      const isSenderAdmin = sender.role === 'admin';
      const recipientId = isSenderAdmin ? comm.clientId : 'd4440c2e-aeea-4a8d-bcaf-7b844ec2be69';
      const notifTitle = isSenderAdmin ? 'Message from DESTALION' : `New message from ${sender.name}`;
      const notifMsg = isSenderAdmin 
        ? `${sender.name} sent you a message: "${effectiveBody.slice(0, 45)}..."` 
        : `New message from ${sender.name} on "${comm.projectName}"`;
      
      dispatchNotification({
        recipientId,
        type: 'message',
        title: notifTitle,
        message: notifMsg,
        commissionId,
        linkTab: 'chat',
      });
    }

    return { success: true, message: newMsg };
  };

  const markMessagesAsRead = useCallback((commissionId: string) => {
    setMessages(prev => {
      const hasUnread = prev.some(m => m.commissionId === commissionId && !m.readStatus);
      if (!hasUnread) return prev;
      return prev.map(m => (m.commissionId === commissionId && !m.readStatus ? { ...m, readStatus: true } : m));
    });
  }, []);

  const uploadProjectFile = (file: Omit<ProjectFile, 'id' | 'timestamp'>) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newFile: ProjectFile = {
      ...file,
      id: `file-${Date.now()}`,
      timestamp: todayStr,
    };
    setProjectFiles(prev => [newFile, ...prev]);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, readStatus: true, is_read: true } : n))
    );
    if (isSupabaseConfigured() && currentUser && !id.startsWith('local-') && !id.startsWith('notif-')) {
      await markNotificationReadInDb(id);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, readStatus: true, is_read: true }))
    );
    if (isSupabaseConfigured() && currentUser) {
      await markAllNotificationsReadInDb(currentUser.id);
    }
  };

  const dispatchNotification = async (params: {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    commissionId?: string;
    linkTab?: string;
  }) => {
    if (isSupabaseConfigured() && currentUser) {
      const { data, error } = await createNotificationInDb({
        recipientId: params.recipientId,
        type: params.type,
        title: params.title,
        message: params.message,
        commissionId: params.commissionId || null,
        linkTab: params.linkTab || null,
        callerUserId: currentUser.id,
      });
      if (data) {
        if (params.recipientId === currentUser.id) {
          setNotifications(prev => {
            if (prev.some(n => n.id === data.id)) return prev;
            return [data, ...prev];
          });
        }
        return;
      }
      if (error) {
        console.warn('[Supabase Notifications] Dispatch notice:', error);
      }
      // Do not pollute sender's local notification list with another recipient's failed notification
      if (params.recipientId !== currentUser.id) {
        return;
      }
    }

    // Local fallback for offline/demo preview (or self-notification fallback)
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: params.recipientId,
      user_id: params.recipientId,
      recipientId: params.recipientId,
      recipient_id: params.recipientId,
      commissionId: params.commissionId,
      commission_id: params.commissionId,
      title: params.title,
      message: params.message,
      type: params.type,
      readStatus: false,
      is_read: false,
      timestamp: 'Just now',
      created_at: new Date().toISOString(),
      linkTab: params.linkTab || 'overview',
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateUserProfile = async (
    userId: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; error?: string }> => {
    // Security: explicitly strip role, id, and email so clients cannot tamper with roles
    const { role: _ignoredRole, id: _ignoredId, email: _ignoredEmail, ...safeUpdates } = updates as any;

    if (isSupabaseConfigured() && currentUser?.id === userId) {
      try {
        const dbPayload: any = {};
        if (safeUpdates.name !== undefined) dbPayload.name = safeUpdates.name;
        if (safeUpdates.handle !== undefined) dbPayload.handle = safeUpdates.handle;
        if (safeUpdates.contactMethod !== undefined) dbPayload.contact_method = safeUpdates.contactMethod;
        if (safeUpdates.bio !== undefined) dbPayload.bio = safeUpdates.bio;
        if (safeUpdates.avatar !== undefined) dbPayload.avatar = safeUpdates.avatar;

        if (Object.keys(dbPayload).length > 0) {
          dbPayload.updated_at = new Date().toISOString();
          const { error: profileError } = await supabase
            .from('profiles')
            .update(dbPayload)
            .eq('id', userId);
          if (profileError) {
            return { success: false, error: profileError.message || 'Failed to update profile in database.' };
          }
        }

        // Store phone in Supabase auth user_metadata if updated
        if (safeUpdates.phone !== undefined) {
          try {
            await supabase.auth.updateUser({
              data: { phone: safeUpdates.phone }
            });
          } catch {
            // non-blocking
          }
        }
      } catch (err: any) {
        console.error('Error updating profile in Supabase:', err);
        return { success: false, error: err?.message || 'Unexpected error while saving profile.' };
      }
    }

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...safeUpdates } : u)));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, ...safeUpdates } : null));
    }
    // Also sync client fields on their commission records using sanitized fields only
    if (safeUpdates.name || safeUpdates.handle || safeUpdates.avatar || safeUpdates.contactMethod) {
      setCommissions(prev =>
        prev.map(c => {
          if (c.clientId === userId) {
            return {
              ...c,
              clientName: safeUpdates.name || c.clientName,
              clientHandle: safeUpdates.handle || c.clientHandle,
              clientAvatar: safeUpdates.avatar || c.clientAvatar,
              contactMethod: safeUpdates.contactMethod || c.contactMethod,
            };
          }
          return c;
        })
      );
    }

    return { success: true };
  };

  const updateStudioProfile = async (updates: Partial<StudioProfile>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can update studio profile settings.' };
    }

    const previousProfile = studioProfile;
    const updated = { ...studioProfile, ...updates };
    setStudioProfile(updated);

    if (isSupabaseConfigured()) {
      const { error } = await upsertStudioProfileInDb(updated);
      if (error) {
        setStudioProfile(previousProfile);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updateServicePrice = async (serviceId: string, newPrice: number): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can update service pricing.' };
    }

    const targetIndex = services.findIndex(s => s.id === serviceId);
    const targetService = targetIndex >= 0 ? services[targetIndex] : undefined;
    if (!targetService) return { success: false, error: 'Service not found.' };

    const previousServices = services;
    const updated = { ...targetService, startingPrice: newPrice };
    setServices(prev => prev.map(s => (s.id === serviceId ? updated : s)));

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(updated, targetIndex + 1);
      if (error) {
        setServices(previousServices);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const addServiceItem = async (service: ServiceItem): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can add studio services.' };
    }

    const previousServices = services;
    setServices(prev => [...prev, service]);

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(service, previousServices.length + 1);
      if (error) {
        setServices(previousServices);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updateServiceItem = async (serviceId: string, updates: Partial<ServiceItem>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can edit studio services.' };
    }

    const targetIndex = services.findIndex(s => s.id === serviceId);
    const target = targetIndex >= 0 ? services[targetIndex] : undefined;
    if (!target) return { success: false, error: 'Service not found.' };

    const previousServices = services;
    const updated = { ...target, ...updates };
    setServices(prev => prev.map(s => (s.id === serviceId ? updated : s)));

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(updated, targetIndex + 1);
      if (error) {
        setServices(previousServices);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deleteServiceItem = async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can delete studio services.' };
    }

    const previousServices = services;
    setServices(prev => prev.filter(s => s.id !== serviceId));

    if (isSupabaseConfigured()) {
      const { success, error } = await deleteServiceFromDb(serviceId);
      if (!success) {
        setServices(previousServices);
        return { success: false, error: error || 'Failed to delete service.' };
      }
    }
    return { success: true };
  };

  const addPortfolioProject = async (project: PortfolioProject): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can publish portfolio works.' };
    }

    const previousPortfolio = portfolio;
    setPortfolio(prev => [project, ...prev]);

    if (isSupabaseConfigured()) {
      const { error } = await upsertPortfolioProjectInDb(project, 0);
      if (error) {
        setPortfolio(previousPortfolio);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updatePortfolioProject = async (projectId: string, updates: Partial<PortfolioProject>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can edit portfolio works.' };
    }

    const target = portfolio.find(p => p.id === projectId);
    if (!target) return { success: false, error: 'Project not found.' };

    const previousPortfolio = portfolio;
    const previousSelected = selectedPortfolioProject;
    const updated = { ...target, ...updates };
    setPortfolio(prev => prev.map(p => (p.id === projectId ? updated : p)));
    if (selectedPortfolioProject?.id === projectId) {
      setSelectedPortfolioProject(updated);
    }

    if (isSupabaseConfigured()) {
      const { error } = await upsertPortfolioProjectInDb(updated);
      if (error) {
        setPortfolio(previousPortfolio);
        if (previousSelected?.id === projectId) {
          setSelectedPortfolioProject(previousSelected);
        }
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deletePortfolioProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can delete portfolio works.' };
    }

    const previousPortfolio = portfolio;
    const previousSelected = selectedPortfolioProject;
    setPortfolio(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      try {
        localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (selectedPortfolioProject?.id === projectId) {
      setSelectedPortfolioProject(null);
    }

    if (isSupabaseConfigured()) {
      const { success, error } = await deletePortfolioProjectFromDb(projectId);
      if (!success) {
        setPortfolio(previousPortfolio);
        if (previousSelected?.id === projectId) {
          setSelectedPortfolioProject(previousSelected);
        }
        try {
          localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(previousPortfolio));
        } catch {}
        return { success: false, error: error || 'Failed to delete project.' };
      }
    }
    return { success: true };
  };

  const addShopProduct = async (product: ShopProduct): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can add storefront editions.' };
    }
    setShopProducts(prev => [product, ...prev]);
    return { success: true };
  };

  const updateShopProduct = async (productId: string, updates: Partial<ShopProduct>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can edit storefront editions.' };
    }
    const target = shopProducts.find(p => p.id === productId);
    if (!target) return { success: false, error: 'Shop edition not found.' };

    const updated: ShopProduct = { ...target, ...updates };
    setShopProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
    if (selectedShopProduct?.id === productId) {
      setSelectedShopProduct(updated);
    }
    return { success: true };
  };

  const deleteShopProduct = async (productId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can delete storefront editions.' };
    }
    setShopProducts(prev => prev.filter(p => p.id !== productId));
    if (selectedShopProduct?.id === productId) {
      setSelectedShopProduct(null);
    }
    return { success: true };
  };

  const resetShopCatalog = async (): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only studio administrators can reset the storefront catalog.' };
    }
    setShopProducts(SHOP_PRODUCTS);
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_PRODUCTS, JSON.stringify(SHOP_PRODUCTS));
    } catch {}
    return { success: true };
  };

  const resetAllData = () => {
    try {
      localStorage.clear();
    } catch {}
    // Re-hydrate from Supabase if configured, otherwise reset to empty portfolio
    if (isSupabaseConfigured()) {
      fetchStudioProfileFromDb().then(({ data }) => data && setStudioProfile(data));
      fetchServicesFromDb().then(({ data }) => data && setServices(data));
      fetchPortfolioProjectsFromDb().then(({ data }) => {
        if (data) {
          const demoIds = new Set(['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5', 'proj-6']);
          setPortfolio(data.filter((p) => !demoIds.has(p.id)));
        } else {
          setPortfolio([]);
        }
      });
    } else {
      setStudioProfile(INITIAL_STUDIO_PROFILE);
      setServices(INITIAL_SERVICES);
      setPortfolio([]);
    }
    setShopProducts(SHOP_PRODUCTS);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setCommissions(INITIAL_COMMISSIONS);
    setMessages(INITIAL_MESSAGES);
    setTimelineUpdates(INITIAL_TIMELINE);
    setProjectFiles(INITIAL_FILES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSelectedCommissionId('');
    setActiveView('home');
  };

  const currentUserCommissions = currentUser?.role === 'admin' 
    ? commissions 
    : commissions.filter(c => c.clientId === currentUser?.id || (currentUser?.email && c.clientEmail?.toLowerCase() === currentUser.email.toLowerCase()));

  const isCommissionActive = (c: Commission) => {
    const s = (c.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled' && s !== 'rejected' && c.currentStage !== 8;
  };

  const activeCommission = commissions.find(c => c.id === selectedCommissionId) 
    || (currentUser?.role === 'client' 
      ? (currentUserCommissions.find(isCommissionActive) || currentUserCommissions[0]) 
      : (commissions.find(isCommissionActive) || commissions[0]));

  const setActiveCommissionId = (id: string) => {
    setSelectedCommissionId(id);
  };

  const openCaseStudy = (project: PortfolioProject) => {
    setSelectedPortfolioProject(project);
    setActiveView('case-study');
    if (typeof window !== 'undefined') {
      const targetUrl = buildCaseStudyShareUrl(project.id);
      if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
    }
  };

  const closeCaseStudy = () => {
    setSelectedPortfolioProject(null);
    setActiveView('portfolio');
    if (typeof window !== 'undefined') {
      if (window.location.pathname.toLowerCase().startsWith('/case-study/')) {
        window.history.replaceState(null, '', '/');
      } else if (window.location.hash.startsWith('#case-study-')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const toggleProjectLikeInContext = async (
    projectId: string
  ): Promise<{ liked: boolean; likesCount: number; error: string | null }> => {
    const res = await toggleProjectLike(projectId);
    if (!res.error) {
      setPortfolio((prev) => {
        const next = prev.map((p) => {
          if (p.id === projectId) {
            return { ...p, likesCount: res.likesCount, likes_count: res.likesCount };
          }
          return p;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedPortfolioProject((prev) => {
        if (prev && prev.id === projectId) {
          return { ...prev, likesCount: res.likesCount, likes_count: res.likesCount };
        }
        return prev;
      });
    }
    return res;
  };

  const recordProjectViewInContext = async (
    projectId: string
  ): Promise<{ viewed: boolean; viewsCount: number | null; error: string | null }> => {
    if (!currentUser?.id) {
      return { viewed: false, viewsCount: null, error: null };
    }
    const res = await recordPortfolioViewDebounced(projectId, currentUser.id);
    if (!res.error && res.viewed && res.viewsCount !== null) {
      const safeViews = normalizeNumericStat(res.viewsCount, 0);
      setPortfolio((prev) => {
        const next = prev.map((p) => {
          if (p.id === projectId) {
            return { ...p, viewsCount: safeViews, views_count: safeViews };
          }
          return p;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedPortfolioProject((prev) => {
        if (prev && prev.id === projectId) {
          return { ...prev, viewsCount: safeViews, views_count: safeViews };
        }
        return prev;
      });
    }
    return res;
  };

  // Keep document title & OpenGraph social metadata synchronized with active case study
  useEffect(() => {
    if (activeView === 'case-study' && selectedPortfolioProject) {
      syncDocumentSeoForProject(selectedPortfolioProject);
    } else {
      syncDocumentSeoForProject(null);
    }
  }, [activeView, selectedPortfolioProject]);

  // Deep-linking: Support /case-study/{projectId}, ?case-study={projectId}, legacy #case-study-{projectId}, & browser back/forward
  useEffect(() => {
    const handleHashNavigation = () => {
      if (typeof window === 'undefined') return;
      const projId = extractCaseStudyIdFromLocation(window.location);
      if (projId) {
        const found = portfolio.find((p) => p.id === projId);
        if (found) {
          setSelectedPortfolioProject(found);
          setActiveView('case-study');
        } else {
          fetchPortfolioProjectsFromDb().then(({ data }) => {
            if (data) {
              const fresh = data.find((p) => p.id === projId);
              if (fresh) {
                setSelectedPortfolioProject(fresh);
                setActiveView('case-study');
                return;
              }
            }
            setActiveView('home');
            window.history.replaceState(null, '', '/');
          });
        }
      } else if (activeView === 'case-study' && !projId) {
        setActiveView('portfolio');
        setSelectedPortfolioProject(null);
      }
    };

    window.addEventListener('hashchange', handleHashNavigation);
    window.addEventListener('popstate', handleHashNavigation);
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
      window.removeEventListener('popstate', handleHashNavigation);
    };
  }, [portfolio, activeView]);

  const uploadDesignReviewDraft = uploadDesignForReview;

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        activeView,
        setActiveView,
        selectedCommissionId,
        setSelectedCommissionId,
        setActiveCommissionId,
        selectedPortfolioProject,
        setSelectedPortfolioProject,
        openCaseStudy,
        closeCaseStudy,
        toggleProjectLikeInContext,
        recordProjectViewInContext,
        preselectedService,
        setPreselectedService,
        selectedShopProduct,
        setSelectedShopProduct,
        selectedShopCategory,
        setSelectedShopCategory,
        currentUser,
        setCurrentUser,
        authLoading,
        databaseError,
        clearDatabaseError,
        refreshCurrentUserProfile,
        users,
        usersLoading,
        usersLoadError,
        refreshUsers,
        loginUser,
        signUpUser,
        emailVerificationStatus,
        clearEmailVerificationStatus,
        resendVerificationEmail,
        registerClient,
        updateUserProfile,
        logout,
        studioProfile,
        services,
        portfolio,
        shopProducts,
        commissions,
        currentUserCommissions,
        activeCommission,
        messages,
        timelineUpdates,
        projectFiles,
        notifications,
        liveAlert,
        dismissLiveAlert,
        submitCommission,
        submitCommissionRequest,
        refreshCommissions,
        updateCommissionStage,
        updateCommissionStatus,
        updateCommissionPriority,
        updateCommissionDetails,
        updatePaymentStatus,
        acceptCommission,
        declineCommission,
        deleteCommission,
        submitClientReviewAction,
        approveCommissionWithProof,
        deliverFinalFiles,
        uploadDesignForReview,
        uploadDesignReviewDraft,
        sendMessage,
        fetchMessagesForCommission,
        markMessagesAsRead,
        uploadProjectFile,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        fetchNotifications,
        dispatchNotification,
        activeDashboardTab,
        setActiveDashboardTab,
        updateStudioProfile,
        updateServicePrice,
        addServiceItem,
        updateServiceItem,
        deleteServiceItem,
        addPortfolioProject,
        updatePortfolioProject,
        deletePortfolioProject,
        addShopProduct,
        updateShopProduct,
        deleteShopProduct,
        resetShopCatalog,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
