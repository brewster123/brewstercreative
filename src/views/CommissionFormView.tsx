import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCommissionDate } from '../utils/dateUtils';
import { isValidReferenceUrl } from '../utils/urlUtils';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CommissionFormView: React.FC = () => {
  const { 
    currentUser, 
    services, 
    studioProfile, 
    submitCommissionRequest, 
    preselectedService, 
    setPreselectedService,
    setActiveView 
  } = useApp();

  // Commission Form Fields
  const [serviceType, setServiceType] = useState(preselectedService || 'Brand Identity Package');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [referenceLinksInput, setReferenceLinksInput] = useState('');
  const [requiredDimensions, setRequiredDimensions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [budget, setBudget] = useState('5000');
  const [deadline, setDeadline] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [referenceLinksError, setReferenceLinksError] = useState<string | null>(null);
  const [submittedCommission, setSubmittedCommission] = useState<any | null>(null);

  // Tomorrow's date string for input min attribute
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Sync preselectedService if passed from Portfolio or Services page
  useEffect(() => {
    if (preselectedService) {
      const matchingService = services.find(
        s => s.name.toLowerCase() === preselectedService.toLowerCase() ||
             s.category.toLowerCase() === preselectedService.toLowerCase()
      );
      if (matchingService) {
        setServiceType(matchingService.name);
        setBudget(matchingService.startingPrice.toString());
      } else {
        setServiceType(preselectedService);
      }
    }
  }, [preselectedService, services]);

  // When serviceType changes, update recommended budget default
  const handleServiceChange = (newService: string) => {
    setServiceType(newService);
    const match = services.find(s => s.name === newService);
    if (match) {
      setBudget(match.startingPrice.toString());
    }
  };

  const selectedServiceItem = services.find(s => s.name === serviceType);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPurpose('');
    setTargetAudience('');
    setPreferredStyle('');
    setColorsInput('');
    setReferenceLinksInput('');
    setRequiredDimensions('');
    setAdditionalNotes('');
    setDeadline('');
    setFormError(null);
    setReferenceLinksError(null);
    setSubmittedCommission(null);
    if (services.length > 0) {
      setServiceType(services[0].name);
      setBudget(services[0].startingPrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setReferenceLinksError(null);

    // Authentication Guard
    if (!currentUser) {
      setFormError('You must be signed in to submit a commission request. Please sign in or register to continue.');
      return;
    }

    // Validation for required fields
    if (!serviceType) {
      setFormError('Please select a service for your commission.');
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Please enter a project title.');
      return;
    }
    if (cleanTitle.length < 3) {
      setFormError('Project title must be at least 3 characters long.');
      return;
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      setFormError('Please provide a project description detailing your requirements.');
      return;
    }
    if (cleanDesc.length < 10) {
      setFormError('Project description should be at least 10 characters so we can understand your vision.');
      return;
    }

    const numericBudget = parseFloat(budget.replace(/[^0-9.]/g, ''));
    if (isNaN(numericBudget) || numericBudget <= 0) {
      setFormError('Please enter a valid budget amount greater than 0.');
      return;
    }

    if (!deadline) {
      setFormError('Please select a desired deadline for the project.');
      return;
    }

    // Parse preferredColors array from input
    const parsedColors = colorsInput
      .split(/[\n,]+/)
      .map(c => c.trim())
      .filter(Boolean);

    // Parse referenceLinks array from input
    const parsedReferenceLinks = referenceLinksInput
      .split(/[\n,]+/)
      .map(l => l.trim())
      .filter(Boolean);

    // Validate reference links individually (must be authentic web URLs)
    const invalidLinks = parsedReferenceLinks.filter(l => !isValidReferenceUrl(l));
    if (invalidLinks.length > 0) {
      const errorMsg = 'Please enter a valid URL beginning with https://';
      setReferenceLinksError(errorMsg);
      setFormError(errorMsg);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await submitCommissionRequest({
        serviceType,
        title: cleanTitle,
        description: cleanDesc,
        budget: numericBudget,
        deadline,
        purpose: purpose.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        preferredStyle: preferredStyle.trim() || undefined,
        preferredColors: parsedColors.length > 0 ? parsedColors : undefined,
        requiredDimensions: requiredDimensions.trim() || undefined,
        referenceLinks: parsedReferenceLinks.length > 0 ? parsedReferenceLinks : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      if (response.success && response.commission) {
        setSubmittedCommission(response.commission);
        setPreselectedService(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(response.error || 'Failed to submit commission request to Supabase. Please try again.');
      }
    } catch (err: any) {
      console.error('[Commission Form] Submission error:', err);
      setFormError(err?.message || 'An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION STATE (Editorial Studio Receipt)
  if (submittedCommission) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-in fade-in duration-300 space-y-10">
        
        {/* Receipt Header */}
        <div className="space-y-4 border-b border-[#E4E2DC] dark:border-[#27272A] pb-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#EA580C] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Project Receipt & Alignment</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            Commission Brief Initiated
          </h1>

          <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl font-normal">
            Your creative specifications have been securely recorded. Brewster will review your scope, verify scheduling, and initiate preliminary concept boards.
          </p>
        </div>

        {/* Ledger Summary */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DC] dark:border-[#27272A] flex-wrap gap-2">
            <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
              Commission Reference
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#18181B] dark:text-[#EDEDEC]">
              #{submittedCommission.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div>
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Service Practice</span>
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{submittedCommission.service}</span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA580C]">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Designer Review</span>
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Proposed Investment</span>
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC] font-mono">{submittedCommission.budget}</span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Target Delivery</span>
              <span className="font-medium text-[#18181B] dark:text-[#EDEDEC]">{formatCommissionDate(submittedCommission.deadline)}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">Project Title</span>
              <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">{submittedCommission.projectName}</span>
            </div>
          </div>

          {submittedCommission.description && (
            <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-1.5">
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block">Brief Summary</span>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed whitespace-pre-line bg-[#FAF9F6] dark:bg-[#0F0F11] p-4 rounded-lg border border-[#E4E2DC] dark:border-[#27272A]">
                {submittedCommission.description}
              </p>
            </div>
          )}

          {/* Creative Brief Specifications */}
          {(submittedCommission.purpose || submittedCommission.targetAudience || submittedCommission.preferredStyle || submittedCommission.requiredDimensions || (submittedCommission.preferredColors && submittedCommission.preferredColors.length > 0) || (submittedCommission.referenceLinks && submittedCommission.referenceLinks.length > 0) || submittedCommission.additionalNotes) && (
            <div className="pt-4 border-t border-[#E4E2DC] dark:border-[#27272A] space-y-4">
              <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block font-bold">
                Creative Specifications Recorded
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF9F6] dark:bg-[#0F0F11] p-4 rounded-lg border border-[#E4E2DC] dark:border-[#27272A]">
                {submittedCommission.purpose && (
                  <div>
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Context & Purpose</span>
                    <span className="text-[#18181B] dark:text-[#EDEDEC] font-medium">{submittedCommission.purpose}</span>
                  </div>
                )}
                {submittedCommission.targetAudience && (
                  <div>
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Target Audience</span>
                    <span className="text-[#18181B] dark:text-[#EDEDEC] font-medium">{submittedCommission.targetAudience}</span>
                  </div>
                )}
                {submittedCommission.preferredStyle && (
                  <div>
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Aesthetic Direction</span>
                    <span className="text-[#18181B] dark:text-[#EDEDEC] font-medium">{submittedCommission.preferredStyle}</span>
                  </div>
                )}
                {submittedCommission.requiredDimensions && (
                  <div>
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Dimensions & Formats</span>
                    <span className="text-[#18181B] dark:text-[#EDEDEC] font-mono">{submittedCommission.requiredDimensions}</span>
                  </div>
                )}
                {submittedCommission.preferredColors && submittedCommission.preferredColors.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block mb-1">Color Palette</span>
                    <div className="flex flex-wrap gap-1.5">
                      {submittedCommission.preferredColors.map((color: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] text-[11px] font-mono text-[#18181B] dark:text-[#EDEDEC]">
                          {color.startsWith('#') && (
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                          )}
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {submittedCommission.referenceLinks && submittedCommission.referenceLinks.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block mb-1">Inspiration Links</span>
                    <div className="flex flex-wrap gap-2">
                      {submittedCommission.referenceLinks.map((link: string, idx: number) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#EA580C] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-xs">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {submittedCommission.additionalNotes && (
                  <div className="sm:col-span-2">
                    <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Special Directives</span>
                    <span className="text-[#18181B] dark:text-[#EDEDEC] whitespace-pre-line">{submittedCommission.additionalNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* What Happens Next Guidance */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold block">
            Next Stages
          </span>
          <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Collaborative Dialogue & Proof Delivery
          </h3>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Brewster will review your project requirements and confirm milestone scheduling. You can track progress, exchange messages, and review proofs directly through your <strong>Client Dashboard</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            id="btn-submit-another"
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#232327] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Submit Another Project</span>
          </button>

          <button
            id="btn-view-client-dashboard"
            type="button"
            onClick={() => setActiveView('client-dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Client Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    );
  }

  // STANDARD FORM VIEW (Creative Studio Collaboration)
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      
      {/* Editorial Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-8 sm:pb-12">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Creative Consultation</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-5.5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
            Initiate a Project Commission
          </h1>

          <p className="text-sm sm:text-base text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
            A structured brief to align vision, scope, and technical deliverables with the studio. Every inquiry receives personalized creative direction from Brewster.
          </p>
        </div>
      </div>

      {/* Sign-in prompt for unauthenticated visitors */}
      {!currentUser && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#18181B] dark:text-[#EDEDEC]">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
              <span>Client Account Authentication Required</span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Please sign in or register so your commission is securely assigned to your client portal in Supabase, enabling real-time proof reviews, messaging, and asset downloads.
            </p>
          </div>

          <button
            id="btn-signin-to-submit"
            type="button"
            onClick={() => setActiveView('auth')}
            className="shrink-0 px-5 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] hover:opacity-90 text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Sign In / Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ERROR FEEDBACK BANNER */}
      {formError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 flex items-start gap-3 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
            {formError}
          </div>
        </div>
      )}

      {/* COMMISSION FORM */}
      <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">

        {/* SECTION 1: PROJECT OVERVIEW */}
        <section className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-4 space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
              01 / PROJECT SCOPE & CONTEXT
            </span>
            <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              What are we creating together?
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Define your project title, practice package, core objectives, and strategic purpose.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="input-project-title" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Project Title <span className="text-[#EA580C]">*</span>
              </label>
              <input
                id="input-project-title"
                type="text"
                required
                placeholder="e.g. Solis Labs Brand Identity System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="select-commission-service" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Practice Package <span className="text-[#EA580C]">*</span>
              </label>
              <select
                id="select-commission-service"
                value={serviceType}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors cursor-pointer"
              >
                {services.map((srv) => (
                  <option key={srv.id} value={srv.name}>
                    {srv.name} (from {studioProfile.currencySymbol}{srv.startingPrice.toLocaleString()} · {srv.turnaround})
                  </option>
                ))}
                <option value="Custom Creative Direction">Custom Creative Direction</option>
              </select>

              {selectedServiceItem && (
                <div className="mt-2.5 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">
                    {selectedServiceItem.shortDesc}
                  </span>
                  <div className="flex items-center gap-3 shrink-0 text-[#71717A] dark:text-[#A1A1AA] font-mono text-[11px]">
                    <span>Turnaround: <strong className="text-[#18181B] dark:text-[#EDEDEC]">{selectedServiceItem.turnaround}</strong></span>
                    <span>·</span>
                    <span>Base: <strong className="text-[#EA580C]">{studioProfile.currencySymbol}{selectedServiceItem.startingPrice.toLocaleString()}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="textarea-project-description" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Project Description & Deliverables <span className="text-[#EA580C]">*</span>
              </label>
              <textarea
                id="textarea-project-description"
                rows={4}
                required
                placeholder="Describe your design needs, deliverables, key themes, and primary goals for this project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="input-project-purpose" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Purpose & Strategic Context <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="input-project-purpose"
                type="text"
                placeholder="e.g. Launching a new tech startup, rebranding an artisan roastery, album release..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: AUDIENCE & CREATIVE DIRECTION */}
        <section className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-4 space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
              02 / AESTHETIC DIRECTION & REFERENCES
            </span>
            <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Visual Mood & Atmosphere
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Define your intended audience, preferred aesthetic style, color palette, and inspiration links.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="input-target-audience" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Target Demographic <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="input-target-audience"
                type="text"
                placeholder="e.g. Art collectors, early-stage founders, design-minded consumers..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="input-preferred-style" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Aesthetic Style / Feel <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="input-preferred-style"
                type="text"
                placeholder="e.g. Swiss typographic minimalism, warm editorial, brutalist..."
                value={preferredStyle}
                onChange={(e) => setPreferredStyle(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="input-preferred-colors" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Color Palette or Hex Codes <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="input-preferred-colors"
                type="text"
                placeholder="e.g. #0F172A, #F97316, warm sand, charcoal black (comma-separated)"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="textarea-reference-links" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Visual References & Moodboards <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="textarea-reference-links"
                rows={2}
                placeholder="e.g. https://www.behance.net/example, https://are.na/channel, https://pinterest.com/example (must start with https://)"
                value={referenceLinksInput}
                onChange={(e) => {
                  setReferenceLinksInput(e.target.value);
                  if (referenceLinksError) setReferenceLinksError(null);
                }}
                className={`w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border ${
                  referenceLinksError ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#27272A]'
                } rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors resize-none`}
              />
              {referenceLinksError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {referenceLinksError}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: TECHNICAL REQUIREMENTS */}
        <section className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-4 space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
              03 / TECHNICAL SPECIFICATIONS & PRODUCTION
            </span>
            <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Formats & Delivery Requirements
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Specify required aspect ratios, print specs, vector layers, or existing brand guidelines.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="input-required-dimensions" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Dimensions & Formats <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <input
                id="input-required-dimensions"
                type="text"
                placeholder="e.g. Scalable SVG + Vector AI, A2 300 DPI print poster, 1920x1080 horizontal..."
                value={requiredDimensions}
                onChange={(e) => setRequiredDimensions(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="textarea-additional-notes" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Additional Directives / Constraints <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="textarea-additional-notes"
                rows={3}
                placeholder="e.g. Special spot-color considerations, existing brand typography to respect, specific copy to embed..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: BUDGET & TIMELINE */}
        <section className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E4E2DC] dark:border-[#27272A] pb-4 space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
              04 / INVESTMENT & TIMELINE
            </span>
            <h3 className="font-display text-xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
              Proposed Budget & Delivery Window
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Set your target investment and requested delivery date.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="input-commission-budget" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Estimated Budget ({studioProfile.currencySymbol}) <span className="text-[#EA580C]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] font-mono text-xs font-bold">
                  {studioProfile.currencySymbol}
                </span>
                <input
                  id="input-commission-budget"
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg pl-8 pr-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors font-mono font-bold"
                />
              </div>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5 block">
                Practice base rate: {studioProfile.currencySymbol}{selectedServiceItem ? selectedServiceItem.startingPrice.toLocaleString() : '3,500'}.
              </span>
            </div>

            <div>
              <label htmlFor="input-commission-deadline" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                Target Delivery Date <span className="text-[#EA580C]">*</span>
              </label>
              <input
                id="input-commission-deadline"
                type="date"
                required
                min={tomorrowStr}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] transition-colors cursor-pointer"
              />
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1.5 block">
                Committed delivery target for final approved assets.
              </span>
            </div>
          </div>
        </section>

        {/* SUBMISSION FOOTER */}
        <div className="bg-[#FAF9F6] dark:bg-[#232327] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#71717A] dark:text-[#A1A1AA] pb-4 border-b border-[#E4E2DC] dark:border-[#27272A]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
              <span>Initial Status: <strong className="text-[#18181B] dark:text-[#EDEDEC]">Pending Designer Review</strong></span>
            </div>
            <span className="font-mono text-[11px]">Directly assigned in Supabase database</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] text-center sm:text-left leading-relaxed max-w-md">
              By initiating this brief, your specifications will be transmitted to the studio. You can track all stages, discuss revisions, and inspect proofs in your Client Dashboard.
            </p>

            <button
              id="btn-submit-commission-form"
              type="submit"
              disabled={isSubmitting || !currentUser}
              className="w-full sm:w-auto px-7 py-3 rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transmitting Brief...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Commission Brief</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
