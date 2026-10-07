import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Commission, 
  CommissionStatus,
  CommissionPriority,
  CommissionStageName, 
  COMMISSION_STAGES, 
  ServiceItem, 
  PortfolioProject,
  StudioProfile,
  ProjectType,
  CaseStudyContent
} from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { ProfilePhotoUploader } from '../components/ProfilePhotoUploader';
import { StudioPhotoUploader } from '../components/StudioPhotoUploader';
import { 
  Sparkles, 
  Layers, 
  Check, 
  X, 
  UploadCloud, 
  Eye, 
  MessageSquare, 
  RotateCcw, 
  DollarSign, 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight,
  ShieldCheck,
  FolderArchive,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Type,
  Image as ImageIcon,
  Briefcase,
  Globe,
  ExternalLink,
  Mail,
  Copy,
  CheckCheck,
  Users,
  Phone,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText
} from 'lucide-react';
import { loadCustomFontFile, isFontLoaded } from '../utils/fontLoader';
import { formatCommissionDate } from '../utils/dateUtils';
import { isValidReferenceUrl } from '../utils/urlUtils';
import { AdminCreativeProofsSection } from '../components/AdminCreativeProofsSection';
import { AdminDeliverablesSection } from '../components/AdminDeliverablesSection';
import { uploadPortfolioMedia } from '../lib/portfolio';

export const AdminDashboardView: React.FC = () => {
  const { 
    commissions, 
    users,
    activeCommission, 
    setActiveCommissionId, 
    updateCommissionStage, 
    updateCommissionStatus,
    updateCommissionPriority,
    updatePaymentStatus, 
    acceptCommission, 
    declineCommission, 
    uploadDesignReviewDraft,
    services, 
    addServiceItem, 
    updateServiceItem,
    deleteServiceItem,
    portfolio, 
    addPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject,
    studioProfile, 
    updateStudioProfile,
    currentUser,
    authLoading,
    setActiveView,
    activeDashboardTab,
    setActiveDashboardTab
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'commissions' | 'clients' | 'website-info' | 'portfolio' | 'services' | 'proof-uploader' | 'typography' | 'admin-account'
  >('commissions');

  const [selectedCommissionId, setSelectedCommissionId] = useState<string>(activeCommission?.id || commissions[0]?.id || '');
  const [expandedProofsCommissionId, setExpandedProofsCommissionId] = useState<string | null>(null);
  const [expandedDeliverablesCommissionId, setExpandedDeliverablesCommissionId] = useState<string | null>(null);
  const [commissionSection, setCommissionSection] = useState<'active' | 'completed' | 'cancelled' | 'all'>('active');
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Supabase Commission Status Management state
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusSuccessId, setStatusSuccessId] = useState<string | null>(null);
  const [statusErrorMap, setStatusErrorMap] = useState<Record<string, string>>({});

  const STATUS_OPTIONS: { value: CommissionStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'for_review', label: 'For Review' },
    { value: 'revision', label: 'Revision' },
    { value: 'final_approval', label: 'Final Approval' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const formatCommissionStatus = (status: string | undefined): string => {
    if (!status) return 'Pending';
    switch (status.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'In Progress';
      case 'for_review':
      case 'client review':
        return 'For Review';
      case 'pending':
        return 'Pending';
      case 'reviewing':
        return 'Reviewing';
      case 'accepted':
        return 'Accepted';
      case 'revision':
      case 'revision requested':
        return 'Revision';
      case 'final_approval':
      case 'final approval':
        return 'Final Approval';
      case 'completed':
        return 'Completed';
      case 'cancelled':
      case 'rejected':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleStatusChange = async (commissionId: string, newStatus: CommissionStatus) => {
    setStatusUpdatingId(commissionId);
    setStatusErrorMap(prev => {
      const copy = { ...prev };
      delete copy[commissionId];
      return copy;
    });

    try {
      const res = await updateCommissionStatus(commissionId, newStatus);
      if (res.success) {
        setStatusSuccessId(commissionId);
        setTimeout(() => {
          setStatusSuccessId(curr => (curr === commissionId ? null : curr));
        }, 3000);
      } else {
        setStatusErrorMap(prev => ({
          ...prev,
          [commissionId]: res.error || 'Failed to update commission status.',
        }));
      }
    } catch (err: any) {
      setStatusErrorMap(prev => ({
        ...prev,
        [commissionId]: err?.message || 'An unexpected error occurred while updating status.',
      }));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Supabase Commission Priority Management state
  const [priorityUpdatingId, setPriorityUpdatingId] = useState<string | null>(null);
  const [prioritySuccessId, setPrioritySuccessId] = useState<string | null>(null);
  const [priorityErrorMap, setPriorityErrorMap] = useState<Record<string, string>>({});

  const PRIORITY_OPTIONS: { value: CommissionPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const handlePriorityChange = async (commissionId: string, newPriority: CommissionPriority) => {
    setPriorityUpdatingId(commissionId);
    setPriorityErrorMap(prev => {
      const copy = { ...prev };
      delete copy[commissionId];
      return copy;
    });

    try {
      const res = await updateCommissionPriority(commissionId, newPriority);
      if (res.success) {
        setPrioritySuccessId(commissionId);
        setTimeout(() => {
          setPrioritySuccessId(curr => (curr === commissionId ? null : curr));
        }, 3000);
      } else {
        setPriorityErrorMap(prev => ({
          ...prev,
          [commissionId]: res.error || 'Failed to update commission priority.',
        }));
      }
    } catch (err: any) {
      setPriorityErrorMap(prev => ({
        ...prev,
        [commissionId]: err?.message || 'An unexpected error occurred while updating priority.',
      }));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  // Consolidated client directory for Brewster
  const clientList = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      email: string;
      avatar: string;
      handle?: string;
      phone?: string;
      contactMethod?: string;
      commissionsCount: number;
      latestProject?: string;
      latestStatus?: string;
    }>();

    // From registered users state
    users.filter(u => u.role === 'client').forEach(u => {
      const userComms = commissions.filter(c => c.clientId === u.id || c.clientEmail.toLowerCase() === u.email.toLowerCase());
      map.set(u.email.toLowerCase(), {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        handle: u.handle,
        phone: u.phone,
        contactMethod: u.contactMethod,
        commissionsCount: userComms.length,
        latestProject: userComms[0]?.projectName,
        latestStatus: userComms[0]?.status,
      });
    });

    // From commissions table
    commissions.forEach(c => {
      const key = c.clientEmail.toLowerCase();
      if (!map.has(key)) {
        const commsForClient = commissions.filter(x => x.clientEmail.toLowerCase() === key);
        map.set(key, {
          id: c.clientId,
          name: c.clientName,
          email: c.clientEmail,
          avatar: c.clientAvatar,
          handle: c.clientHandle,
          contactMethod: c.contactMethod,
          commissionsCount: commsForClient.length,
          latestProject: c.projectName,
          latestStatus: c.status,
        });
      }
    });

    return Array.from(map.values());
  }, [users, commissions]);

  // Website Info Form State
  const [profileForm, setProfileForm] = useState<StudioProfile>(() => {
    const p = { ...studioProfile };
    if (p.email?.toLowerCase().includes('cabandobrewster') || !p.email) {
      p.email = 'brewstercreates@gmail.com';
    }
    return p;
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Portfolio Management State
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false);
  const [isCaseStudyExpanded, setIsCaseStudyExpanded] = useState<boolean>(false);
  const [projectForm, setProjectForm] = useState<Partial<PortfolioProject>>({
    title: '',
    category: 'Branding',
    shortDesc: '',
    fullDesc: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
    client: '',
    date: '2026',
    tools: ['Adobe Illustrator', 'Photoshop'],
    tags: ['Branding', 'Vector'],
    featured: false,
    projectType: 'client',
    serviceId: '',
    caseStudy: {},
  });

  // Services Management State
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<ServiceItem>>({
    name: '',
    category: 'Branding',
    shortDesc: '',
    startingPrice: 3500,
    turnaround: '3–7 days',
    revisionsCount: 2,
    deliverables: ['Primary logo mark', 'Vector source SVG/EPS', 'Presentation-ready files'],
    popular: false,
    iconName: 'Sparkles',
  });
  const [deliverablesText, setDeliverablesText] = useState('Primary logo mark\nVector source SVG/EPS\nPresentation-ready files');

  // Font customization state
  const [customFontUploaded, setCustomFontUploaded] = useState<boolean>(false);
  const [fontUploadMessage, setFontUploadMessage] = useState<string>('');

  const currentCommission = commissions.find(c => c.id === selectedCommissionId) || commissions[0];

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontUploadMessage(`Loading font file: ${file.name}...`);
    const success = await loadCustomFontFile(file);
    if (success) {
      setCustomFontUploaded(true);
      setFontUploadMessage(`Successfully loaded & applied "${file.name}" as custom font across the studio.`);
    } else {
      setFontUploadMessage('Could not load font file. Please provide a valid .otf, .ttf, or .woff2 file.');
    }
  };

  const handleStageChange = async (commissionId: string, newStage: number) => {
    const stageObj = COMMISSION_STAGES.find(s => s.number === newStage);
    if (!stageObj) return;
    const stageName = stageObj.name as CommissionStageName;
    const res = await updateCommissionStage(commissionId, newStage, stageName, `Stage updated to ${stageName} by Designer.`);
    if (res && !res.success) {
      setStatusErrorMap(prev => ({
        ...prev,
        [commissionId]: res.error || 'Failed to update commission stage.',
      }));
    }
  };

  // Async saving & feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectSaveError, setProjectSaveError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceSaveError, setServiceSaveError] = useState<string | null>(null);

  // Synchronize form when studioProfile is fetched or updated
  useEffect(() => {
    if (isSavingProfile) return;
    setProfileForm(prev => {
      const p = { ...studioProfile };
      if (p.email?.toLowerCase().includes('cabandobrewster') || !p.email) {
        p.email = 'brewstercreates@gmail.com';
      }
      return p;
    });
  }, [studioProfile, isSavingProfile]);

  // Website Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveError(null);
    try {
      const res = await updateStudioProfile(profileForm);
      if (res && !res.success) {
        setProfileSaveError(res.error || 'Failed to save website information.');
      } else {
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 3500);
      }
    } catch (err: any) {
      setProfileSaveError(err?.message || 'Unexpected error saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Portfolio Handlers
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectSaveError(null);
    setIsCaseStudyExpanded(false);
    setProjectForm({
      title: '',
      category: 'Branding',
      shortDesc: '',
      fullDesc: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
      client: '',
      date: '2026',
      tools: ['Adobe Illustrator', 'Photoshop'],
      tags: ['Branding', 'Vector'],
      featured: false,
      projectType: 'client',
      serviceId: '',
      caseStudy: {},
    });
    setIsAddingProject(true);
  };

  const handleOpenEditProject = (proj: PortfolioProject) => {
    setEditingProject(proj);
    setProjectSaveError(null);
    setIsCaseStudyExpanded(false);
    setProjectForm({ 
      ...proj,
      projectType: proj.projectType || 'client',
      serviceId: proj.serviceId || '',
      featured: !!proj.featured,
      caseStudy: proj.caseStudy || {},
    });
    setIsAddingProject(true);
  };

  const handleCaseStudyFieldChange = (field: keyof CaseStudyContent, value: string) => {
    setProjectForm(prev => ({
      ...prev,
      caseStudy: {
        ...(prev.caseStudy || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProject(true);
    setProjectSaveError(null);

    try {
      if (editingProject) {
        const res = await updatePortfolioProject(editingProject.id, projectForm as Partial<PortfolioProject>);
        if (res && !res.success) {
          setProjectSaveError(res.error || 'Failed to update portfolio project.');
          setIsSavingProject(false);
          return;
        }
      } else {
        const newProj: PortfolioProject = {
          id: `proj-${Date.now()}`,
          title: projectForm.title || 'Untitled Showcase Work',
          category: (projectForm.category as any) || 'Branding',
          shortDesc: projectForm.shortDesc || '',
          fullDesc: projectForm.fullDesc || projectForm.shortDesc || '',
          image: projectForm.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
          gallery: [projectForm.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80'],
          tools: Array.isArray(projectForm.tools) ? projectForm.tools : ['Adobe Illustrator'],
          date: projectForm.date || '2026',
          client: projectForm.client || 'Studio Concept',
          tags: Array.isArray(projectForm.tags) ? projectForm.tags : ['Design'],
          featured: !!projectForm.featured,
          projectType: projectForm.projectType || 'concept',
          serviceId: projectForm.serviceId || undefined,
          caseStudy: projectForm.caseStudy || {},
          likesCount: 0,
          viewsCount: 0,
          sharesCount: 0,
          views_count: 0,
          likes_count: 0,
          shares_count: 0,
        };
        const res = await addPortfolioProject(newProj);
        if (res && !res.success) {
          setProjectSaveError(res.error || 'Failed to create portfolio project.');
          setIsSavingProject(false);
          return;
        }
      }
      setIsAddingProject(false);
      setEditingProject(null);
    } catch (err: any) {
      setProjectSaveError(err?.message || 'Error occurred while saving project.');
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
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Portfolio Media Upload Handler
  const handlePortfolioMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    setProjectSaveError(null);
    try {
      const { publicUrl, error } = await uploadPortfolioMedia(file, file.name);
      if (error || !publicUrl) {
        setProjectSaveError(error || 'Failed to upload image.');
      } else {
        setProjectForm(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err: any) {
      setProjectSaveError(err?.message || 'Unexpected error uploading artwork.');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  // Services Handlers
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceSaveError(null);
    setServiceForm({
      name: '',
      category: 'Branding',
      shortDesc: '',
      startingPrice: 3500,
      turnaround: '3–7 days',
      revisionsCount: 2,
      deliverables: ['Primary logo mark', 'Vector source SVG/EPS', 'Presentation-ready files'],
      popular: false,
      iconName: 'Sparkles',
    });
    setDeliverablesText('Primary logo mark\nVector source SVG/EPS\nPresentation-ready files');
    setIsAddingService(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingService(srv);
    setServiceSaveError(null);
    setServiceForm({ ...srv });
    setDeliverablesText(srv.deliverables.join('\n'));
    setIsAddingService(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingService(true);
    setServiceSaveError(null);

    const deliverablesList = deliverablesText
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    try {
      if (editingService) {
        const res = await updateServiceItem(editingService.id, {
          ...serviceForm,
          deliverables: deliverablesList,
        });
        if (res && !res.success) {
          setServiceSaveError(res.error || 'Failed to update service.');
          setIsSavingService(false);
          return;
        }
      } else {
        const newSrv: ServiceItem = {
          id: `srv-${Date.now()}`,
          name: serviceForm.name || 'New Design Service',
          category: serviceForm.category || 'Branding',
          shortDesc: serviceForm.shortDesc || '',
          startingPrice: Number(serviceForm.startingPrice) || 3000,
          turnaround: serviceForm.turnaround || '3–7 days',
          revisionsCount: Number(serviceForm.revisionsCount) || 2,
          deliverables: deliverablesList,
          popular: !!serviceForm.popular,
          iconName: serviceForm.iconName || 'Sparkles',
        };
        const res = await addServiceItem(newSrv);
        if (res && !res.success) {
          setServiceSaveError(res.error || 'Failed to create service.');
          setIsSavingService(false);
          return;
        }
      }
      setIsAddingService(false);
      setEditingService(null);
    } catch (err: any) {
      setServiceSaveError(err?.message || 'Error occurred while saving service.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Delete service package "${name}" from the website?`)) {
      await deleteServiceItem(id);
    }
  };

  // Canonical commission section classification (Active, Completed, Cancelled)
  const getCommissionSection = (status?: string): 'active' | 'completed' | 'cancelled' => {
    if (!status) return 'active';
    const s = status.toLowerCase().trim().replace(/[\s-]+/g, '_');
    if (s === 'completed') {
      return 'completed';
    }
    if (s === 'cancelled' || s === 'rejected') {
      return 'cancelled';
    }
    // ACTIVE: pending, reviewing, accepted, in_progress, for_review, revision, final_approval, etc.
    return 'active';
  };

  const activeCommissions = commissions.filter(c => getCommissionSection(c.status) === 'active');
  const completedCommissions = commissions.filter(c => getCommissionSection(c.status) === 'completed');
  const cancelledCommissions = commissions.filter(c => getCommissionSection(c.status) === 'cancelled');

  const displayedActiveCommissions = activeCommissions.filter(c => {
    if (activeStageFilter === 'all') return true;
    const s = (c.status || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (activeStageFilter === 'pending') {
      return s === 'pending' || s === 'request_submitted' || s === 'reviewing';
    }
    if (activeStageFilter === 'in_progress') {
      return s === 'in_progress' || s === 'accepted';
    }
    if (activeStageFilter === 'review') {
      return s === 'for_review' || s === 'revision' || s === 'client_review' || s === 'revision_requested' || s === 'final_approval';
    }
    return true;
  });

  // Calculate Needs Attention priority list
  const attentionItems = React.useMemo(() => {
    const items: {
      commissionId: string;
      projectName: string;
      clientName: string;
      reason: string;
      actionLabel: string;
      actionType: 'proof' | 'review' | 'chat';
    }[] = [];

    commissions.forEach(c => {
      const s = (c.status || '').toLowerCase();
      if (s === 'pending' || s === 'reviewing' || s === 'request_submitted') {
        items.push({
          commissionId: c.id,
          projectName: c.projectName,
          clientName: c.clientName,
          reason: 'New commission submission awaiting review',
          actionLabel: 'Review Request',
          actionType: 'review',
        });
      } else if (s === 'revision' || s === 'revision requested' || s === 'revision_requested') {
        items.push({
          commissionId: c.id,
          projectName: c.projectName,
          clientName: c.clientName,
          reason: 'Client submitted revision feedback on draft',
          actionLabel: 'Open Proofs',
          actionType: 'proof',
        });
      } else if (c.currentStage === 5 || s === 'for_review' || s === 'client review') {
        items.push({
          commissionId: c.id,
          projectName: c.projectName,
          clientName: c.clientName,
          reason: 'Stage 05 proof pending client sign-off',
          actionLabel: 'Inspect Proof',
          actionType: 'proof',
        });
      }
    });

    return items;
  }, [commissions]);

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#EA580C] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
          Verifying studio credentials...
        </p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-center mx-auto text-[#71717A] dark:text-[#A1A1AA]">
          <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Studio Director Access
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
            This production desk is reserved for authorized studio directors.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-6 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold text-xs transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const renderCommissionCard = (comm: Commission) => {
    const isSelected = comm.id === selectedCommissionId;

    return (
      <article
        key={comm.id}
        className={`bg-white dark:bg-[#18181B] border rounded-xl p-5 sm:p-6 transition-all space-y-5 ${
          isSelected ? 'border-[#EA580C] shadow-2xs' : 'border-[#E4E2DC] dark:border-[#27272A]'
        }`}
      >
        {/* Commission Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
          <div className="flex items-start gap-4">
            <img
              src={comm.clientAvatar}
              alt={comm.clientName}
              className="w-11 h-11 rounded-full object-cover ring-1 ring-[#E4E2DC] dark:ring-[#27272A] shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {comm.projectName}
                </h3>
                <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  #{comm.id.slice(0, 8)}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-[#EA580C] font-semibold uppercase">
                  {comm.serviceType}
                </span>
                <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                  {comm.budget}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] flex-wrap">
                <span>Client: <strong className="text-[#18181B] dark:text-[#EDEDEC] font-semibold">{comm.clientName}</strong></span>
                <span>·</span>
                <span>{comm.clientEmail}</span>
                <span>·</span>
                <span>Deadline: {formatCommissionDate(comm.deadline)}</span>
              </div>
            </div>
          </div>

          {/* Status & Priority Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <label htmlFor={`status-select-${comm.id}`} className="text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
                Status:
              </label>
              <select
                id={`status-select-${comm.id}`}
                value={
                  comm.status === 'In Progress' ? 'in_progress' :
                  comm.status === 'Client Review' ? 'for_review' :
                  comm.status === 'Revision Requested' ? 'revision' :
                  comm.status === 'Final Approval' || comm.status === 'final_approval' ? 'final_approval' :
                  comm.status === 'Rejected' ? 'cancelled' :
                  comm.status === 'Completed' ? 'completed' :
                  comm.status === 'Pending' ? 'pending' :
                  comm.status
                }
                disabled={statusUpdatingId === comm.id}
                onChange={(e) => handleStatusChange(comm.id, e.target.value as CommissionStatus)}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-md px-2.5 py-1 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {statusSuccessId === comm.id && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Saved</span>
              )}
            </div>

            {/* Priority Dropdown */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <label htmlFor={`priority-select-${comm.id}`} className="text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA]">
                Priority:
              </label>
              <select
                id={`priority-select-${comm.id}`}
                value={(comm.priority || 'normal').toLowerCase()}
                disabled={priorityUpdatingId === comm.id}
                onChange={(e) => handlePriorityChange(comm.id, e.target.value as CommissionPriority)}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-md px-2.5 py-1 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Links */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCommissionId(comm.id);
                  setActiveCommissionId(comm.id);
                  setActiveView('chat');
                }}
                title="Open Conversation"
                className="p-1.5 rounded-md border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] hover:bg-[#FAF9F6] dark:hover:bg-[#232327] transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCommissionId(comm.id);
                  setActiveCommissionId(comm.id);
                  setActiveAdminTab('proof-uploader');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold text-xs transition-opacity hover:opacity-90 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Proofs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Accept / Decline Bar if Pending */}
        {((comm.status as string) === 'Request Submitted' || comm.status === 'pending' || comm.status === 'Pending') && (
          <div className="p-3 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg flex items-center justify-between gap-3 text-xs">
            <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono">
              New commission proposal submitted by {comm.clientName}.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => acceptCommission(comm.id)}
                className="px-3 py-1 rounded bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => declineCommission(comm.id)}
                className="px-3 py-1 rounded border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] hover:text-red-600 text-xs transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* 8-Stage Interactive Production Bar */}
        <div className="pt-1">
          <ProgressBar commission={comm} interactiveAdmin={true} />
        </div>

        {/* Expandable Proofs and Deliverables Accordion Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExpandedProofsCommissionId(prev => prev === comm.id ? null : comm.id)}
              className="text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Layers className="w-3 h-3" />
              <span>{expandedProofsCommissionId === comm.id ? 'Hide Proofs' : 'Inspect Proofs'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExpandedDeliverablesCommissionId(prev => prev === comm.id ? null : comm.id)}
              className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] flex items-center gap-1 cursor-pointer"
            >
              <FolderArchive className="w-3 h-3" />
              <span>{expandedDeliverablesCommissionId === comm.id ? 'Hide Deliverables' : 'Final Deliverables'}</span>
            </button>
          </div>

          {/* Payment Status Toggles */}
          <div className="flex items-center gap-2">
            <span className="text-[#71717A] dark:text-[#A1A1AA]">Settlement:</span>
            {(['Unpaid', 'Partial', 'Paid'] as const).map((pStatus) => (
              <button
                key={pStatus}
                type="button"
                onClick={() => updatePaymentStatus(comm.id, pStatus)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  comm.paymentStatus === pStatus
                    ? pStatus === 'Paid'
                      ? 'bg-emerald-600 text-white font-bold'
                      : pStatus === 'Partial'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-red-600 text-white font-bold'
                    : 'bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                }`}
              >
                {pStatus}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Proofs Subsection */}
        {expandedProofsCommissionId === comm.id && (
          <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] animate-in fade-in duration-200">
            <AdminCreativeProofsSection
              commission={comm}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* Expanded Deliverables Subsection */}
        {expandedDeliverablesCommissionId === comm.id && (
          <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] animate-in fade-in duration-200">
            <AdminDeliverablesSection
              commission={comm}
              currentUser={currentUser}
            />
          </div>
        )}

      </article>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-in fade-in duration-300">
      
      {/* Studio Control Room Editorial Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <span>Brewster Creative — Studio</span>
              <span>·</span>
              <span className="text-[#EA580C] font-semibold">Production Desk</span>
              <span>·</span>
              <span>Director: {currentUser?.name || studioProfile.designerName}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
              Production & Commissions
            </h1>

            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-2xl leading-relaxed">
              Oversee client commissions, manage artwork deliverables, approve iterations, and publish portfolio works.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 font-mono text-xs self-start md:self-auto">
            <div>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block uppercase">Active Orders</span>
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] text-base font-display">
                {commissions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority 1: NEEDS ATTENTION SECTION */}
      {attentionItems.length > 0 && (
        <section className="bg-white dark:bg-[#18181B] border border-[#EA580C] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E4E2DC] dark:border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold">
                Needs Attention ({attentionItems.length})
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              High-priority review queue
            </span>
          </div>

          <div className="divide-y divide-[#E4E2DC] dark:divide-[#27272A]">
            {attentionItems.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] truncate">{item.projectName}</span>
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">·</span>
                    <span className="text-[#71717A] dark:text-[#A1A1AA] truncate">{item.clientName}</span>
                  </div>
                  <p className="text-[#71717A] dark:text-[#A1A1AA]">
                    {item.reason}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCommissionId(item.commissionId);
                    setActiveCommissionId(item.commissionId);
                    if (item.actionType === 'proof') {
                      setActiveAdminTab('proof-uploader');
                    } else if (item.actionType === 'chat') {
                      setActiveAdminTab('chat');
                    } else {
                      setActiveAdminTab('commissions');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] hover:bg-[#F4F2ED] dark:hover:bg-[#27272A] border border-[#E4E2DC] dark:border-[#27272A] font-semibold text-[#EA580C] transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Navigation Tabs */}
      <nav className="flex items-center gap-1 border-b border-[#E4E2DC] dark:border-[#27272A] pb-1 overflow-x-auto no-scrollbar" aria-label="Studio administration navigation">
        {[
          { id: 'commissions' as const, label: 'Production Ledger', icon: FolderArchive, count: commissions.length },
          { id: 'proof-uploader' as const, label: 'Creative Proofs', icon: UploadCloud },
          { id: 'clients' as const, label: 'Client Directory', icon: Users, count: clientList.length },
          { id: 'portfolio' as const, label: 'Portfolio Archive', icon: ImageIcon, count: portfolio.length },
          { id: 'services' as const, label: 'Studio Services', icon: Layers, count: services.length },
          { id: 'website-info' as const, label: 'Studio Profile', icon: Settings },
        ].map(({ id, label, icon: TabIcon, count }) => {
          const isSelected = activeAdminTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveAdminTab(id);
                setActiveDashboardTab(id);
              }}
              className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'text-[#18181B] dark:text-[#EDEDEC] font-bold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {typeof count === 'number' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]">
                  {count}
                </span>
              )}
              {isSelected && (
                <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#EA580C] rounded-full animate-in fade-in duration-200" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCTION LEDGER (ALL COMMISSIONS)               */}
      {/* ======================================================== */}
      {activeAdminTab === 'commissions' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Dynamic Summary Counters Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Counter Card */}
            <button
              type="button"
              onClick={() => setCommissionSection('active')}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                commissionSection === 'active'
                  ? 'bg-orange-50/50 dark:bg-orange-950/20 border-[#EA580C] ring-1 ring-[#EA580C] shadow-2xs'
                  : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-widest font-semibold text-[#EA580C]">
                  Active
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${activeCommissions.length > 0 ? 'bg-[#EA580C] animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {activeCommissions.length}
                </span>
                <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {activeCommissions.length === 1 ? 'commission' : 'commissions'}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5 font-mono">
                In progress, review & final approval
              </p>
            </button>

            {/* Completed Counter Card */}
            <button
              type="button"
              onClick={() => setCommissionSection('completed')}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                commissionSection === 'completed'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs'
                  : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-widest font-semibold text-emerald-600 dark:text-emerald-400">
                  Completed
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${completedCommissions.length > 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {completedCommissions.length}
                </span>
                <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {completedCommissions.length === 1 ? 'commission' : 'commissions'}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5 font-mono">
                Finished commission history & deliverables
              </p>
            </button>

            {/* Cancelled Counter Card */}
            <button
              type="button"
              onClick={() => setCommissionSection('cancelled')}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                commissionSection === 'cancelled'
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-500 ring-1 ring-zinc-500 shadow-2xs'
                  : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-widest font-semibold text-zinc-600 dark:text-zinc-400">
                  Cancelled
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${cancelledCommissions.length > 0 ? 'bg-zinc-400' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {cancelledCommissions.length}
                </span>
                <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  {cancelledCommissions.length === 1 ? 'commission' : 'commissions'}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5 font-mono">
                Cancelled or declined historical records
              </p>
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg flex-wrap">
              <button
                type="button"
                onClick={() => setCommissionSection('active')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  commissionSection === 'active'
                    ? 'bg-white dark:bg-[#18181B] text-[#EA580C] shadow-2xs border border-[#E4E2DC] dark:border-[#27272A]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                Active ({activeCommissions.length})
              </button>

              <button
                type="button"
                onClick={() => setCommissionSection('completed')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  commissionSection === 'completed'
                    ? 'bg-white dark:bg-[#18181B] text-emerald-600 dark:text-emerald-400 shadow-2xs border border-[#E4E2DC] dark:border-[#27272A]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                Completed ({completedCommissions.length})
              </button>

              <button
                type="button"
                onClick={() => setCommissionSection('cancelled')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                  commissionSection === 'cancelled'
                    ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] shadow-2xs border border-[#E4E2DC] dark:border-[#27272A]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                Cancelled ({cancelledCommissions.length})
              </button>

              <button
                type="button"
                onClick={() => setCommissionSection('all')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  commissionSection === 'all'
                    ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] font-semibold shadow-2xs border border-[#E4E2DC] dark:border-[#27272A]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
              >
                All Sections ({commissions.length})
              </button>
            </div>

            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Total database records: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{commissions.length}</strong>
            </span>
          </div>

          {/* ACTIVE SECTION */}
          {(commissionSection === 'active' || commissionSection === 'all') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block">
                    ACTIVE
                  </span>
                  <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {activeCommissions.length} {activeCommissions.length === 1 ? 'commission' : 'commissions'}
                  </p>
                </div>

                {/* Sub-filter only when viewing Active tab directly */}
                {commissionSection === 'active' && activeCommissions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] mr-1">Stage:</span>
                    {[
                      { key: 'all', label: `All Active (${activeCommissions.length})` },
                      { key: 'pending', label: 'Pending Review' },
                      { key: 'in_progress', label: 'In Progress' },
                      { key: 'review', label: 'In Review' },
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setActiveStageFilter(f.key)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          activeStageFilter === f.key
                            ? 'bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold'
                            : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] bg-[#FAF9F6] dark:bg-[#0F0F11]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {displayedActiveCommissions.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] space-y-2">
                  <Clock className="w-8 h-8 text-[#A1A1AA] mx-auto" />
                  <h4 className="font-display font-semibold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    No active commissions
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                    All commissions currently in progress, review, or awaiting approval appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedActiveCommissions.map(renderCommissionCard)}
                </div>
              )}
            </section>
          )}

          {/* COMPLETED SECTION */}
          {(commissionSection === 'completed' || commissionSection === 'all') && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold block">
                    COMPLETED
                  </span>
                  <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {completedCommissions.length} {completedCommissions.length === 1 ? 'commission' : 'commissions'}
                  </p>
                </div>
                <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Historical Delivered Records
                </span>
              </div>

              {completedCommissions.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#A1A1AA] mx-auto" />
                  <h4 className="font-display font-semibold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    No completed commissions yet
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                    Commissions marked as completed are permanently preserved here for reference.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedCommissions.map(renderCommissionCard)}
                </div>
              )}
            </section>
          )}

          {/* CANCELLED SECTION */}
          {(commissionSection === 'cancelled' || commissionSection === 'all') && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold block">
                    CANCELLED
                  </span>
                  <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                    {cancelledCommissions.length} {cancelledCommissions.length === 1 ? 'commission' : 'commissions'}
                  </p>
                </div>
                <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Historical Discontinued Records
                </span>
              </div>

              {cancelledCommissions.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] space-y-2">
                  <X className="w-8 h-8 text-[#A1A1AA] mx-auto" />
                  <h4 className="font-display font-semibold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                    No cancelled commissions
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                    Commissions that are cancelled or declined are kept here as historical records.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cancelledCommissions.map(renderCommissionCard)}
                </div>
              )}
            </section>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATIVE PROOFS UPLOADER                          */}
      {/* ======================================================== */}
      {activeAdminTab === 'proof-uploader' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block mb-1">
                Iteration Delivery
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Creative Proofs & Review Rounds
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="select-proof-commission" className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Project:
              </label>
              <select
                id="select-proof-commission"
                value={selectedCommissionId}
                onChange={(e) => {
                  setSelectedCommissionId(e.target.value);
                  setActiveCommissionId(e.target.value);
                }}
                className="bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-md px-3 py-1.5 text-xs text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C]"
              >
                {commissions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.projectName} ({c.clientName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentCommission && (
            <AdminCreativeProofsSection
              commission={currentCommission}
              currentUser={currentUser}
            />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CLIENT DIRECTORY                                  */}
      {/* ======================================================== */}
      {activeAdminTab === 'clients' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Client Roster
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Studio Client Directory ({clientList.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientList.map((client) => (
              <div
                key={client.email}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={client.avatar}
                    alt={client.name}
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

                <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-1 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
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

                <div className="pt-2 flex items-center justify-between gap-2">
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
      {/* TAB 5: PORTFOLIO SHOWCASE MANAGEMENT                     */}
      {/* ======================================================== */}
      {activeAdminTab === 'portfolio' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Exhibition Archive
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Portfolio Projects ({portfolio.length})
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
            {portfolio.map((proj) => (
              <div
                key={proj.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-[#FAF9F6] dark:bg-[#0F0F11]">
                    <img
                      src={proj.image}
                      alt={proj.title}
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

                  {/* Phase 5F: Project Type & Associated Service & Featured Controls */}
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
                        {services.map((svc) => (
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

                  {/* Phase 5F: Collapsible Editorial Case Study Narrative Accordion */}
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
      {/* TAB 6: STUDIO SERVICES                                   */}
      {/* ======================================================== */}
      {activeAdminTab === 'services' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
                Service Catalog
              </span>
              <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Studio Services ({services.length})
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
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-3"
              >
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

                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {srv.shortDesc}
                </p>

                <div className="pt-2 border-t border-[#E4E2DC] dark:border-[#27272A] flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
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

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: STUDIO PROFILE & BIO                              */}
      {/* ======================================================== */}
      {activeAdminTab === 'website-info' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold block mb-0.5">
              Studio Configuration
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

            <div className="grid grid-cols-2 gap-3">
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
      )}

      {/* ======================================================== */}
      {/* TAB 8: DIRECTOR ACCOUNT & PHOTO                          */}
      {/* ======================================================== */}
      {activeAdminTab === 'admin-account' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
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
      )}

      {/* ======================================================== */}
      {/* TAB 9: TYPOGRAPHY                                        */}
      {/* ======================================================== */}
      {activeAdminTab === 'typography' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
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
      )}

    </div>
  );
};
