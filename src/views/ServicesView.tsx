import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceCard } from '../components/ServiceCard';
import {
  ServiceEditorModal,
  ServiceDeleteModal,
} from '../components/admin/ServiceEditorModal';
import { ServiceItem } from '../types';
import { 
  Clock, 
  RotateCcw, 
  FileCheck,
  Layers,
  ArrowUpRight,
  Plus,
  AlertCircle
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { services, studioProfile, setActiveView, currentUser, updateServiceItem } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleOpenAddService = () => {
    if (!isAdmin) return;
    setAdminError(null);
    setEditingService(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditService = (service: ServiceItem) => {
    if (!isAdmin) return;
    setAdminError(null);
    setEditingService(service);
    setIsEditorOpen(true);
  };

  const handleRequestDeleteService = (service: ServiceItem) => {
    if (!isAdmin) return;
    setAdminError(null);
    setServiceToDelete({ id: service.id, name: service.name });
  };

  const handleTogglePopularService = async (service: ServiceItem) => {
    if (!isAdmin) return;
    setAdminError(null);
    const res = await updateServiceItem(service.id, { popular: !service.popular });
    if (res && !res.success) {
      setAdminError(res.error || 'Failed to update Core Offering status.');
    }
  };

  const adminCardProps = isAdmin
    ? {
        onEdit: handleOpenEditService,
        onDelete: handleRequestDeleteService,
        onTogglePopular: handleTogglePopularService,
      }
    : {};

  const faqs = [
    {
      q: 'How does payment and deposit work?',
      a: 'A 50% deposit is required after project scope alignment to reserve your slot and initiate concept development. The remaining 50% balance is settled upon final design approval before master production files are delivered.',
    },
    {
      q: 'What is your turnaround time?',
      a: 'Turnaround ranges from 2–5 days for posters and social kits, up to 7–14 days for comprehensive brand identity systems. Rush turnaround is available upon request during commission submission.',
    },
    {
      q: 'How do revisions work in the client dashboard?',
      a: 'When proofs are uploaded to Stage 05 (Client Review), you can inspect high-res visuals and click "Request Revision" with detailed notes. Your revision request updates the project timeline and notifies the designer immediately.',
    },
    {
      q: 'How can I use the delivered design files?',
      a: 'All completed commissions include full master source files and production exports ready for your digital media, print materials, marketing campaigns, and merchandise.',
    },
  ];

  const standards = [
    {
      icon: FileCheck,
      title: 'Master Source Files',
      desc: 'Complete scalable vector formats (AI, SVG, EPS), layered PSDs, and press-ready 300 DPI CMYK PDFs.',
    },
    {
      icon: Clock,
      title: 'Committed Deadlines',
      desc: 'Transparent milestones with real-time progress updates so you are never left guessing where your project stands.',
    },
    {
      icon: RotateCcw,
      title: 'Dedicated Revisions',
      desc: 'Structured revision cycles included with every engagement to refine composition, weights, palette, and typography.',
    },
    {
      icon: Layers,
      title: 'Multi-Format Production',
      desc: 'High-resolution production assets prepared for web, social feeds, physical packaging, and tactile print applications.',
    },
  ];

  return (
    <div className="bg-canvas min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16 space-y-16 sm:space-y-20">

      {/* Editorial Service Menu */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase tracking-widest text-graphite font-bold">
              Service Menu &amp; Scope of Practice
            </span>
            {isAdmin && (
              <span className="text-[11px] font-mono text-graphite px-2 py-0.5 rounded-full bg-surface-secondary border border-hairline">
                {services.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs text-graphite ${isAdmin ? 'hidden sm:inline' : ''}`}>
              Select a practice to initiate brief
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddService}
                className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            )}
          </div>
        </div>

        {isAdmin && adminError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adminError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminError(null)}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {services.length === 0 ? (
          <div className="rounded-3xl bg-surface border border-hairline p-10 sm:p-14 text-center space-y-4">
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-display text-lg font-bold text-carbon">
                No studio services published yet
              </h3>
              <p className="text-xs sm:text-sm text-graphite leading-relaxed">
                {isAdmin
                  ? 'Add your first service package with starting rates, turnaround, and deliverables.'
                  : 'Custom commission packages are currently being updated. Reach out below for bespoke inquiries.'}
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddService}
                className="btn-tactile inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Service</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {services.map((service, index) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                index={index}
                {...adminCardProps}
              />
            ))}
          </div>
        )}
      </section>

      {/* Studio Standards Section */}
      <section className="pt-10 border-t border-hairline space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs uppercase tracking-widest text-accent font-bold">
            · Commitments &amp; Rigor
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            The {studioProfile.studioName} Production Standards
          </h2>
          <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
            Every engagement adheres to non-negotiable craftsmanship benchmarks regardless of scope.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {standards.map((std, idx) => {
            const Icon = std.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-3xl bg-surface-secondary border border-hairline space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-surface border border-hairline text-accent flex items-center justify-center shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-carbon">
                  {std.title}
                </h3>
                <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed font-normal">
                  {std.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="pt-10 border-t border-hairline space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs uppercase tracking-widest text-accent font-bold">
            · Clarity &amp; Guidance
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-carbon tracking-tight">
            Frequently Discussed Questions
          </h2>
          <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed">
            Everything you need to know regarding commissioning custom artworks, payment schedules, and revision rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-surface border border-hairline space-y-2">
              <h3 className="font-display text-base font-bold text-carbon flex items-baseline gap-2.5">
                <span className="text-accent text-xs font-bold tabular-nums">0{idx + 1}.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-graphite-strong leading-relaxed pl-6 font-normal">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing Radiant CTA Banner */}
      <section className="pt-6">
        <div className="hero-sky-gradient text-white rounded-3xl p-8 sm:p-12 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase tracking-widest text-white/85 font-bold block">
              · Creative Dialogue · Make noise. Make meaning.
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Require a custom scope not listed above?
            </h3>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal">
              DESTALION regularly directs bespoke multimedia installations, experimental typographic releases, and one-off publication editions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveView('commission-form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pl-6 pr-2.5 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-3 cursor-pointer shrink-0 min-h-[44px] btn-tactile"
          >
            <span>Submit Custom Project Brief</span>
            <span className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>

      {/* Admin-Only Service Editor & Delete Modals */}
      {isAdmin && (
        <>
          <ServiceEditorModal
            isOpen={isEditorOpen}
            service={editingService}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingService(null);
            }}
          />
          <ServiceDeleteModal
            service={serviceToDelete}
            onClose={() => setServiceToDelete(null)}
          />
        </>
      )}

    </div>
  );
};
