import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  Palette, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Maximize2, 
  Save, 
  Undo2, 
  Redo2, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Square, 
  Type, 
  Frame, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  FolderOpen,
  Layout,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MousePointer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  StudioWorkspaceMode, 
  StudioDesignDocument, 
  StudioArtboard, 
  StudioElement, 
  StudioElementType 
} from '../types';
import { 
  createDefaultDesignDocument, 
  loadSavedStudioDocument, 
  saveStudioDocument, 
  cloneStudioDocument 
} from '../data/defaultDesignDocument';
import { StudioTokenEditor } from '../components/studio-editor/StudioTokenEditor';

export const CreativeStudioView: React.FC = () => {
  const { currentUser, setActiveView } = useApp();

  // Document state
  const [doc, setDoc] = useState<StudioDesignDocument>(() => loadSavedStudioDocument());
  const [activeArtboardId, setActiveArtboardId] = useState<string>(doc.activeArtboardId || doc.artboards[0]?.id || 'artboard-desktop-hero');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Active workspace mode
  const [workspaceMode, setWorkspaceMode] = useState<StudioWorkspaceMode>('design-workspace');

  // Canvas zoom
  const [canvasZoom, setCanvasZoom] = useState<number>(0.75);

  // Undo / Redo history stacks for document
  const [history, setHistory] = useState<StudioDesignDocument[]>([]);
  const [future, setFuture] = useState<StudioDesignDocument[]>([]);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Helper toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Commit document change with history snapshot
  const commitDocChange = useCallback((newDoc: StudioDesignDocument) => {
    setHistory((prev) => [...prev.slice(-29), cloneStudioDocument(doc)]);
    setFuture([]);
    setDoc(newDoc);
    setIsDirty(true);
  }, [doc]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevSnapshot = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [cloneStudioDocument(doc), ...prev]);
    setDoc(cloneStudioDocument(prevSnapshot));
    showToast('Undo applied');
  }, [history, doc, showToast]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextSnapshot = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, cloneStudioDocument(doc)]);
    setDoc(cloneStudioDocument(nextSnapshot));
    showToast('Redo applied');
  }, [future, doc, showToast]);

  // Save document to isolated localStorage draft
  const handleSaveDraft = useCallback(() => {
    const success = saveStudioDocument(doc);
    if (success) {
      setIsDirty(false);
      showToast('Document saved to local workspace draft');
    } else {
      showToast('Error saving document draft');
    }
  }, [doc, showToast]);

  // Return to Admin Dashboard with unsaved confirmation
  const handleRequestExit = useCallback(() => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      setActiveView('admin-dashboard');
    }
  }, [isDirty, setActiveView]);

  const activeArtboard = doc.artboards.find((a) => a.id === activeArtboardId) || doc.artboards[0];
  const selectedElement = activeArtboard?.elements.find((e) => e.id === selectedElementId) || null;

  // Add new element to active artboard
  const handleAddElement = useCallback((type: StudioElementType) => {
    if (!activeArtboard) return;
    const newId = `elem-${Date.now()}`;
    const newElement: StudioElement = {
      id: newId,
      name: type === 'text' ? 'Text Heading' : type === 'rectangle' ? 'Visual Block' : type === 'vector-badge' ? 'Status Badge' : 'Group Frame',
      type,
      x: 120,
      y: 120,
      width: type === 'text' ? 320 : type === 'vector-badge' ? 220 : 200,
      height: type === 'text' ? 48 : type === 'vector-badge' ? 32 : 120,
      fill: type === 'text' ? undefined : type === 'vector-badge' ? '#18181B' : '#EA580C',
      stroke: type === 'vector-badge' ? '#27272A' : undefined,
      strokeWidth: 1,
      borderRadius: type === 'rectangle' ? 8 : type === 'vector-badge' ? 6 : 0,
      text: type === 'text' ? 'New Creative Typography' : type === 'vector-badge' ? 'STUDIO BADGE // 2026' : undefined,
      fontSize: type === 'text' ? 24 : 10,
      color: '#FFFFFF',
      visible: true,
      locked: false,
    };

    const nextDoc = cloneStudioDocument(doc);
    const targetBoard = nextDoc.artboards.find((a) => a.id === activeArtboard.id);
    if (targetBoard) {
      targetBoard.elements.push(newElement);
    }
    commitDocChange(nextDoc);
    setSelectedElementId(newId);
    showToast(`Added ${type} to artboard`);
  }, [activeArtboard, doc, commitDocChange, showToast]);

  // Update selected element property
  const handleUpdateSelectedElement = useCallback((updates: Partial<StudioElement>) => {
    if (!activeArtboard || !selectedElementId) return;
    const nextDoc = cloneStudioDocument(doc);
    const targetBoard = nextDoc.artboards.find((a) => a.id === activeArtboard.id);
    if (!targetBoard) return;
    const elem = targetBoard.elements.find((e) => e.id === selectedElementId);
    if (!elem) return;

    Object.assign(elem, updates);
    commitDocChange(nextDoc);
  }, [activeArtboard, selectedElementId, doc, commitDocChange]);

  // Delete element
  const handleDeleteElement = useCallback((elemId: string) => {
    if (!activeArtboard) return;
    const nextDoc = cloneStudioDocument(doc);
    const targetBoard = nextDoc.artboards.find((a) => a.id === activeArtboard.id);
    if (!targetBoard) return;
    targetBoard.elements = targetBoard.elements.filter((e) => e.id !== elemId);
    commitDocChange(nextDoc);
    if (selectedElementId === elemId) {
      setSelectedElementId(null);
    }
    showToast('Element deleted');
  }, [activeArtboard, doc, commitDocChange, selectedElementId, showToast]);

  // Add new artboard
  const handleAddArtboard = useCallback(() => {
    const newId = `artboard-${Date.now()}`;
    const newArtboard: StudioArtboard = {
      id: newId,
      name: `Artboard ${doc.artboards.length + 1} (800×600)`,
      width: 800,
      height: 600,
      backgroundColor: '#09090B',
      elements: [],
    };
    const nextDoc = cloneStudioDocument(doc);
    nextDoc.artboards.push(newArtboard);
    nextDoc.activeArtboardId = newId;
    commitDocChange(nextDoc);
    setActiveArtboardId(newId);
    showToast('New artboard created');
  }, [doc, commitDocChange, showToast]);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#09090B] text-[#EDEDEC] font-sans overflow-hidden select-none">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2 bg-[#18181B] border border-[#27272A] text-white text-xs font-mono rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                Unsaved Studio Changes
              </h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              You have unsaved draft modifications in your Creative Studio workspace. Would you like to save your work before returning to the Admin Dashboard?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setActiveView('admin-dashboard');
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-mono text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                Discard & Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveDraft();
                  setShowExitConfirm(false);
                  setActiveView('admin-dashboard');
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#EA580C] hover:bg-[#D94814] text-white transition-all cursor-pointer"
              >
                Save Draft & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. DEDICATED TOP APPLICATION BAR                         */}
      {/* ======================================================== */}
      <header className="h-13 bg-[#121214] border-b border-[#222225] px-4 flex items-center justify-between gap-4 shrink-0 z-40">
        {/* Brand & Document Identity */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#EA580C] text-white flex items-center justify-center font-black text-xs">
            D
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-white">
              DESTALION Studio
            </span>
            <span className="text-[#52525B]">/</span>
            <input
              type="text"
              value={doc.title}
              onChange={(e) => {
                const nextDoc = cloneStudioDocument(doc);
                nextDoc.title = e.target.value;
                commitDocChange(nextDoc);
              }}
              className="bg-transparent text-xs text-[#A1A1AA] hover:text-white focus:text-white focus:bg-[#18181B] px-2 py-0.5 rounded border border-transparent focus:border-[#27272A] focus:outline-none transition-colors max-w-xs font-mono"
            />
          </div>

          {/* Draft Status Badge */}
          {isDirty ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Draft Modified</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Workspace Saved</span>
            </span>
          )}
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
          {[
            { id: 'dashboard' as const, label: 'Studio Home', icon: FolderOpen },
            { id: 'design-workspace' as const, label: 'Design Canvas', icon: Layers },
            { id: 'website-workspace' as const, label: 'Website Workspace', icon: Monitor },
          ].map(({ id, label, icon: TabIcon }) => {
            const isSelected = workspaceMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setWorkspaceMode(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#222225] text-[#EA580C] font-semibold border border-[#2E2E33] shadow-xs'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Undo, Redo, Save, Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded text-[#A1A1AA] hover:text-white hover:bg-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={future.length === 0}
            className="p-1.5 rounded text-[#A1A1AA] hover:text-white hover:bg-[#18181B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#232327] border border-[#27272A] text-xs font-mono text-white transition-colors cursor-pointer"
          >
            <Save className="w-3 h-3 text-[#EA580C]" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>

          <div className="h-4 w-px bg-[#27272A] mx-1" />

          {/* Return to Admin Dashboard Button */}
          <button
            type="button"
            onClick={handleRequestExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#D94814] text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
            title="Return to DESTALION Admin Production Ledger"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MODE 1: STUDIO HOME / DASHBOARD                       */}
      {/* ======================================================== */}
      {workspaceMode === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
          <div className="space-y-2 border-b border-[#222225] pb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#EA580C] font-semibold">
              Creative Application Desk
            </span>
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">
              DESTALION Creative Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
              Dedicated visual design environment combining freeform artboard composition with live responsive website editing.
            </p>
          </div>

          {/* Quick Starter Launchers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div 
              onClick={() => setWorkspaceMode('design-workspace')}
              className="p-6 rounded-xl border border-[#222225] bg-[#121214] hover:border-[#EA580C] transition-all cursor-pointer space-y-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#EA580C] transition-colors">
                  Design Workspace (Freeform Canvas)
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Figma / Illustrator-style freeform canvas for artboards, typography elements, geometry blocks, and layout compositions.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#EA580C] pt-2">
                <span>Enter Canvas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div 
              onClick={() => setWorkspaceMode('website-workspace')}
              className="p-6 rounded-xl border border-[#222225] bg-[#121214] hover:border-[#EA580C] transition-all cursor-pointer space-y-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#EA580C] transition-colors">
                  Website Workspace (Live Preview & Tokens)
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Inspect and edit real DESTALION pages with responsive Desktop (1440px), Tablet (768px), and Mobile (375px) previews.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#EA580C] pt-2">
                <span>Open Website Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Active Documents & Artboards Overview */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-white">
                Active Master Artboards ({doc.artboards.length})
              </h2>
              <button
                type="button"
                onClick={() => {
                  handleAddArtboard();
                  setWorkspaceMode('design-workspace');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] hover:bg-[#222225] border border-[#27272A] text-xs font-mono text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Add Artboard</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doc.artboards.map((artboard) => (
                <div
                  key={artboard.id}
                  onClick={() => {
                    setActiveArtboardId(artboard.id);
                    setWorkspaceMode('design-workspace');
                  }}
                  className="p-5 rounded-xl border border-[#222225] bg-[#121214] hover:border-[#38383E] transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#A1A1AA] uppercase">
                      {artboard.width} × {artboard.height} px
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-[#EA580C] border border-[#27272A]">
                      {artboard.elements.length} layers
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-white">
                    {artboard.name}
                  </h4>
                  <div className="h-24 bg-[#09090B] rounded-lg border border-[#222225] flex items-center justify-center p-3 relative overflow-hidden">
                    <div className="text-[10px] font-mono text-[#52525B]">
                      Artboard Preview Canvas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Roadmap Note */}
          <div className="p-4 rounded-xl border border-[#27272A] bg-[#121214] flex items-start gap-3 text-xs text-[#A1A1AA]">
            <ShieldCheck className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white block">
                Isolated Application State Boundary
              </span>
              <p>
                Creative Studio document data is completely independent of client commissions, payments, and deliverables. Edits here affect only the visual studio draft until explicitly approved and published.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODE 2: DESIGN WORKSPACE (FREEFORM ARTBOARD CANVAS)   */}
      {/* ======================================================== */}
      {workspaceMode === 'design-workspace' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Artboards & Layers */}
          <aside className="w-64 bg-[#121214] border-r border-[#222225] flex flex-col shrink-0">
            {/* Toolstrip */}
            <div className="p-3 border-b border-[#222225] flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => handleAddElement('rectangle')}
                className="p-2 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Add Block / Shape"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('text')}
                className="p-2 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Add Typography Element"
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('vector-badge')}
                className="p-2 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Add Vector Status Badge"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAddElement('frame')}
                className="p-2 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Add Layout Frame"
              >
                <Frame className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-[#27272A]" />
              <button
                type="button"
                onClick={handleAddArtboard}
                className="p-2 rounded hover:bg-[#18181B] text-[#EA580C] hover:text-white transition-colors cursor-pointer"
                title="Create New Artboard"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Artboard Selector Dropdown */}
            <div className="p-3 border-b border-[#222225] space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
                Active Artboard
              </span>
              <select
                value={activeArtboardId}
                onChange={(e) => {
                  setActiveArtboardId(e.target.value);
                  setSelectedElementId(null);
                }}
                className="w-full bg-[#18181B] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EA580C] cursor-pointer"
              >
                {doc.artboards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.width}×{b.height})
                  </option>
                ))}
              </select>
            </div>

            {/* Layers Hierarchy Panel */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block mb-2">
                Layers ({activeArtboard?.elements.length || 0})
              </span>
              {activeArtboard?.elements.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#52525B] font-mono">
                  No elements on artboard
                </div>
              ) : (
                activeArtboard?.elements.map((elem) => {
                  const isSelected = selectedElementId === elem.id;
                  const Icon = elem.type === 'text' ? Type : elem.type === 'vector-badge' ? Sparkles : Square;

                  return (
                    <div
                      key={elem.id}
                      onClick={() => setSelectedElementId(elem.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EA580C] text-white font-semibold'
                          : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{elem.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextDoc = cloneStudioDocument(doc);
                            const board = nextDoc.artboards.find((a) => a.id === activeArtboard.id);
                            const el = board?.elements.find((e) => e.id === elem.id);
                            if (el) el.visible = !el.visible;
                            commitDocChange(nextDoc);
                          }}
                          className="p-1 hover:text-white transition-colors"
                          title={elem.visible ? 'Hide' : 'Show'}
                        >
                          {elem.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-zinc-500" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const nextDoc = cloneStudioDocument(doc);
                            const board = nextDoc.artboards.find((a) => a.id === activeArtboard.id);
                            const el = board?.elements.find((e) => e.id === elem.id);
                            if (el) el.locked = !el.locked;
                            commitDocChange(nextDoc);
                          }}
                          className="p-1 hover:text-white transition-colors"
                          title={elem.locked ? 'Unlock' : 'Lock'}
                        >
                          {elem.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Center Freeform Canvas Stage */}
          <main className="flex-1 bg-[#0B0B0E] overflow-auto p-12 flex flex-col items-center relative">
            {/* Zoom / Stage Controls */}
            <div className="sticky top-4 z-20 bg-[#121214]/90 backdrop-blur-xs border border-[#27272A] rounded-lg p-1.5 flex items-center gap-2 text-xs font-mono text-[#A1A1AA] shadow-xl">
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.max(0.25, z - 0.1))}
                className="p-1 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-white">{Math.round(canvasZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.min(2.0, z + 0.1))}
                className="p-1 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-[#27272A]" />
              <button
                type="button"
                onClick={() => setCanvasZoom(0.75)}
                className="px-2 py-0.5 hover:text-white cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Artboard Frame & Interactive Canvas */}
            {activeArtboard && (
              <div className="mt-8 transition-transform origin-top" style={{ transform: `scale(${canvasZoom})` }}>
                {/* Artboard Header Label */}
                <div className="text-xs font-mono text-[#71717A] mb-2 flex items-center justify-between">
                  <span>{activeArtboard.name}</span>
                  <span>{activeArtboard.width} × {activeArtboard.height} px</span>
                </div>

                {/* Artboard Content Container */}
                <div
                  className="relative rounded-sm shadow-2xl border border-[#222225] overflow-hidden"
                  style={{
                    width: `${activeArtboard.width}px`,
                    height: `${activeArtboard.height}px`,
                    backgroundColor: activeArtboard.backgroundColor,
                  }}
                  onClick={() => setSelectedElementId(null)}
                >
                  {activeArtboard.elements.map((elem) => {
                    if (!elem.visible) return null;
                    const isSelected = selectedElementId === elem.id;

                    return (
                      <div
                        key={elem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(elem.id);
                        }}
                        className={`absolute select-none transition-shadow ${
                          isSelected ? 'ring-2 ring-[#EA580C] ring-offset-1 ring-offset-black z-30 cursor-move' : 'cursor-pointer'
                        }`}
                        style={{
                          left: `${elem.x}px`,
                          top: `${elem.y}px`,
                          width: `${elem.width}px`,
                          height: `${elem.height}px`,
                          backgroundColor: elem.fill,
                          borderColor: elem.stroke,
                          borderWidth: elem.strokeWidth ? `${elem.strokeWidth}px` : undefined,
                          borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : undefined,
                        }}
                      >
                        {/* Render Text Content */}
                        {elem.text && (
                          <div
                            className="w-full h-full p-2 flex items-center whitespace-pre-line leading-tight"
                            style={{
                              color: elem.color || '#FFFFFF',
                              fontSize: elem.fontSize ? `${elem.fontSize}px` : '14px',
                              fontWeight: elem.fontWeight || 'normal',
                            }}
                          >
                            {elem.text}
                          </div>
                        )}

                        {/* Selection Dimension Label */}
                        {isSelected && (
                          <div className="absolute -bottom-6 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EA580C] text-white">
                            {elem.width} × {elem.height} px
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* Right Inspector Panel */}
          <aside className="w-72 bg-[#121214] border-l border-[#222225] flex flex-col shrink-0">
            <div className="p-3.5 border-b border-[#222225] flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-white font-semibold">
                Element Inspector
              </span>
              {selectedElement && (
                <button
                  type="button"
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {selectedElement ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
                      Element Label
                    </label>
                    <input
                      type="text"
                      value={selectedElement.name}
                      onChange={(e) => handleUpdateSelectedElement({ name: e.target.value })}
                      className="w-full bg-[#18181B] border border-[#27272A] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>

                  {/* Position & Size */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
                      Dimensions & Coordinates
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[#52525B] text-[10px] block">X</span>
                        <input
                          type="number"
                          value={selectedElement.x}
                          onChange={(e) => handleUpdateSelectedElement({ x: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[#52525B] text-[10px] block">Y</span>
                        <input
                          type="number"
                          value={selectedElement.y}
                          onChange={(e) => handleUpdateSelectedElement({ y: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[#52525B] text-[10px] block">Width</span>
                        <input
                          type="number"
                          value={selectedElement.width}
                          onChange={(e) => handleUpdateSelectedElement({ width: parseInt(e.target.value, 10) || 10 })}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[#52525B] text-[10px] block">Height</span>
                        <input
                          type="number"
                          value={selectedElement.height}
                          onChange={(e) => handleUpdateSelectedElement({ height: parseInt(e.target.value, 10) || 10 })}
                          className="w-full bg-[#18181B] border border-[#27272A] rounded px-2 py-1 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Styling (Fill, Radius) */}
                  <div className="space-y-2 pt-2 border-t border-[#222225]">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
                      Geometry & Color
                    </span>
                    {selectedElement.fill !== undefined && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[#A1A1AA]">Fill Color</span>
                        <input
                          type="color"
                          value={selectedElement.fill}
                          onChange={(e) => handleUpdateSelectedElement({ fill: e.target.value })}
                          className="w-7 h-7 rounded border border-[#27272A] cursor-pointer bg-transparent"
                        />
                      </div>
                    )}
                    {selectedElement.borderRadius !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#A1A1AA]">Corner Radius</span>
                          <span className="text-[#EA580C]">{selectedElement.borderRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={selectedElement.borderRadius}
                          onChange={(e) => handleUpdateSelectedElement({ borderRadius: parseInt(e.target.value, 10) })}
                          className="w-full accent-[#EA580C]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Text Properties */}
                  {selectedElement.type === 'text' && (
                    <div className="space-y-2 pt-2 border-t border-[#222225]">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] font-semibold block">
                        Typography Content
                      </span>
                      <textarea
                        rows={3}
                        value={selectedElement.text || ''}
                        onChange={(e) => handleUpdateSelectedElement({ text: e.target.value })}
                        className="w-full bg-[#18181B] border border-[#27272A] rounded p-2 text-xs text-white focus:outline-none focus:border-[#EA580C] resize-none"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[#A1A1AA]">Font Size</span>
                          <span className="text-[#EA580C]">{selectedElement.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="84"
                          value={selectedElement.fontSize || 16}
                          onChange={(e) => handleUpdateSelectedElement({ fontSize: parseInt(e.target.value, 10) })}
                          className="w-full accent-[#EA580C]"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-xs text-[#52525B] font-mono space-y-2">
                  <MousePointer className="w-5 h-5 mx-auto text-[#3F3F46]" />
                  <p>Select any element on the artboard to inspect and modify properties.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODE 3: WEBSITE WORKSPACE (RESPONSIVE LIVE PREVIEW)   */}
      {/* ======================================================== */}
      {workspaceMode === 'website-workspace' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#09090B]">
          <div className="max-w-7xl mx-auto space-y-4">
            <StudioTokenEditor />
          </div>
        </div>
      )}
    </div>
  );
};
