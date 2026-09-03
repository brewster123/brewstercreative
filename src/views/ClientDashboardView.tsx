import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ClientReviewSection } from '../components/ClientReviewSection';
import { FinalDeliverySection } from '../components/FinalDeliverySection';
import { ChatWindow } from '../components/ChatWindow';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  RotateCcw, 
  DollarSign, 
  ShieldCheck, 
  FolderArchive, 
  MessageSquare, 
  FileText, 
  ExternalLink,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  User as UserIcon,
  Check
} from 'lucide-react';

export const ClientDashboardView: React.FC = () => {
  const { 
    currentUserCommissions = [], 
    activeCommission, 
    setActiveCommissionId, 
    setActiveView,
    updatePaymentStatus,
    currentUser,
    updateUserProfile,
    studioProfile,
    timelineUpdates = []
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'review' | 'timeline' | 'profile'>('overview');

  // Client profile editing state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileHandle, setProfileHandle] = useState(currentUser?.handle || '');
  const [profileContact, setProfileContact] = useState(currentUser?.contactMethod || 'Platform Chat & Email');
  const [profileBio, setProfileBio] = useState(currentUser?.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Keep in sync if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileHandle(currentUser.handle || '');
      setProfileContact(currentUser.contactMethod || 'Platform Chat & Email');
      setProfileBio(currentUser.bio || '');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUserProfile(currentUser.id, {
      name: profileName,
      email: profileEmail,
      handle: profileHandle,
      contactMethod: profileContact,
      bio: profileBio,
      avatar: profileAvatar || currentUser.avatar,
    });

    setProfileSavedMsg('Your personal client profile has been updated successfully!');
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-600 shadow-xs">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
            Sign In to Access Your Workspace
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Please sign in with your email to view your ongoing projects, approve milestone design proofs, and chat directly with Brewster.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveView('auth')}
            className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveView('commission-form')}
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            Start a Commission
          </button>
        </div>
      </div>
    );
  }

  const commission = activeCommission || (currentUserCommissions && currentUserCommissions.length > 0 ? currentUserCommissions[0] : undefined);

  if (!commission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-500">
          <FolderArchive className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
          No Active Commissions Found
        </h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          You don't have any ongoing graphic design commissions. Submit a new brief to collaborate with {studioProfile.designerName}.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-sm"
        >
          Start a Commission
        </button>
      </div>
    );
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono-code font-bold text-xs border border-emerald-200">✓ Fully Settled</span>;
      case 'Partial':
        return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-mono-code font-bold text-xs border border-amber-200">⚡ 50% Deposit Paid</span>;
      case 'Unpaid':
      default:
        return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-mono-code font-bold text-xs border border-rose-200">⏳ Awaiting Deposit</span>;
    }
  };

  const isFinalDelivery = commission.currentStage === 8 || commission.status === 'Completed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Commission Switcher (if multiple projects exist) */}
      {currentUserCommissions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-mono-code text-zinc-500 uppercase tracking-wider font-bold shrink-0">Your Projects:</span>
          {currentUserCommissions.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCommissionId(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                c.id === commission.id
                  ? 'bg-zinc-900 text-white font-bold shadow-sm'
                  : 'bg-white text-zinc-700 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              {c.projectName} ({c.status})
            </button>
          ))}
          <button
            onClick={() => setActiveView('commission-form')}
            className="px-4 py-2 rounded-full bg-white hover:bg-orange-50 text-orange-600 text-xs font-bold flex items-center gap-1.5 border border-orange-200 shrink-0 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Commission</span>
          </button>
        </div>
      )}

      {/* Main Project Header Bento Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code font-bold border border-orange-200">
                {commission.serviceType}
              </span>
              <span className="text-xs font-mono-code text-zinc-400 font-medium">
                Project Ref: #{commission.id.slice(0, 8)}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-black text-zinc-900">
              {commission.projectName}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Client: <strong className="text-zinc-800">{commission.clientName}</strong> • Assigned Designer: <strong className="text-orange-600">{commission.assignedDesigner}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="tab-open-chat"
              type="button"
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold border border-zinc-200 flex items-center gap-2 transition-all shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span>Studio Chat</span>
            </button>

            {commission.currentStage >= 5 && (
              <button
                id="tab-open-review"
                type="button"
                onClick={() => setActiveTab('review')}
                className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-sm shadow-orange-500/20 flex items-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Review Design Proofs</span>
              </button>
            )}
          </div>
        </div>

        {/* 8-Stage Progress Tracker Visual Component */}
        <div className="mt-8">
          <ProgressBar commission={commission} interactiveAdmin={false} />
        </div>
      </div>

      {/* Navigation Tabs for Client Dashboard - Bento Pills */}
      <div className="flex items-center gap-2 bg-zinc-100/90 p-1.5 rounded-2xl border border-zinc-200/80 overflow-x-auto no-scrollbar w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Project Specifications</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Designer Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'review'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Design Proof & Revisions</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Milestone Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>My Profile & Information</span>
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Final Delivery Card (If Stage 8 is reached) */}
          {isFinalDelivery && (
            <FinalDeliverySection commission={commission} />
          )}

          {/* Key Metrics Quick Stats Grid - Bento Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Status & Deadline */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Target Deadline
              </span>
              <div className="flex items-center gap-2 text-zinc-900 font-black text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{commission.deadline}</span>
              </div>
              <span className="text-[11px] text-zinc-400 block font-medium">
                Started on {commission.startDate}
              </span>
            </div>

            {/* Budget & Payment */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Budget & Settlement
              </span>
              <div className="flex items-center justify-between">
                <span className="text-zinc-900 font-display font-black text-base">
                  {commission.budget}
                </span>
                {getPaymentBadge(commission.paymentStatus)}
              </div>
              {commission.paymentStatus !== 'Paid' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => updatePaymentStatus(commission.id, commission.paymentStatus === 'Unpaid' ? 'Partial' : 'Paid')}
                    className="text-[11px] font-mono-code text-orange-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    {commission.paymentStatus === 'Unpaid' ? '💳 Settle 50% Deposit' : '💳 Settle Final Balance'}
                  </button>
                </div>
              )}
            </div>

            {/* Revisions Count */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Revisions Status
              </span>
              <div className="flex items-center gap-2 text-zinc-900 font-black text-base">
                <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{commission.revisionsUsed || 1} Used / {commission.revisionsAllowed || 3} Allowed</span>
              </div>
              <span className="text-[11px] text-zinc-400 block font-medium">
                Stage 05 handles revision loops
              </span>
            </div>

            {/* Stage Progress */}
            <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 space-y-1 shadow-xs">
              <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block font-bold">
                Current Completion
              </span>
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-lg text-orange-600">
                  {commission.progress}%
                </span>
                <span className="text-xs font-mono-code text-zinc-500 font-medium">
                  Stage {commission.currentStage} of 8
                </span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                <div 
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${commission.progress}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Project Brief Specifications & Details Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Full Brief Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-7 space-y-5 shadow-xs">
                <h3 className="font-display text-lg font-bold text-zinc-900 pb-3 border-b border-zinc-200/80 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Commission Project Details
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                      Project Description
                    </span>
                    <p className="text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-200/70 font-medium">
                      {commission.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Purpose & Context
                      </span>
                      <p className="text-zinc-800 font-semibold">
                        {commission.purpose || 'Commercial branding and digital release'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Target Audience
                      </span>
                      <p className="text-zinc-800 font-semibold">
                        {commission.targetAudience || 'Modern tech founders & design enthusiasts'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Aesthetic Style Direction
                      </span>
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold font-mono-code inline-block border border-orange-200">
                        {commission.preferredStyle}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Required Dimensions
                      </span>
                      <p className="text-zinc-800 text-xs font-mono-code font-semibold">
                        {commission.requiredDimensions || 'Vector SVG/AI + 300DPI Print'}
                      </p>
                    </div>
                  </div>

                  {/* Colors */}
                  {commission.preferredColors && commission.preferredColors.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1.5 font-bold">
                        Selected Brand Palette
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {commission.preferredColors.map((hex, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-mono-code text-zinc-800 font-medium shadow-2xs">
                            <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 shadow-2xs" style={{ backgroundColor: hex }}></span>
                            <span>{hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {commission.communicationGoals && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono-code text-zinc-500 uppercase tracking-wider block mb-1 font-bold">
                        Communication Goals
                      </span>
                      <p className="text-zinc-700 italic text-xs bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                        "{commission.communicationGoals}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Col: Client Contacts & Reference Assets */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Reference Links & Documents */}
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-4 shadow-xs">
                <h4 className="font-display text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-orange-500" />
                  Attached References ({commission.referenceImages?.length || 0 + (commission.referenceDocs?.length || 0)})
                </h4>

                {commission.referenceImages && commission.referenceImages.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-400 uppercase block mb-2 font-bold">
                      Inspiration Moodboard
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {commission.referenceImages.map((img, i) => (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                          <img src={img} alt="Reference" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {commission.referenceLinks && commission.referenceLinks.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono-code text-zinc-400 uppercase block mb-1.5 font-bold">
                      External Reference URLs
                    </span>
                    <ul className="space-y-1.5 text-xs">
                      {commission.referenceLinks.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 hover:underline flex items-center gap-1.5 truncate font-medium"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{link}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Designer Contact Card */}
              <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 space-y-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={studioProfile.avatar}
                    alt={studioProfile.designerName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-orange-500/30"
                  />
                  <div>
                    <h5 className="font-display font-bold text-sm text-zinc-900">
                      {studioProfile.designerName}
                    </h5>
                    <p className="text-xs text-orange-600 font-mono-code font-semibold">Studio Lead & Artist</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  Have questions about your commission or need to discuss modifications?
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Open Studio Chat</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <ChatWindow commission={commission} />
        </div>
      )}

      {/* TAB CONTENT 3: REVIEW PROOFS */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <ClientReviewSection commission={commission} />
        </div>
      )}

      {/* TAB CONTENT 4: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <ProgressTimeline updates={commission.timelineUpdates || timelineUpdates.filter(t => t.commissionId === commission.id)} />
        </div>
      )}

      {/* TAB CONTENT 5: MY PROFILE & INFORMATION */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          {/* Privilege explanation notice */}
          <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-950">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Client Profile & Privacy Control</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              As a client, you can manage and update your personal contact details, brand handles, and preferences here. You cannot edit the studio portfolio, services, or website settings—those are maintained by Brewster A. Cabando.
            </p>
          </div>

          {profileSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSavedMsg}</span>
            </div>
          )}

          <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-6 sm:p-8 shadow-xs">
            <h3 className="font-display text-lg font-black text-zinc-900 mb-1">
              Edit My Client Information
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-mono-code">
              Updates will automatically sync with your active commission brief and chat identity.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                <img
                  src={profileAvatar || currentUser?.avatar}
                  alt={profileName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-500/30 shrink-0"
                />
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Brand / Company Handle
                  </label>
                  <input
                    type="text"
                    value={profileHandle}
                    onChange={(e) => setProfileHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Preferred Communication Method
                  </label>
                  <select
                    value={profileContact}
                    onChange={(e) => setProfileContact(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                  >
                    <option value="Platform Chat & Email">Platform Chat & Email</option>
                    <option value="Discord">Discord</option>
                    <option value="Telegram">Telegram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email Only">Email Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">
                  Client Bio / Brand Note
                </label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="e.g. Founder at Solis Labs — Sustainable Tech Products"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
