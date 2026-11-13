import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCommissionDate } from '../utils/dateUtils';
import { isValidReferenceUrl } from '../utils/urlUtils';
import { InlineAuthDialog } from '../components/InlineAuthDialog';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  RotateCcw, 
  Sparkles,
  ExternalLink,
  Edit3,
  Calendar,
  Layers,
  FileText,
  Palette,
  CreditCard,
  Link as LinkIcon,
  Check,
  UserCheck
} from 'lucide-react';

export const COMMISSION_DRAFT_STORAGE_KEY = 'brewster_commission_form_draft_v1';

export interface CommissionDraftData {
  serviceType?: string;
  title?: string;
  description?: string;
  purpose?: string;
  targetAudience?: string;
  preferredStyle?: string;
  colorsInput?: string;
  referenceLinksInput?: string;
  requiredDimensions?: string;
  additionalNotes?: string;
  budget?: string;
  deadline?: string;
  currentStep?: number;
  updatedAt?: number;
}

/**
 * Safely loads the saved commission brief draft from sessionStorage.
 * Corrupted, invalid, or unparseable drafts are safely discarded without throwing.
 */
export function loadCommissionDraft(): CommissionDraftData | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(COMMISSION_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      window.sessionStorage.removeItem(COMMISSION_DRAFT_STORAGE_KEY);
      return null;
    }
    return {
      serviceType: typeof parsed.serviceType === 'string' ? parsed.serviceType : undefined,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      purpose: typeof parsed.purpose === 'string' ? parsed.purpose : '',
      targetAudience: typeof parsed.targetAudience === 'string' ? parsed.targetAudience : '',
      preferredStyle: typeof parsed.preferredStyle === 'string' ? parsed.preferredStyle : '',
      colorsInput: typeof parsed.colorsInput === 'string' ? parsed.colorsInput : '',
      referenceLinksInput: typeof parsed.referenceLinksInput === 'string' ? parsed.referenceLinksInput : '',
      requiredDimensions: typeof parsed.requiredDimensions === 'string' ? parsed.requiredDimensions : '',
      additionalNotes: typeof parsed.additionalNotes === 'string' ? parsed.additionalNotes : '',
      budget: typeof parsed.budget === 'string' ? parsed.budget : undefined,
      deadline: typeof parsed.deadline === 'string' ? parsed.deadline : '',
      currentStep: typeof parsed.currentStep === 'number' && parsed.currentStep >= 1 && parsed.currentStep <= 6 ? parsed.currentStep : 1,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(COMMISSION_DRAFT_STORAGE_KEY);
      }
    } catch {}
    return null;
  }
}

/**
 * Safely persists the user-entered commission brief draft to sessionStorage.
 */
export function saveCommissionDraft(draft: CommissionDraftData): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(COMMISSION_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Silently handle quota exceeded or storage restrictions
  }
}

/**
 * Safely clears the commission brief draft from sessionStorage upon completion or reset.
 */
export function clearCommissionDraft(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.removeItem(COMMISSION_DRAFT_STORAGE_KEY);
  } catch {
    // Silently handle storage clearance failures
  }
}

const STEP_DEFINITIONS = [
  { step: 1, title: 'Service', label: 'Service Practice', icon: Layers },
  { step: 2, title: 'Scope', label: 'Project Scope', icon: FileText },
  { step: 3, title: 'Directives', label: 'Creative Directives', icon: Palette },
  { step: 4, title: 'Investment', label: 'Budget & Timeline', icon: CreditCard },
  { step: 5, title: 'References', label: 'Visual References', icon: LinkIcon },
  { step: 6, title: 'Review', label: 'Review & Submit', icon: CheckCircle2 },
];

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

  // Load initial draft from sessionStorage on initial mount
  const [initialDraft] = useState<CommissionDraftData | null>(() => loadCommissionDraft());

  // Current Active Step (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return initialDraft?.currentStep || 1;
  });

  // Commission Form Fields initialized from draft (or preselectedService/defaults)
  const [serviceType, setServiceType] = useState(() => {
    return initialDraft?.serviceType || preselectedService || 'Brand Identity Package';
  });
  const [title, setTitle] = useState(() => initialDraft?.title || '');
  const [description, setDescription] = useState(() => initialDraft?.description || '');
  const [purpose, setPurpose] = useState(() => initialDraft?.purpose || '');
  const [targetAudience, setTargetAudience] = useState(() => initialDraft?.targetAudience || '');
  const [preferredStyle, setPreferredStyle] = useState(() => initialDraft?.preferredStyle || '');
  const [colorsInput, setColorsInput] = useState(() => initialDraft?.colorsInput || '');
  const [referenceLinksInput, setReferenceLinksInput] = useState(() => initialDraft?.referenceLinksInput || '');
  const [requiredDimensions, setRequiredDimensions] = useState(() => initialDraft?.requiredDimensions || '');
  const [additionalNotes, setAdditionalNotes] = useState(() => initialDraft?.additionalNotes || '');
  const [budget, setBudget] = useState(() => initialDraft?.budget || '5000');
  const [deadline, setDeadline] = useState(() => initialDraft?.deadline || '');

  // UI & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submittedCommission, setSubmittedCommission] = useState<any | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'signin' | 'register'>('signin');

  const [hasRestoredDraft, setHasRestoredDraft] = useState(() => {
    return Boolean(
      initialDraft && (
        initialDraft.title || 
        initialDraft.description || 
        initialDraft.purpose || 
        initialDraft.targetAudience || 
        initialDraft.preferredStyle || 
        initialDraft.colorsInput || 
        initialDraft.referenceLinksInput || 
        initialDraft.requiredDimensions || 
        initialDraft.additionalNotes || 
        initialDraft.deadline
      )
    );
  });

  // Tomorrow's date string for input min attribute
  const tomorrowStr = useMemo(() => {
    return new Date(Date.now() + 86400000).toISOString().split('T')[0];
  }, []);

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
      // If user came specifically for this service, advance to step 2 if on step 1
      if (!initialDraft?.title) {
        setCurrentStep(2);
      }
    }
  }, [preselectedService, services, initialDraft]);

  // Update sessionStorage draft whenever user edits any form field or step
  useEffect(() => {
    const hasMeaningfulContent = Boolean(
      title.trim() ||
      description.trim() ||
      purpose.trim() ||
      targetAudience.trim() ||
      preferredStyle.trim() ||
      colorsInput.trim() ||
      referenceLinksInput.trim() ||
      requiredDimensions.trim() ||
      additionalNotes.trim() ||
      deadline.trim()
    );

    if (hasMeaningfulContent || currentStep > 1) {
      saveCommissionDraft({
        serviceType,
        title,
        description,
        purpose,
        targetAudience,
        preferredStyle,
        colorsInput,
        referenceLinksInput,
        requiredDimensions,
        additionalNotes,
        budget,
        deadline,
        currentStep,
        updatedAt: Date.now(),
      });
    }
  }, [
    serviceType,
    title,
    description,
    purpose,
    targetAudience,
    preferredStyle,
    colorsInput,
    referenceLinksInput,
    requiredDimensions,
    additionalNotes,
    budget,
    deadline,
    currentStep,
  ]);

  // When serviceType changes, update recommended budget default if matching service found
  const handleServiceSelect = (newService: string) => {
    setServiceType(newService);
    const match = services.find(s => s.name === newService);
    if (match) {
      setBudget(match.startingPrice.toString());
    }
    setStepErrors(prev => ({ ...prev, service: '' }));
  };

  const selectedServiceItem = useMemo(() => {
    return services.find(s => s.name === serviceType);
  }, [services, serviceType]);

  // Parse color chips for live preview
  const previewColors = useMemo(() => {
    return colorsInput
      .split(/[\n,]+/)
      .map(c => c.trim())
      .filter(Boolean);
  }, [colorsInput]);

  // Parse reference links
  const parsedReferenceLinks = useMemo(() => {
    return referenceLinksInput
      .split(/[\n,]+/)
      .map(l => l.trim())
      .filter(Boolean);
  }, [referenceLinksInput]);

  // Reset entire form
  const resetForm = () => {
    clearCommissionDraft();
    setHasRestoredDraft(false);
    setCurrentStep(1);
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
    setStepErrors({});
    setSubmittedCommission(null);
    if (services.length > 0) {
      setServiceType(services[0].name);
      setBudget(services[0].startingPrice.toString());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step Validation Guard before advancing
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!serviceType.trim()) {
        errors.service = 'Please select a design discipline to continue.';
      }
    } else if (step === 2) {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        errors.title = 'Please provide a project name or working title.';
      } else if (cleanTitle.length < 3) {
        errors.title = 'Project title must be at least 3 characters.';
      }

      const cleanDesc = description.trim();
      if (!cleanDesc) {
        errors.description = 'Please detail your project requirements and scope.';
      } else if (cleanDesc.length < 10) {
        errors.description = 'Project description should be at least 10 characters so we can understand your vision.';
      }
    } else if (step === 4) {
      const numericBudget = parseFloat(budget.replace(/[^0-9.]/g, ''));
      if (isNaN(numericBudget) || numericBudget <= 0) {
        errors.budget = 'Please enter a valid investment budget greater than 0.';
      }

      if (!deadline) {
        errors.deadline = 'Please specify your target delivery deadline.';
      } else if (deadline < tomorrowStr) {
        errors.deadline = 'Committed delivery date must be scheduled at least 1 day in advance.';
      }
    } else if (step === 5) {
      if (parsedReferenceLinks.length > 0) {
        const invalid = parsedReferenceLinks.filter(l => !isValidReferenceUrl(l));
        if (invalid.length > 0) {
          errors.referenceLinks = 'Each inspiration link must be a valid web URL beginning with https://';
        }
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setStepErrors({});
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      // Always allow returning to earlier steps
      setStepErrors({});
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep > currentStep) {
      // Validate current step before skipping forward
      if (validateStep(currentStep)) {
        setStepErrors({});
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Final Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // If client is not signed in, open the inline authentication dialog instead of failing
    if (!currentUser) {
      setAuthDialogMode('signin');
      setIsAuthDialogOpen(true);
      return;
    }

    // Validate all required steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(4) || !validateStep(5)) {
      setFormError('Please review and correct the marked requirements before transmission.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const numericBudget = parseFloat(budget.replace(/[^0-9.]/g, ''));

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
        preferredColors: previewColors.length > 0 ? previewColors : undefined,
        requiredDimensions: requiredDimensions.trim() || undefined,
        referenceLinks: parsedReferenceLinks.length > 0 ? parsedReferenceLinks : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      if (response.success && response.commission) {
        clearCommissionDraft();
        setHasRestoredDraft(false);
        setSubmittedCommission(response.commission);
        setPreselectedService(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(response.error || 'Failed to submit commission request to Supabase. Please try again.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // SUCCESS RECEIPT VIEW (Editorial Project Confirmation)
  // =========================================================================
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
            Your creative specifications have been securely recorded. The DESTALION studio team will review your scope, verify scheduling, and initiate preliminary concept boards.
          </p>
        </div>

        {/* Ledger Summary Card */}
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
        </div>

        {/* Action Controls */}
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

  // =========================================================================
  // GUIDED MULTI-STEP COMMISSION FORM VIEW
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-10">
      
      {/* Header & Section Metadata */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#EA580C] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
            <span>Commission Intake Brief</span>
          </div>

          {/* Quick Authenticated User Status / Sign In Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Signed in as <strong>{currentUser.name}</strong></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setAuthDialogMode('signin'); setIsAuthDialogOpen(true); }}
              className="text-xs font-mono text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Have an account? Sign in</span>
            </button>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight leading-[1.08]">
          Initiate a Project Commission
        </h1>

        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed max-w-2xl font-normal">
          A structured 6-step consultation brief to align creative parameters, technical deliverables, and production timelines directly with DESTALION studio.
        </p>
      </div>

      {/* Restored Draft Alert Banner */}
      {hasRestoredDraft && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="leading-relaxed">
              <strong>Draft Session Restored:</strong> Your previously entered project details have been restored.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setHasRestoredDraft(false)}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] hover:text-red-500 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESPONSIVE STEPPER / PROGRESS INDICATOR                                   */}
      {/* ========================================================================= */}
      <div className="space-y-3 bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-4 sm:p-5 shadow-2xs">
        
        {/* Step Label & Count */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#EA580C] uppercase tracking-wider">
            Step 0{currentStep} of 06 · {STEP_DEFINITIONS[currentStep - 1].label}
          </span>
          <span className="text-[#71717A] dark:text-[#A1A1AA]">
            {Math.round((currentStep / 6) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-1.5 bg-[#FAF9F6] dark:bg-[#18181B] rounded-full overflow-hidden border border-[#E4E2DC] dark:border-[#222225]">
          <div 
            className="h-full bg-[#EA580C] transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Stepper Pills Navigation */}
        <div className="grid grid-cols-6 gap-1 sm:gap-2 pt-1">
          {STEP_DEFINITIONS.map((def) => {
            const isCompleted = def.step < currentStep;
            const isCurrent = def.step === currentStep;
            const isUpcoming = def.step > currentStep;
            const StepIcon = def.icon;

            return (
              <button
                key={def.step}
                type="button"
                onClick={() => jumpToStep(def.step)}
                disabled={isUpcoming}
                aria-label={`Jump to Step ${def.step}: ${def.label}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={`py-1.5 px-1 sm:px-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#FAF9F6] dark:bg-[#18181B] border border-[#EA580C] text-[#EA580C] font-bold shadow-2xs'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-[#FAF9F6] dark:hover:bg-[#18181B] font-medium'
                    : 'text-[#71717A] dark:text-[#52525B] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3 h-3" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-tight hidden md:inline truncate">
                  {def.title}
                </span>
                <span className="text-[10px] font-mono md:hidden">
                  0{def.step}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Global Form Feedback Error */}
      {formError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 flex items-start gap-3 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            {formError}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FORM BODY: STEP-BY-STEP SCREENS                                          */}
      {/* ========================================================================= */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* --------------------------------------------------------------------- */}
        {/* STEP 1: SERVICE PACKAGE SELECTION                                     */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 1 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                01 / SERVICE PRACTICE
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Select a Design Discipline
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Choose the primary service package that matches your engagement. You can refine deliverables in subsequent steps.
              </p>
            </div>

            {stepErrors.service && (
              <p className="text-xs text-red-600 dark:text-red-400 font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {stepErrors.service}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((srv) => {
                const isSelected = serviceType === srv.name;

                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => handleServiceSelect(srv.name)}
                    aria-pressed={isSelected}
                    className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] btn-tactile ${
                      isSelected
                        ? 'border-[#EA580C] bg-orange-50/20 dark:bg-orange-950/20 ring-1 ring-[#EA580C] shadow-xs'
                        : 'border-[#E4E2DC] dark:border-[#222225] bg-[#FAF9F6] dark:bg-[#18181B] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                          {srv.category}
                        </span>
                        <h3 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                          {srv.name}
                        </h3>
                      </div>
                      
                      {/* Selection Check Indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-[#EA580C] border-[#EA580C] text-white shadow-2xs' 
                          : 'border-[#D4D2CA] dark:border-[#3F3F46]'
                      }`} aria-hidden="true">
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2">
                      {srv.shortDesc}
                    </p>

                    <div className="pt-2 border-t border-[#E4E2DC]/60 dark:border-[#27272A]/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#18181B] dark:text-[#EDEDEC] font-bold">
                        From {studioProfile.currencySymbol}{srv.startingPrice.toLocaleString()}
                      </span>
                      <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                        {srv.turnaround}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Studio Engagement Option */}
              <button
                type="button"
                onClick={() => handleServiceSelect('Custom Studio Engagement')}
                aria-pressed={serviceType === 'Custom Studio Engagement'}
                className={`p-5 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] btn-tactile ${
                  serviceType === 'Custom Studio Engagement'
                    ? 'border-[#EA580C] bg-orange-50/20 dark:bg-orange-950/20 ring-1 ring-[#EA580C] shadow-xs'
                    : 'border-[#E4E2DC] dark:border-[#222225] bg-[#FAF9F6] dark:bg-[#18181B] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold">
                      Bespoke
                    </span>
                    <h3 className="font-display font-bold text-base text-[#18181B] dark:text-[#EDEDEC]">
                      Custom Studio Engagement
                    </h3>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    serviceType === 'Custom Studio Engagement'
                      ? 'bg-[#EA580C] border-[#EA580C] text-white shadow-2xs' 
                      : 'border-[#D4D2CA] dark:border-[#3F3F46]'
                  }`} aria-hidden="true">
                    {serviceType === 'Custom Studio Engagement' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  Have an experimental or hybrid commission outside standard practice tiers? We'll tailor custom deliverables and timeline terms.
                </p>

                <div className="pt-2 border-t border-[#E4E2DC]/60 dark:border-[#27272A]/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#18181B] dark:text-[#EDEDEC] font-bold">
                    Custom Quote
                  </span>
                  <span className="text-[#71717A] dark:text-[#A1A1AA] text-[11px]">
                    Tailored Schedule
                  </span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 2: PROJECT SCOPE & OBJECTIVES                                   */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 2 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                02 / SCOPE & CONTEXT
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Define Project Scope & Objectives
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Give your project an identifiable working name and describe the core requirements.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="input-project-title" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Project Working Title <span className="text-[#EA580C]">*</span>
                </label>
                <input
                  id="input-project-title"
                  type="text"
                  required
                  placeholder="e.g. Apex Visual Identity System, Solaris Album Cover"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (stepErrors.title) setStepErrors(prev => ({ ...prev, title: '' }));
                  }}
                  className={`w-full bg-[#FAF9F6] dark:bg-[#18181B] border ${
                    stepErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#222225]'
                  } rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors`}
                />
                {stepErrors.title ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.title}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1 font-mono">
                    A distinct moniker for identifying your project in the studio ledger.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="textarea-project-description" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Project Brief & Deliverable Requirements <span className="text-[#EA580C]">*</span>
                </label>
                <textarea
                  id="textarea-project-description"
                  rows={4}
                  required
                  placeholder="Detail your requirements, brand story, primary deliverables, and where the assets will be showcased..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (stepErrors.description) setStepErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className={`w-full bg-[#FAF9F6] dark:bg-[#18181B] border ${
                    stepErrors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#222225]'
                  } rounded-lg p-3.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors resize-none leading-relaxed`}
                />
                {stepErrors.description ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1 font-mono">
                    Minimum 10 characters detailing primary design targets.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="input-project-purpose" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                    Context & Purpose <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="input-project-purpose"
                    type="text"
                    placeholder="e.g. Seed-stage venture launch, annual festival..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="input-target-audience" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                    Target Demographic <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="input-target-audience"
                    type="text"
                    placeholder="e.g. Design-conscious collectors, technical founders..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 3: CREATIVE DIRECTIVES & FORMATS                                */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 3 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                03 / CREATIVE DIRECTIVES
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Visual Tone & Technical Specifications
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Communicate your aesthetic sensibilities, color palettes, and production dimensions.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="input-preferred-style" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Aesthetic Style / Feel <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-preferred-style"
                  type="text"
                  placeholder="e.g. Swiss typographic minimalism, vintage screen-print, bold brutalist..."
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors"
                />

                {/* Suggested Aesthetic Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA] pr-1">Suggestions:</span>
                  {[
                    'Swiss Typographic',
                    'Vintage Screen-print',
                    'Minimalist Vector',
                    'Warm Editorial',
                    'Cyberpunk / Acid'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setPreferredStyle(tag)}
                      className="px-2 py-0.5 rounded bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[10px] font-mono hover:border-[#EA580C] transition-colors cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="input-preferred-colors" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Color Palette or Hex Codes <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-preferred-colors"
                  type="text"
                  placeholder="e.g. #B91F20, #F5EBCB, Charcoal, Deep Navy (comma-separated)"
                  value={colorsInput}
                  onChange={(e) => setColorsInput(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors"
                />

                {/* Live Swatch Preview */}
                {previewColors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2.5">
                    <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">Detected:</span>
                    {previewColors.map((color, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[11px] font-mono">
                        {color.startsWith('#') && (
                          <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                        )}
                        <span>{color}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="input-required-dimensions" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Required Dimensions & Formats <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-required-dimensions"
                  type="text"
                  placeholder="e.g. Scalable SVG + Vector AI, A2 300 DPI Print PDF, 1920x1080 horizontal..."
                  value={requiredDimensions}
                  onChange={(e) => setRequiredDimensions(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="textarea-additional-notes" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Directives, Constraints & Things to Avoid <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="textarea-additional-notes"
                  rows={3}
                  placeholder="e.g. Must harmonize with existing brand guidelines, avoid drop shadows, specific copy to embed..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 4: INVESTMENT & COMMITTED DELIVERY                              */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 4 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                04 / INVESTMENT & TIMELINE
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Proposed Budget & Delivery Window
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Set your target financial investment and committed delivery date.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="input-commission-budget" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Target Budget ({studioProfile.currencySymbol}) <span className="text-[#EA580C]">*</span>
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
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (stepErrors.budget) setStepErrors(prev => ({ ...prev, budget: '' }));
                    }}
                    className={`w-full bg-[#FAF9F6] dark:bg-[#18181B] border ${
                      stepErrors.budget ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#222225]'
                    } rounded-lg pl-8 pr-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors font-mono font-bold`}
                  />
                </div>
                {stepErrors.budget ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.budget}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1 font-mono">
                    Base rate for {serviceType}: {studioProfile.currencySymbol}{selectedServiceItem ? selectedServiceItem.startingPrice.toLocaleString() : '3,500'}.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="input-commission-deadline" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Committed Delivery Date <span className="text-[#EA580C]">*</span>
                </label>
                <input
                  id="input-commission-deadline"
                  type="date"
                  required
                  min={tomorrowStr}
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    if (stepErrors.deadline) setStepErrors(prev => ({ ...prev, deadline: '' }));
                  }}
                  className={`w-full bg-[#FAF9F6] dark:bg-[#18181B] border ${
                    stepErrors.deadline ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#222225]'
                  } rounded-lg px-4 py-2.5 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors cursor-pointer`}
                />
                {stepErrors.deadline ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.deadline}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1 font-mono">
                    Subject to studio schedule alignment during brief review.
                  </p>
                )}
              </div>
            </div>

            {/* Explanatory Policy Callout */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#EA580C] font-semibold block">
                Payment Terms Alignment
              </span>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                Commissions require a <strong>50% deposit</strong> following scope alignment to reserve production scheduling. The remaining <strong>50% balance</strong> is settled upon final design approval prior to deliverable package handoff.
              </p>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 5: VISUAL REFERENCES & LINKS                                    */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 5 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                05 / REFERENCES & VISUALS
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Visual References & Moodboards
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Share online moodboards, inspiration boards, or brand decks via secure HTTPS links.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="textarea-reference-links" className="block text-xs font-semibold text-[#18181B] dark:text-[#EDEDEC] mb-2 font-mono uppercase tracking-wider">
                  Inspiration Links (HTTPS) <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="textarea-reference-links"
                  rows={3}
                  placeholder="e.g. https://www.behance.net/example, https://are.na/channel/moodboard, https://pinterest.com/pin/example (separate with newlines or commas)"
                  value={referenceLinksInput}
                  onChange={(e) => {
                    setReferenceLinksInput(e.target.value);
                    if (stepErrors.referenceLinks) setStepErrors(prev => ({ ...prev, referenceLinks: '' }));
                  }}
                  className={`w-full bg-[#FAF9F6] dark:bg-[#18181B] border ${
                    stepErrors.referenceLinks ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E4E2DC] dark:border-[#222225]'
                  } rounded-lg p-3 text-xs sm:text-sm text-[#18181B] dark:text-[#EDEDEC] placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:border-[#EA580C] transition-colors resize-none leading-relaxed`}
                />
                {stepErrors.referenceLinks ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.referenceLinks}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1 font-mono">
                    All links must begin with <code>https://</code> for browser security.
                  </p>
                )}
              </div>

              {/* Verified Links Chips */}
              {parsedReferenceLinks.length > 0 && !stepErrors.referenceLinks && (
                <div className="p-3 bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-lg space-y-2">
                  <span className="font-mono text-[10px] text-[#71717A] dark:text-[#A1A1AA] uppercase font-bold block">
                    Recognized Reference Links ({parsedReferenceLinks.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {parsedReferenceLinks.map((url, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] text-[#EA580C]">
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[220px]">{url}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secure Asset Delivery Policy Notice */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-mono font-bold text-[#18181B] dark:text-[#EDEDEC] block uppercase tracking-wider text-[10px]">
                    Direct File Attachments Notice
                  </span>
                  <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    High-resolution brand assets, logos, and print PDFs are uploaded directly inside your private <strong>Client Workspace</strong> following brief transmission. This protects your proprietary source material with encrypted storage.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 6: REVIEW & TRANSMIT BRIEF                                      */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 6 && (
          <section className="bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
                06 / VERIFY & TRANSMIT
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
                Review Project Brief
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Confirm your brief specifications before transmitting to the studio. You can edit any section below.
              </p>
            </div>

            {/* Structured Summary Cards */}
            <div className="space-y-4 text-xs">
              
              {/* Card 1: Service Practice */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    01 · Service Practice
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#18181B] dark:text-[#EDEDEC]">
                    {serviceType}
                  </h3>
                  {selectedServiceItem && (
                    <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      Starting at {studioProfile.currencySymbol}{selectedServiceItem.startingPrice.toLocaleString()} · {selectedServiceItem.turnaround}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(1)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono font-semibold text-[#EA580C] hover:bg-white dark:hover:bg-[#121214] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 2: Project Scope */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    02 · Project Scope
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#18181B] dark:text-[#EDEDEC] truncate">
                    {title || 'Untitled Project'}
                  </h3>
                  <p className="text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-3 whitespace-pre-line text-xs">
                    {description || 'No description provided.'}
                  </p>
                  {(purpose || targetAudience) && (
                    <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                      {purpose && <span><strong>Context:</strong> {purpose}</span>}
                      {targetAudience && <span><strong>Audience:</strong> {targetAudience}</span>}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(2)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono font-semibold text-[#EA580C] hover:bg-white dark:hover:bg-[#121214] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 3: Creative Directives */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    03 · Creative Directives & Formats
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Aesthetic Feel</span>
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDEC]">{preferredStyle || 'Studio Artistic Discretion'}</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Dimensions & Formats</span>
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDEC]">{requiredDimensions || 'Standard Vector & Production Package'}</span>
                    </div>
                  </div>
                  {previewColors.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-[#71717A] dark:text-[#A1A1AA]">Palette:</span>
                      {previewColors.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#121214] border border-[#E4E2DC] dark:border-[#222225]">
                          {c.startsWith('#') && (
                            <span className="w-2 h-2 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c }} />
                          )}
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {additionalNotes && (
                    <div className="pt-1">
                      <span className="text-[#71717A] dark:text-[#A1A1AA] font-mono text-[10px] uppercase block">Directives</span>
                      <span className="text-xs text-[#18181B] dark:text-[#EDEDEC] line-clamp-2">{additionalNotes}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(3)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono font-semibold text-[#EA580C] hover:bg-white dark:hover:bg-[#121214] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 4: Investment & Timeline */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    04 · Investment & Target Delivery
                  </span>
                  <div className="flex items-center gap-6 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px] uppercase block">Budget Target</span>
                      <span className="font-bold text-[#18181B] dark:text-[#EDEDEC]">
                        {studioProfile.currencySymbol}{parseFloat(budget.replace(/[^0-9.]/g, '') || '0').toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#71717A] dark:text-[#A1A1AA] text-[10px] uppercase block">Committed Delivery</span>
                      <span className="font-medium text-[#18181B] dark:text-[#EDEDEC]">
                        {deadline ? formatCommissionDate(deadline) : 'Scheduled with studio'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(4)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono font-semibold text-[#EA580C] hover:bg-white dark:hover:bg-[#121214] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 5: References */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-[#71717A] dark:text-[#A1A1AA] font-bold block">
                    05 · Visual References
                  </span>
                  {parsedReferenceLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {parsedReferenceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#EA580C] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{link}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No external links provided. Uploads can be supplied in Client Workspace.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(5)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] text-xs font-mono font-semibold text-[#EA580C] hover:bg-white dark:hover:bg-[#121214] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

            </div>

            {/* Authentication Status Check Banner */}
            {!currentUser ? (
              <div className="p-5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-[#EA580C]/40 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                      Client Authentication Required to Transmit
                    </h4>
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                      Your draft is safely preserved in this session. Sign in or register in one click below to link your brief to your personal studio dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthDialogMode('signin'); setIsAuthDialogOpen(true); }}
                    className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Sign In to Transmit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthDialogMode('register'); setIsAuthDialogOpen(true); }}
                    className="px-4 py-2 rounded-lg border border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#EDEDEC] text-xs font-semibold transition-all cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Authenticated as <strong>{currentUser.name}</strong> ({currentUser.email})
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                  Ready to Transmit
                </span>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEPPER CONTROLS (BACK & CONTINUE / TRANSMIT)                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {currentStep > 1 ? (
            <button
              id="btn-step-prev"
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-lg border border-[#E4E2DC] dark:border-[#222225] bg-white dark:bg-[#18181B] hover:bg-[#FAF9F6] dark:hover:bg-[#121214] text-[#18181B] dark:text-[#EDEDEC] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              id="btn-step-next"
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="btn-submit-commission-form"
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 min-h-[44px] rounded-lg bg-[#EA580C] hover:bg-[#D94814] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ml-auto focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transmitting Brief to Studio...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentUser ? 'Transmit Commission Brief' : 'Sign In & Transmit'}</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>

      {/* Inline Authentication Dialog */}
      <InlineAuthDialog
        isOpen={isAuthDialogOpen}
        initialMode={authDialogMode}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={() => {
          setIsAuthDialogOpen(false);
          setFormError(null);
        }}
        subtitle="Sign in or register to link this project brief directly to your private client portal."
      />

    </div>
  );
};
