import React, { useState, useCallback } from 'react';
import { 
  Palette, 
  Type, 
  Layout, 
  Maximize, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Layers, 
  Sliders, 
  Sun, 
  Moon,
  Info,
  ShieldAlert
} from 'lucide-react';
import { StudioDesignConfig, ThemeColors, ThemeVariant } from '../../types';
import { 
  DEFAULT_DESIGN_CONFIG, 
  SUPPORTED_FONT_FAMILIES, 
  isValidHexColor, 
  clampNumber, 
  cloneDesignConfig, 
  areConfigsEqual 
} from '../../data/defaultDesignConfig';
import { StudioResponsivePreview } from './StudioResponsivePreview';

export const StudioTokenEditor: React.FC = () => {
  // Current active draft config
  const [currentConfig, setCurrentConfig] = useState<StudioDesignConfig>(() =>
    cloneDesignConfig(DEFAULT_DESIGN_CONFIG)
  );

  // Undo / Redo history stacks
  const [history, setHistory] = useState<StudioDesignConfig[]>([]);
  const [future, setFuture] = useState<StudioDesignConfig[]>([]);

  // Active color editor mode: light or dark palette
  const [colorEditMode, setColorEditMode] = useState<'light' | 'dark'>('light');

  // Preview display mode: light or dark
  const [previewThemeMode, setPreviewThemeMode] = useState<'light' | 'dark'>('light');

  // Active section accordion in the editor
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'borders' | 'variants'>('colors');

  // Confirmation dialog for Reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to show momentary feedback toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Check if draft has unsaved differences from canonical defaults
  const isDirty = !areConfigsEqual(currentConfig, DEFAULT_DESIGN_CONFIG);

  // Push new state to history stack with cap at 30 entries
  const commitChange = useCallback((newConfig: StudioDesignConfig) => {
    setHistory((prev) => [...prev.slice(-29), cloneDesignConfig(currentConfig)]);
    setFuture([]);
    setCurrentConfig(newConfig);
  }, [currentConfig]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [cloneDesignConfig(currentConfig), ...prev]);
    setCurrentConfig(cloneDesignConfig(previous));
    showToast('Undo applied');
  }, [history, currentConfig, showToast]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, cloneDesignConfig(currentConfig)]);
    setCurrentConfig(cloneDesignConfig(next));
    showToast('Redo applied');
  }, [future, currentConfig, showToast]);

  // Reset to canonical defaults
  const handleResetToDefaults = useCallback(() => {
    commitChange(cloneDesignConfig(DEFAULT_DESIGN_CONFIG));
    setShowResetConfirm(false);
    showToast('Reset to canonical DESTALION defaults');
  }, [commitChange, showToast]);

  // Update a specific theme color
  const handleColorChange = useCallback((key: keyof ThemeColors, hexValue: string) => {
    const updated = cloneDesignConfig(currentConfig);
    const target = colorEditMode === 'dark' ? updated.dark : updated.light;
    target[key] = hexValue;
    commitChange(updated);
  }, [currentConfig, colorEditMode, commitChange]);

  // Update typography token
  const handleTypographyChange = useCallback((field: keyof StudioDesignConfig['typography'], value: any) => {
    const updated = cloneDesignConfig(currentConfig);
    (updated.typography as any)[field] = value;
    commitChange(updated);
  }, [currentConfig, commitChange]);

  // Update spacing token
  const handleSpacingChange = useCallback((field: keyof StudioDesignConfig['spacing'], value: number) => {
    const updated = cloneDesignConfig(currentConfig);
    updated.spacing[field] = value;
    commitChange(updated);
  }, [currentConfig, commitChange]);

  // Update border token
  const handleBorderChange = useCallback((field: keyof StudioDesignConfig['borders'], value: number) => {
    const updated = cloneDesignConfig(currentConfig);
    updated.borders[field] = value;
    commitChange(updated);
  }, [currentConfig, commitChange]);

  // Preset themes
  const applyVariant = useCallback((variant: ThemeVariant) => {
    const next = cloneDesignConfig(currentConfig);
    next.themeVariant = variant;

    if (variant === 'default') {
      next.light = cloneDesignConfig(DEFAULT_DESIGN_CONFIG).light;
      next.dark = cloneDesignConfig(DEFAULT_DESIGN_CONFIG).dark;
      next.typography.baseFontSizePx = 16;
      next.typography.headingScale = 1.25;
    } else if (variant === 'high-contrast') {
      next.light = {
        ...next.light,
        bgCanvas: '#FFFFFF',
        bgSurface: '#F4F4F5',
        textPrimary: '#000000',
        textMuted: '#52525B',
        borderSubtle: '#D4D4D8',
        accent: '#FF4500',
        accentHover: '#CC3700',
      };
      next.dark = {
        ...next.dark,
        bgCanvas: '#000000',
        bgSurface: '#09090B',
        textPrimary: '#FFFFFF',
        textMuted: '#A1A1AA',
        borderSubtle: '#27272A',
        accent: '#FF5722',
        accentHover: '#E64A19',
      };
    } else if (variant === 'editorial-minimal') {
      next.typography.headingLetterSpacing = '-0.04em';
      next.typography.bodyLineHeight = 1.75;
      next.borders.radiusSm = 0;
      next.borders.radiusMd = 2;
      next.borders.radiusLg = 4;
      next.borders.radiusXl = 6;
      next.light.accent = '#D94814';
      next.dark.accent = '#EA580C';
    }

    commitChange(next);
    showToast(`Applied preset: ${variant}`);
  }, [currentConfig, commitChange, showToast]);

  const activeColors = colorEditMode === 'dark' ? currentConfig.dark : currentConfig.light;

  const colorFields: { key: keyof ThemeColors; label: string; desc: string }[] = [
    { key: 'bgCanvas', label: 'Canvas Background', desc: 'Main page backdrop behind all sections' },
    { key: 'bgSurface', label: 'Primary Surface', desc: 'Card containers, navbar, and primary modals' },
    { key: 'bgSurfaceSecondary', label: 'Secondary Surface', desc: 'Subtle section backgrounds, badges, and tags' },
    { key: 'textPrimary', label: 'Primary Text', desc: 'Headlines, body copy, and bold indicators' },
    { key: 'textMuted', label: 'Muted Text', desc: 'Metadata, labels, subtitles, and captions' },
    { key: 'borderSubtle', label: 'Subtle Border', desc: 'Dividers, card outlines, and input perimeters' },
    { key: 'accent', label: 'Primary Brand Accent', desc: 'Buttons, highlighted glyphs, and active states' },
    { key: 'accentHover', label: 'Accent Hover State', desc: 'Interactive focus and hover emphasis' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] text-xs font-mono rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editor Header & Studio Toolbar */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
              DESTALION Creative Studio · Milestone 1
            </span>
            {isDirty ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved Draft
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Pristine Standard
              </span>
            )}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#EDEDEC]">
            Design Token Engine & Studio Canvas
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xl">
            Fine-tune palette tokens, typographic scales, responsive spacing, and border geometries with real-time isolated preview.
          </p>
        </div>

        {/* Global Toolbar: Undo, Redo, Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Undo previous token change"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo {history.length > 0 ? `(${history.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={future.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] hover:bg-[#F4F2ED] dark:hover:bg-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Redo previously undone change"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo {future.length > 0 ? `(${future.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-xs font-mono text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer"
            title="Reset all design tokens to canonical DESTALION defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#18181B] dark:text-[#EDEDEC]">
                Reset Design Tokens?
              </h3>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              This will restore all color palettes, typography scales, spacing tokens, and border radii back to canonical DESTALION Atelier defaults. Your current uncommitted changes will be replaced.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono border border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Yes, Restore Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Workspace: Left Editor Controls, Right Responsive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================== */}
        {/* LEFT COLUMN: TOKEN CONTROLS (5 cols on lg)           */}
        {/* ==================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Navigation Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg overflow-x-auto no-scrollbar">
            {[
              { id: 'colors' as const, label: 'Colors', icon: Palette },
              { id: 'typography' as const, label: 'Typography', icon: Type },
              { id: 'spacing' as const, label: 'Spacing', icon: Layout },
              { id: 'borders' as const, label: 'Borders', icon: Maximize },
              { id: 'variants' as const, label: 'Presets', icon: Sparkles },
            ].map(({ id, label, icon: TabIcon }) => {
              const isSelected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#FAF9F6] dark:bg-[#232327] text-[#EA580C] font-semibold border border-[#E4E2DC] dark:border-[#27272A] shadow-2xs'
                      : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#EDEDEC]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GLOBAL COLOR PALETTE */}
          {activeTab === 'colors' && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-semibold block">
                    Global Colors
                  </span>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    Edit tokens for light and dark theme canvas targets.
                  </p>
                </div>

                {/* Sub-toggle: Light vs Dark Palette */}
                <div className="flex items-center gap-1 bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setColorEditMode('light');
                      setPreviewThemeMode('light');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono cursor-pointer ${
                      colorEditMode === 'light'
                        ? 'bg-white dark:bg-[#232327] text-amber-600 font-bold shadow-2xs'
                        : 'text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <Sun className="w-3 h-3 text-amber-500" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setColorEditMode('dark');
                      setPreviewThemeMode('dark');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono cursor-pointer ${
                      colorEditMode === 'dark'
                        ? 'bg-white dark:bg-[#232327] text-[#EA580C] font-bold shadow-2xs'
                        : 'text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  >
                    <Moon className="w-3 h-3 text-[#EA580C]" />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Color Fields Grid */}
              <div className="space-y-3.5">
                {colorFields.map(({ key, label, desc }) => {
                  const val = activeColors[key];
                  const isValid = isValidHexColor(val);

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg border border-[#E4E2DC] dark:border-[#27272A] bg-[#FAF9F6] dark:bg-[#0F0F11] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <label 
                          htmlFor={`color-${key}`}
                          className="text-xs font-mono font-semibold text-[#18181B] dark:text-[#EDEDEC] block cursor-pointer"
                        >
                          {label}
                        </label>
                        <p className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">
                          {desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {/* Native Color Input */}
                        <div className="relative w-8 h-8 rounded-md overflow-hidden border border-[#E4E2DC] dark:border-[#27272A] shadow-2xs">
                          <input
                            id={`color-${key}`}
                            type="color"
                            value={isValid ? val : '#EA580C'}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 p-0"
                          />
                        </div>

                        {/* Hex Text Input */}
                        <input
                          type="text"
                          value={val}
                          maxLength={7}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className={`w-24 px-2 py-1 text-xs font-mono uppercase bg-white dark:bg-[#18181B] border rounded-md focus:outline-none focus:border-[#EA580C] ${
                            isValid
                              ? 'border-[#E4E2DC] dark:border-[#27272A] text-[#18181B] dark:text-[#EDEDEC]'
                              : 'border-red-400 text-red-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY CONTROLS */}
          {activeTab === 'typography' && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-5 animate-in fade-in">
              <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-semibold block">
                  Typography Standard
                </span>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Configure body & display families, base type sizing, and proportional ratios.
                </p>
              </div>

              {/* Primary Body Font Family */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                  Body Font Family
                </label>
                <select
                  value={currentConfig.typography.fontFamily}
                  onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                >
                  {SUPPORTED_FONT_FAMILIES.map((f) => (
                    <option key={f.id} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display / Heading Font Family */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                  Heading / Display Font Family
                </label>
                <select
                  value={currentConfig.typography.headingFontFamily}
                  onChange={(e) => handleTypographyChange('headingFontFamily', e.target.value)}
                  className="w-full bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono text-[#18181B] dark:text-[#EDEDEC] focus:outline-none focus:border-[#EA580C] cursor-pointer"
                >
                  {SUPPORTED_FONT_FAMILIES.map((f) => (
                    <option key={f.id} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base Font Size (px) Slider */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Base Font Size</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.typography.baseFontSizePx}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={currentConfig.typography.baseFontSizePx}
                  onChange={(e) => handleTypographyChange('baseFontSizePx', parseInt(e.target.value, 10))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 12px – 24px (standard studio base: 16px)
                </span>
              </div>

              {/* Heading Scale Slider */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Heading Scale Ratio</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.typography.headingScale}x</span>
                </div>
                <input
                  type="range"
                  min="1.1"
                  max="1.5"
                  step="0.05"
                  value={currentConfig.typography.headingScale}
                  onChange={(e) => handleTypographyChange('headingScale', parseFloat(e.target.value))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 1.1x – 1.5x (Major Second to Perfect Fifth)
                </span>
              </div>

              {/* Body Line Height Slider */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Body Line Height</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.typography.bodyLineHeight}</span>
                </div>
                <input
                  type="range"
                  min="1.3"
                  max="2.0"
                  step="0.05"
                  value={currentConfig.typography.bodyLineHeight}
                  onChange={(e) => handleTypographyChange('bodyLineHeight', parseFloat(e.target.value))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 1.3 – 2.0 (standard reading metric: 1.6)
                </span>
              </div>

              {/* Heading Letter Spacing */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-[#71717A] dark:text-[#A1A1AA] font-semibold block">
                  Display Letter Spacing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['-0.035em', '-0.025em', '0em'].map((spacingVal) => (
                    <button
                      key={spacingVal}
                      type="button"
                      onClick={() => handleTypographyChange('headingLetterSpacing', spacingVal)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        currentConfig.typography.headingLetterSpacing === spacingVal
                          ? 'bg-[#EA580C] text-white border-[#EA580C] font-bold shadow-2xs'
                          : 'bg-[#FAF9F6] dark:bg-[#0F0F11] border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {spacingVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPACING CONTROLS */}
          {activeTab === 'spacing' && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-5 animate-in fade-in">
              <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-semibold block">
                  Spacing & Layout Engine
                </span>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Control vertical rhythm, gutter widths, and container max boundaries.
                </p>
              </div>

              {/* Section Padding Y */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Vertical Section Padding</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.spacing.sectionPaddingY}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="128"
                  step="8"
                  value={currentConfig.spacing.sectionPaddingY}
                  onChange={(e) => handleSpacingChange('sectionPaddingY', parseInt(e.target.value, 10))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 32px – 128px (default: 64px)
                </span>
              </div>

              {/* Container Horizontal Padding */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Container Gutter (Padding X)</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.spacing.containerPaddingX}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="48"
                  step="4"
                  value={currentConfig.spacing.containerPaddingX}
                  onChange={(e) => handleSpacingChange('containerPaddingX', parseInt(e.target.value, 10))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 16px – 48px (default: 24px)
                </span>
              </div>

              {/* Grid Gap */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Grid / Card Gap</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.spacing.gridGap}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="40"
                  step="4"
                  value={currentConfig.spacing.gridGap}
                  onChange={(e) => handleSpacingChange('gridGap', parseInt(e.target.value, 10))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block">
                  Bound: 12px – 40px (default: 24px)
                </span>
              </div>

              {/* Max Content Width */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Max Content Width</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.maxContentWidthPx}px</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1120, 1280, 1440].map((widthVal) => (
                    <button
                      key={widthVal}
                      type="button"
                      onClick={() => {
                        const next = cloneDesignConfig(currentConfig);
                        next.maxContentWidthPx = widthVal;
                        commitChange(next);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        currentConfig.maxContentWidthPx === widthVal
                          ? 'bg-[#EA580C] text-white border-[#EA580C] font-bold shadow-2xs'
                          : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {widthVal}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BORDER & RADIUS CONTROLS */}
          {activeTab === 'borders' && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-5 animate-in fade-in">
              <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-semibold block">
                  Border & Geometry Scale
                </span>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Configure corner radius curvature and stroke widths.
                </p>
              </div>

              {/* Border Radii */}
              {[
                { field: 'radiusSm' as const, label: 'Small Radius (Buttons & Badges)', min: 0, max: 8, def: 4 },
                { field: 'radiusMd' as const, label: 'Medium Radius (Inputs & Selectors)', min: 0, max: 16, def: 8 },
                { field: 'radiusLg' as const, label: 'Large Radius (Cards & Panels)', min: 0, max: 24, def: 12 },
                { field: 'radiusXl' as const, label: 'Extra Large Radius (Modals & Hero)', min: 0, max: 32, def: 16 },
              ].map(({ field, label, min, max }) => (
                <div key={field} className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">{label}</span>
                    <span className="text-[#EA580C] font-bold">{currentConfig.borders[field]}px</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step="2"
                    value={currentConfig.borders[field]}
                    onChange={(e) => handleBorderChange(field, parseInt(e.target.value, 10))}
                    className="w-full accent-[#EA580C] cursor-pointer"
                  />
                </div>
              ))}

              {/* Border Width */}
              <div className="space-y-2 p-3 rounded-lg bg-[#FAF9F6] dark:bg-[#0F0F11] border border-[#E4E2DC] dark:border-[#27272A]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#18181B] dark:text-[#EDEDEC]">Structural Stroke Width</span>
                  <span className="text-[#EA580C] font-bold">{currentConfig.borders.borderWidth}px</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleBorderChange('borderWidth', w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        currentConfig.borders.borderWidth === w
                          ? 'bg-[#EA580C] text-white border-[#EA580C] font-bold shadow-2xs'
                          : 'bg-white dark:bg-[#18181B] border-[#E4E2DC] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA]'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRESET THEME VARIANTS */}
          {activeTab === 'variants' && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E4E2DC] dark:border-[#27272A] rounded-xl p-5 space-y-4 animate-in fade-in">
              <div className="pb-3 border-b border-[#E4E2DC] dark:border-[#27272A]">
                <span className="font-mono text-xs uppercase tracking-wider text-[#EA580C] font-semibold block">
                  Studio Archetype Presets
                </span>
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Quickly test coherent aesthetic combinations.
                </p>
              </div>

              {[
                {
                  id: 'default' as const,
                  title: 'Atelier Standard',
                  desc: 'Canonical Plus Jakarta Sans typography, terracotta orange accent, and warm off-white canvas.',
                  accentColor: '#EA580C',
                },
                {
                  id: 'high-contrast' as const,
                  title: 'High-Contrast Neo-Brutalist',
                  desc: 'Stark pure white/black surfaces, sharp borders, and hyper-saturated international flame accent.',
                  accentColor: '#FF4500',
                },
                {
                  id: 'editorial-minimal' as const,
                  title: 'Editorial Minimalist',
                  desc: 'Geometric tight tracking, expanded line heights, softened radius, and deep studio terracotta.',
                  accentColor: '#D94814',
                },
              ].map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => applyVariant(variant.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    currentConfig.themeVariant === variant.id
                      ? 'border-[#EA580C] bg-[#FAF9F6] dark:bg-[#0F0F11] shadow-2xs ring-1 ring-[#EA580C]'
                      : 'border-[#E4E2DC] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-[#D4D2CA] dark:hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display font-bold text-sm text-[#18181B] dark:text-[#EDEDEC]">
                      {variant.title}
                    </span>
                    <span 
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0" 
                      style={{ backgroundColor: variant.accentColor }} 
                    />
                  </div>
                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                    {variant.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: ISOLATED RESPONSIVE PREVIEW (7 cols)   */}
        {/* ==================================================== */}
        <div className="lg:col-span-7">
          <StudioResponsivePreview
            config={currentConfig}
            previewMode={previewThemeMode}
            onTogglePreviewMode={() =>
              setPreviewThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
          />
        </div>
      </div>
    </div>
  );
};
