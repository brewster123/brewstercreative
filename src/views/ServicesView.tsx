import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceCard } from '../components/ServiceCard';
import { 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  Send,
  FileCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { services, studioProfile, setActiveView, currentUser } = useApp();

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
    <div className="bg-notebook-ruled min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
      
      {/* Editorial Services Header */}
      <div className="border-b border-[#E4E2DC] dark:border-[#222225] pb-8 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-handwriting text-2xl text-[#EA580C]">the catalogue</span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-bold">
                · Studio Practice &amp; Menu
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tighter leading-[1.04]">
              Commission Services &amp; Capabilities
            </h1>

            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A1A1AA] leading-relaxed font-normal">
              Transparent starting rates, committed delivery windows, and iterative milestone reviews tracked directly through your private client portal.
            </p>
          </div>

          <div className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA] self-start md:self-end">
            <span className="text-[#18181B] dark:text-[#EDEDEC] font-semibold tabular-nums">{services.length}</span> Active Practices
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      {currentUser?.role === 'admin' && (
        <div className="bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-[#18181B] dark:text-[#EDEDEC] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>Studio Director Portal: You can modify service deliverables, rates, or add new disciplines.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('admin-dashboard')}
            className="px-4 py-2 bg-[#18181B] dark:bg-[#EDEDEC] text-white dark:text-[#18181B] font-semibold rounded-lg text-xs transition-colors hover:opacity-90 cursor-pointer min-h-[44px] inline-flex items-center"
          >
            Manage Services in Admin Portal →
          </button>
        </div>
      )}

      {/* Editorial Service Menu */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#E4E2DC] dark:border-[#222225] pb-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#71717A] dark:text-[#A1A1AA] font-bold">
            Service Menu &amp; Scope of Practice
          </span>
          <span className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Select a practice to initiate brief
          </span>
        </div>

        <div className="space-y-6">
          {services.map((service, index) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              index={index} 
            />
          ))}
        </div>
      </section>

      {/* Studio Standards Section (Editorial Ledger, Not SaaS Cards) */}
      <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#222225] space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
            Commitments &amp; Rigor
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            The {studioProfile.studioName} Production Standards
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Every engagement adheres to non-negotiable craftsmanship benchmarks regardless of scope.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {standards.map((std, idx) => {
            const Icon = std.icon;
            return (
              <div 
                key={idx} 
                className="space-y-3 pb-6 border-b border-[#E4E2DC] dark:border-[#222225] sm:border-b-0"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#222225] text-[#EA580C] flex items-center justify-center shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC]">
                  {std.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed font-normal">
                  {std.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frequently Asked Questions (Editorial Format) */}
      <section className="pt-10 border-t border-[#E4E2DC] dark:border-[#222225] space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
            Clarity &amp; Guidance
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#18181B] dark:text-[#EDEDEC] tracking-tight">
            Frequently Discussed Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            Everything you need to know regarding commissioning custom artworks, payment schedules, and revision rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {faqs.map((faq, idx) => (
            <div key={idx} className="space-y-2 pb-6 border-b border-[#E4E2DC] dark:border-[#222225]">
              <h3 className="font-display text-base font-bold text-[#18181B] dark:text-[#EDEDEC] flex items-baseline gap-2">
                <span className="text-[#EA580C] font-mono text-xs font-bold">0{idx + 1}.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed pl-6 font-normal">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Closing Banner */}
      <section className="pt-6">
        <div className="bg-[#121214] text-white rounded-2xl p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#222225]">
          <div className="space-y-2 max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#EA580C] font-bold">
              Creative Dialogue · Make noise. Make meaning.
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Require a custom scope not listed above?
            </h3>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed font-normal">
              DESTALION regularly directs bespoke multimedia installations, experimental typographic releases, and one-off publication editions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveView('commission-form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] active:bg-[#C23E0E] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer shrink-0 min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>Submit Custom Project Brief</span>
          </button>
        </div>
      </section>

    </div>
  );
};
