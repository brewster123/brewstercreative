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
  ArrowRight,
  ArrowUpRight
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
    <div className="bg-canvas min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-20">
      
      {/* Editorial Services Header */}
      <div className="border-b border-hairline pb-8 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Studio Practice &amp; Capabilities Menu</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-carbon tracking-tight leading-[1.04]">
              Commission Services &amp; Capabilities
            </h1>

            <p className="text-sm sm:text-base text-graphite-strong leading-relaxed font-normal">
              Transparent starting rates, committed delivery windows, and iterative milestone reviews tracked directly through your private client portal.
            </p>
          </div>

          <div className="text-xs text-graphite self-start md:self-end">
            <span className="text-carbon font-bold tabular-nums">{services.length}</span> Active Practices
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      {currentUser?.role === 'admin' && (
        <div className="bg-surface-secondary border border-hairline rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-carbon font-medium">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <span>Studio Director Portal: You can modify service deliverables, rates, or add new disciplines.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('admin-dashboard')}
            className="px-4 py-2 bg-[#111114] dark:bg-white text-white dark:text-[#111114] font-semibold rounded-full text-xs transition-opacity hover:opacity-90 cursor-pointer min-h-[44px] inline-flex items-center"
          >
            Manage Services in Admin Portal →
          </button>
        </div>
      )}

      {/* Editorial Service Menu */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-hairline pb-3">
          <span className="text-xs uppercase tracking-widest text-graphite font-bold">
            Service Menu &amp; Scope of Practice
          </span>
          <span className="text-xs text-graphite">
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

    </div>
  );
};
