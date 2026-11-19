import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [hasConfirmedBrief, setHasConfirmedBrief] = useState(false);
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

  const appliedPreselectionRef = useRef<string | null>(null);

  // Sync preselectedService once when a new preselection arrives from Portfolio or Services page
  useEffect(() => {
    if (!preselectedService || appliedPreselectionRef.current === preselectedService) {
      return;
    }
    appliedPreselectionRef.current = preselectedService;

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
    // Advance to step 2 if user came specifically for a service and has no saved title yet
    if (!initialDraft?.title) {
      setCurrentStep(2);
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
    setHasConfirmedBrief(false);
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

  const handleNextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (validateStep(currentStep)) {
      setStepErrors({});
      setFormError(null);
      setHasConfirmedBrief(false);
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    setStepErrors({});
    setFormError(null);
    setHasConfirmedBrief(false);
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      // Always allow returning to earlier steps
      setStepErrors({});
      setFormError(null);
      setHasConfirmedBrief(false);
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep > currentStep) {
      // Validate current step before skipping forward
      if (validateStep(currentStep)) {
        setStepErrors({});
        setFormError(null);
        setHasConfirmedBrief(false);
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Final Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Prevent Enter-key or premature form submission before reaching Step 6 Review
    if (currentStep < 6) {
      handleNextStep();
      return;
    }

    // If client is not signed in, open the inline authentication dialog instead of failing
    if (!currentUser) {
      setAuthDialogMode('signin');
      setIsAuthDialogOpen(true);
      return;
    }

    // Require explicit client confirmation on the Review step before creating the commission
    if (!hasConfirmedBrief) {
      setStepErrors(prev => ({
        ...prev,
        confirm: 'Please confirm that you have reviewed your brief before submitting this commission.',
      }));
      setFormError('Please review your project details and check the confirmation box below before submitting.');
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
        <div className="space-y-4 border-b border-hairline pb-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent font-semibold">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Project Receipt & Alignment</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-carbon tracking-tight">
            Commission Brief Initiated
          </h1>

          <p className="text-sm sm:text-base text-graphite leading-relaxed max-w-2xl font-normal">
            Your creative specifications have been securely recorded. The DESTALION studio team will review your scope, verify scheduling, and initiate preliminary concept boards.
          </p>
        </div>

        {/* Ledger Summary Card */}
        <div className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-hairline flex-wrap gap-2">
            <span className="font-mono text-xs text-graphite uppercase tracking-wider font-semibold">
              Commission Reference
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-carbon">
              #{submittedCommission.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div>
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block mb-1">Service Practice</span>
              <span className="font-bold text-carbon">{submittedCommission.service}</span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block mb-1">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Designer Review</span>
              </span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block mb-1">Proposed Investment</span>
              <span className="font-bold text-carbon font-mono">{submittedCommission.budget}</span>
            </div>

            <div>
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block mb-1">Target Delivery</span>
              <span className="font-medium text-carbon">{formatCommissionDate(submittedCommission.deadline)}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block mb-1">Project Title</span>
              <span className="font-bold text-carbon">{submittedCommission.projectName}</span>
            </div>
          </div>

          {submittedCommission.description && (
            <div className="pt-4 border-t border-hairline space-y-1.5">
              <span className="font-mono text-[10px] text-graphite uppercase tracking-wider block">Brief Summary</span>
              <p className="text-xs text-graphite leading-relaxed whitespace-pre-line bg-surface-secondary p-4 rounded-2xl border border-hairline">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Submit Another Project</span>
          </button>

          <button
            id="btn-view-client-dashboard"
            type="button"
            onClick={() => setActiveView('client-dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 space-y-8 sm:space-y-10">
      
      {/* Restored Draft Alert Banner */}
      {hasRestoredDraft && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-4 animate-in fade-in duration-200">
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
              className="text-[11px] text-graphite hover:text-red-500 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESPONSIVE STEPPER / PROGRESS INDICATOR                                   */}
      {/* ========================================================================= */}
      <div className="space-y-3 bg-surface border border-hairline rounded-3xl p-4 sm:p-5 shadow-xs">
        
        {/* Step Label & Count */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-accent uppercase tracking-wider">
            Step 0{currentStep} of 06 · {STEP_DEFINITIONS[currentStep - 1].label}
          </span>
          <span className="text-graphite">
            {Math.round((currentStep / 6) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden border border-hairline">
          <div 
            className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
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
                className={`py-2 px-1 sm:px-2.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 text-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#E0F2FE]/70 dark:bg-sky-950/50 border border-accent text-accent font-bold shadow-2xs'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-surface-secondary font-medium'
                    : 'text-graphite opacity-50 cursor-not-allowed'
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
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                01 / SERVICE PRACTICE
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Select a Design Discipline
              </h2>
              <p className="text-xs text-graphite">
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
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative space-y-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile ${
                      isSelected
                        ? 'border-accent bg-[#E0F2FE]/55 dark:bg-sky-950/30 ring-1 ring-accent shadow-xs'
                        : 'border-hairline bg-surface-secondary hover:border-graphite/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                          {srv.category}
                        </span>
                        <h3 className="font-display font-bold text-base text-carbon">
                          {srv.name}
                        </h3>
                      </div>
                      
                      {/* Selection Check Indicator */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-accent border-accent text-white shadow-2xs' 
                          : 'border-graphite/40'
                      }`} aria-hidden="true">
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <p className="text-xs text-graphite leading-relaxed line-clamp-2">
                      {srv.shortDesc}
                    </p>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs font-mono">
                      <span className="text-carbon font-bold">
                        From {studioProfile.currencySymbol}{srv.startingPrice.toLocaleString()}
                      </span>
                      <span className="text-graphite text-[11px]">
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
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative space-y-3 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent btn-tactile ${
                  serviceType === 'Custom Studio Engagement'
                    ? 'border-accent bg-[#E0F2FE]/55 dark:bg-sky-950/30 ring-1 ring-accent shadow-xs'
                    : 'border-hairline bg-surface-secondary hover:border-graphite/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                      Bespoke
                    </span>
                    <h3 className="font-display font-bold text-base text-carbon">
                      Custom Studio Engagement
                    </h3>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    serviceType === 'Custom Studio Engagement'
                      ? 'bg-accent border-accent text-white shadow-2xs' 
                      : 'border-graphite/40'
                  }`} aria-hidden="true">
                    {serviceType === 'Custom Studio Engagement' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <p className="text-xs text-graphite leading-relaxed">
                  Have an experimental or hybrid commission outside standard practice tiers? We'll tailor custom deliverables and timeline terms.
                </p>

                <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs font-mono">
                  <span className="text-carbon font-bold">
                    Custom Quote
                  </span>
                  <span className="text-graphite text-[11px]">
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
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                02 / SCOPE & CONTEXT
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Define Project Scope & Objectives
              </h2>
              <p className="text-xs text-graphite">
                Give your project an identifiable working name and describe the core requirements.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="input-project-title" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Project Working Title <span className="text-accent">*</span>
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
                  className={`w-full bg-surface-secondary border ${
                    stepErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-hairline'
                  } rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors`}
                />
                {stepErrors.title ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.title}
                  </p>
                ) : (
                  <p className="text-[11px] text-graphite mt-1 font-mono">
                    A distinct moniker for identifying your project in the studio ledger.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="textarea-project-description" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Project Brief & Deliverable Requirements <span className="text-accent">*</span>
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
                  className={`w-full bg-surface-secondary border ${
                    stepErrors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-hairline'
                  } rounded-xl p-3.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors resize-none leading-relaxed`}
                />
                {stepErrors.description ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-graphite mt-1 font-mono">
                    Minimum 10 characters detailing primary design targets.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="input-project-purpose" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                    Context & Purpose <span className="text-graphite font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="input-project-purpose"
                    type="text"
                    placeholder="e.g. Seed-stage venture launch, annual festival..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="input-target-audience" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                    Target Demographic <span className="text-graphite font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="input-target-audience"
                    type="text"
                    placeholder="e.g. Design-conscious collectors, technical founders..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full bg-surface-secondary border border-hairline rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
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
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                03 / CREATIVE DIRECTIVES
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Visual Tone & Technical Specifications
              </h2>
              <p className="text-xs text-graphite">
                Communicate your aesthetic sensibilities, color palettes, and production dimensions.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="input-preferred-style" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Aesthetic Style / Feel <span className="text-graphite font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-preferred-style"
                  type="text"
                  placeholder="e.g. Swiss typographic minimalism, vintage screen-print, bold brutalist..."
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                />

                {/* Suggested Aesthetic Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-[10px] font-mono text-graphite pr-1">Suggestions:</span>
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
                      className="px-2.5 py-0.5 rounded-full bg-surface-secondary border border-hairline text-[10px] font-mono hover:border-accent transition-colors cursor-pointer"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="input-preferred-colors" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Color Palette or Hex Codes <span className="text-graphite font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-preferred-colors"
                  type="text"
                  placeholder="e.g. #B91F20, #F5EBCB, Charcoal, Deep Navy (comma-separated)"
                  value={colorsInput}
                  onChange={(e) => setColorsInput(e.target.value)}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                />

                {/* Live Swatch Preview */}
                {previewColors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2.5">
                    <span className="text-[10px] font-mono text-graphite">Detected:</span>
                    {previewColors.map((color, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-secondary border border-hairline text-[11px] font-mono">
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
                <label htmlFor="input-required-dimensions" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Required Dimensions & Formats <span className="text-graphite font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="input-required-dimensions"
                  type="text"
                  placeholder="e.g. Scalable SVG + Vector AI, A2 300 DPI Print PDF, 1920x1080 horizontal..."
                  value={requiredDimensions}
                  onChange={(e) => setRequiredDimensions(e.target.value)}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="textarea-additional-notes" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Directives, Constraints & Things to Avoid <span className="text-graphite font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="textarea-additional-notes"
                  rows={3}
                  placeholder="e.g. Must harmonize with existing brand guidelines, avoid drop shadows, specific copy to embed..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full bg-surface-secondary border border-hairline rounded-xl p-3.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 4: INVESTMENT & COMMITTED DELIVERY                              */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 4 && (
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                04 / INVESTMENT & TIMELINE
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Proposed Budget & Delivery Window
              </h2>
              <p className="text-xs text-graphite">
                Set your target financial investment and committed delivery date.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="input-commission-budget" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Target Budget ({studioProfile.currencySymbol}) <span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite font-mono text-xs font-bold">
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
                    className={`w-full bg-surface-secondary border ${
                      stepErrors.budget ? 'border-red-500 ring-1 ring-red-500' : 'border-hairline'
                    } rounded-xl pl-8 pr-4 py-2.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors font-mono font-bold`}
                  />
                </div>
                {stepErrors.budget ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.budget}
                  </p>
                ) : (
                  <p className="text-[11px] text-graphite mt-1 font-mono">
                    Base rate for {serviceType}: {studioProfile.currencySymbol}{selectedServiceItem ? selectedServiceItem.startingPrice.toLocaleString() : '3,500'}.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="input-commission-deadline" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Committed Delivery Date <span className="text-accent">*</span>
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
                  className={`w-full bg-surface-secondary border ${
                    stepErrors.deadline ? 'border-red-500 ring-1 ring-red-500' : 'border-hairline'
                  } rounded-xl px-4 py-2.5 text-xs sm:text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors cursor-pointer`}
                />
                {stepErrors.deadline ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.deadline}
                  </p>
                ) : (
                  <p className="text-[11px] text-graphite mt-1 font-mono">
                    Subject to studio schedule alignment during brief review.
                  </p>
                )}
              </div>
            </div>

            {/* Explanatory Policy Callout */}
            <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold block">
                Payment Terms Alignment
              </span>
              <p className="text-xs text-graphite leading-relaxed">
                Commissions require a <strong>50% deposit</strong> following scope alignment to reserve production scheduling. The remaining <strong>50% balance</strong> is settled upon final design approval prior to deliverable package handoff.
              </p>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* STEP 5: VISUAL REFERENCES & LINKS                                    */}
        {/* --------------------------------------------------------------------- */}
        {currentStep === 5 && (
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                05 / REFERENCES & VISUALS
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Visual References & Moodboards
              </h2>
              <p className="text-xs text-graphite">
                Share online moodboards, inspiration boards, or brand decks via secure HTTPS links.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="textarea-reference-links" className="block text-xs font-semibold text-carbon mb-2 font-mono uppercase tracking-wider">
                  Inspiration Links (HTTPS) <span className="text-graphite font-normal lowercase">(optional)</span>
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
                  className={`w-full bg-surface-secondary border ${
                    stepErrors.referenceLinks ? 'border-red-500 ring-1 ring-red-500' : 'border-hairline'
                  } rounded-xl p-3.5 text-xs sm:text-sm text-carbon placeholder-[#A1A1AA] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors resize-none leading-relaxed`}
                />
                {stepErrors.referenceLinks ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {stepErrors.referenceLinks}
                  </p>
                ) : (
                  <p className="text-[11px] text-graphite mt-1 font-mono">
                    All links must begin with <code>https://</code> for browser security.
                  </p>
                )}
              </div>

              {/* Verified Links Chips */}
              {parsedReferenceLinks.length > 0 && !stepErrors.referenceLinks && (
                <div className="p-3 bg-surface-secondary border border-hairline rounded-2xl space-y-2">
                  <span className="font-mono text-[10px] text-graphite uppercase font-bold block">
                    Recognized Reference Links ({parsedReferenceLinks.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {parsedReferenceLinks.map((url, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface border border-hairline text-accent">
                        <LinkIcon className="w-3 h-3" />
                        <span className="truncate max-w-[220px]">{url}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secure Asset Delivery Policy Notice */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-mono font-bold text-carbon block uppercase tracking-wider text-[10px]">
                    Direct File Attachments Notice
                  </span>
                  <p className="text-graphite leading-relaxed">
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
          <section className="bg-surface border border-hairline rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200 shadow-xs">
            <div className="border-b border-hairline pb-4 space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-accent font-bold">
                06 / VERIFY & TRANSMIT
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-carbon">
                Review Project Brief
              </h2>
              <p className="text-xs text-graphite">
                Confirm your brief specifications before transmitting to the studio. You can edit any section below.
              </p>
            </div>

            {/* Structured Summary Cards */}
            <div className="space-y-4 text-xs">
              
              {/* Card 1: Service Practice */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-graphite font-bold block">
                    01 · Service Practice
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-carbon">
                    {serviceType}
                  </h3>
                  {selectedServiceItem && (
                    <p className="text-[11px] text-graphite">
                      Starting at {studioProfile.currencySymbol}{selectedServiceItem.startingPrice.toLocaleString()} · {selectedServiceItem.turnaround}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(1)}
                  className="px-3 py-1.5 rounded-full border border-hairline text-xs font-mono font-semibold text-accent hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 2: Project Scope */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-graphite font-bold block">
                    02 · Project Scope
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-carbon truncate">
                    {title || 'Untitled Project'}
                  </h3>
                  <p className="text-graphite leading-relaxed line-clamp-3 whitespace-pre-line text-xs">
                    {description || 'No description provided.'}
                  </p>
                  {(purpose || targetAudience) && (
                    <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-graphite">
                      {purpose && <span><strong>Context:</strong> {purpose}</span>}
                      {targetAudience && <span><strong>Audience:</strong> {targetAudience}</span>}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(2)}
                  className="px-3 py-1.5 rounded-full border border-hairline text-xs font-mono font-semibold text-accent hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 3: Creative Directives */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-graphite font-bold block">
                    03 · Creative Directives & Formats
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-graphite font-mono text-[10px] uppercase block">Aesthetic Feel</span>
                      <span className="font-medium text-carbon">{preferredStyle || 'Studio Artistic Discretion'}</span>
                    </div>
                    <div>
                      <span className="text-graphite font-mono text-[10px] uppercase block">Dimensions & Formats</span>
                      <span className="font-medium text-carbon">{requiredDimensions || 'Standard Vector & Production Package'}</span>
                    </div>
                  </div>
                  {previewColors.length > 0 && (
                    <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-graphite">Palette:</span>
                      {previewColors.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-surface border border-hairline">
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
                      <span className="text-graphite font-mono text-[10px] uppercase block">Directives</span>
                      <span className="text-xs text-carbon line-clamp-2">{additionalNotes}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(3)}
                  className="px-3 py-1.5 rounded-full border border-hairline text-xs font-mono font-semibold text-accent hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 4: Investment & Timeline */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-graphite font-bold block">
                    04 · Investment & Target Delivery
                  </span>
                  <div className="flex items-center gap-6 font-mono text-xs sm:text-sm">
                    <div>
                      <span className="text-graphite text-[10px] uppercase block">Budget Target</span>
                      <span className="font-bold text-carbon">
                        {studioProfile.currencySymbol}{parseFloat(budget.replace(/[^0-9.]/g, '') || '0').toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-graphite text-[10px] uppercase block">Committed Delivery</span>
                      <span className="font-medium text-carbon">
                        {deadline ? formatCommissionDate(deadline) : 'Scheduled with studio'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(4)}
                  className="px-3 py-1.5 rounded-full border border-hairline text-xs font-mono font-semibold text-accent hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* Card 5: References */}
              <div className="p-4 rounded-2xl bg-surface-secondary border border-hairline flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="font-mono text-[10px] uppercase text-graphite font-bold block">
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
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{link}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-graphite">
                      No external links provided. Uploads can be supplied in Client Workspace.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(5)}
                  className="px-3 py-1.5 rounded-full border border-hairline text-xs font-mono font-semibold text-accent hover:bg-surface transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

            </div>

            {/* Authentication Status Check Banner */}
            {!currentUser ? (
              <div className="p-5 rounded-2xl bg-[#E0F2FE]/60 dark:bg-sky-950/30 border border-accent/40 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-carbon">
                      Client Authentication Required to Transmit
                    </h4>
                    <p className="text-xs text-graphite leading-relaxed">
                      Your draft is safely preserved in this session. Sign in or register in one click below to link your brief to your personal studio dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setAuthDialogMode('signin'); setIsAuthDialogOpen(true); }}
                    className="px-5 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Sign In to Transmit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthDialogMode('register'); setIsAuthDialogOpen(true); }}
                    className="px-4 py-2 rounded-full border border-hairline bg-surface text-carbon text-xs font-semibold transition-all cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Authenticated as <strong>{currentUser.name}</strong> ({currentUser.email})
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                  Ready to Confirm
                </span>
              </div>
            )}

            {/* Explicit Commission Confirmation Checkbox */}
            <div className="space-y-1.5">
              <label
                htmlFor="checkbox-confirm-commission"
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  hasConfirmedBrief
                    ? 'bg-[#E0F2FE]/45 dark:bg-sky-950/30 border-accent/60'
                    : stepErrors.confirm
                    ? 'bg-red-50/70 dark:bg-red-950/20 border-red-400 dark:border-red-800'
                    : 'bg-surface-secondary border-hairline hover:border-graphite/40'
                }`}
              >
                <input
                  id="checkbox-confirm-commission"
                  type="checkbox"
                  checked={hasConfirmedBrief}
                  onChange={(e) => {
                    setHasConfirmedBrief(e.target.checked);
                    if (stepErrors.confirm) setStepErrors(prev => ({ ...prev, confirm: '' }));
                    if (formError) setFormError(null);
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-[#0284C7] cursor-pointer shrink-0"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-semibold text-carbon block">
                    I have reviewed my project brief and confirm I want to submit this commission request.
                  </span>
                  <span className="text-graphite leading-relaxed block">
                    Submitting sends your brief for studio review. No payment is charged until your scope is aligned.
                  </span>
                </div>
              </label>

              {stepErrors.confirm && (
                <p className="text-xs text-red-600 dark:text-red-400 font-mono flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{stepErrors.confirm}</span>
                </p>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEPPER CONTROLS (BACK & CONTINUE / TRANSMIT)                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {currentStep > 1 ? (
            <button
              key="btn-step-prev"
              id="btn-step-prev"
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-full border border-hairline bg-surface hover:bg-surface-secondary text-carbon text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              key="btn-step-next"
              id="btn-step-next"
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ml-auto"
            >
              <span>{currentStep === 5 ? 'Review Brief' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              key="btn-submit-commission-form"
              id="btn-submit-commission-form"
              type="submit"
              disabled={isSubmitting || (Boolean(currentUser) && !hasConfirmedBrief)}
              className="px-7 py-3 min-h-[44px] rounded-full bg-[#D4FF38] hover:bg-[#C4F024] disabled:opacity-50 disabled:cursor-not-allowed text-[#111114] font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ml-auto focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#111114] border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Commission...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentUser ? 'Confirm & Submit Commission' : 'Sign In & Confirm'}</span>
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
