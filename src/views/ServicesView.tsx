import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceCard } from '../components/ServiceCard';
import { 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  Send,
  CheckCircle2,
  FileCheck
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
      q: 'Do I own full commercial rights to the final designs?',
      a: 'Yes! All final commissioned work includes an unrestricted, exclusive worldwide commercial usage license for print, digital, merchandise, and trademark registration.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Services Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Commission Packages & Rates</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
          Design Services & Capabilities
        </h1>

        <p className="text-sm sm:text-base text-zinc-500 leading-relaxed font-medium">
          Transparent rates, guaranteed turnarounds, and collaborative milestone reviews tracked directly through your client dashboard.
        </p>
      </div>

      {/* Admin Notice & Quick Edit Button */}
      {currentUser?.role === 'admin' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Studio Admin View (Brewster A. Cabando): You can update package rates, add deliverables, or create new service tiers.</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('admin-dashboard')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl whitespace-nowrap shadow-xs transition-colors"
          >
            Manage Services & Pricing in Admin Portal →
          </button>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* Commission Guarantees & Studio Standards */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-12 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
            The {studioProfile.studioName} Guarantee
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            Standard perks included with every graphic design commission:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-[24px] bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 border border-orange-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-display font-black text-sm text-zinc-900">Master Source Files</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Complete scalable vector (AI/SVG/EPS), layered PSDs, and print-ready 300 DPI CMYK PDFs.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-200">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-display font-black text-sm text-zinc-900">On-Time Delivery</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Committed deadlines with milestone updates so you are never left guessing where your project stands.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-200">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="font-display font-black text-sm text-zinc-900">Dedicated Revisions</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Clear revision rounds included to refine composition, weights, colors, and typography.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-zinc-50 border border-zinc-200/80 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-display font-black text-sm text-zinc-900">Full Commercial Rights</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Unconditional commercial IP transfer for marketing, packaging, merchandise, and broadcasts.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono-code text-orange-600 uppercase tracking-wider font-bold">
            Common Inquiries
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-[28px] bg-white border border-[#E5E5E5] space-y-2 hover:border-orange-200 transition-colors shadow-xs"
            >
              <h4 className="font-display font-black text-sm sm:text-base text-zinc-900 flex items-start gap-2">
                <span className="text-orange-500 font-mono-code font-bold">Q.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed pl-5 font-medium">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-8 sm:p-10 text-center space-y-4 shadow-xs">
        <h3 className="font-display text-2xl font-black text-zinc-900">
          Ready to get started on your design?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto font-medium">
          Submit your commission brief today. No payment required until we confirm project scope together.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all shadow-xs inline-flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Submit a Commission Request</span>
        </button>
      </div>

    </div>
  );
};
