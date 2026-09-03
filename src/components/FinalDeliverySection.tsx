import React, { useState } from 'react';
import { Commission } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  FolderArchive, 
  Calendar, 
  FileText, 
  Send,
  ExternalLink,
  ShieldCheck,
  Star
} from 'lucide-react';

interface FinalDeliverySectionProps {
  commission: Commission;
}

export const FinalDeliverySection: React.FC<FinalDeliverySectionProps> = ({ commission }) => {
  const { setActiveView } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const finalPackage = commission.finalFiles || {
    packageName: `${commission.projectName.replace(/\s+/g, '_')}_Production_Suite.zip`,
    packageSize: '124.6 MB',
    formats: ['Vector SVG & EPS', 'High-Res PNG (Transparent)', 'Print PDF (CMYK 300DPI)', 'Brand Guidelines PDF'],
    downloadUrl: '#download-package',
    deliverablesList: [
      'Primary_Logo_Vector_Suite.svg',
      'Secondary_Marks_and_Monograms.ai',
      'Print_Production_Collateral_300DPI.pdf',
      'Social_Media_Kit_Optimized_Assets.zip',
      'Full_Brand_Styleguide_Guidelines.pdf',
    ],
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    completedDate: commission.updatedAt || 'September 5, 2026',
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-xs relative overflow-hidden text-center sm:text-left">
      
      {/* Background celebration glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-zinc-200/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 p-0.5 shadow-xs shrink-0 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-center sm:text-left">
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono-code font-bold border border-emerald-200 inline-block mb-1">
              ✓ STAGE 08 — FINAL DELIVERY COMPLETE
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-zinc-900">
              🎉 Your commission is complete!
            </h2>
          </div>
        </div>

        <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-200/80 text-center sm:text-right">
          <div className="text-[11px] text-zinc-500 font-mono-code uppercase font-bold">Completed On</div>
          <div className="text-sm font-bold text-zinc-800 flex items-center gap-1.5 justify-center sm:justify-end">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{finalPackage.completedDate}</span>
          </div>
        </div>
      </div>

      {/* Project Final Showcase & Downloads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 text-left">
        
        {/* Left: Final Preview Showcase */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-xs bg-zinc-100 aspect-[16/10] relative group">
            <img
              src={finalPackage.previewUrl}
              alt="Final Project Showcase"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold font-mono-code mb-1 inline-block">
                  Master Production Deliverable
                </span>
                <h4 className="font-display text-lg font-bold text-white">
                  {commission.projectName}
                </h4>
                <p className="text-xs text-zinc-200">
                  Crafted by {commission.assignedDesigner} for {commission.clientName}
                </p>
              </div>
            </div>
          </div>

          {/* Formats Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 font-mono-code font-bold">Included Formats:</span>
            {finalPackage.formats.map((fmt, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs border border-zinc-200 font-mono-code font-medium">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Package Downloads & Files list */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-orange-500" />
                <h4 className="font-display text-sm font-black text-zinc-900">
                  Deliverables Manifest
                </h4>
              </div>
              <span className="text-xs font-mono-code text-zinc-500 font-bold">
                {finalPackage.packageSize}
              </span>
            </div>

            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {finalPackage.deliverablesList.map((file, i) => (
                <li key={i} className="text-xs text-zinc-700 flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-200">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate font-mono-code text-[11px] font-medium">{file}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 shrink-0 ml-2 font-mono-code font-bold">✓ Ready</span>
                </li>
              ))}
            </ul>

            {/* Master Download Action Button */}
            <button
              id="btn-download-final-package"
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Packaging Archives...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Download Initiated Successfully!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Complete Production Suite (.ZIP)</span>
                </>
              )}
            </button>
          </div>

          {/* Licensing & Commercial Release */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-800 block">Full Commercial Rights Granted</span>
              <span>All vector master files and assets are licensed for unlimited worldwide commercial distribution, trademark registration, and reproduction.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Thank you note & CTA */}
      <div className="pt-8 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 bg-zinc-50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-8 rounded-b-[32px]">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-amber-500 mb-1 justify-center sm:justify-start">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h4 className="font-display text-lg font-black text-zinc-900">
            Thank you for working with me!
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            It was a pleasure bringing your vision for {commission.projectName} to life.
          </p>
        </div>

        <button
          id="btn-commission-another-project"
          type="button"
          onClick={() => setActiveView('commission-form')}
          className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Commission Another Project</span>
        </button>
      </div>

    </div>
  );
};
