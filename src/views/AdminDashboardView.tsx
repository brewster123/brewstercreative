import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Commission, 
  CommissionStatus,
  CommissionPriority,
  CommissionStageName, 
  COMMISSION_STAGES, 
  ServiceItem, 
  PortfolioProject,
  StudioProfile 
} from '../types';
import { ChatWindow } from '../components/ChatWindow';
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
  ChevronDown
} from 'lucide-react';
import { loadCustomFontFile, isFontLoaded } from '../utils/fontLoader';
import { formatCommissionDate } from '../utils/dateUtils';

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
    setActiveView 
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'commissions' | 'clients' | 'website-info' | 'portfolio' | 'services' | 'proof-uploader' | 'chat' | 'typography' | 'admin-account'
  >('commissions');

  const [selectedCommissionId, setSelectedCommissionId] = useState<string>(activeCommission?.id || commissions[0]?.id || '');
  const [commissionFilter, setCommissionFilter] = useState<string>('all');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Supabase Commission Status Management state (Phase 3B.2)
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
          [commissionId]: res.error || 'Failed to update commission status in Supabase.',
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

  // Supabase Commission Priority Management state (Phase 3B.3)
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
          [commissionId]: res.error || 'Failed to update commission priority in Supabase.',
        }));
      }
    } catch (err: any) {
      setPriorityErrorMap(prev => ({
        ...prev,
        [commissionId]: err?.message || 'An unexpected error occurred while updating priority.',
      }));
    } finally {
      setPriorityUpdatingId(null);
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
  
  // Proof upload form state
  const [proofNote, setProofNote] = useState('Version 2.1: Here are the refined brand identity icon marks, custom typography lockup, and dark/light collateral proofs.');
  const [proofImageInput, setProofImageInput] = useState('https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1200&auto=format&fit=crop&q=80');

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
    deliverables: ['Primary logo mark', 'Vector source SVG/EPS', 'Commercial license'],
    popular: false,
    iconName: 'Sparkles',
  });
  const [deliverablesText, setDeliverablesText] = useState('Primary logo mark\nVector source SVG/EPS\nCommercial license');

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
      setFontUploadMessage(`Successfully loaded & applied "${file.name}" as Primeform Pro Demo across the studio!`);
    } else {
      setFontUploadMessage('Could not load font file. Please provide a valid .otf, .ttf, or .woff2 file.');
    }
  };

  const handleStageChange = (commissionId: string, newStage: number) => {
    const stageObj = COMMISSION_STAGES.find(s => s.number === newStage);
    if (!stageObj) return;
    const stageName = stageObj.name as CommissionStageName;
    updateCommissionStage(commissionId, newStage, stageName, `Stage updated to ${stageName} by Designer.`);
  };

  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommission) return;

    uploadDesignReviewDraft(currentCommission.id, [proofImageInput], proofNote);
    alert(`Design proof submitted to Client Review stage for ${currentCommission.projectName}!`);
    setActiveAdminTab('commissions');
  };

  // Website Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudioProfile(profileForm);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3500);
  };

  // Portfolio Handlers
  const handleOpenAddProject = () => {
    setEditingProject(null);
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
    });
    setIsAddingProject(true);
  };

  const handleOpenEditProject = (proj: PortfolioProject) => {
    setEditingProject(proj);
    setProjectForm({ ...proj });
    setIsAddingProject(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updatePortfolioProject(editingProject.id, projectForm as Partial<PortfolioProject>);
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
        client: projectForm.client || 'Commission Client',
        tags: Array.isArray(projectForm.tags) ? projectForm.tags : ['Design'],
        featured: !!projectForm.featured,
      };
      addPortfolioProject(newProj);
    }
    setIsAddingProject(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: string, title: string) => {
    if (window.confirm(`Delete portfolio project "${title}" from the website?`)) {
      deletePortfolioProject(id);
    }
  };

  // Services Handlers
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: 'Branding',
      shortDesc: '',
      startingPrice: 3500,
      turnaround: '3–7 days',
      revisionsCount: 2,
      deliverables: ['Primary logo mark', 'Vector source SVG/EPS', 'Commercial license'],
      popular: false,
      iconName: 'Sparkles',
    });
    setDeliverablesText('Primary logo mark\nVector source SVG/EPS\nCommercial license');
    setIsAddingService(true);
  };

  const handleOpenEditService = (srv: ServiceItem) => {
    setEditingService(srv);
    setServiceForm({ ...srv });
    setDeliverablesText(srv.deliverables.join('\n'));
    setIsAddingService(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const deliverablesList = deliverablesText
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    if (editingService) {
      updateServiceItem(editingService.id, {
        ...serviceForm,
        deliverables: deliverablesList,
      });
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
      addServiceItem(newSrv);
    }
    setIsAddingService(false);
    setEditingService(null);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (window.confirm(`Delete service package "${name}" from the website?`)) {
      deleteServiceItem(id);
    }
  };

  const filteredCommissions = commissions.filter(c => {
    if (commissionFilter === 'all') return true;
    const s = (c.status || '').toLowerCase().replace(/\s+/g, '_');
    if (commissionFilter === 'pending') {
      return s === 'pending' || s === 'request_submitted' || s === 'reviewing';
    }
    if (commissionFilter === 'in_progress') {
      return s === 'in_progress' || s === 'accepted';
    }
    if (commissionFilter === 'review') {
      return s === 'for_review' || s === 'revision' || s === 'client_review' || s === 'revision_requested';
    }
    if (commissionFilter === 'completed') {
      return s === 'completed' || s === 'final_approval';
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
          <ShieldCheck className="w-6 h-6 text-orange-600" />
        </div>
        <p className="text-xs text-zinc-500 font-mono-code">
          Hydrating Supabase session & verifying studio director privileges...
        </p>
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
            Studio Director Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            This administrative dashboard is restricted to authorized studio directors. To access management tools, your account must have an administrator role assigned in the database.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Admin Studio Header Banner */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Admin personal account avatar */}
          <div className="relative shrink-0">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
              alt={currentUser?.name || 'Administrator'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-orange-500/20 shadow-xs"
            />
            <button
              type="button"
              onClick={() => setActiveAdminTab('admin-account')}
              title="Edit Admin Account Profile Photo"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-zinc-900 text-white hover:bg-orange-600 transition-colors shadow-xs border border-white cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono-code font-bold uppercase">
                Studio Owner Portal
              </span>
              <span className="text-xs text-zinc-500 font-mono-code font-medium">
                Administrator: <strong className="text-zinc-800">{currentUser?.name || studioProfile.designerName}</strong>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono-code">
                ({currentUser?.email || studioProfile.email})
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Designer Control & Website Management Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium max-w-2xl leading-relaxed">
              Full administrative control: customize your website profile & bio, publish or edit portfolio works, configure design packages & pricing, and oversee all client commission orders.
            </p>
          </div>
        </div>

        {/* Studio Slots & Orders Status Badge */}
        <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-200 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-mono-code text-zinc-400 uppercase block font-bold">Live Slots</span>
            <span className="font-display text-xl font-black text-emerald-600">
              {studioProfile.availableSlots} Available
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-200"></div>
          <div>
            <span className="text-[11px] font-mono-code text-zinc-400 uppercase block font-bold">All Orders</span>
            <span className="font-display text-xl font-black text-zinc-900">
              {commissions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'admin-tab-commissions', tab: 'commissions' as const, label: 'All Commissions', icon: FolderArchive, count: commissions.length },
            { id: 'admin-tab-clients', tab: 'clients' as const, label: 'Clients & Inquiries', icon: Users, count: clientList.length },
            { id: 'admin-tab-portfolio', tab: 'portfolio' as const, label: 'Edit Portfolio', icon: ImageIcon, count: portfolio.length },
            { id: 'admin-tab-services', tab: 'services' as const, label: 'Services & Pricing', icon: Layers, count: services.length },
            { id: 'admin-tab-website-info', tab: 'website-info' as const, label: 'Edit Website Info', icon: Settings, count: undefined },
            { id: 'admin-tab-account', tab: 'admin-account' as const, label: 'Admin Account & Profile', icon: UserCheck, count: undefined },
            { id: 'admin-tab-proofs', tab: 'proof-uploader' as const, label: 'Upload Proofs', icon: UploadCloud, count: undefined },
            { id: 'admin-tab-chat', tab: 'chat' as const, label: 'Client Chat', icon: MessageSquare, count: undefined },
            { id: 'admin-tab-typography', tab: 'typography' as const, label: 'Typography (Primeform Pro)', icon: Type, count: undefined },
          ]
        ).map(({ id, tab, label, icon: TabIcon, count }) => (
          <button
            key={id}
            id={id}
            type="button"
            title={label}
            aria-label={label}
            aria-current={activeAdminTab === tab ? 'true' : undefined}
            onClick={() => setActiveAdminTab(tab)}
            className={`relative shrink-0 w-11 h-11 rounded-full transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
              activeAdminTab === tab
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200'
            }`}
          >
            <TabIcon className="w-4 h-4" />
            {typeof count === 'number' && count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-orange-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ALL COMMISSIONS (BREWSTER SEES ALL CLIENT REQUESTS) */}
      {/* ======================================================== */}
      {activeAdminTab === 'commissions' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-500 uppercase font-mono-code mr-1">Filter:</span>
              {[
                { key: 'all', label: `All (${commissions.length})` },
                { key: 'pending', label: 'Pending Review' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'review', label: 'Proof Delivered' },
                { key: 'completed', label: 'Completed' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setCommissionFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    commissionFilter === f.key
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-500 font-mono-code">
              Showing {filteredCommissions.length} of {commissions.length} total client requests
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredCommissions.map((comm) => {
              const isSelected = comm.id === selectedCommissionId;

              return (
                <div
                  key={comm.id}
                  className={`bg-white border rounded-[32px] p-6 sm:p-7 transition-all shadow-xs ${
                    isSelected ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-[#E5E5E5] hover:border-zinc-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                    <div className="flex items-start gap-4">
                      <img
                        src={comm.clientAvatar}
                        alt={comm.clientName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg sm:text-xl font-black text-zinc-900">
                            {comm.projectName}
                          </h3>
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code bg-zinc-100 text-zinc-600 font-bold border border-zinc-200"
                            title={`Commission ID: ${comm.id}`}
                          >
                            ID: #{comm.id.length > 12 ? `${comm.id.slice(0, 8)}...` : comm.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono-code font-bold border ${
                            comm.status === 'Completed' || comm.status === 'Final Approval' || comm.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : comm.status === 'In Progress' || comm.status === 'in_progress' || comm.status === 'accepted'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : comm.status === 'Client Review' || comm.status === 'Revision Requested' || comm.status === 'for_review' || comm.status === 'reviewing' || comm.status === 'revision'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : comm.status === 'Rejected' || comm.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            Status: {formatCommissionStatus(comm.status)}
                          </span>
                          {/* Supabase Priority Selector (Phase 3B.3) */}
                          <div className="inline-flex items-center gap-1.5">
                            <div className={`relative inline-flex items-center rounded-full border pl-2.5 pr-6 py-0.5 text-[11px] font-mono-code font-bold transition-colors ${
                              (comm.priority || 'normal').toLowerCase() === 'urgent' || (comm.priority || 'normal').toLowerCase() === 'high'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}>
                              <label htmlFor={`priority-select-${comm.id}`} className="mr-1 select-none cursor-pointer">
                                Priority:
                              </label>
                              <select
                                id={`priority-select-${comm.id}`}
                                value={(comm.priority || 'normal').toLowerCase()}
                                disabled={priorityUpdatingId === comm.id}
                                onChange={(e) => handlePriorityChange(comm.id, e.target.value as CommissionPriority)}
                                className="appearance-none bg-transparent font-mono-code font-bold focus:outline-none cursor-pointer disabled:opacity-50"
                                title="Update commission priority in Supabase"
                              >
                                {PRIORITY_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value} className="bg-white text-zinc-900 font-sans">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-current">
                                {priorityUpdatingId === comm.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 opacity-60" />
                                )}
                              </div>
                            </div>
                            {prioritySuccessId === comm.id && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono-code font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300 animate-fade-in">
                                <Check className="w-3 h-3 text-emerald-600" /> Saved
                              </span>
                            )}
                          </div>
                          <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
                            {comm.serviceType}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                            Budget: {comm.budget}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                          <span>Client: <strong className="text-zinc-800 font-bold">{comm.clientName}</strong> ({comm.clientEmail})</span>
                          <span>•</span>
                          <span>Date Submitted: <strong className="text-zinc-700 font-semibold">{formatCommissionDate(comm.createdAt)}</strong></span>
                          <span>•</span>
                          <span>Deadline: <strong className="text-orange-600 font-bold">{formatCommissionDate(comm.deadline)}</strong></span>
                        </p>

                        {/* Direct Email & Contact Actions for Brewster */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <a
                            id={`btn-email-client-${comm.id}`}
                            href={`mailto:${comm.clientEmail}?subject=${encodeURIComponent(`Brewster Creative — Update on ${comm.projectName}`)}&body=${encodeURIComponent(`Hi ${comm.clientName},\n\nThis is Brewster from Brewster Creative following up on your project "${comm.projectName}".\n\n`)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors"
                            title={`Open email client to contact ${comm.clientEmail}`}
                          >
                            <Mail className="w-3.5 h-3.5 text-orange-600" />
                            <span>Email Client</span>
                          </a>

                          <button
                            id={`btn-copy-email-${comm.id}`}
                            type="button"
                            onClick={() => handleCopyEmail(comm.clientEmail, `comm-${comm.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold border border-zinc-200 transition-colors cursor-pointer"
                            title="Copy client email to clipboard"
                          >
                            {copiedEmailId === `comm-${comm.id}` ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold text-xs">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Copy Email</span>
                              </>
                            )}
                          </button>

                          {comm.clientHandle && (
                            <span className="px-2.5 py-1 rounded-xl bg-zinc-50 text-zinc-600 text-xs font-mono-code border border-zinc-200">
                              {comm.clientHandle}
                            </span>
                          )}

                          {comm.contactMethod && (
                            <span className="px-2.5 py-1 rounded-xl bg-zinc-50 text-zinc-500 text-xs font-medium border border-zinc-200">
                              Contact: {comm.contactMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons & Status Management for Designer */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {/* Status Dropdown Selector (Phase 3B.2 Supabase backed) */}
                      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-1.5">
                        <label
                          htmlFor={`status-select-${comm.id}`}
                          className="text-[11px] font-bold text-zinc-500 font-mono-code uppercase tracking-wider shrink-0"
                        >
                          Status:
                        </label>
                        <div className="relative inline-flex items-center">
                          <select
                            id={`status-select-${comm.id}`}
                            value={
                              comm.status === 'In Progress' ? 'in_progress' :
                              comm.status === 'Client Review' ? 'for_review' :
                              comm.status === 'Revision Requested' ? 'revision' :
                              comm.status === 'Final Approval' ? 'for_review' :
                              comm.status === 'Rejected' ? 'cancelled' :
                              comm.status === 'Completed' ? 'completed' :
                              comm.status === 'Pending' ? 'pending' :
                              comm.status
                            }
                            disabled={statusUpdatingId === comm.id}
                            onChange={(e) => handleStatusChange(comm.id, e.target.value as CommissionStatus)}
                            className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono-code font-bold bg-white text-zinc-900 border border-zinc-200 rounded-xl hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 cursor-pointer transition-colors"
                            title="Update commission status in Supabase"
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
                            {statusUpdatingId === comm.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                          </div>
                        </div>
                        {statusSuccessId === comm.id && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono-code font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-300 animate-fade-in">
                            <Check className="w-3 h-3 text-emerald-600" /> Saved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {comm.status === 'Request Submitted' && (
                          <>
                            <button
                              type="button"
                              onClick={() => acceptCommission(comm.id)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Commission</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => declineCommission(comm.id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCommissionId(comm.id);
                            setActiveCommissionId(comm.id);
                            setActiveAdminTab('proof-uploader');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Proof</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCommissionId(comm.id);
                            setActiveCommissionId(comm.id);
                            setActiveAdminTab('chat');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-200"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Client Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Supabase status update error banner if any */}
                  {statusErrorMap[comm.id] && (
                    <div className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{statusErrorMap[comm.id]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStatusErrorMap(prev => {
                          const copy = { ...prev };
                          delete copy[comm.id];
                          return copy;
                        })}
                        className="text-rose-400 hover:text-rose-700 font-bold ml-3 text-sm leading-none cursor-pointer"
                        title="Dismiss error"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Supabase priority update error banner if any */}
                  {priorityErrorMap[comm.id] && (
                    <div className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{priorityErrorMap[comm.id]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPriorityErrorMap(prev => {
                          const copy = { ...prev };
                          delete copy[comm.id];
                          return copy;
                        })}
                        className="text-rose-400 hover:text-rose-700 font-bold ml-3 text-sm leading-none cursor-pointer"
                        title="Dismiss error"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Stage Controller Selector */}
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-500" />
                        Update Project Milestone Stage:
                      </span>
                      <span className="font-mono-code font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        Current: Stage 0{comm.currentStage} — {COMMISSION_STAGES.find(s => s.number === comm.currentStage)?.name} ({comm.progress}%)
                      </span>
                    </div>

                    {/* Stage selector bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {COMMISSION_STAGES.map((s) => {
                        const isCurrent = comm.currentStage === s.number;
                        const isPassed = comm.currentStage > s.number;

                        return (
                          <button
                            key={s.number}
                            type="button"
                            onClick={() => handleStageChange(comm.id, s.number)}
                            className={`p-2.5 rounded-xl text-left transition-all text-xs flex flex-col justify-between border ${
                              isCurrent
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm ring-2 ring-orange-500/30'
                                : isPassed
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <span className="font-mono-code font-black text-[10px] block opacity-70">
                              0{s.number}
                            </span>
                            <span className="font-bold text-[11px] line-clamp-1 mt-1">
                              {s.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Status Switcher & Project Notes */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 font-bold">Payment Status:</span>
                      {(['Unpaid', 'Partial', 'Paid'] as const).map((pStatus) => (
                        <button
                          key={pStatus}
                          type="button"
                          onClick={() => updatePaymentStatus(comm.id, pStatus)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                            comm.paymentStatus === pStatus
                              ? pStatus === 'Paid' 
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : pStatus === 'Partial'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-rose-500 text-white border-rose-500'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                          }`}
                        >
                          {pStatus}
                        </button>
                      ))}
                    </div>

                    <div className="text-zinc-400 font-mono-code text-[11px]">
                      Date Submitted: {formatCommissionDate(comm.createdAt)} • Deadline: {formatCommissionDate(comm.deadline)} • Revisions Used: {comm.revisionsUsed}/{comm.revisionsAllowed}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CLIENTS & CONTACT DIRECTORY (FOR BREWSTER OUTREACH) */}
      {/* ======================================================== */}
      {activeAdminTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E5E5E5] shadow-xs">
            <div>
              <h3 className="font-display text-xl font-black text-zinc-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>Client Contact Directory</span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Quick access to all client email addresses, contact handles, and commission histories.
              </p>
            </div>

            <div className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl font-medium">
              Total Clients on Record: <strong className="text-zinc-900 font-bold">{clientList.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientList.map((client) => {
              return (
                <div 
                  key={client.email}
                  className="bg-white border border-zinc-200/90 rounded-[28px] p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={client.avatar} 
                      alt={client.name} 
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-zinc-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-bold text-base text-zinc-900 truncate">
                          {client.name}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[11px] font-bold shrink-0">
                          {client.commissionsCount} {client.commissionsCount === 1 ? 'Project' : 'Projects'}
                        </span>
                      </div>

                      {/* Email address row */}
                      <p className="text-xs text-zinc-500 font-mono-code truncate mt-0.5">
                        {client.email}
                      </p>

                      {/* Additional contact metadata */}
                      <div className="flex items-center gap-2 flex-wrap mt-2.5">
                        {client.handle && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-mono-code">
                            {client.handle}
                          </span>
                        )}
                        {client.contactMethod && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 text-[11px]">
                            {client.contactMethod}
                          </span>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1 font-mono-code"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </a>
                        )}
                      </div>

                      {client.latestProject && (
                        <p className="text-xs text-zinc-600 mt-2">
                          Latest Project: <strong className="text-zinc-900">{client.latestProject}</strong>
                          {client.latestStatus && (
                            <span className="text-zinc-400 font-normal"> ({client.latestStatus})</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Outreach Action Buttons */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${client.email}?subject=${encodeURIComponent(`Brewster Creative — Hello ${client.name}`)}&body=${encodeURIComponent(`Hi ${client.name},\n\nThis is Brewster from Brewster Creative.\n\n`)}`}
                        className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Email</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyEmail(client.email, `client-dir-${client.id}`)}
                        className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-all border border-zinc-200 flex items-center gap-1.5"
                      >
                        {copiedEmailId === `client-dir-${client.id}` ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Copy Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const comm = commissions.find(c => c.clientEmail.toLowerCase() === client.email.toLowerCase() || c.clientId === client.id);
                        if (comm) {
                          setSelectedCommissionId(comm.id);
                          setActiveCommissionId(comm.id);
                        }
                        setActiveAdminTab('chat');
                      }}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all border border-zinc-200 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Open Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeAdminTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E5E5E5] shadow-xs">
            <div>
              <h3 className="font-display text-xl font-black text-zinc-900">
                Portfolio Projects Manager
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Add, edit, or remove showcase pieces displayed on the public Portfolio page.
              </p>
            </div>

            <button
              id="btn-admin-add-portfolio"
              type="button"
              onClick={handleOpenAddProject}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Portfolio Project</span>
            </button>
          </div>

          {/* Add / Edit Project Modal/Form */}
          {isAddingProject && (
            <div className="bg-white border-2 border-orange-400 rounded-[28px] p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h4 className="font-display text-lg font-black text-zinc-900">
                  {editingProject ? `Edit Project: ${editingProject.title}` : 'Publish New Portfolio Project'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectForm.title || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      placeholder="e.g. Nexus Cybernetics Identity"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Category *
                    </label>
                    <select
                      value={projectForm.category || 'Branding'}
                      onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value as any })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    >
                      <option value="Branding">Branding</option>
                      <option value="Logo">Logo</option>
                      <option value="Poster">Poster</option>
                      <option value="Illustration">Illustration</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Book Covers">Book Covers</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Client / Brand Name
                    </label>
                    <input
                      type="text"
                      value={projectForm.client || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                      placeholder="e.g. Solis Labs, Tokyo"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Cover Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={projectForm.image || ''}
                      onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Short Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.shortDesc || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, shortDesc: e.target.value })}
                    placeholder="Brief 1-sentence synopsis for the portfolio grid card"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Detailed Case Study Story
                  </label>
                  <textarea
                    rows={3}
                    value={projectForm.fullDesc || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, fullDesc: e.target.value })}
                    placeholder="Provide context on client goals, typographic decisions, and deliverable suite..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="chk-featured"
                    checked={!!projectForm.featured}
                    onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <label htmlFor="chk-featured" className="text-xs font-bold text-zinc-800">
                    Feature on Homepage Carousel
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs"
                  >
                    {editingProject ? 'Save Project Changes' : 'Publish Project'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((proj) => (
              <div 
                key={proj.id} 
                className="bg-white border border-[#E5E5E5] rounded-[28px] overflow-hidden shadow-xs flex flex-col justify-between group hover:border-zinc-400 transition-all"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-zinc-100 relative">
                    <img
                      src={proj.image}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/70 backdrop-blur-md text-[10px] font-mono-code text-white font-bold uppercase">
                      {proj.category}
                    </span>
                    {proj.featured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-xs">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 className="font-display font-black text-base text-zinc-900 line-clamp-1">
                      {proj.title}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-medium">
                      {proj.shortDesc}
                    </p>
                    <div className="text-[11px] text-zinc-400 font-mono-code pt-2">
                      Client: {proj.client || 'Direct Commission'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono-code">
                    ID: {proj.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProject(proj)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:border-zinc-300 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                      title="Delete from Portfolio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SERVICES & PRICING MANAGER (EDIT RATES & PACKAGES) */}
      {/* ======================================================== */}
      {activeAdminTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E5E5E5] shadow-xs">
            <div>
              <h3 className="font-display text-xl font-black text-zinc-900">
                Services & Pricing Manager
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Configure rates, deliverables, and turnarounds shown on the public Services & Pricing page.
              </p>
            </div>

            <button
              id="btn-admin-add-service"
              type="button"
              onClick={handleOpenAddService}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service Package</span>
            </button>
          </div>

          {/* Add / Edit Service Modal/Form */}
          {isAddingService && (
            <div className="bg-white border-2 border-orange-400 rounded-[28px] p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h4 className="font-display text-lg font-black text-zinc-900">
                  {editingService ? `Edit Package: ${editingService.name}` : 'Create New Service Package'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingService(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.name || ''}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="e.g. Brand Identity Package"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.category || ''}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      placeholder="e.g. Branding, Posters, Illustration"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Starting Price ({studioProfile.currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={serviceForm.startingPrice || 3500}
                      onChange={(e) => setServiceForm({ ...serviceForm, startingPrice: Number(e.target.value) })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 font-mono-code font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Estimated Turnaround *
                    </label>
                    <input
                      type="text"
                      required
                      value={serviceForm.turnaround || '3–7 days'}
                      onChange={(e) => setServiceForm({ ...serviceForm, turnaround: e.target.value })}
                      placeholder="e.g. 5–10 days"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Included Revisions
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={serviceForm.revisionsCount || 2}
                      onChange={(e) => setServiceForm({ ...serviceForm, revisionsCount: Number(e.target.value) })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Short Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceForm.shortDesc || ''}
                    onChange={(e) => setServiceForm({ ...serviceForm, shortDesc: e.target.value })}
                    placeholder="Clear description of what this service delivers"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Deliverables List (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={deliverablesText}
                    onChange={(e) => setDeliverablesText(e.target.value)}
                    placeholder="Primary vector logo&#10;Color palette breakdown&#10;Typography guidelines"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 font-mono-code focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-popular"
                    checked={!!serviceForm.popular}
                    onChange={(e) => setServiceForm({ ...serviceForm, popular: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <label htmlFor="chk-popular" className="text-xs font-bold text-zinc-800">
                    Mark as "Most Popular" on Services page
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs"
                  >
                    {editingService ? 'Save Package Changes' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => (
              <div 
                key={srv.id} 
                className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-4 shadow-xs flex flex-col justify-between hover:border-zinc-400 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono-code text-orange-600 font-bold uppercase">{srv.category}</span>
                    <span className="font-display font-black text-xl text-zinc-900">
                      {studioProfile.currencySymbol}{srv.startingPrice.toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-display font-black text-lg text-zinc-900">{srv.name}</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">{srv.shortDesc}</p>

                  <div className="mt-4 pt-3 border-t border-zinc-100 space-y-1.5 text-xs text-zinc-600">
                    <div className="font-bold text-[11px] text-zinc-400 uppercase font-mono-code">Included Deliverables:</div>
                    {srv.deliverables.map((del, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono-code">
                    {srv.turnaround} • {srv.revisionsCount} Revs
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditService(srv)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: EDIT WEBSITE INFO & ARTIST PROFILE */}
      {/* ======================================================== */}
      {activeAdminTab === 'website-info' && (
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Website Content & Artist Identity Synchronization</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Changes saved here instantly update the public homepage hero, artist statement, navigation logo, footer, and commission availability banner across the entire website.
            </p>
          </div>

          {profileSaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Website information and studio settings have been saved successfully!</span>
            </div>
          )}

          <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 space-y-8 shadow-xs">
            <h3 className="font-display text-xl font-black text-zinc-900 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Edit Artist & Website Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Designer Studio Photo row (System 1: Studio / Website Photo) */}
              <div className="p-1">
                <StudioPhotoUploader
                  adminUserId={currentUser?.id || 'usr-admin-1'}
                  currentPhoto={profileForm.avatar || studioProfile.avatar}
                  onPhotoUpdated={(newUrl) => {
                    setProfileForm(prev => ({ ...prev, avatar: newUrl }));
                  }}
                  label="Brewster A. Cabando — Studio / Website Brand Photo"
                  description="Professional portrait representing the designer on the public homepage 'Meet The Designer' section. Changing this photo updates the public website and does NOT change your personal account avatar."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Artist Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.designerName}
                    onChange={(e) => setProfileForm({ ...profileForm, designerName: e.target.value })}
                    placeholder="Brewster A. Cabando"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Studio Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.studioName}
                    onChange={(e) => setProfileForm({ ...profileForm, studioName: e.target.value })}
                    placeholder="Brewster Creative"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Professional Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    placeholder="Multimedia Artist & Brand Designer"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Studio Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="brewstercreates@gmail.com"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Artist Bio / Studio Statement *
                </label>
                <textarea
                  rows={4}
                  required
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Commission Availability Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Available Commission Slots
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={profileForm.availableSlots}
                    onChange={(e) => setProfileForm({ ...profileForm, availableSlots: Number(e.target.value) })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono-code font-bold text-zinc-900 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-zinc-400 font-mono-code block mt-1">
                    Shown on homepage hero badge
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Commission Status
                  </label>
                  <select
                    value={profileForm.commissionStatus}
                    onChange={(e) => setProfileForm({ ...profileForm, commissionStatus: e.target.value as any })}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="open">Open for Commissions</option>
                    <option value="waitlist">Waitlist Only</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={profileForm.currencySymbol}
                    onChange={(e) => setProfileForm({ ...profileForm, currencySymbol: e.target.value })}
                    placeholder="₱"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono-code font-bold text-zinc-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-save-website-profile"
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Website Content</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ADMIN PERSONAL ACCOUNT PROFILE (SYSTEM 2) */}
      {/* ======================================================== */}
      {activeAdminTab === 'admin-account' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <UserCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Administrator Personal Account Profile</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              This is your individual administrator account profile. Your profile photo is used for your personal login session, top navigation bar, and client chat conversations.
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 space-y-8 shadow-xs">
            <h3 className="font-display text-xl font-black text-zinc-900 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              My Administrator Account Profile
            </h3>

            {/* Account Profile Photo Uploader with Facebook-style crop */}
            {currentUser?.id ? (
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200">
                <ProfilePhotoUploader
                  userId={currentUser.id}
                  currentAvatar={currentUser.avatar}
                  label="Administrator Account Profile Photo"
                  description="Upload and adjust your personal account portrait with the circular crop editor. Changing this will NOT modify the public Studio/Website photo on the homepage."
                  avatarSizeClass="w-20 h-20 sm:w-24 sm:h-24"
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500 font-mono-code">
                Loading administrator session...
              </div>
            )}

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Account Name
                </label>
                <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-800 font-medium">
                  {currentUser?.name || 'Brewster A. Cabando'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Login Email
                </label>
                <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-700 font-mono-code">
                  {currentUser?.email || 'admin@brewstercreative.com'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Account Role
                </label>
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs text-emerald-800 font-bold uppercase tracking-wider font-mono-code">
                  Studio Owner / Administrator
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Storage Path Pattern
                </label>
                <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-600 font-mono-code truncate">
                  avatars/{currentUser?.id || 'usr-admin-1'}/profile-*.jpg
                </div>
              </div>
            </div>

            {/* Notice card explaining separation */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-start gap-3 text-xs text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Two Independent Systems:</strong> This account profile photo is strictly your personal account picture (stored in <code className="text-zinc-800 font-mono-code">public.profiles.avatar</code>). The public homepage <em>Meet The Designer</em> studio photo is managed separately under <button type="button" onClick={() => setActiveAdminTab('website-info')} className="text-orange-600 font-bold underline cursor-pointer">Edit Website Info</button>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: UPLOAD PROOF DRAFTS */}
      {/* ======================================================== */}
      {activeAdminTab === 'proof-uploader' && (
        <div className="max-w-2xl mx-auto bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-zinc-900">
                Upload Proof Draft for Client Review (Stage 05)
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Target Project: <strong className="text-zinc-800 font-bold">{currentCommission?.projectName}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadProof} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Select Active Commission
              </label>
              <select
                value={selectedCommissionId}
                onChange={(e) => setSelectedCommissionId(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
              >
                {commissions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.projectName} ({c.clientName}) — Current: {formatCommissionStatus(c.status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                High-Resolution Proof Image URL
              </label>
              <input
                type="url"
                required
                value={proofImageInput}
                onChange={(e) => setProofImageInput(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                Direct image link or rendered mockup preview to present for client feedback.
              </p>
            </div>

            {/* Proof Preview Box */}
            {proofImageInput && (
              <div className="rounded-[24px] overflow-hidden border border-zinc-200 aspect-[16/9] bg-zinc-100 relative">
                <img src={proofImageInput} alt="Proof preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-[10px] font-mono-code text-white font-bold">
                  Live Preview
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Designer Notes for Client
              </label>
              <textarea
                rows={4}
                required
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                placeholder="Explain the concepts, iterations made, color choices, and ask for client feedback..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAdminTab('commissions')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                id="btn-submit-proof-draft"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Publish to Client Review</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: CLIENT MESSAGES */}
      {/* ======================================================== */}
      {activeAdminTab === 'chat' && currentCommission && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-[24px] border border-[#E5E5E5] shadow-xs">
            <span className="text-xs font-mono-code text-zinc-500 uppercase font-bold">Chatting with:</span>
            <select
              value={selectedCommissionId}
              onChange={(e) => {
                setSelectedCommissionId(e.target.value);
                setActiveCommissionId(e.target.value);
              }}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-bold"
            >
              {commissions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName} ({c.projectName})
                </option>
              ))}
            </select>
          </div>

          <ChatWindow commission={currentCommission} />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: BRAND TYPOGRAPHY (PRIMEFORM PRO DEMO) */}
      {/* ======================================================== */}
      {activeAdminTab === 'typography' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="font-display text-lg font-black text-zinc-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-500" />
                Typography & Brand Typeface
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono-code font-bold">
                Active: Primeform Pro Demo
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800">Primary Font Family:</span>
                  <span className="font-mono-code font-bold text-orange-600">Primeform Pro Demo</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                  The application is configured to use <strong className="text-zinc-900">Primeform Pro Demo</strong> for all headings, display titles, navigation, and body copy. If you have the font installed on your computer, the browser renders it automatically.
                </p>
              </div>

              {/* Sample Typography Test Card */}
              <div className="p-5 rounded-2xl bg-zinc-950 text-white space-y-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono-code">
                  <span>LIVE TYPE SPECIMEN</span>
                  <span>GEOMETRIC SANS-SERIF</span>
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Primeform Pro Demo
                </div>
                <div className="text-xs text-zinc-300 font-normal leading-relaxed">
                  The quick brown fox jumps over the lazy dog. 0123456789 & @ $ ₱ ! ?
                </div>
                <div className="text-[11px] text-zinc-500 font-mono-code pt-2 border-t border-zinc-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  CSS font-family: 'Primeform Pro Demo', 'Primeform Pro', 'Plus Jakarta Sans', sans-serif
                </div>
              </div>

              {/* Optional Font File Dropper / Bundler */}
              <div className="border-2 border-dashed border-zinc-200 hover:border-orange-400 rounded-2xl p-5 text-center transition-colors">
                <input
                  type="file"
                  id="font-file-input"
                  accept=".otf,.ttf,.woff,.woff2"
                  onChange={handleFontFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="font-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-900 hover:text-orange-600">
                      Upload Primeform Pro Demo Font File
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                      Optional: Load a local .otf, .ttf, or .woff2 file directly into this browser session
                    </p>
                  </div>
                </label>

                {fontUploadMessage && (
                  <div className="mt-3 p-2.5 rounded-xl bg-orange-50 text-orange-700 text-xs font-mono-code font-bold">
                    {fontUploadMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
