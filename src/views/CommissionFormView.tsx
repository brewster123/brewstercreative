import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Info,
  ExternalLink,
  ChevronRight,
  Plus
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

  // Commission Form Fields (as specified by Phase 3A requirements)
  const [serviceType, setServiceType] = useState(preselectedService || 'Brand Identity Package');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('5000');
  const [deadline, setDeadline] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedCommission, setSubmittedCommission] = useState<any | null>(null);

  // Tomorrow's date string for input min attribute
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Sync preselectedService if passed from Portfolio or Services page
  useEffect(() => {
    if (preselectedService) {
      // Find matching service name if partial or category match
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
    setAdditionalNotes('');
    setDeadline('');
    setFormError(null);
    setSubmittedCommission(null);
    if (services.length > 0) {
      setServiceType(services[0].name);
      setBudget(services[0].startingPrice.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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

    // Prevent accidental duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await submitCommissionRequest({
        serviceType,
        title: cleanTitle,
        description: cleanDesc,
        budget: numericBudget,
        deadline,
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

  // SUCCESS CONFIRMATION STATE
  if (submittedCommission) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-xl space-y-8">
          
          {/* Header Badge & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono-code font-bold border border-emerald-200 uppercase tracking-wider">
              <span>Saved to Database</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
              Commission Request Submitted!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Your request has been successfully recorded in the Brewster Creative database with initial status <strong className="text-zinc-800">Pending</strong>.
            </p>
          </div>

          {/* Submission Details Bento Box */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60">
              <span className="text-xs text-zinc-500 font-mono-code font-bold uppercase tracking-wider">
                Commission Reference
              </span>
              <span className="font-mono-code text-xs sm:text-sm font-bold text-zinc-800 bg-white px-2.5 py-1 rounded-md border border-zinc-200">
                #{submittedCommission.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Service</span>
                <span className="font-bold text-zinc-900">{submittedCommission.service}</span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-xs mt-0.5">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Pending Designer Review</span>
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Project Title</span>
                <span className="font-medium text-zinc-800">{submittedCommission.projectName}</span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Estimated Budget</span>
                <span className="font-bold text-orange-600 font-mono-code">{submittedCommission.budget}</span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Target Deadline</span>
                <span className="font-medium text-zinc-800">{submittedCommission.deadline}</span>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase">Submitted By</span>
                <span className="font-medium text-zinc-800">{currentUser?.name} ({currentUser?.email})</span>
              </div>
            </div>

            {submittedCommission.description && (
              <div className="pt-3 border-t border-zinc-200/60">
                <span className="text-zinc-400 block text-[11px] font-mono-code uppercase mb-1">Brief Summary</span>
                <p className="text-xs text-zinc-600 line-clamp-3 bg-white p-3 rounded-xl border border-zinc-200/60">
                  {submittedCommission.description}
                </p>
              </div>
            )}
          </div>

          {/* Next Steps Guidance */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>What happens next?</span>
            </div>
            <p className="text-xs text-orange-950/80 leading-relaxed">
              Brewster will review your creative specifications and project scope. You can track real-time milestones, exchange messages, and review design drafts directly in your <strong>Client Dashboard</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              id="btn-submit-another"
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit Another Request</span>
            </button>

            <button
              id="btn-view-client-dashboard"
              type="button"
              onClick={() => setActiveView('client-dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Go to Client Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Commission Request</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
          Request a Custom Design Commission
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
          Fill out the project specifications below to submit your commission request directly to our database.
        </p>
      </div>

      {/* AUTHENTICATION STATUS BANNER */}
      {currentUser ? (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">{currentUser.name}</span>
                <span className="text-[10px] font-mono-code bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Logged In
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono-code mt-0.5">
                {currentUser.email} · Client ID: <span className="text-zinc-700 font-bold">{currentUser.id.slice(0, 8)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium self-end sm:self-center">
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Authenticated Client ID Locked</span>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                Sign In Required to Submit
              </h4>
              <p className="text-xs text-amber-800/90 leading-relaxed max-w-xl">
                A logged-in client account is required so your commission is securely assigned to your profile in Supabase and manageable in your client dashboard.
              </p>
            </div>
          </div>

          <button
            id="btn-signin-to-submit"
            type="button"
            onClick={() => setActiveView('auth')}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Sign In / Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ERROR FEEDBACK BANNER */}
      {formError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
            {formError}
          </div>
        </div>
      )}

      {/* COMMISSION FORM */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

        {/* FIELD 1: SERVICE SELECTION */}
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              01
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Select Service Package <span className="text-orange-500">*</span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Choose the design discipline or package for your project.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="select-commission-service" className="block text-xs font-bold text-zinc-800 mb-2">
              Service <span className="text-orange-500">*</span>
            </label>
            <select
              id="select-commission-service"
              value={serviceType}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white font-medium cursor-pointer"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.name}>
                  {srv.name} (from {studioProfile.currencySymbol}{srv.startingPrice.toLocaleString()} · {srv.turnaround})
                </option>
              ))}
              <option value="Custom Creative Direction">Custom Creative Direction</option>
            </select>
          </div>

          {/* Service quick info badge */}
          {selectedServiceItem && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-zinc-600 font-medium">
                {selectedServiceItem.shortDesc}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-zinc-500 font-mono-code">
                <span>Turnaround: <strong className="text-zinc-800 font-bold">{selectedServiceItem.turnaround}</strong></span>
                <span>Base: <strong className="text-orange-600 font-bold">{studioProfile.currencySymbol}{selectedServiceItem.startingPrice.toLocaleString()}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* FIELD 2 & 3: PROJECT TITLE & PROJECT DESCRIPTION */}
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              02
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Project Scope & Requirements
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Provide a clear title and description for what you want designed.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="input-project-title" className="block text-xs font-bold text-zinc-800 mb-1.5">
                Project Title <span className="text-orange-500">*</span>
              </label>
              <input
                id="input-project-title"
                type="text"
                required
                placeholder="e.g. Solis Labs Brand Identity Package"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="textarea-project-description" className="block text-xs font-bold text-zinc-800 mb-1.5">
                Project Description <span className="text-orange-500">*</span>
              </label>
              <textarea
                id="textarea-project-description"
                rows={4}
                required
                placeholder="Describe your design needs, visual goals, context, desired mood, deliverables, and intended audience..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* FIELD 4 & 5: BUDGET & DESIRED DEADLINE */}
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              03
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Budget & Schedule
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Specify your proposed investment and target completion date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="input-commission-budget" className="block text-xs font-bold text-zinc-800 mb-1.5">
                Budget ({studioProfile.currencySymbol}) <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono-code text-sm font-bold">
                  {studioProfile.currencySymbol}
                </span>
                <input
                  id="input-commission-budget"
                  type="number"
                  required
                  min="1"
                  step="100"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-9 pr-4 py-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono-code font-bold text-orange-600"
                />
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Estimated starting rate is {studioProfile.currencySymbol}{selectedServiceItem ? selectedServiceItem.startingPrice.toLocaleString() : '3,500'}.
              </span>
            </div>

            <div>
              <label htmlFor="input-commission-deadline" className="block text-xs font-bold text-zinc-800 mb-1.5">
                Desired Deadline <span className="text-orange-500">*</span>
              </label>
              <input
                id="input-commission-deadline"
                type="date"
                required
                min={tomorrowStr}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white font-medium cursor-pointer"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Select your preferred project delivery target date.
              </span>
            </div>
          </div>
        </div>

        {/* FIELD 6: ADDITIONAL NOTES */}
        <div className="bg-white border border-[#E5E5E5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              04
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Additional Notes
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Include any special requests, reference links, print considerations, or constraints.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="textarea-additional-notes" className="block text-xs font-bold text-zinc-800 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              id="textarea-additional-notes"
              rows={3}
              placeholder="e.g. Reference links (Pinterest, Behance), preferred color preferences, dimensions (e.g. A2 300DPI), or special file format needs..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* SUBMISSION & STATUS INFO BOX */}
        <div className="bg-zinc-50 border border-orange-200/80 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600 pb-4 border-b border-zinc-200/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Initial Status: <strong className="text-zinc-800">Pending Designer Review</strong> (Database default)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-mono-code text-[11px]">
              <span>Directly written to Supabase commissions table</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <p className="text-xs text-zinc-500 text-center sm:text-left leading-relaxed max-w-md">
              By submitting, your brief will be saved to the database. You can track progress and milestones in your Client Dashboard.
            </p>

            <button
              id="btn-submit-commission-form"
              type="submit"
              disabled={isSubmitting || !currentUser}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Commission...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Commission Request</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
