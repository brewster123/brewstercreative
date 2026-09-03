import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FileUploader } from '../components/FileUploader';
import { 
  Sparkles, 
  Send, 
  Check, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  FileText, 
  DollarSign, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  UserCheck
} from 'lucide-react';

export const CommissionFormView: React.FC = () => {
  const { 
    currentUser, 
    services, 
    studioProfile, 
    submitCommission, 
    preselectedService, 
    setPreselectedService 
  } = useApp();

  // Form State
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [socialHandle, setSocialHandle] = useState(currentUser?.handle || '');
  const [preferredContact, setPreferredContact] = useState(currentUser?.contactMethod || 'Platform Chat');

  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState(preselectedService || 'Brand Identity Package');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('Modern Minimalist');
  const [colorTags, setColorTags] = useState<string[]>(['#0F172A', '#F97316']);
  const [newColorInput, setNewColorInput] = useState('#2563EB');
  const [requiredDimensions, setRequiredDimensions] = useState('Vector SVG/AI + High-Res PNG + 300DPI Print PDF');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('5000');

  // References
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const [referenceLinks, setReferenceLinks] = useState<string[]>(['']);

  // Additional Information
  const [communicationGoals, setCommunicationGoals] = useState('');
  const [thingsToAvoid, setThingsToAvoid] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedService) {
      setServiceType(preselectedService);
      const match = services.find(s => s.name.toLowerCase() === preselectedService.toLowerCase() || s.category.toLowerCase() === preselectedService.toLowerCase());
      if (match) {
        setBudget(match.startingPrice.toString());
      }
    }
  }, [preselectedService, services]);

  const handleAddLink = () => {
    setReferenceLinks(prev => [...prev, '']);
  };

  const handleLinkChange = (index: number, val: string) => {
    setReferenceLinks(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveLink = (index: number) => {
    setReferenceLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddColor = () => {
    if (newColorInput && !colorTags.includes(newColorInput)) {
      setColorTags(prev => [...prev, newColorInput]);
    }
  };

  const handleRemoveColor = (hex: string) => {
    setColorTags(prev => prev.filter(c => c !== hex));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please check and agree to the commission terms to proceed.');
      return;
    }

    setIsSubmitting(true);

    const refImages = uploadedFiles.filter(f => f.type === 'image').map(f => f.url);
    const refDocs = uploadedFiles.filter(f => f.type === 'document').map((f, i) => ({
      id: `doc-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      url: f.url,
    }));

    setTimeout(() => {
      submitCommission({
        fullName,
        email,
        socialHandle,
        preferredContact,
        projectName,
        serviceType,
        description,
        purpose,
        targetAudience,
        preferredStyle,
        preferredColors: colorTags,
        requiredDimensions,
        deadline: deadline || 'Within 2 weeks',
        budget: budget.startsWith('₱') ? budget : `₱${budget}`,
        referenceImages: refImages,
        referenceDocs: refDocs,
        referenceLinks: referenceLinks.filter(l => l.trim() !== ''),
        communicationGoals,
        thingsToAvoid,
        additionalNotes,
      });
      setIsSubmitting(false);
      setPreselectedService(null);
    }, 600);
  };

  const stylePresets = [
    'Modern Minimalist',
    'Bold & Brutalist',
    'Retro / 80s Cyberpunk',
    'Organic / Earthy Botanical',
    'Luxury Serif Typography',
    'Playful / Illustrative',
    'Corporate Clean & Professional',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Commission Briefing Suite</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-zinc-900">
          Start Your Graphic Design Commission
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
          Provide as much detail as possible to help me understand your aesthetic goals, deliverables, and timeline requirements.
        </p>
      </div>

      {/* Main Commission Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: CLIENT INFORMATION */}
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              01
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Client Information
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                How should I address you and keep in touch regarding project updates?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <input
                id="input-client-fullname"
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Email Address <span className="text-orange-500">*</span>
              </label>
              <input
                id="input-client-email"
                type="email"
                required
                placeholder="e.g. alex@solislabs.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Social Media / Contact Handle (Optional)
              </label>
              <input
                id="input-client-social"
                type="text"
                placeholder="e.g. @alexrivera_co on X / Instagram / Discord"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Preferred Contact Method
              </label>
              <select
                id="select-contact-method"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              >
                <option value="Platform Chat">Platform Chat (Studio Portal)</option>
                <option value="Email">Email</option>
                <option value="Discord">Discord</option>
                <option value="WhatsApp / Telegram">WhatsApp / Telegram</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: PROJECT INFORMATION */}
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              02
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Project Specifications & Scope
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Describe the design deliverables, purpose, aesthetic preference, and parameters.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Project Name <span className="text-orange-500">*</span>
                </label>
                <input
                  id="input-project-name"
                  type="text"
                  required
                  placeholder="e.g. Solis Labs Brand Identity Package"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Type of Design / Commission Package <span className="text-orange-500">*</span>
                </label>
                <select
                  id="select-design-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name} (from {studioProfile.currencySymbol}{srv.startingPrice})
                    </option>
                  ))}
                  <option value="Custom Graphic Design">Custom Graphic Design (Bespoke)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Description of the Design <span className="text-orange-500">*</span>
              </label>
              <textarea
                id="input-project-description"
                rows={3}
                required
                placeholder="Describe what you need built, key visual elements, mood, and context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Purpose of the Design
                </label>
                <input
                  id="input-project-purpose"
                  type="text"
                  placeholder="e.g. Commercial launch, album release, event key visual"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Target Audience
                </label>
                <input
                  id="input-target-audience"
                  type="text"
                  placeholder="e.g. Tech founders, gaming community, Gen Z readers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Preferred Style & Presets */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Preferred Aesthetic Style
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {stylePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPreferredStyle(preset)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                      preferredStyle === preset
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                id="input-preferred-style"
                type="text"
                value={preferredStyle}
                onChange={(e) => setPreferredStyle(e.target.value)}
                placeholder="Or type a custom aesthetic direction..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
              />
            </div>

            {/* Preferred Colors Tag Picker */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Preferred Color Palette System
              </label>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {colorTags.map((hex) => (
                  <span
                    key={hex}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono-code text-zinc-800 font-bold"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-zinc-300 shrink-0"
                      style={{ backgroundColor: hex }}
                    ></span>
                    <span>{hex}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(hex)}
                      className="text-zinc-400 hover:text-red-500 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                    title="Choose color"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono-code text-zinc-700 border border-zinc-200 font-bold"
                  >
                    + Add Color
                  </button>
                </div>
              </div>
            </div>

            {/* Required Dimensions, Deadline & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Required Dimensions / Formats
                </label>
                <input
                  id="input-dimensions"
                  type="text"
                  placeholder="e.g. Vector SVG, A2 300DPI, 1080x1350"
                  value={requiredDimensions}
                  onChange={(e) => setRequiredDimensions(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Desired Deadline <span className="text-orange-500">*</span>
                </label>
                <input
                  id="input-deadline"
                  type="text"
                  required
                  placeholder="e.g. September 15, 2026"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Estimated Budget ({studioProfile.currencySymbol})
                </label>
                <input
                  id="input-budget"
                  type="text"
                  placeholder="e.g. 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono-code font-bold text-orange-600"
                />
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: REFERENCES & MOODBOARD */}
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              03
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Visual References & Documents
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Attach moodboards, inspiration images, existing brand guidelines, or reference links.
              </p>
            </div>
          </div>

          <FileUploader onFilesSelected={(files) => setUploadedFiles(files)} />

          {/* Reference Links list */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-zinc-800">
              Reference URLs / Moodboards (Pinterest, Are.na, Behance, Figma)
            </label>
            {referenceLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://pinterest.com/moodboard-example"
                    value={link}
                    onChange={(e) => handleLinkChange(idx, e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
                {referenceLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLink}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another reference link</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: ADDITIONAL INFORMATION */}
        <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 font-mono-code font-bold flex items-center justify-center text-xs border border-orange-200">
              04
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-zinc-900">
                Creative Direction & Guidelines
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Clarify what the design must communicate and what to avoid.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                What do you want the design to communicate?
              </label>
              <textarea
                id="input-communication-goals"
                rows={2}
                placeholder="e.g. Needs to feel high-tech, organic, trustworthy, and premium..."
                value={communicationGoals}
                onChange={(e) => setCommunicationGoals(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Things to Avoid (Visual dealbreakers)
              </label>
              <textarea
                id="input-things-to-avoid"
                rows={2}
                placeholder="e.g. Please avoid generic leaf icons, clip art stars, or neon green accents..."
                value={thingsToAvoid}
                onChange={(e) => setThingsToAvoid(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Additional Notes or Questions
              </label>
              <textarea
                id="input-additional-notes"
                rows={2}
                placeholder="Any special print considerations, font licenses, or urgent timeline constraints..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: TERMS & SUBMIT */}
        <div className="bg-zinc-50 border border-orange-200 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-start gap-3">
            <input
              id="checkbox-commission-terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500 mt-1 cursor-pointer"
            />
            <label htmlFor="checkbox-commission-terms" className="text-xs sm:text-sm text-zinc-700 leading-relaxed cursor-pointer font-medium">
              <strong className="text-zinc-900 font-bold">I understand and agree to the commission terms:</strong> A 50% deposit will be initiated upon scope alignment, followed by transparent 8-stage visual milestone reviews in the client dashboard before master deliverable release.
            </label>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Directly managed in your dedicated Client Portal</span>
            </div>

            <button
              id="btn-submit-commission-request"
              type="submit"
              disabled={isSubmitting || !agreedToTerms}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Commission Record...</span>
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
