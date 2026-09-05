import React, { createContext, useContext, useState, useEffect } from 'react';
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
  COMMISSION_STAGES,
  FinalFilesPackage,
  MessageAttachment,
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
} from '../data/commissionsData';

export type AppView = 
  | 'home'
  | 'portfolio'
  | 'services'
  | 'commission-form'
  | 'client-dashboard'
  | 'admin-dashboard'
  | 'auth';

interface AppContextType {
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
    additionalNotes?: string;
  }) => Promise<{ success: boolean; commission?: Commission; error?: string }>;
  refreshCommissions: () => Promise<void>;
  updateCommissionStage: (commissionId: string, newStageNumber: number, stageName?: string, stageNote?: string) => void;
  updateCommissionStatus: (commissionId: string, status: CommissionStatus) => void;
  updateCommissionDetails: (commissionId: string, updates: Partial<Commission>) => void;
  updatePaymentStatus: (commissionId: string, status: 'Unpaid' | 'Partial' | 'Paid') => void;
  acceptCommission: (commissionId: string) => void;
  declineCommission: (commissionId: string) => void;
  submitClientReviewAction: (commissionId: string, action: 'approve' | 'revision', feedback?: string) => void;
  deliverFinalFiles: (commissionId: string, finalPackage: FinalFilesPackage) => void;
  uploadDesignForReview: (commissionId: string, previewImages: string[], reviewNotes: string) => void;
  uploadDesignReviewDraft: (commissionId: string, previewImages: string[], reviewNotes: string) => void;
  
  // Messaging
  sendMessage: (commissionId: string, text: string, attachment?: MessageAttachment) => void;
  markMessagesAsRead: (commissionId: string) => void;
  
  // Files
  uploadProjectFile: (file: Omit<ProjectFile, 'id' | 'timestamp'>) => void;
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Studio & Settings
  updateStudioProfile: (updates: Partial<StudioProfile>) => void;
  updateServicePrice: (serviceId: string, newPrice: number) => void;
  addServiceItem: (service: ServiceItem) => void;
  updateServiceItem: (serviceId: string, updates: Partial<ServiceItem>) => void;
  deleteServiceItem: (serviceId: string) => void;
  addPortfolioProject: (project: PortfolioProject) => void;
  updatePortfolioProject: (projectId: string, updates: Partial<PortfolioProject>) => void;
  deletePortfolioProject: (projectId: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
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
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>('comm-sample-alex');
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<PortfolioProject | null>(null);
  const [preselectedService, setPreselectedService] = useState<string | null>(null);

  // Initialize state with LocalStorage fallback
  const [studioProfile, setStudioProfile] = useState<StudioProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.studioName === 'Cabando Studio' || !parsed.studioName) {
        parsed.studioName = 'Brewster Creative';
      }
      if (parsed.email === 'cabandobrewster@gmail.com') {
        parsed.email = 'brewstercreates@gmail.com';
      }
      return parsed;
    }
    return INITIAL_STUDIO_PROFILE;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  const clearDatabaseError = () => setDatabaseError(null);

  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_COMMISSIONS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [timelineUpdates, setTimelineUpdates] = useState<ProgressUpdate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILES);
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Sync to LocalStorage
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Securely query profile from Supabase profiles table using the authenticated user's UUID
  // Admin role is strictly derived from the database 'public.profiles.role' column
  const fetchUserProfileFromDb = async (
    userId: string, 
    fallbackEmail: string, 
    metadataPhone?: string
  ): Promise<{ profile: User | null; error?: string; rawError?: any }> => {
    // 1. Log authenticated user's ID and email
    console.log('[Supabase Auth] Fetching profile for authenticated user:', {
      userId,
      email: fallbackEmail,
    });

    // 2. Log the Supabase URL being used (DO NOT log or expose the API key)
    console.log('[Supabase Config] Supabase project URL being used:', supabaseUrl);

    try {
      const { data, error, status, statusText } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar, handle, contact_method, bio')
        .eq('id', userId)
        .maybeSingle();

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
        const formattedErr = `[Code: ${error.code || 'UNKNOWN'}] ${error.message}${error.details ? ` (Details: ${error.details})` : ''}${error.hint ? ` (Hint: ${error.hint})` : ''}`;
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
        email: data.email || fallbackEmail,
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
      console.error('[Supabase Auth] Unexpected exception in fetchUserProfileFromDb:', err);
      return {
        profile: null,
        error: err?.message || 'Unexpected exception during profile query.',
        rawError: err,
      };
    }
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
      if (success && data && data.length > 0) {
        setCommissions(prev => {
          const dbIds = new Set(data.map(d => d.id));
          const retained = prev.filter(p => !dbIds.has(p.id));
          return [...data, ...retained];
        });
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

    // Notification for client
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      commissionId: newCommission.id,
      message: `Your commission request for "${newCommission.projectName}" was successfully submitted!`,
      type: 'status',
      readStatus: false,
      timestamp: todayStr,
      linkTab: 'overview',
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, commission: newCommission };
  };

  const updateCommissionStage = (commissionId: string, newStageNumber: number, stageNameOrNote?: string, optionalNote?: string) => {
    const stageInfo = COMMISSION_STAGES.find(s => s.number === newStageNumber) || COMMISSION_STAGES[0];
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const noteText = optionalNote || stageNameOrNote || `Project moved to Stage ${newStageNumber}: ${stageInfo.name}.`;

    let calculatedStatus: CommissionStatus = 'In Progress';
    if (newStageNumber === 1) calculatedStatus = 'Pending';
    else if (newStageNumber === 5) calculatedStatus = 'Client Review';
    else if (newStageNumber === 6) calculatedStatus = 'Revision Requested';
    else if (newStageNumber === 7) calculatedStatus = 'Final Approval';
    else if (newStageNumber === 8) calculatedStatus = 'Completed';

    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          return {
            ...c,
            currentStage: newStageNumber,
            progress: stageInfo.defaultPercentage,
            status: calculatedStatus,
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
      stageNumber: newStageNumber,
      percentage: stageInfo.defaultPercentage,
      note: noteText,
      timestamp: todayStr,
      updatedBy: studioProfile.designerName,
    };
    setTimelineUpdates(prev => [...prev, newTimelineUpdate]);

    // Notify client
    const targetComm = commissions.find(c => c.id === commissionId);
    if (targetComm) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: targetComm.clientId,
        commissionId,
        message: `Your project "${targetComm.projectName}" has moved to ${stageInfo.name}.`,
        type: newStageNumber === 5 ? 'review' : newStageNumber === 8 ? 'delivery' : 'status',
        readStatus: false,
        timestamp: todayStr,
        linkTab: newStageNumber === 5 ? 'review' : newStageNumber === 8 ? 'delivery' : 'timeline',
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const updateCommissionStatus = (commissionId: string, status: CommissionStatus) => {
    setCommissions(prev =>
      prev.map(c => (c.id === commissionId ? { ...c, status, updatedAt: 'Just now' } : c))
    );
  };

  const updateCommissionDetails = (commissionId: string, updates: Partial<Commission>) => {
    setCommissions(prev =>
      prev.map(c => (c.id === commissionId ? { ...c, ...updates, updatedAt: 'Just now' } : c))
    );
  };

  const updatePaymentStatus = (commissionId: string, status: 'Unpaid' | 'Partial' | 'Paid') => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    setCommissions(prev =>
      prev.map(c => {
        if (c.id === commissionId) {
          const depositPaid = status === 'Partial' || status === 'Paid';
          const totalPaid = status === 'Paid';
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
  };

  const acceptCommission = (commissionId: string) => {
    updateCommissionStage(commissionId, 2, 'Project Discussion', 'Commission brief accepted by designer. Moving to project scope and discussion.');
  };

  const declineCommission = (commissionId: string) => {
    setCommissions(prev =>
      prev.map(c => (c.id === commissionId ? { ...c, status: 'Rejected' as CommissionStatus } : c))
    );
  };

  const submitClientReviewAction = (commissionId: string, action: 'approve' | 'revision', feedback?: string) => {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const comm = commissions.find(c => c.id === commissionId);
    if (!comm) return;

    if (action === 'approve') {
      // Move to Final Approval (Stage 7) or Final Delivery
      setCommissions(prev =>
        prev.map(c => {
          if (c.id === commissionId) {
            return {
              ...c,
              currentStage: 7,
              progress: 95,
              status: 'Final Approval',
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
    } else {
      // Request Revision -> Move to Stage 6 (Revisions)
      setCommissions(prev =>
        prev.map(c => {
          if (c.id === commissionId) {
            return {
              ...c,
              currentStage: 6,
              progress: 80,
              status: 'Revision Requested',
              revisionsUsed: (c.revisionsUsed || 0) + 1,
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
          note: `Revision #${(comm.revisionsUsed || 0) + 1} requested: ${feedback ? feedback.substring(0, 80) + '...' : 'Client requested adjustments'}`,
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
            status: 'Client Review',
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
            status: 'Completed',
            totalPaid: true,
            finalFiles: finalPackage,
            updatedAt: todayStr,
          };
        }
        return c;
      })
    );

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

  const sendMessage = (commissionId: string, text: string, attachment?: MessageAttachment) => {
    if (!text.trim() && !attachment) return;
    const sender = currentUser || INITIAL_USERS[1];
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      commissionId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      message: text,
      attachment,
      timestamp: `${todayStr} · ${timeStr}`,
      readStatus: false,
    };

    setMessages(prev => [...prev, newMsg]);

    // Generate responsive notification
    const comm = commissions.find(c => c.id === commissionId);
    if (comm) {
      const recipientId = sender.role === 'admin' ? comm.clientId : 'usr-admin-1';
      const notifMsg = sender.role === 'admin' 
        ? `${sender.name} sent you a message: "${text.slice(0, 45)}..."` 
        : `New message from ${sender.name} on "${comm.projectName}"`;
      
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          userId: recipientId,
          commissionId,
          message: notifMsg,
          type: 'message',
          readStatus: false,
          timestamp: 'Just now',
          linkTab: 'chat',
        },
        ...prev,
      ]);
    }
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

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, readStatus: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
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

  const updateStudioProfile = (updates: Partial<StudioProfile>) => {
    setStudioProfile(prev => ({ ...prev, ...updates }));
  };

  const updateServicePrice = (serviceId: string, newPrice: number) => {
    setServices(prev =>
      prev.map(s => (s.id === serviceId ? { ...s, startingPrice: newPrice } : s))
    );
  };

  const addServiceItem = (service: ServiceItem) => {
    setServices(prev => [...prev, service]);
  };

  const updateServiceItem = (serviceId: string, updates: Partial<ServiceItem>) => {
    setServices(prev => prev.map(s => (s.id === serviceId ? { ...s, ...updates } : s)));
  };

  const deleteServiceItem = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const addPortfolioProject = (project: PortfolioProject) => {
    setPortfolio(prev => [project, ...prev]);
  };

  const updatePortfolioProject = (projectId: string, updates: Partial<PortfolioProject>) => {
    setPortfolio(prev => prev.map(p => (p.id === projectId ? { ...p, ...updates } : p)));
  };

  const deletePortfolioProject = (projectId: string) => {
    setPortfolio(prev => prev.filter(p => p.id !== projectId));
  };

  const resetAllData = () => {
    localStorage.clear();
    setStudioProfile(INITIAL_STUDIO_PROFILE);
    setServices(INITIAL_SERVICES);
    setPortfolio(INITIAL_PORTFOLIO);
    setUsers([]);
    setCurrentUser(null);
    setCommissions(INITIAL_COMMISSIONS);
    setMessages(INITIAL_MESSAGES);
    setTimelineUpdates(INITIAL_TIMELINE);
    setProjectFiles(INITIAL_FILES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSelectedCommissionId('comm-sample-alex');
    setActiveView('home');
  };

  const currentUserCommissions = currentUser?.role === 'admin' 
    ? commissions 
    : commissions.filter(c => c.clientId === currentUser?.id);

  const activeCommission = commissions.find(c => c.id === selectedCommissionId) 
    || (currentUser?.role === 'client' ? commissions.find(c => c.clientId === currentUser?.id) : commissions[0]) 
    || commissions[0];

  const setActiveCommissionId = (id: string) => {
    setSelectedCommissionId(id);
  };

  const uploadDesignReviewDraft = uploadDesignForReview;

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedCommissionId,
        setSelectedCommissionId,
        setActiveCommissionId,
        selectedPortfolioProject,
        setSelectedPortfolioProject,
        preselectedService,
        setPreselectedService,
        currentUser,
        setCurrentUser,
        authLoading,
        databaseError,
        clearDatabaseError,
        refreshCurrentUserProfile,
        users,
        loginUser,
        signUpUser,
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
        updateCommissionDetails,
        updatePaymentStatus,
        acceptCommission,
        declineCommission,
        submitClientReviewAction,
        deliverFinalFiles,
        uploadDesignForReview,
        uploadDesignReviewDraft,
        sendMessage,
        markMessagesAsRead,
        uploadProjectFile,
        markNotificationAsRead,
        markAllNotificationsAsRead,
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
