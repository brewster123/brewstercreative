import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Sun, 
  Moon, 
  Maximize2, 
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { StudioDesignConfig, ViewportMode } from '../../types';
import { VIEWPORT_DEFINITIONS, generateScopedCssVars } from '../../data/defaultDesignConfig';
import { PreviewSiteContent } from './PreviewSiteContent';

interface StudioResponsivePreviewProps {
  config: StudioDesignConfig;
  previewMode: 'light' | 'dark';
  onTogglePreviewMode: () => void;
}

export const StudioResponsivePreview: React.FC<StudioResponsivePreviewProps> = ({
  config,
  previewMode,
  onTogglePreviewMode,
}) => {
  const [activeViewport, setActiveViewport] = useState<ViewportMode>('desktop');
  const [scaleMode, setScaleMode] = useState<'fit' | '100%'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  const [calculatedScale, setCalculatedScale] = useState<number>(1);

  const currentViewport = VIEWPORT_DEFINITIONS.find((v) => v.id === activeViewport) || VIEWPORT_DEFINITIONS[0];

  // Dynamically calculate scale when in 'fit' mode
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      if (scaleMode === '100%') {
        setCalculatedScale(1);
        return;
      }
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      if (containerWidth < currentViewport.width) {
        const nextScale = Math.max(0.35, Math.min(1, containerWidth / currentViewport.width));
        setCalculatedScale(nextScale);
      } else {
        setCalculatedScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [activeViewport, scaleMode]);

  const scopedCss = generateScopedCssVars(config, previewMode);

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] dark:bg-[#09090B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl overflow-hidden shadow-xs">
      {/* Top Preview Control Bar */}
      <div className="px-4 py-3 bg-white dark:bg-[#121214] border-b border-[#E4E2DC] dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Viewport Toggles */}
        <div className="flex items-center gap-1 bg-[#FAF9F6] dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-1">
          {VIEWPORT_DEFINITIONS.map((vp) => {
            const isSelected = activeViewport === vp.id;
            const Icon = vp.id === 'desktop' ? Monitor : vp.id === 'tablet' ? Tablet : Smartphone;

            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => setActiveViewport(vp.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#232327] text-[#EA580C] font-semibold shadow-2xs border border-[#E4E2DC] dark:border-[#27272A]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                }`}
                title={`Switch to ${vp.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{vp.id}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Dimension Info */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentViewport.width}px × {currentViewport.height}px</span>
          <span>·</span>
          <span>{scaleMode === 'fit' ? `Scaled: ${Math.round(calculatedScale * 100)}%` : '100% Native'}</span>
        </div>

        {/* Preview Actions: Scale Mode & Preview Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Fit vs 100% toggle */}
          <button
            type="button"
            onClick={() => setScaleMode(scaleMode === 'fit' ? '100%' : 'fit')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-white dark:hover:bg-[#232327] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-all cursor-pointer"
            title="Toggle between auto-fit scale and 100% native pixels"
          >
            <Maximize2 className="w-3 h-3 text-[#EA580C]" />
            <span>{scaleMode === 'fit' ? 'Fit Window' : '100% View'}</span>
          </button>

          {/* Scoped Preview Theme Toggle */}
          <button
            type="button"
            onClick={onTogglePreviewMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#18181B] hover:bg-white dark:hover:bg-[#232327] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] transition-all cursor-pointer"
            title={`Preview canvas in ${previewMode === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {previewMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Preview</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Dark Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Stage Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-zinc-200/50 dark:bg-zinc-950/70"
      >
        {/* Device Wrapper Frame */}
        <div
          className="transition-all duration-300 origin-top bg-white dark:bg-[#121214] rounded-lg shadow-xl border border-zinc-300 dark:border-zinc-800 overflow-hidden"
          style={{
            width: `${currentViewport.width}px`,
            maxWidth: scaleMode === '100%' ? 'none' : '100%',
            transform: scaleMode === 'fit' && calculatedScale < 1 ? `scale(${calculatedScale})` : 'none',
            transformOrigin: 'top center',
            marginBottom: scaleMode === 'fit' && calculatedScale < 1 ? `${(calculatedScale - 1) * 800}px` : undefined,
          }}
        >
          {/* Device Top Bezel Indicator */}
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
              <span className="ml-2 font-medium">preview.destalion.studio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-widest text-[10px] font-semibold text-[#EA580C]">
                Isolated Scope
              </span>
              <span>·</span>
              <span>{previewMode.toUpperCase()}</span>
            </div>
          </div>

          {/* Scoped Preview Root: All CSS tokens applied inline */}
          <div 
            className="w-full overflow-y-auto"
            style={{ 
              ...scopedCss,
              maxHeight: '75vh',
            }}
          >
            <PreviewSiteContent config={config} previewMode={previewMode} />
          </div>
        </div>
      </div>
    </div>
  );
};
