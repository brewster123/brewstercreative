import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ServiceItem, 
  PortfolioProject, 
  StudioProfile, 
  ProjectType, 
  CaseStudyContent,
  User 
} from '../../types';
import { 
  Users, 
  Briefcase, 
  Image as ImageIcon, 
  Sparkles, 
  CreditCard, 
  Globe, 
  Mail, 
  Plus, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  X, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  Type, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { StudioPhotoUploader } from '../StudioPhotoUploader';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';
import { uploadPortfolioMedia } from '../../lib/portfolio';
import { loadCustomFontFile, isFontLoaded } from '../../utils/fontLoader';

interface ClientStudioManagementProps {
  initialSubTab?: 'clients' | 'profile' | 'services' | 'portfolio' | 'account';
}

export const ClientStudioManagement: React.FC<ClientStudioManagementProps> = ({
  initialSubTab = 'clients'
}) => {
  const {
    commissions = [],
    users = [],
    services = [],
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    portfolio = [],
    addPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject,
    studioProfile,
    updateStudioProfile,
    currentUser,
    setActiveView
  } = useApp();

  const safeCommissions = commissions || [];
  const safeUsers = users || [];
  const safeServices = services || [];
  const safePortfolio = portfolio || [];
  const currencySymbol = studioProfile?.currencySymbol || '₱';

  const [subTab, setSubTab] = useState<'clients' | 'profile' | 'services' | 'portfolio' | 'account'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
      if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    };
  }, []);

  // ==========================================
  // 1. CLIENTS DIRECTORY
  // ==========================================
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const clientList = safeUsers.filter((u) => u && u.role === 'client').map((client) => {
    const clientComms = safeCommissions.filter(
      (c) => c && (c.clientId === client.id || c.clientEmail?.toLowerCase() === client.email.toLowerCase())
    );
    return {
      ...client,
      commissionsCount: clientComms.length,
      latestProject: clientComms[0]?.projectName || null,
    };
  });

  const handleCopyEmail = async (email: string, id: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmailId(id);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedEmailId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  // ==========================================
  // 2. STUDIO PROFILE & GCASH
  // ==========================================
  const buildProfileFormState = (sp?: StudioProfile): StudioProfile => ({
    designerName: sp?.designerName || 'Brewster Cabando',
    studioName: sp?.studioName || 'DESTALION',
    title: sp?.title || 'Experimental Multimedia Artist & Brand Designer',
    bio: sp?.bio || '',
    avatar: sp?.avatar || '',
    email: sp?.email || 'contact@destalion.com',
    location: sp?.location || 'Cebu City',
    currency: sp?.currency || 'PHP',
    currencySymbol: sp?.currencySymbol || '₱',
    commissionStatus: sp?.commissionStatus || 'open',
    availableSlots: sp?.availableSlots ?? 4,
    socialLinks: {
      ...(sp?.socialLinks || {}),
      instagram: sp?.socialLinks?.instagram || '',
      behance: sp?.socialLinks?.behance || '',
      dribbble: sp?.socialLinks?.dribbble || '',
      twitter: sp?.socialLinks?.twitter || '',
    },
    gcashDetails: {
      accountName: sp?.gcashDetails?.accountName || 'Brewster Cabando',
      accountNumber: sp?.gcashDetails?.accountNumber || '0965-706-4331',
      qrCodeUrl: sp?.gcashDetails?.qrCodeUrl,
      instructions: sp?.gcashDetails?.instructions || '',
      depositPercentage: sp?.gcashDetails?.depositPercentage || 50,
    },
  });

  const [profileForm, setProfileForm] = useState<StudioProfile>(() => buildProfileFormState(studioProfile));
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (studioProfile) {
      setProfileForm(buildProfileFormState(studioProfile));
    }
  }, [studioProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);
    try {
      const res = await updateStudioProfile(profileForm);
      if (res && !res.success) {
        setProfileSaveError(res.error || 'Failed to update studio profile.');
        return;
      }
      setProfileSaveSuccess(true);
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
      profileTimerRef.current = setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err: any) {
      setProfileSaveError(err?.message || 'Failed to update studio profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ==========================================
  // 3. SERVICES CATALOG
  // ==========================================
  const [isAddingService, setIsAddingService] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingService, setIsDeletingService] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState<Omit<ServiceItem, 'id' | 'iconName'>>({
    name: '',
    category: 'Branding',
    startingPrice: 15000,
    turnaround: '2-3 weeks',
    revisionsCount: 3,
    deliverables: [],
    shortDesc: '',
  });
  const [deliverablesText, setDeliverablesText] = useState<string>('');
  const [isSavingService, setIsSavingService] = useState<boolean>(false);
  const [serviceSaveError, setServiceSaveError] = useState<string | null>(null);
  const [serviceDeleteError, setServiceDeleteError] = useState<string | null>(null);

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'Branding',
      startingPrice: 15000,
      turnaround: '2-3 weeks',
      revisionsCount: 3,
      deliverables: [],
      shortDesc: '',
    });
    setDeliverablesText('');
    setServiceSaveError(null);
    setIsAddingService(true);
  };

  const handleOpenEditService = (item: ServiceItem) => {
    setEditingService(item);
    setServiceForm({
      name: item.name,
      category: item.category,
      startingPrice: item.startingPrice,
      turnaround: item.turnaround,
      revisionsCount: item.revisionsCount,
      deliverables: item.deliverables,
      shortDesc: item.shortDesc,
    });
    setDeliverablesText((item.deliverables || []).join('\n'));
    setServiceSaveError(null);
    setIsAddingService(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceSaveError(null);
    if (!serviceForm.name.trim()) {
      setServiceSaveError('Service name is required.');
      return;
    }
    setIsSavingService(true);
    const parsedDeliverables = deliverablesText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);

    try {
      if (editingService) {
        const res = await updateServiceItem(editingService.id, {
          ...serviceForm,
          deliverables: parsedDeliverables,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to update service package.');
        }
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `srv-${crypto.randomUUID().slice(0, 8)}`
            : `srv-${Date.now()}`;
        const res = await addServiceItem({
          id: newId,
          iconName: 'Layers',
          ...serviceForm,
          deliverables: parsedDeliverables,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to create service package.');
        }
      }
      setIsAddingService(false);
    } catch (err: any) {
      setServiceSaveError(err?.message || 'Failed to save service package.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    setServiceDeleteError(null);
    setServiceToDelete({ id, name });
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);
    setServiceDeleteError(null);
    try {
      const res = await deleteServiceItem(serviceToDelete.id);
      if (res && !res.success) {
        setServiceDeleteError(res.error || 'Failed to delete service package.');
        return;
      }
      setServiceToDelete(null);
    } catch (err: any) {
      setServiceDeleteError(err?.message || 'Failed to delete service package.');
    } finally {
      setIsDeletingService(false);
    }
  };

  // ==========================================
  // 4. PORTFOLIO SHOWCASE
  // ==========================================
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [projectForm, setProjectForm] = useState<Omit<PortfolioProject, 'id' | 'fullDesc' | 'gallery' | 'tools' | 'tags'>>({
    title: '',
    category: 'Branding',
    client: '',
    date: new Date().getFullYear().toString(),
    shortDesc: '',
    image: '',
    featured: false,
    projectType: 'concept',
    serviceId: undefined,
    caseStudy: {},
  });
  const [isCaseStudyExpanded, setIsCaseStudyExpanded] = useState<boolean>(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);
  const [projectSaveError, setProjectSaveError] = useState<string | null>(null);
  const [projectDeleteError, setProjectDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (serviceToDelete && !isDeletingService) {
        setServiceToDelete(null);
      } else if (projectToDelete && !isDeletingProject) {
        setProjectToDelete(null);
      } else if (isAddingService && !isSavingService) {
        setIsAddingService(false);
      } else if (isAddingProject && !isSavingProject) {
        setIsAddingProject(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [serviceToDelete, isDeletingService, projectToDelete, isDeletingProject, isAddingService, isSavingService, isAddingProject, isSavingProject]);

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      category: 'Branding',
      client: '',
      date: new Date().getFullYear().toString(),
      shortDesc: '',
      image: '',
      featured: false,
      projectType: 'concept',
      serviceId: undefined,
      caseStudy: {},
    });
    setIsCaseStudyExpanded(false);
    setProjectSaveError(null);
    setIsAddingProject(true);
  };

  const handleOpenEditProject = (p: PortfolioProject) => {
    setEditingProject(p);
    setProjectForm({
      title: p.title,
      category: p.category,
      client: p.client,
      date: p.date,
      shortDesc: p.shortDesc,
      image: p.image,
      featured: p.featured,
      projectType: p.projectType || 'concept',
      serviceId: p.serviceId,
      caseStudy: p.caseStudy || {},
    });
    setIsCaseStudyExpanded(!!p.caseStudy && Object.keys(p.caseStudy).length > 0);
    setProjectSaveError(null);
    setIsAddingProject(true);
  };

  const handleCaseStudyFieldChange = (field: keyof CaseStudyContent, val: string) => {
    setProjectForm((prev) => ({
      ...prev,
      caseStudy: {
        ...prev.caseStudy,
        [field]: val,
      },
    }));
  };

  const handlePortfolioMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setProjectSaveError(null);
    try {
      const result = await uploadPortfolioMedia(file, file.name || 'artwork.jpg');
      if (result.error || !result.publicUrl) {
        setProjectSaveError(result.error || 'Failed to upload portfolio media.');
        return;
      }
      setProjectForm((prev) => ({ ...prev, image: result.publicUrl! }));
    } catch (err: any) {
      setProjectSaveError(err?.message || 'Failed to upload portfolio media.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectSaveError(null);
    if (!projectForm.title.trim()) {
      setProjectSaveError('Project title is required.');
      return;
    }
    setIsSavingProject(true);
    try {
      if (editingProject) {
        const res = await updatePortfolioProject(editingProject.id, {
          ...projectForm,
          gallery: projectForm.image
            ? [projectForm.image, ...(editingProject.gallery || []).filter((g) => g !== projectForm.image && g !== editingProject.image)]
            : editingProject.gallery,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to update portfolio project.');
        }
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `proj-${crypto.randomUUID().slice(0, 8)}`
            : `proj-${Date.now()}`;
        const defaultImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80';
        const resolvedImg = projectForm.image?.trim() || defaultImg;
        const res = await addPortfolioProject({
          id: newId,
          ...projectForm,
          image: resolvedImg,
          fullDesc: projectForm.shortDesc || projectForm.title,
          gallery: [resolvedImg],
          tools: [],
          tags: [projectForm.category],
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to save portfolio project.');
        }
      }
      setIsAddingProject(false);
    } catch (err: any) {
      setProjectSaveError(err?.message || 'Failed to save portfolio project.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = (id: string, title: string) => {
    setProjectDeleteError(null);
    setProjectToDelete({ id, title });
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    setProjectDeleteError(null);
    try {
      const res = await deletePortfolioProject(projectToDelete.id);
      if (res && !res.success) {
        setProjectDeleteError(res.error || 'Failed to delete portfolio project.');
        return;
      }
      setProjectToDelete(null);
    } catch (err: any) {
      setProjectDeleteError(err?.message || 'Failed to delete portfolio project.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  // ==========================================
  // 5. DIRECTOR ACCOUNT & TYPOGRAPHY
  // ==========================================
  const [fontUploadMessage, setFontUploadMessage] = useState<string | null>(null);

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const success = await loadCustomFontFile(file);
      if (success) {
        setFontUploadMessage(`Successfully loaded and applied custom font file "${file.name}".`);
      } else {
        setFontUploadMessage('Failed to load font file.');
      }
      if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
      fontTimerRef.current = setTimeout(() => setFontUploadMessage(null), 4000);
    } catch (err: any) {
      setFontUploadMessage(err?.message || 'Failed to load font file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Sub-Navigation */}
      <div className="bg-surface border border-hairline rounded-3xl p-5 sm:p-6 space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold block mb-1">
            Studio Administration
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
            Client & Studio Management
          </h2>
          <p className="text-xs sm:text-sm text-graphite mt-0.5">
            Manage your client directory, studio bio & payment instructions, published services, and portfolio showcase.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-hairline">
          <button
            type="button"
            onClick={() => setSubTab('clients')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'clients'
                ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                : 'bg-surface-secondary text-graphite hover:text-carbon'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients ({clientList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'profile'
                ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                : 'bg-surface-secondary text-graphite hover:text-carbon'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Studio Profile & GCash</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('services')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'services'
                ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                : 'bg-surface-secondary text-graphite hover:text-carbon'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Services & Pricing ({safeServices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('portfolio')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'portfolio'
                ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                : 'bg-surface-secondary text-graphite hover:text-carbon'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Portfolio Showcase ({safePortfolio.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('account')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'account'
                ? 'bg-[#111114] text-white dark:bg-white dark:text-[#111114]'
                : 'bg-surface-secondary text-graphite hover:text-carbon'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Director & Typography</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. CLIENTS DIRECTORY                                     */}
      {/* ======================================================== */}
      {subTab === 'clients' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientList.map((client) => (
              <div
                key={client.email}
                className="bg-surface border border-hairline rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={client.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                      alt={client.name || 'Client Avatar'}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-hairline"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm text-carbon truncate">
                        {client.name}
                      </h4>
                      <p className="text-xs font-mono text-graphite truncate">
                        {client.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-hairline space-y-1 font-mono text-xs text-graphite">
                    <div className="flex justify-between">
                      <span>Commissions:</span>
                      <span className="font-bold text-carbon">{client.commissionsCount}</span>
                    </div>
                    {client.latestProject && (
                      <div className="flex justify-between">
                        <span>Latest:</span>
                        <span className="text-carbon truncate max-w-[150px]">{client.latestProject}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-hairline flex items-center justify-between gap-2">
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(client.email, client.id)}
                    className="text-xs font-mono text-graphite hover:text-carbon cursor-pointer"
                  >
                    {copiedEmailId === client.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STUDIO PROFILE & GCASH                                */}
      {/* ======================================================== */}
      {subTab === 'profile' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
          {/* Dedicated Creative Studio — Edit Website Entry Point */}
          {currentUser?.role === 'admin' && (
            <div className="p-5 sm:p-6 rounded-3xl border border-accent/35 bg-gradient-to-r from-sky-500/10 via-surface-secondary to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                      Dedicated Application
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-secondary text-graphite border border-hairline">
                      Visual Editor
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-base text-carbon">
                    DESTALION Creative Studio
                  </h4>
                  <p className="text-xs text-graphite max-w-md">
                    Open the visual website design workspace to edit design tokens, customize layout artboards, and preview desktop and mobile live components.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('creative-studio')}
                className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                title="Launch DESTALION Creative Studio Application"
              >
                <span>Edit Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-hairline">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-0.5">
                Public Identity
              </span>
              <h3 className="font-display text-xl font-bold text-carbon">
                Public Studio Profile
              </h3>
            </div>

            {profileSaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                Studio profile updated successfully.
              </div>
            )}

            {profileSaveError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                {profileSaveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <StudioPhotoUploader
                adminUserId={currentUser?.id || ''}
                currentPhoto={profileForm.avatar}
                currentPhotoUrl={profileForm.avatar}
                onPhotoUpdated={(newUrl) => setProfileForm(prev => ({ ...prev, avatar: newUrl }))}
                label="Studio Lead Photo"
                description="Professional portrait displayed on the public website homepage 'Meet The Designer' section. Represents Brewster A. Cabando (Studio Lead)."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                    Designer Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.designerName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, designerName: e.target.value }))}
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                    Studio Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                  Studio Bio
                </label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent leading-relaxed resize-none"
                />
              </div>

              {/* GCash Payment Instructions Configuration */}
              <div className="pt-4 border-t border-hairline space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <h4 className="font-display font-bold text-sm text-carbon">
                    GCash Payment Instructions
                  </h4>
                </div>
                <p className="text-[11px] text-graphite">
                  Configured details displayed to clients during direct GCash transfer and manual verification intake.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      GCash Account Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.gcashDetails?.accountName || 'Brewster Cabando'}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          gcashDetails: {
                            accountName: e.target.value,
                            accountNumber: prev.gcashDetails?.accountNumber || '0965-706-4331',
                            instructions: prev.gcashDetails?.instructions || '',
                            depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                          },
                        }))
                      }
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      GCash Mobile Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.gcashDetails?.accountNumber || '0965-706-4331'}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          gcashDetails: {
                            accountName: prev.gcashDetails?.accountName || 'Brewster Cabando',
                            accountNumber: e.target.value,
                            instructions: prev.gcashDetails?.instructions || '',
                            depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                          },
                        }))
                      }
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                    Client Transfer Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={
                      profileForm.gcashDetails?.instructions ||
                      '1. Open your GCash app and tap "Send Money" > "Express Send".\n2. Enter the studio mobile number and the deposit amount.\n3. Complete transfer and screenshot the official receipt.\n4. Upload below with the Reference No. clearly visible.'
                    }
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        gcashDetails: {
                          accountName: prev.gcashDetails?.accountName || 'Brewster Cabando',
                          accountNumber: prev.gcashDetails?.accountNumber || '0965-706-4331',
                          instructions: e.target.value,
                          depositPercentage: prev.gcashDetails?.depositPercentage || 50,
                        },
                      }))
                    }
                    className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs text-carbon focus:outline-none focus:border-accent leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Social Media & External Profiles Configuration */}
              <div className="pt-4 border-t border-hairline space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  <h4 className="font-display font-bold text-sm text-carbon">
                    Social & External Profiles
                  </h4>
                </div>
                <p className="text-[11px] text-graphite">
                  Official studio handles and profiles displayed dynamically across website footers and contact areas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Instagram Handle / URL
                    </label>
                    <input
                      type="text"
                      value={profileForm.socialLinks?.instagram || ''}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            instagram: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. instagram.com/brewster.cabando"
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Behance Portfolio / URL
                    </label>
                    <input
                      type="text"
                      value={profileForm.socialLinks?.behance || ''}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            behance: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. behance.net/brewstercabando"
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Dribbble Profile / URL
                    </label>
                    <input
                      type="text"
                      value={profileForm.socialLinks?.dribbble || ''}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            dribbble: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. dribbble.com/brewstercabando"
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Twitter / X Profile / URL
                    </label>
                    <input
                      type="text"
                      value={profileForm.socialLinks?.twitter || ''}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            twitter: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. x.com/brewstercabando"
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-tactile px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Studio Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SERVICES CATALOG                                      */}
      {/* ======================================================== */}
      {subTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-0.5">
                Service Catalog
              </span>
              <h3 className="font-display text-xl font-bold text-carbon">
                Studio Services ({safeServices.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddService}
              className="btn-tactile inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-surface border border-hairline rounded-3xl p-5 sm:p-6 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-accent font-semibold block">
                        {srv.category}
                      </span>
                      <h4 className="font-display font-bold text-base text-carbon">
                        {srv.name}
                      </h4>
                    </div>
                    <span className="font-mono font-bold text-sm text-carbon">
                      {currencySymbol}{(srv.startingPrice ?? 0).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-graphite mt-2">
                    {srv.shortDesc}
                  </p>
                </div>

                <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono text-graphite">
                  <span>{srv.turnaround} · {srv.revisionsCount} revisions</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditService(srv)}
                      className="p-1.5 rounded-full hover:bg-surface-secondary hover:text-carbon cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-600 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Service Modal */}
          {isAddingService && (
            <div
              onClick={() => !isSavingService && setIsAddingService(false)}
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <h3 className="font-display text-xl font-bold text-carbon">
                    {editingService ? 'Edit Service Package' : 'New Service Package'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !isSavingService && setIsAddingService(false)}
                    aria-label="Close service modal"
                    className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {serviceSaveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-900/50">
                    {serviceSaveError}
                  </div>
                )}

                <form onSubmit={handleSaveService} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Service Name
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Category
                      </label>
                      <input
                        type="text"
                        value={serviceForm.category}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g. Branding, Print, Illustration"
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Starting Price ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serviceForm.startingPrice}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, startingPrice: Number(e.target.value) }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Turnaround
                      </label>
                      <input
                        type="text"
                        value={serviceForm.turnaround}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, turnaround: e.target.value }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Revisions
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={serviceForm.revisionsCount}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, revisionsCount: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={serviceForm.shortDesc}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, shortDesc: e.target.value }))}
                      placeholder="Concise summary of package scope..."
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Deliverables (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={deliverablesText}
                      onChange={(e) => setDeliverablesText(e.target.value)}
                      className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingService(false)}
                      disabled={isSavingService}
                      className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingService}
                      className="btn-tactile px-6 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingService ? 'Saving...' : 'Save Service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* In-App Confirmation Dialog for Service Deletion */}
          {serviceToDelete && (
            <div 
              onClick={() => !isDeletingService && setServiceToDelete(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-service-title"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 id="delete-service-title" className="font-display text-base sm:text-lg font-bold text-carbon">
                      Delete Service Package
                    </h3>
                    <p className="text-xs sm:text-sm text-graphite leading-relaxed">
                      Are you sure you want to delete service package <span className="font-semibold text-carbon">"{serviceToDelete.name}"</span> from the website?
                    </p>
                  </div>
                </div>

                {serviceDeleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                    {serviceDeleteError}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(null)}
                    disabled={isDeletingService}
                    className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteService}
                    disabled={isDeletingService}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isDeletingService ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete Service</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PORTFOLIO SHOWCASE                                    */}
      {/* ======================================================== */}
      {subTab === 'portfolio' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-0.5">
                Exhibition Archive
              </span>
              <h3 className="font-display text-xl font-bold text-carbon">
                Portfolio Projects ({safePortfolio.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddProject}
              className="btn-tactile inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {safePortfolio.map((proj) => (
              <div
                key={proj.id}
                className="bg-surface border border-hairline rounded-3xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-surface-secondary">
                    <img
                      src={proj.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80'}
                      alt={proj.title || 'Project Artwork'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 sm:p-5 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                      {proj.category} · {proj.date}
                    </span>
                    <h4 className="font-display font-bold text-base text-carbon">
                      {proj.title}
                    </h4>
                    <p className="text-xs text-graphite line-clamp-2">
                      {proj.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-3 border-t border-hairline flex items-center justify-between">
                  <span className="font-mono text-[11px] text-graphite">
                    {proj.client}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProject(proj)}
                      className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="p-1.5 rounded-full text-graphite hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Project Modal */}
          {isAddingProject && (
            <div
              onClick={() => !isSavingProject && setIsAddingProject(false)}
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <h3 className="font-display text-xl font-bold text-carbon">
                    {editingProject ? 'Edit Portfolio Project' : 'New Portfolio Project'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => !isSavingProject && setIsAddingProject(false)}
                    aria-label="Close project modal"
                    className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {projectSaveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                    {projectSaveError}
                  </div>
                )}

                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Project Title
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-carbon focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Category
                      </label>
                      <select
                        value={projectForm.category}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      >
                        <option value="Branding">Branding</option>
                        <option value="Illustration">Illustration</option>
                        <option value="Poster">Poster</option>
                        <option value="Logo">Logo</option>
                        <option value="Merchandise">Merchandise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                        Client / Commission Entity
                      </label>
                      <input
                        type="text"
                        value={projectForm.client}
                        placeholder="e.g. Acme Studio / Independent Client"
                        onChange={(e) => setProjectForm(prev => ({ ...prev, client: e.target.value }))}
                        className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Project Type & Associated Service & Featured Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-secondary border border-hairline">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                        Archive Classification
                      </label>
                      <select
                        value={projectForm.projectType || 'concept'}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, projectType: e.target.value as ProjectType }))}
                        className="w-full bg-surface border border-hairline rounded-xl px-3 py-2 text-xs text-carbon focus:outline-none focus:border-accent"
                      >
                        <option value="concept">Concept Exploration (Studio R&D)</option>
                        <option value="client">Client Work (Commissioned)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                        Associated Studio Service
                      </label>
                      <select
                        value={projectForm.serviceId || ''}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, serviceId: e.target.value || undefined }))}
                        className="w-full bg-surface border border-hairline rounded-xl px-3 py-2 text-xs text-carbon focus:outline-none focus:border-accent"
                      >
                        <option value="">-- No associated service --</option>
                        {safeServices.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} ({svc.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 pt-1 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-carbon">
                        <input
                          type="checkbox"
                          checked={!!projectForm.featured}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, featured: e.target.checked }))}
                          className="rounded border-hairline text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                        />
                        <span>Feature this project in Curated Exhibition on Home Page</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Short Description / Abstract
                    </label>
                    <textarea
                      rows={2}
                      value={projectForm.shortDesc}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, shortDesc: e.target.value }))}
                      className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                      Artwork Image URL or Upload
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={projectForm.image}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, image: e.target.value }))}
                        className="flex-1 bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
                      />
                      <label className="shrink-0 px-4 py-2 rounded-full bg-surface-secondary border border-hairline text-xs font-mono text-carbon hover:border-accent cursor-pointer flex items-center gap-1.5 transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isUploadingMedia ? 'Uploading...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePortfolioMediaUpload}
                          className="hidden"
                          disabled={isUploadingMedia}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Case Study Narrative Accordion */}
                  <div className="border border-hairline rounded-2xl overflow-hidden bg-surface-secondary">
                    <button
                      type="button"
                      onClick={() => setIsCaseStudyExpanded(prev => !prev)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <span className="font-display text-sm font-bold text-carbon">
                          Editorial Case Study Narrative Chapters
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-graphite font-mono">
                        <span>{isCaseStudyExpanded ? 'Collapse' : 'Expand Chapters'}</span>
                        {isCaseStudyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isCaseStudyExpanded && (
                      <div className="p-4 sm:p-5 border-t border-hairline space-y-4 bg-surface animate-in fade-in duration-150">
                        <p className="text-[11px] text-graphite leading-relaxed">
                          Document the deep-dive narrative for the standalone case study page. Blank fields will not be rendered to visitors.
                        </p>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            01 / Project Overview & Context
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.overview || ''}
                            placeholder="Background of the project, client introduction, and overall context..."
                            onChange={(e) => handleCaseStudyFieldChange('overview', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            02 / The Challenge & Constraints
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.challenge || ''}
                            placeholder="Core problems, audience obstacles, or technical hurdles faced..."
                            onChange={(e) => handleCaseStudyFieldChange('challenge', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            03 / Strategic Objective
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.objective || ''}
                            placeholder="Primary aesthetic and functional goals..."
                            onChange={(e) => handleCaseStudyFieldChange('objective', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            04 / Research & Aesthetic Inquiries
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.researchInspiration || ''}
                            placeholder="Visual references, historical typography, texture studies, moodboards..."
                            onChange={(e) => handleCaseStudyFieldChange('researchInspiration', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            05 / Concept Development & Iteration
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.conceptDevelopment || ''}
                            placeholder="Early sketch phases, vector construction, creative pivots..."
                            onChange={(e) => handleCaseStudyFieldChange('conceptDevelopment', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            06 / Design Decisions & Rationale
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.designDecisions || ''}
                            placeholder="Why specific typefaces, color harmonies, and grids were chosen..."
                            onChange={(e) => handleCaseStudyFieldChange('designDecisions', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            07 / Final Solution & Master Deliverables
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.finalSolution || ''}
                            placeholder="The final outcome, brand impact, delivery format..."
                            onChange={(e) => handleCaseStudyFieldChange('finalSolution', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-graphite mb-1 font-semibold">
                            08 / Studio Reflection & Retrospective
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.reflection || ''}
                            placeholder="Key takeaways, future evolution, lessons learned..."
                            onChange={(e) => handleCaseStudyFieldChange('reflection', e.target.value)}
                            className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProject}
                      className="btn-tactile px-6 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingProject ? 'Saving...' : 'Save Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* In-App Confirmation Dialog for Portfolio Project Deletion */}
          {projectToDelete && (
            <div 
              onClick={() => !isDeletingProject && setProjectToDelete(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-project-title"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-hairline rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 id="delete-project-title" className="font-display text-base sm:text-lg font-bold text-carbon">
                      Delete Portfolio Project
                    </h3>
                    <p className="text-xs sm:text-sm text-graphite leading-relaxed">
                      Are you sure you want to delete <span className="font-semibold text-carbon">"{projectToDelete.title}"</span>? This portfolio project will be permanently deleted from the studio website.
                    </p>
                  </div>
                </div>

                {projectDeleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
                    {projectDeleteError}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeletingProject}
                    className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProject}
                    disabled={isDeletingProject}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isDeletingProject ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DIRECTOR ACCOUNT & TYPOGRAPHY                         */}
      {/* ======================================================== */}
      {subTab === 'account' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
          {/* Director Account Card */}
          <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-hairline">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-0.5">
                Access & Credentials
              </span>
              <h3 className="font-display text-xl font-bold text-carbon">
                Director Account Profile
              </h3>
            </div>

            <ProfilePhotoUploader
              userId={currentUser?.id || 'usr-admin-1'}
              currentAvatar={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
              label="Director Account Avatar"
              description="Used within project dialogues and the admin top bar."
              avatarSizeClass="w-16 h-16"
            />

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs text-graphite">
              <div>
                <span className="text-[10px] uppercase block">Director Name</span>
                <span className="font-bold text-carbon">{currentUser?.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase block">Account Email</span>
                <span className="font-bold text-carbon">{currentUser?.email}</span>
              </div>
            </div>
          </div>

          {/* Typography Standard */}
          <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-hairline">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold block mb-0.5">
                Studio System
              </span>
              <h3 className="font-display text-xl font-bold text-carbon">
                Typography Standard
              </h3>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-surface-secondary border border-hairline space-y-1">
              <span className="text-xs font-mono text-graphite uppercase">Primary Typeface</span>
              <h4 className="font-display font-bold text-2xl text-carbon">
                Plus Jakarta Sans
              </h4>
              <p className="text-xs text-graphite leading-relaxed pt-1">
                Geometric sans-serif standard deployed across all studio touchpoints, case studies, and editorial documents.
              </p>
            </div>

            {/* Optional Local Font Loader */}
            <div className="border border-dashed border-hairline rounded-2xl p-5 text-center">
              <input
                type="file"
                id="font-file-input"
                accept=".otf,.ttf,.woff,.woff2"
                onChange={handleFontFileUpload}
                className="hidden"
              />
              <label htmlFor="font-file-input" className="cursor-pointer space-y-1 block">
                <span className="text-xs font-semibold text-carbon hover:text-accent transition-colors">
                  Load Custom Font File
                </span>
                <p className="text-[11px] font-mono text-graphite">
                  Optional: load a local .otf, .ttf, or .woff2 file for this session
                </p>
              </label>
              {fontUploadMessage && (
                <p className="mt-2 text-xs font-mono text-accent">{fontUploadMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
