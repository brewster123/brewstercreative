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
  INITIAL_PORTFOLIO,
  INITIAL_USERS,
  INITIAL_COMMISSIONS,
  INITIAL_MESSAGES,
  INITIAL_TIMELINE,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase';
import {
  insertCommissionToSupabase,
  fetchCommissionsFromSupabase,
  updateCommissionStatusInSupabase,
  updateCommissionPriorityInSupabase,
  updateCommissionPaymentInSupabase,
  requestCommissionRevisionInSupabase,
  subscribeToCommissionsChange,
  mapDbCommissionToAppCommission,
  getStageAndProgressFromStatus,
  getLifecycleFromStage,
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

export type AppView = 
  | 'home'
  | 'portfolio'
  | 'services'
  | 'commission-form'
  | 'client-dashboard'
  | 'admin-dashboard'
  | 'auth'
  | 'shop'
  | 'product-detail';

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
  loginUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signUpUser: (name: string, email: string, password?: string, handle?: string, contactMethod?: string, phone?: string) => Promise<{ success: boolean; error?: string; user?: User; confirmationRequired?: boolean }>;
  emailVerificationStatus: 'success' | 'expired' | 'error' | null;
  clearEmailVerificationStatus: () => void;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  registerClient: (name: string, email: string, handle?: string, contactMethod?: string, phone?: string) => User;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  
  // Data entities
  studioProfile: StudioProfile;
  services: ServiceItem[];
  portfolio: PortfolioProject[];
  commissions: Commission[];
  currentUserCommissions: Commission[];
  activeCommission?: Commission;
  messages: Message[];
  timelineUpdates: ProgressUpdate[];
  projectFiles: ProjectFile[];
  notifications: AppNotification[];
  
  // Commission Actions
  submitCommission: (formData: any) => string;
  submitCommissionRequest: (data: {
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
  }) => Promise<{ success: boolean; commission?: Commission; error?: string }>;
  refreshCommissions: () => Promise<void>;
  updateCommissionStage: (commissionId: string, newStageNumber: number, stageName?: string, stageNote?: string) => Promise<{ success: boolean; error?: string }>;
  updateCommissionStatus: (commissionId: string, status: CommissionStatus) => Promise<{ success: boolean; error?: string }>;
  updateCommissionPriority: (commissionId: string, priority: CommissionPriority) => Promise<{ success: boolean; error?: string }>;
  updateCommissionDetails: (commissionId: string, updates: Partial<Commission>) => void;
  updatePaymentStatus: (commissionId: string, status: 'Unpaid' | 'Partial' | 'Paid') => Promise<{ success: boolean; error?: string }> | void;
  acceptCommission: (commissionId: string) => Promise<{ success: boolean; error?: string }>;
  declineCommission: (commissionId: string) => Promise<{ success: boolean; error?: string }>;
  submitClientReviewAction: (commissionId: string, action: 'approve' | 'revision', feedback?: string) => Promise<{ success: boolean; error?: string }> | void;
  deliverFinalFiles: (commissionId: string, finalPackage: FinalFilesPackage) => void;
  uploadDesignForReview: (commissionId: string, previewImages: string[], reviewNotes: string) => void;
  uploadDesignReviewDraft: (commissionId: string, previewImages: string[], reviewNotes: string) => void;
  
  // Messaging
  sendMessage: (commissionId: string, text: string, attachment?: MessageAttachment) => Promise<{ success: boolean; error?: string; message?: Message }>;
  fetchMessagesForCommission: (commissionId: string) => Promise<{ data: Message[] | null; error: string | null }>;
  markMessagesAsRead: (commissionId: string) => void;
  
  // Files
  uploadProjectFile: (file: Omit<ProjectFile, 'id' | 'timestamp'>) => void;
  
  // Notifications
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
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
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
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {}
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>('');
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<PortfolioProject | null>(null);
  const [preselectedService, setPreselectedService] = useState<string | null>(null);
  const [selectedShopProduct, setSelectedShopProduct] = useState<ShopProduct | null>(null);
  const [selectedShopCategory, setSelectedShopCategory] = useState<ShopCategoryName>('All');

  // Initialize state with LocalStorage fallback
  const [studioProfile, setStudioProfile] = useState<StudioProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.studioName === 'Cabando Studio' || !parsed.studioName) {
        parsed.studioName = 'Brewster Creative';
      }
      if (parsed.email?.toLowerCase().includes('cabandobrewster') || !parsed.email) {
        parsed.email = 'brewstercreates@gmail.com';
      }
      return parsed;
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
        return parsed.map((p) => {
          const init = INITIAL_PORTFOLIO.find((ip) => ip.id === p.id);
          if (init?.relatedShopProductIds && !p.relatedShopProductIds) {
            return { ...p, relatedShopProductIds: init.relatedShopProductIds };
          }
          return p;
        });
      } catch (e) {
        return INITIAL_PORTFOLIO;
      }
    }
    return INITIAL_PORTFOLIO;
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
  const [activeDashboardTab, setActiveDashboardTab] = useState<string>('overview');

  // Supabase Notification Persistence & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    const { data, error } = await fetchUserNotifications(currentUser.id);
    if (!error && data) {
      setNotifications(data);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) {
      // Clear notifications if logged out
      if (!currentUser) setNotifications([]);
      return;
    }

    let isMounted = true;

    fetchUserNotifications(currentUser.id).then(({ data, error }) => {
      if (!error && data && isMounted) {
        setNotifications(data);
      }
    });

    const unsubscribe = subscribeToUserNotifications(currentUser.id, (newNotif) => {
      if (!isMounted) return;
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser?.id]);

  // Phase 5D: Mount query to hydrate Studio Profile, Services, and Portfolio from Supabase
  useEffect(() => {
    let isMounted = true;
    if (!isSupabaseConfigured()) return;

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
      if (!error && data && data.length > 0 && isMounted) {
        setPortfolio(data);
      }
    });

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
        fetchPortfolioProjectsFromDb().then(({ data }) => {
          if (data && isMounted) setPortfolio(data);
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
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // When an admin is logged in, load registered clients from public.profiles table
  useEffect(() => {
    if (currentUser?.role === 'admin' && isSupabaseConfigured()) {
      supabase
        .from('profiles')
        .select('id, name, email, role, avatar, handle, contact_method, bio, created_at')
        .then(({ data, error }) => {
          if (!error && data) {
            const dbUsers: User[] = data.map(p => ({
              id: p.id,
              name: p.name || p.email?.split('@')[0] || 'Client',
              email: p.email || '',
              role: p.role === 'admin' ? 'admin' : 'client',
              avatar: p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
              handle: p.handle,
              contactMethod: p.contact_method,
              phone: (p as any).phone || undefined,
              bio: p.bio,
              createdAt: p.created_at,
            }));
            setUsers(dbUsers);
          }
        });
    }
  }, [currentUser?.role]);

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
      } else if (error) {
        console.warn('[Supabase Commissions] Notice fetching commissions:', error);
      }
    } catch (err) {
      console.error('[Supabase Commissions] Error in refreshCommissions:', err);
    }
  };

  useEffect(() => {
    if (currentUser && isSupabaseConfigured()) {
      refreshCommissions();

      // Phase 5E-1: Centralized Realtime subscription for public.commissions
      const unsubscribe = subscribeToCommissionsChange({
        onInsert: (row) => {
          // If admin, or if the inserted commission belongs to current authenticated client
          if (currentUser.role === 'admin' || row.client_id === currentUser.id) {
            const mapped = mapDbCommissionToAppCommission(row, currentUser);
            setCommissions(prev => {
              if (prev.some(c => c.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          }
        },
        onUpdate: (row) => {
          if (currentUser.role === 'admin' || row.client_id === currentUser.id) {
            setCommissions(prev => {
              const existing = prev.find(c => c.id === row.id);
              const mapped = mapDbCommissionToAppCommission(row, existing ? {
                id: existing.clientId,
                name: existing.clientName,
                email: existing.clientEmail,
                avatar: existing.clientAvatar,
                handle: existing.clientHandle,
                contactMethod: existing.contactMethod,
                role: 'client',
              } : currentUser);

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
  }, [currentUser?.id, currentUser?.role]);

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
        const clientComm = commissions.find(c => c.clientId === profile.id || c.clientEmail.toLowerCase() === cleanEmail);
        if (clientComm) setSelectedCommissionId(clientComm.id);
        setActiveView('client-dashboard');
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

      const clientComm = commissions.find(c => c.clientEmail.toLowerCase() === cleanEmail);
      if (clientComm) setSelectedCommissionId(clientComm.id);
      setActiveView('client-dashboard');

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
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out from Supabase:', err);
      }
    }
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

    resolveAdminUserId().then(adminId => {
      dispatchNotification({
        recipientId: adminId,
        type: 'commission_update',
        title: 'New Commission Intake',
        message: `New commission requested: "${newCommission.projectName}" by ${currentUser.name}.`,
        commissionId: newCommission.id,
        linkTab: 'overview',
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
    setCommissions(prev =>
      prev.map(c => (c.id === commissionId ? { ...c, ...updates, updatedAt: 'Just now' } : c))
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

  const submitClientReviewAction = async (
    commissionId: string, 
    action: 'approve' | 'revision', 
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const comm = commissions.find(c => c.id === commissionId);
    if (!comm) return { success: false, error: 'Commission not found.' };

    if (action === 'approve') {
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

      // Persist canonical final_approval status to Supabase
      updateCommissionStatusInSupabase(commissionId, 'final_approval').catch(err => {
        console.error('[AppContext] Failed to persist final_approval to Supabase:', err);
      });

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
            totalPaid: true,
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

  const fetchMessagesForCommission = async (
    commissionId: string
  ): Promise<{ data: Message[] | null; error: string | null }> => {
    if (!commissionId?.trim()) return { data: [], error: null };

    // If Supabase is configured and a user is signed in, load from Supabase database
    if (isSupabaseConfigured() && currentUser) {
      const { data, error } = await fetchCommissionMessages(commissionId, currentUser);
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
    const local = messages.filter(m => m.commissionId === commissionId);
    return { data: local, error: null };
  };

  const sendMessage = async (
    commissionId: string,
    text: string,
    attachment?: MessageAttachment
  ): Promise<{ success: boolean; error?: string; message?: Message }> => {
    const cleanText = text.trim();
    if (!cleanText && !attachment) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    const sender = currentUser || INITIAL_USERS[1];
    if (!sender) {
      return { success: false, error: 'You must be signed in to send messages.' };
    }

    // Real Supabase persistence when user has an active session
    if (isSupabaseConfigured() && currentUser) {
      const { data, error } = await sendCommissionMessageToSupabase(commissionId, currentUser, cleanText);
      if (error || !data) {
        console.error('[Supabase Messages] Send error:', error);
        return { success: false, error: error || 'Failed to deliver message to database.' };
      }

      setMessages(prev => {
        // Prevent duplicate if realtime also delivered it
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });

      // Generate persistent in-app notification for recipient
      const comm = commissions.find(c => c.id === commissionId);
      if (comm) {
        const isSenderAdmin = sender.role === 'admin';
        resolveAdminUserId().then(adminId => {
          const recipientId = isSenderAdmin ? comm.clientId : adminId;
          const notifTitle = isSenderAdmin ? 'Message from Brewster Creative' : `New message from ${sender.name}`;
          const notifMsg = isSenderAdmin
            ? `${sender.name} sent you a message: "${cleanText.slice(0, 45)}..."`
            : `New message on "${comm.projectName}": "${cleanText.slice(0, 45)}..."`;

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

      return { success: true, message: data };
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
      message: cleanText,
      body: cleanText,
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
      const notifTitle = isSenderAdmin ? 'Message from Brewster Creative' : `New message from ${sender.name}`;
      const notifMsg = isSenderAdmin 
        ? `${sender.name} sent you a message: "${cleanText.slice(0, 45)}..."` 
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

  const markMessagesAsRead = (commissionId: string) => {
    setMessages(prev =>
      prev.map(m => (m.commissionId === commissionId ? { ...m, readStatus: true } : m))
    );
  };

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
    if (isSupabaseConfigured() && currentUser) {
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
    }

    // Local fallback for offline/demo preview
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

  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
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
        dbPayload.updated_at = new Date().toISOString();

        if (Object.keys(dbPayload).length > 0) {
          await supabase.from('profiles').update(dbPayload).eq('id', userId);
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
      } catch (err) {
        console.error('Error updating profile in Supabase:', err);
      }
    }

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...safeUpdates } : u)));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, ...safeUpdates } : null));
    }
    // Also sync client fields on their commission records
    if (updates.name || updates.email || updates.handle || updates.avatar || updates.contactMethod) {
      setCommissions(prev =>
        prev.map(c => {
          if (c.clientId === userId) {
            return {
              ...c,
              clientName: updates.name || c.clientName,
              clientEmail: updates.email || c.clientEmail,
              clientHandle: updates.handle || c.clientHandle,
              clientAvatar: updates.avatar || c.clientAvatar,
              contactMethod: updates.contactMethod || c.contactMethod,
            };
          }
          return c;
        })
      );
    }
  };

  const updateStudioProfile = async (updates: Partial<StudioProfile>): Promise<{ success: boolean; error?: string }> => {
    const updated = { ...studioProfile, ...updates };
    setStudioProfile(updated);

    if (isSupabaseConfigured()) {
      const { error } = await upsertStudioProfileInDb(updated);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updateServicePrice = async (serviceId: string, newPrice: number): Promise<{ success: boolean; error?: string }> => {
    const targetService = services.find(s => s.id === serviceId);
    if (!targetService) return { success: false, error: 'Service not found.' };

    const updated = { ...targetService, startingPrice: newPrice };
    setServices(prev => prev.map(s => (s.id === serviceId ? updated : s)));

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(updated);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const addServiceItem = async (service: ServiceItem): Promise<{ success: boolean; error?: string }> => {
    setServices(prev => [...prev, service]);

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(service, services.length + 1);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updateServiceItem = async (serviceId: string, updates: Partial<ServiceItem>): Promise<{ success: boolean; error?: string }> => {
    const target = services.find(s => s.id === serviceId);
    if (!target) return { success: false, error: 'Service not found.' };

    const updated = { ...target, ...updates };
    setServices(prev => prev.map(s => (s.id === serviceId ? updated : s)));

    if (isSupabaseConfigured()) {
      const { error } = await upsertServiceInDb(updated);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deleteServiceItem = async (serviceId: string): Promise<{ success: boolean; error?: string }> => {
    setServices(prev => prev.filter(s => s.id !== serviceId));

    if (isSupabaseConfigured()) {
      const { success, error } = await deleteServiceFromDb(serviceId);
      if (!success) {
        return { success: false, error: error || 'Failed to delete service.' };
      }
    }
    return { success: true };
  };

  const addPortfolioProject = async (project: PortfolioProject): Promise<{ success: boolean; error?: string }> => {
    setPortfolio(prev => [project, ...prev]);

    if (isSupabaseConfigured()) {
      const { error } = await upsertPortfolioProjectInDb(project, 0);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const updatePortfolioProject = async (projectId: string, updates: Partial<PortfolioProject>): Promise<{ success: boolean; error?: string }> => {
    const target = portfolio.find(p => p.id === projectId);
    if (!target) return { success: false, error: 'Project not found.' };

    const updated = { ...target, ...updates };
    setPortfolio(prev => prev.map(p => (p.id === projectId ? updated : p)));

    if (isSupabaseConfigured()) {
      const { error } = await upsertPortfolioProjectInDb(updated);
      if (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deletePortfolioProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    setPortfolio(prev => prev.filter(p => p.id !== projectId));

    if (isSupabaseConfigured()) {
      const { success, error } = await deletePortfolioProjectFromDb(projectId);
      if (!success) {
        return { success: false, error: error || 'Failed to delete project.' };
      }
    }
    return { success: true };
  };

  const resetAllData = () => {
    localStorage.clear();
    // Re-hydrate from Supabase if configured, otherwise reset to fallback
    if (isSupabaseConfigured()) {
      fetchStudioProfileFromDb().then(({ data }) => data && setStudioProfile(data));
      fetchServicesFromDb().then(({ data }) => data && setServices(data));
      fetchPortfolioProjectsFromDb().then(({ data }) => data && setPortfolio(data));
    } else {
      setStudioProfile(INITIAL_STUDIO_PROFILE);
      setServices(INITIAL_SERVICES);
      setPortfolio(INITIAL_PORTFOLIO);
    }
    setUsers([]);
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
        commissions,
        currentUserCommissions,
        activeCommission,
        messages,
        timelineUpdates,
        projectFiles,
        notifications,
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
        submitClientReviewAction,
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
