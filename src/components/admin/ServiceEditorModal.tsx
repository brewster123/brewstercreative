import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItem } from '../../types';
import { X, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

interface ServiceEditorModalProps {
  isOpen: boolean;
  service: ServiceItem | null;
  onClose: () => void;
}

interface ServiceFormState {
  name: string;
  category: string;
  startingPrice: string;
  turnaround: string;
  revisionsCount: string;
  shortDesc: string;
  popular: boolean;
}

const DEFAULT_FORM_STATE: ServiceFormState = {
  name: '',
  category: 'Branding',
  startingPrice: '3500',
  turnaround: '3–7 days',
  revisionsCount: '2',
  shortDesc: '',
  popular: false,
};

export const ServiceEditorModal: React.FC<ServiceEditorModalProps> = ({
  isOpen,
  service,
  onClose,
}) => {
  const { currentUser, studioProfile, addServiceItem, updateServiceItem } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const currencySymbol = studioProfile?.currencySymbol || '₱';

  const [form, setForm] = useState<ServiceFormState>(DEFAULT_FORM_STATE);
  const [deliverablesText, setDeliverablesText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (service) {
      setForm({
        name: service.name || '',
        category: service.category || 'Branding',
        startingPrice:
          typeof service.startingPrice === 'number' && Number.isFinite(service.startingPrice)
            ? String(service.startingPrice)
            : '0',
        turnaround: service.turnaround || '',
        revisionsCount:
          typeof service.revisionsCount === 'number' && Number.isFinite(service.revisionsCount)
            ? String(service.revisionsCount)
            : '2',
        shortDesc: service.shortDesc || '',
        popular: Boolean(service.popular),
      });
      setDeliverablesText((service.deliverables || []).join('\n'));
    } else {
      setForm(DEFAULT_FORM_STATE);
      setDeliverablesText('');
    }
    setSaveError(null);
  }, [isOpen, service]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setSaveError('Service name is required.');
      return;
    }

    const parsedPrice = Number(form.startingPrice);
    const sanitizedPrice = Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0;
    const parsedRevisions = Number(form.revisionsCount);
    const sanitizedRevisions = Number.isFinite(parsedRevisions)
      ? Math.max(0, Math.floor(parsedRevisions))
      : 0;
    const parsedDeliverables = deliverablesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      if (service) {
        const res = await updateServiceItem(service.id, {
          name: trimmedName,
          category: form.category.trim() || 'Branding',
          startingPrice: sanitizedPrice,
          turnaround: form.turnaround.trim() || '1–2 weeks',
          revisionsCount: sanitizedRevisions,
          shortDesc: form.shortDesc.trim(),
          deliverables: parsedDeliverables,
          popular: form.popular,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to update service package.');
        }
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `srv-${crypto.randomUUID().slice(0, 8)}`
            : `srv-${Date.now()}`;
        const res = await addServiceItem({
          id: newId,
          iconName: 'Layers',
          name: trimmedName,
          category: form.category.trim() || 'Branding',
          startingPrice: sanitizedPrice,
          turnaround: form.turnaround.trim() || '1–2 weeks',
          revisionsCount: sanitizedRevisions,
          shortDesc: form.shortDesc.trim(),
          deliverables: parsedDeliverables,
          popular: form.popular,
        });
        if (res && !res.success) {
          throw new Error(res.error || 'Failed to create service package.');
        }
      }
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save service package.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => !isSaving && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-editor-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <h3 id="service-editor-title" className="font-display text-xl font-bold text-carbon">
            {service ? 'Edit Service Package' : 'New Service Package'}
          </h3>
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            aria-label="Close service modal"
            className="p-1.5 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Service Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Brand Identity Package"
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Branding, Print, Illustration"
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Starting Price ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.startingPrice}
                onChange={(e) => {
                  const parts = e.target.value.replace(/[^0-9.]/g, '').split('.');
                  const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : parts[0];
                  setForm((prev) => ({ ...prev, startingPrice: cleaned }));
                }}
                placeholder="0"
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon tabular-nums focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Turnaround
              </label>
              <input
                type="text"
                value={form.turnaround}
                onChange={(e) => setForm((prev) => ({ ...prev, turnaround: e.target.value }))}
                placeholder="e.g. 7–14 days"
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
                Revisions
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.revisionsCount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setForm((prev) => ({ ...prev, revisionsCount: cleaned }));
                }}
                placeholder="0"
                className="w-full bg-surface-secondary border border-hairline rounded-xl px-3.5 py-2.5 text-xs text-carbon tabular-nums focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
              Short Description
            </label>
            <textarea
              rows={2}
              value={form.shortDesc}
              onChange={(e) => setForm((prev) => ({ ...prev, shortDesc: e.target.value }))}
              placeholder="Concise summary of package scope..."
              className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-graphite mb-1 font-semibold">
              Deliverables (one per line)
            </label>
            <textarea
              rows={4}
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              placeholder={'Primary logo + icon mark + monochrome variants\nHigh-res PNG, JPG, and scalable SVG/EPS vector formats'}
              className="w-full bg-surface-secondary border border-hairline rounded-xl p-3 text-xs text-carbon focus:outline-none focus:border-accent font-mono"
            />
          </div>

          <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-secondary border border-hairline cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-carbon">
                  Highlight as Core Offering
                </span>
                <span className="block text-[11px] text-graphite">
                  Displays the featured Core Offering badge on this service card.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(e) => setForm((prev) => ({ ...prev, popular: e.target.checked }))}
              className="w-4 h-4 accent-accent rounded cursor-pointer shrink-0"
            />
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-tactile inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSaving ? 'Saving...' : service ? 'Save Changes' : 'Add Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ServiceDeleteModalProps {
  service: { id: string; name: string } | null;
  onClose: () => void;
}

export const ServiceDeleteModal: React.FC<ServiceDeleteModalProps> = ({
  service,
  onClose,
}) => {
  const { currentUser, deleteServiceItem } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!service) return;
    setDeleteError(null);
  }, [service]);

  useEffect(() => {
    if (!service) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [service, isDeleting, onClose]);

  if (!service || !isAdmin) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteServiceItem(service.id);
      if (res && !res.success) {
        setDeleteError(res.error || 'Failed to delete service package.');
        return;
      }
      onClose();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete service package.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-service-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="delete-service-title" className="font-display text-base sm:text-lg font-bold text-carbon">
              Delete Service Package
            </h3>
            <p className="text-xs sm:text-sm text-graphite leading-relaxed">
              Are you sure you want to delete service package{' '}
              <span className="font-semibold text-carbon">"{service.name}"</span> from the website?
            </p>
          </div>
        </div>

        {deleteError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900/50">
            {deleteError}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Service</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
