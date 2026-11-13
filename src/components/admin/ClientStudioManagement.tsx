import React, { useState } from 'react';
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

  const [subTab, setSubTab] = useState<'clients' | 'profile' | 'services' | 'portfolio' | 'account'>(initialSubTab);

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

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // ==========================================
  // 2. STUDIO PROFILE & GCASH
  // ==========================================
  const [profileForm, setProfileForm] = useState<StudioProfile>({
    designerName: studioProfile?.designerName || 'Brewster Cabando',
    bio: studioProfile?.bio || '',
    avatar: studioProfile?.avatar || '',
    email: studioProfile?.email || 'contact@destalion.com',
    socialLinks: {
      instagram: studioProfile?.socialLinks?.instagram || '',
      behance: studioProfile?.socialLinks?.behance || '',
      dribbble: studioProfile?.socialLinks?.dribbble || '',
      twitter: studioProfile?.socialLinks?.twitter || '',
    },
    gcashDetails: {
      accountName: studioProfile?.gcashDetails?.accountName || 'Brewster Cabando',
      accountNumber: studioProfile?.gcashDetails?.accountNumber || '0965-706-4331',
      instructions: studioProfile?.gcashDetails?.instructions || '',
      depositPercentage: studioProfile?.gcashDetails?.depositPercentage || 50,
    },
  });
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateStudioProfile(profileForm);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update studio profile', err);
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
  const [serviceForm, setServiceForm] = useState<Omit<ServiceItem, 'id'>>({
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
    setDeliverablesText(item.deliverables.join('\n'));
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
        await updateServiceItem({
          ...editingService,
          ...serviceForm,
          deliverables: parsedDeliverables,
        });
      } else {
        await addServiceItem({
          ...serviceForm,
          deliverables: parsedDeliverables,
        });
      }
      setIsAddingService(false);
    } catch (err: any) {
      setServiceSaveError(err.message || 'Failed to save service package.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    setServiceToDelete({ id, name });
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);
    try {
      await deleteServiceItem(serviceToDelete.id);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete service', err);
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
  const [projectForm, setProjectForm] = useState<Omit<PortfolioProject, 'id'>>({
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
      const publicUrl = await uploadPortfolioMedia(file, 'artwork');
      setProjectForm((prev) => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      setProjectSaveError(err.message || 'Failed to upload portfolio media.');
    } finally {
      setIsUploadingMedia(false);
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
        await updatePortfolioProject({
          ...editingProject,
          ...projectForm,
        });
      } else {
        await addPortfolioProject(projectForm);
      }
      setIsAddingProject(false);
    } catch (err: any) {
      setProjectSaveError(err.message || 'Failed to save portfolio project.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = (id: string, title: string) => {
    setProjectToDelete({ id, title });
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      await deletePortfolioProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to delete project', err);
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
      setTimeout(() => setFontUploadMessage(null), 4000);
    } catch (err: any) {
      setFontUploadMessage(err.message || 'Failed to load font file.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Sub-Navigation */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
            Studio Administration
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Client & Studio Management
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            Manage your client directory, studio bio & payment instructions, published services, and portfolio showcase.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E4E2DC] dark:border-[#27272A]">
          <button
            type="button"
            onClick={() => setSubTab('clients')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'clients'
                ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]'
                : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clients ({clientList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'profile'
                ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]'
                : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Studio Profile & GCash</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('services')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'services'
                ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]'
                : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Services & Pricing ({safeServices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('portfolio')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'portfolio'
                ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]'
                : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Portfolio Showcase ({safePortfolio.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('account')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'account'
                ? 'bg-[#18181B] text-white dark:bg-white dark:text-[#18181B]'
                : 'bg-[#FAF9F6] dark:bg-[#0F0F11] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
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
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={client.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                      alt={client.name || 'Client Avatar'}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E4E2DC] dark:ring-[#27272A]"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC] truncate">
                        {client.name}
                      </h4>
                      <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {client.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-1 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    <div className="flex justify-between">
                      <span>Commissions:</span>
                      <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{client.commissionsCount}</span>
                    </div>
                    {client.latestProject && (
                      <div className="flex justify-between">
                        <span>Latest:</span>
                        <span className="text-[#18181B] dark:text-[#EDEDEC] truncate max-w-[150px]">{client.latestProject}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between gap-2">
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#EA580C] hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(client.email, client.id)}
                    className="text-xs font-mono text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
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
            <div className="p-5 rounded-xl border border-[#EA580C]/40 bg-gradient-to-r from-orange-500/10 via-[#FAF9F6] to-transparent dark:from-orange-950/20 dark:via-[#18181B] dark:to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                      Dedicated Application
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      Visual Editor
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                    DESTALION Creative Studio
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md">
                    Open the visual website design workspace to edit design tokens, customize layout artboards, and preview desktop and mobile live components.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('creative-studio')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold font-mono uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                title="Launch DESTALION Creative Studio Application"
              >
                <span>Edit Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Public Identity
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Public Studio Profile
              </h3>
            </div>

            {profileSaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg border border-emerald-200">
                Studio profile updated successfully.
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
                  <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                    Designer Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.designerName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, designerName: e.target.value }))}
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                    Studio Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                  Studio Bio
                </label>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] leading-relaxed resize-none"
                />
              </div>

              {/* GCash Payment Instructions Configuration */}
              <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#EA580C]" />
                  <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    GCash Payment Instructions
                  </h4>
                </div>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Configured details displayed to clients during direct GCash transfer and manual verification intake.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                    className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Social Media & External Profiles Configuration */}
              <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#EA580C]" />
                  <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    Social & External Profiles
                  </h4>
                </div>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Official studio handles and profiles displayed dynamically across website footers and contact areas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
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
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
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
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Service Catalog
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Studio Services ({safeServices.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddService}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-[#EA580C] font-semibold block">
                        {srv.category}
                      </span>
                      <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                        {srv.name}
                      </h4>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                      ₱{srv.startingPrice.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2">
                    {srv.shortDesc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <span>{srv.turnaround} · {srv.revisionsCount} revisions</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditService(srv)}
                      className="hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      className="hover:text-red-600 cursor-pointer"
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
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                  <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    {editingService ? 'Edit Service Package' : 'New Service Package'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {serviceSaveError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                    {serviceSaveError}
                  </div>
                )}

                <form onSubmit={handleSaveService} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Service Name
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Starting Price (₱)
                      </label>
                      <input
                        type="number"
                        value={serviceForm.startingPrice}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, startingPrice: Number(e.target.value) }))}
                        className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Turnaround
                      </label>
                      <input
                        type="text"
                        value={serviceForm.turnaround}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, turnaround: e.target.value }))}
                        className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Deliverables (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={deliverablesText}
                      onChange={(e) => setDeliverablesText(e.target.value)}
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] font-mono"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingService(false)}
                      className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingService}
                      className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-service-title"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            >
              <div 
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 id="delete-service-title" className="font-display text-base sm:text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      Delete Service Package
                    </h3>
                    <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      Are you sure you want to delete service package <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">"{serviceToDelete.name}"</span> from the website?
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(null)}
                    disabled={isDeletingService}
                    className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteService}
                    disabled={isDeletingService}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
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
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Exhibition Archive
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Portfolio Projects ({safePortfolio.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {safePortfolio.map((proj) => (
              <div
                key={proj.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                    <img
                      src={proj.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80'}
                      alt={proj.title || 'Project Artwork'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                      {proj.category} · {proj.date}
                    </span>
                    <h4 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                      {proj.title}
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] line-clamp-2">
                      {proj.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-[#E4E2DC] dark:border-[#27272A] mt-3 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    {proj.client}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProject(proj)}
                      className="p-1.5 rounded text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="p-1.5 rounded text-[#71717A] hover:text-red-600 cursor-pointer"
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
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                  <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                    {editingProject ? 'Edit Portfolio Project' : 'New Portfolio Project'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="text-[#71717A] hover:text-[#18181B] dark:hover:text-[#EDEDEC]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {projectSaveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 text-xs rounded-lg border border-red-200">
                    {projectSaveError}
                  </div>
                )}

                <form onSubmit={handleSaveProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Project Title
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Category
                      </label>
                      <select
                        value={projectForm.category}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      >
                        <option value="Branding">Branding</option>
                        <option value="Illustration">Illustration</option>
                        <option value="Poster">Poster</option>
                        <option value="Logo">Logo</option>
                        <option value="Merchandise">Merchandise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Client / Commission Entity
                      </label>
                      <input
                        type="text"
                        value={projectForm.client}
                        placeholder="e.g. Acme Studio / Independent Client"
                        onChange={(e) => setProjectForm(prev => ({ ...prev, client: e.target.value }))}
                        className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>
                  </div>

                  {/* Project Type & Associated Service & Featured Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Archive Classification
                      </label>
                      <select
                        value={projectForm.projectType || 'concept'}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, projectType: e.target.value as ProjectType }))}
                        className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      >
                        <option value="concept">Concept Exploration (Studio R&D)</option>
                        <option value="client">Client Work (Commissioned)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                        Associated Studio Service
                      </label>
                      <select
                        value={projectForm.serviceId || ''}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, serviceId: e.target.value || undefined }))}
                        className="w-full bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
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
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#18181B] dark:text-[#EDEDEC]">
                        <input
                          type="checkbox"
                          checked={!!projectForm.featured}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, featured: e.target.checked }))}
                          className="rounded border-[#E4E2DC] dark:border-[#27272A] text-[#EA580C] focus:ring-[#EA580C] w-4 h-4 cursor-pointer"
                        />
                        <span>Feature this project in Curated Exhibition on Home Page</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Short Description / Abstract
                    </label>
                    <textarea
                      rows={2}
                      value={projectForm.shortDesc}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, shortDesc: e.target.value }))}
                      className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                      Artwork Image URL or Upload
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={projectForm.image}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, image: e.target.value }))}
                        className="flex-1 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                      />
                      <label className="shrink-0 px-3 py-2 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono hover:bg-[#F4F2ED] cursor-pointer flex items-center gap-1">
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
                  <div className="border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                    <button
                      type="button"
                      onClick={() => setIsCaseStudyExpanded(prev => !prev)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#EA580C]" />
                        <span className="font-display text-sm font-bold text-[#18181B] dark:text-[#EDEDEC]">
                          Editorial Case Study Narrative Chapters
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        <span>{isCaseStudyExpanded ? 'Collapse' : 'Expand Chapters'}</span>
                        {isCaseStudyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isCaseStudyExpanded && (
                      <div className="p-4 sm:p-5 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-4 bg-white dark:bg-[#18181B] animate-in fade-in duration-150">
                        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                          Document the deep-dive narrative for the standalone case study page. Blank fields will not be rendered to visitors.
                        </p>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            01 / Project Overview & Context
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.overview || ''}
                            placeholder="Background of the project, client introduction, and overall context..."
                            onChange={(e) => handleCaseStudyFieldChange('overview', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            02 / The Challenge & Constraints
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.challenge || ''}
                            placeholder="Core problems, audience obstacles, or technical hurdles faced..."
                            onChange={(e) => handleCaseStudyFieldChange('challenge', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            03 / Strategic Objective
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.objective || ''}
                            placeholder="Primary aesthetic and functional goals..."
                            onChange={(e) => handleCaseStudyFieldChange('objective', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            04 / Research & Aesthetic Inquiries
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.researchInspiration || ''}
                            placeholder="Visual references, historical typography, texture studies, moodboards..."
                            onChange={(e) => handleCaseStudyFieldChange('researchInspiration', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            05 / Concept Development & Iteration
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.conceptDevelopment || ''}
                            placeholder="Early sketch phases, vector construction, creative pivots..."
                            onChange={(e) => handleCaseStudyFieldChange('conceptDevelopment', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            06 / Design Decisions & Rationale
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.designDecisions || ''}
                            placeholder="Why specific typefaces, color harmonies, and grids were chosen..."
                            onChange={(e) => handleCaseStudyFieldChange('designDecisions', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            07 / Final Solution & Master Deliverables
                          </label>
                          <textarea
                            rows={3}
                            value={projectForm.caseStudy?.finalSolution || ''}
                            placeholder="The final outcome, brand impact, delivery format..."
                            onChange={(e) => handleCaseStudyFieldChange('finalSolution', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mb-1 font-semibold">
                            08 / Studio Reflection & Retrospective
                          </label>
                          <textarea
                            rows={2}
                            value={projectForm.caseStudy?.reflection || ''}
                            placeholder="Key takeaways, future evolution, lessons learned..."
                            onChange={(e) => handleCaseStudyFieldChange('reflection', e.target.value)}
                            className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-2.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProject}
                      className="px-5 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-project-title"
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            >
              <div 
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 id="delete-project-title" className="font-display text-base sm:text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                      Delete Portfolio Project
                    </h3>
                    <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      Are you sure you want to delete <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">"{projectToDelete.title}"</span>? This portfolio project will be permanently deleted from the studio website.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeletingProject}
                    className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProject}
                    disabled={isDeletingProject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
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
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Access & Credentials
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Director Account Profile
              </h3>
            </div>

            <ProfilePhotoUploader
              userId={currentUser?.id || 'usr-admin-1'}
              currentAvatar={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
              onAvatarUpdated={(newUrl) => {
                if (currentUser) {
                  currentUser.avatar = newUrl;
                }
              }}
              label="Director Account Avatar"
              description="Used within project dialogues and the admin top bar."
              avatarSizeClass="w-16 h-16"
            />

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                <span className="text-[10px] uppercase block">Director Name</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{currentUser?.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase block">Account Email</span>
                <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{currentUser?.email}</span>
              </div>
            </div>
          </div>

          {/* Typography Standard */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Studio System
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Typography Standard
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] space-y-1">
              <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] uppercase">Primary Typeface</span>
              <h4 className="font-display font-bold text-2xl text-[#18181B] dark:text-[#EDEDEC]">
                Plus Jakarta Sans
              </h4>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed pt-1">
                Geometric sans-serif standard deployed across all studio touchpoints, case studies, and editorial documents.
              </p>
            </div>

            {/* Optional Local Font Loader */}
            <div className="border border-dashed border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-5 text-center">
              <input
                type="file"
                id="font-file-input"
                accept=".otf,.ttf,.woff,.woff2"
                onChange={handleFontFileUpload}
                className="hidden"
              />
              <label htmlFor="font-file-input" className="cursor-pointer space-y-1 block">
                <span className="text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:text-[#EA580C]">
                  Load Custom Font File
                </span>
                <p className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  Optional: load a local .otf, .ttf, or .woff2 file for this session
                </p>
              </label>
              {fontUploadMessage && (
                <p className="mt-2 text-xs font-mono text-[#EA580C]">{fontUploadMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
