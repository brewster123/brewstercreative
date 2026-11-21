import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShopProduct,
  ShopCategoryName,
  ShopCategoryId,
  ShopProductStatus,
  ShopProductType,
} from '../../types';
import { SHOP_CATEGORIES } from '../../data/shopData';
import { uploadPortfolioMedia } from '../../lib/portfolio';
import { isValidCheckoutUrl, isValidReferenceUrl } from '../../utils/urlUtils';
import {
  X,
  Plus,
  Search,
  Edit3,
  Trash2,
  Star,
  AlertTriangle,
  Loader2,
  UploadCloud,
  RotateCcw,
  Tag,
  Palette,
  Package,
  Type,
  Layers,
  Image as ImageIcon,
  ShoppingBag,
  Check,
} from 'lucide-react';

const EDITABLE_CATEGORIES = SHOP_CATEGORIES.filter((c) => c.name !== 'All');

const STATUS_OPTIONS: readonly ShopProductStatus[] = [
  'Coming Soon',
  'In Production',
  'Available',
  'Sold Out',
];

const ICON_OPTIONS: readonly NonNullable<ShopProduct['iconName']>[] = [
  'Tag',
  'Palette',
  'Package',
  'Type',
  'Layers',
];

const resolveCategoryId = (categoryName: ShopCategoryName): ShopCategoryId => {
  const match = SHOP_CATEGORIES.find((c) => c.name === categoryName);
  return match ? match.id : 'branding-kits';
};

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `edition-${Date.now()}`;

const isDisallowedSvgFile = (file: File): boolean =>
  file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);

const renderCategoryIcon = (iconName?: ShopProduct['iconName'], className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Tag':
      return <Tag className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Package':
      return <Package className={className} />;
    case 'Type':
      return <Type className={className} />;
    case 'Layers':
    default:
      return <Layers className={className} />;
  }
};

// ============================================================================
// 1. Shop Catalog Dashboard Modal (Opened from "Edit Shop" in ShopView)
// ============================================================================

interface ShopDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNew: () => void;
  onEditProduct: (product: ShopProduct) => void;
  onDeleteProduct: (product: ShopProduct) => void;
}

export const ShopDashboardModal: React.FC<ShopDashboardModalProps> = ({
  isOpen,
  onClose,
  onAddNew,
  onEditProduct,
  onDeleteProduct,
}) => {
  const {
    currentUser,
    shopProducts,
    studioProfile,
    updateShopProduct,
    resetShopCatalog,
  } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const currencySymbol = studioProfile?.currencySymbol || '₱';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ShopCategoryName>('All');
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmReset(false);
    setFeedbackError(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !isAdmin) return null;

  const filtered = shopProducts.filter((item) => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.formats || '').toLowerCase().includes(q) ||
      (item.shortDescription || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const availableCount = shopProducts.filter((p) => p.status === 'Available').length;
  const productionCount = shopProducts.filter((p) => p.status === 'In Production').length;
  const comingSoonCount = shopProducts.filter((p) => p.status === 'Coming Soon').length;
  const featuredCount = shopProducts.filter((p) => Boolean(p.featured)).length;

  const handleQuickStatusChange = async (product: ShopProduct, nextStatus: ShopProductStatus) => {
    setFeedbackError(null);
    const res = await updateShopProduct(product.id, { status: nextStatus });
    if (!res.success) {
      setFeedbackError(res.error || 'Unable to update edition status.');
    }
  };

  const handleQuickToggleFeatured = async (product: ShopProduct) => {
    setFeedbackError(null);
    const res = await updateShopProduct(product.id, { featured: !product.featured });
    if (!res.success) {
      setFeedbackError(res.error || 'Unable to update featured flag.');
    }
  };

  const handleResetDefaults = async () => {
    setFeedbackError(null);
    const res = await resetShopCatalog();
    if (!res.success) {
      setFeedbackError(res.error || 'Failed to restore default storefront catalog.');
    }
    setConfirmReset(false);
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-dashboard-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-hairline flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 text-[#0284C7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shop-dashboard-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-carbon tracking-tight"
              >
                Shop Catalog Dashboard
              </h2>
              <p className="text-xs text-graphite">
                Manage storefront editions, pricing, artwork, checkout links, and release statuses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAddNew}
              className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Edition</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shop dashboard"
              className="p-2 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metrics & Filter Bar */}
        <div className="px-6 py-4 border-b border-hairline bg-surface-secondary/50 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-surface border border-hairline text-carbon font-semibold tabular-nums">
              {shopProducts.length} Total
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              {availableCount} Available
            </span>
            <span className="px-3 py-1 rounded-full bg-surface border border-hairline text-graphite-strong font-medium tabular-nums">
              {productionCount} In Production
            </span>
            <span className="px-3 py-1 rounded-full bg-[#E0F2FE]/60 dark:bg-[#0C4A6E]/30 border border-accent/20 text-accent font-medium tabular-nums">
              {comingSoonCount} Coming Soon
            </span>
            <span className="px-3 py-1 rounded-full bg-[#D4FF38]/20 border border-[#D4FF38]/40 text-carbon font-medium tabular-nums">
              {featuredCount} Featured
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-graphite absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search editions by name, format, or category..."
                className="w-full bg-surface border border-hairline rounded-full pl-9 pr-4 py-2 text-xs text-carbon placeholder-graphite focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <select
              aria-label="Filter dashboard by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ShopCategoryName)}
              className="bg-surface border border-hairline rounded-full px-4 py-2 text-xs font-medium text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              {SHOP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {feedbackError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}
        </div>

        {/* Catalog List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-semibold text-carbon">No matching storefront editions</p>
              <p className="text-xs text-graphite">
                Try clearing your search filter or add a new studio edition.
              </p>
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Edition</span>
              </button>
            </div>
          ) : (
            filtered.map((item) => {
              const rawImage = item.productImage || item.image;
              const priceText =
                item.priceLabel ||
                (item.price > 0 ? `${currencySymbol}${item.price.toLocaleString()}` : 'Price TBA');

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-surface-secondary/50 hover:bg-surface-secondary border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-11 rounded-xl bg-surface border border-hairline overflow-hidden flex items-center justify-center shrink-0 text-accent">
                      {rawImage ? (
                        <img
                          src={rawImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        renderCategoryIcon(item.iconName, 'w-5 h-5 opacity-80')
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm text-carbon truncate max-w-[280px] sm:max-w-sm">
                          {item.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface border border-hairline text-graphite-strong font-semibold">
                          {item.productType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-graphite flex-wrap">
                        <span className="text-accent font-semibold">{item.category}</span>
                        <span>·</span>
                        <span className="font-semibold text-carbon tabular-nums">{priceText}</span>
                        {item.formats && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[180px]">{item.formats}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Inline Controls */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                    <select
                      aria-label={`Status for ${item.name}`}
                      value={item.status}
                      onChange={(e) =>
                        handleQuickStatusChange(item, e.target.value as ShopProductStatus)
                      }
                      className="bg-surface border border-hairline rounded-full px-3 py-1.5 text-[11px] font-semibold text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleQuickToggleFeatured(item)}
                      title={item.featured ? 'Featured edition (click to unfeature)' : 'Feature edition'}
                      aria-label={item.featured ? `Unfeature ${item.name}` : `Feature ${item.name}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                        item.featured
                          ? 'bg-[#D4FF38] border-[#D4FF38] text-[#111114]'
                          : 'bg-surface border-hairline text-graphite hover:text-carbon'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditProduct(item)}
                      aria-label={`Edit ${item.name}`}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-surface hover:bg-canvas border border-hairline text-xs font-semibold text-carbon transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-accent" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProduct(item)}
                      aria-label={`Delete ${item.name}`}
                      title={`Delete ${item.name}`}
                      className="w-8 h-8 rounded-full bg-surface hover:bg-red-600 border border-hairline hover:border-red-600 text-graphite hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3 shrink-0 bg-surface">
          <div>
            {confirmReset ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-graphite-strong font-medium">
                  Restore original 10 studio items?
                </span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1 rounded-full border border-hairline text-graphite hover:text-carbon font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite hover:text-carbon transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Default Catalog</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#111114] dark:bg-white text-white dark:text-[#111114] text-xs font-bold transition-opacity hover:opacity-90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Shop Product Editor Modal (Create & Edit Individual Editions)
// ============================================================================

interface ShopEditorModalProps {
  isOpen: boolean;
  product: ShopProduct | null;
  defaultCategory?: ShopCategoryName;
  onClose: () => void;
}

export const ShopEditorModal: React.FC<ShopEditorModalProps> = ({
  isOpen,
  product,
  defaultCategory,
  onClose,
}) => {
  const {
    currentUser,
    studioProfile,
    services,
    portfolio,
    addShopProduct,
    updateShopProduct,
  } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const currencySymbol = studioProfile?.currencySymbol || '₱';

  const resolvedDefaultCategory: ShopCategoryName =
    defaultCategory && defaultCategory !== 'All' ? defaultCategory : 'Branding Kits';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopCategoryName>(resolvedDefaultCategory);
  const [productType, setProductType] = useState<ShopProductType>('Digital');
  const [status, setStatus] = useState<ShopProductStatus>('Coming Soon');
  const [price, setPrice] = useState<number>(0);
  const [priceLabel, setPriceLabel] = useState('Price TBA');
  const [badge, setBadge] = useState('');
  const [formats, setFormats] = useState('');
  const [iconName, setIconName] = useState<NonNullable<ShopProduct['iconName']>>('Tag');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productImageAlt, setProductImageAlt] = useState('');
  const [externalCheckoutUrl, setExternalCheckoutUrl] = useState('');
  const [externalCheckoutLabel, setExternalCheckoutLabel] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  const [relatedServiceIds, setRelatedServiceIds] = useState<string[]>([]);
  const [relatedPortfolioIds, setRelatedPortfolioIds] = useState<string[]>([]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setName(product.name || '');
      setCategory(product.category !== 'All' ? product.category : 'Branding Kits');
      setProductType(product.productType || 'Digital');
      setStatus(product.status || 'Coming Soon');
      setPrice(typeof product.price === 'number' ? product.price : 0);
      setPriceLabel(product.priceLabel || '');
      setBadge(product.badge || '');
      setFormats(product.formats || '');
      setIconName(product.iconName || 'Tag');
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setProductImage(product.productImage || product.image || '');
      setProductImageAlt(product.productImageAlt || '');
      setExternalCheckoutUrl(product.externalCheckoutUrl || '');
      setExternalCheckoutLabel(product.externalCheckoutLabel || '');
      setTagsInput((product.tags || []).join(', '));
      setFeatured(Boolean(product.featured));
      setIsTemplate(Boolean(product.isTemplate));
      setRelatedServiceIds(product.relatedServiceIds || []);
      setRelatedPortfolioIds(product.relatedPortfolioIds || []);
    } else {
      setName('');
      setCategory(resolvedDefaultCategory);
      setProductType(resolvedDefaultCategory === 'Print & Posters' ? 'Physical' : 'Digital');
      setStatus('Coming Soon');
      setPrice(0);
      setPriceLabel('Price TBA');
      setBadge('');
      setFormats('AI • EPS • SVG • PDF');
      setIconName(
        resolvedDefaultCategory === 'Print & Posters'
          ? 'Palette'
          : resolvedDefaultCategory === 'Vector Packs'
            ? 'Package'
            : resolvedDefaultCategory === 'Typography'
              ? 'Type'
              : resolvedDefaultCategory === 'Digital Mockups'
                ? 'Layers'
                : 'Tag'
      );
      setShortDescription('');
      setDescription('');
      setProductImage('');
      setProductImageAlt('');
      setExternalCheckoutUrl('');
      setExternalCheckoutLabel('');
      setTagsInput('');
      setFeatured(false);
      setIsTemplate(false);
      setRelatedServiceIds([]);
      setRelatedPortfolioIds([]);
    }
    setSaveError(null);
  }, [isOpen, product, resolvedDefaultCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving && !isUploadingImage) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, isUploadingImage, onClose]);

  if (!isOpen || !isAdmin) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isDisallowedSvgFile(file)) {
      setSaveError('SVG files are not supported for cover artwork. Please upload PNG, JPG, or WebP.');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setSaveError('Please upload a valid image file (PNG, JPG, or WebP).');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    setSaveError(null);
    try {
      const result = await uploadPortfolioMedia(file, file.name || 'shop-edition.jpg');
      if (result.error || !result.publicUrl) {
        setSaveError(result.error || 'Failed to upload edition artwork.');
        return;
      }
      setProductImage(result.publicUrl);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to upload edition artwork.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const toggleRelatedId = (list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError('Edition title is required.');
      return;
    }

    const trimmedImage = productImage.trim();
    if (trimmedImage && !isValidReferenceUrl(trimmedImage)) {
      setSaveError('Cover artwork URL must be a valid http:// or https:// image link.');
      return;
    }

    const trimmedCheckout = externalCheckoutUrl.trim();
    if (trimmedCheckout && !isValidCheckoutUrl(trimmedCheckout)) {
      setSaveError('External checkout URL must be a valid, secure https:// link.');
      return;
    }

    const sanitizedPrice = Number.isFinite(price) ? Math.max(0, price) : 0;
    const trimmedPriceLabel = priceLabel.trim();
    const resolvedPriceLabel =
      trimmedPriceLabel ||
      (sanitizedPrice > 0 ? `${currencySymbol}${sanitizedPrice.toLocaleString()}` : 'Price TBA');

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const trimmedShort = shortDescription.trim();
    const trimmedFull = description.trim() || trimmedShort;

    const payload: Omit<ShopProduct, 'id'> = {
      name: trimmedName,
      slug: product?.slug || toSlug(trimmedName),
      category,
      categoryId: resolveCategoryId(category),
      description: trimmedFull || `${trimmedName} — curated DESTALION studio release.`,
      shortDescription: trimmedShort || trimmedFull || `${trimmedName} — studio edition.`,
      productType,
      isPhysical: productType === 'Physical',
      isDownloadable: productType === 'Digital',
      isTemplate,
      price: sanitizedPrice,
      priceLabel: resolvedPriceLabel,
      status,
      featured,
      badge: badge.trim() || undefined,
      formats: formats.trim() || undefined,
      iconName,
      tags: parsedTags.length > 0 ? parsedTags : [category],
      productImage: trimmedImage || undefined,
      image: trimmedImage || undefined,
      productImageAlt: productImageAlt.trim() || undefined,
      externalCheckoutUrl: trimmedCheckout || undefined,
      externalCheckoutLabel: externalCheckoutLabel.trim() || undefined,
      relatedServiceIds,
      relatedPortfolioIds,
    };

    setIsSaving(true);
    try {
      if (product) {
        const res = await updateShopProduct(product.id, payload);
        if (!res.success) {
          throw new Error(res.error || 'Failed to update storefront edition.');
        }
      } else {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `prod-${crypto.randomUUID().slice(0, 8)}`
            : `prod-${Date.now()}`;
        const res = await addShopProduct({
          id: newId,
          ...payload,
        });
        if (!res.success) {
          throw new Error(res.error || 'Failed to add storefront edition.');
        }
      }
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save storefront edition.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => !isSaving && !isUploadingImage && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-editor-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-hairline rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <h3 id="shop-editor-modal-title" className="font-display text-xl font-bold text-carbon">
            {product ? 'Edit Storefront Edition' : 'New Storefront Edition'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isUploadingImage}
            aria-label="Close edition editor"
            className="p-2 rounded-full text-graphite hover:text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Row 1: Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Edition Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brutalist Display Typeface v1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Badge</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Vector Kit v1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          {/* Row 2: Category, Medium, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopCategoryName)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                {EDITABLE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Medium Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ShopProductType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                <option value="Digital">Digital</option>
                <option value="Physical">Physical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Release Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShopProductStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Price, Price Label, Formats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">
                Price ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setPrice(val);
                  if (val > 0 && (priceLabel === 'Price TBA' || !priceLabel.trim())) {
                    setPriceLabel(`${currencySymbol}${val.toLocaleString()}`);
                  } else if (val === 0 && priceLabel.startsWith(currencySymbol)) {
                    setPriceLabel('Price TBA');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon tabular-nums focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Display Price Label</label>
              <input
                type="text"
                value={priceLabel}
                onChange={(e) => setPriceLabel(e.target.value)}
                placeholder="Price TBA or ₱950"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">Master Formats</label>
              <input
                type="text"
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                placeholder="AI • EPS • SVG • PDF"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          {/* Cover Artwork Upload or URL */}
          <div className="space-y-2 p-4 rounded-2xl bg-surface-secondary/60 border border-hairline">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-carbon flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" />
                <span>Edition Artwork Preview (Optional)</span>
              </label>

              {productImage && (
                <button
                  type="button"
                  onClick={() => setProductImage('')}
                  className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface hover:bg-canvas border border-hairline text-xs font-semibold text-carbon cursor-pointer transition-colors shrink-0">
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 text-accent" />
                    <span>Upload Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={productImage}
                onChange={(e) => setProductImage(e.target.value)}
                placeholder="Or paste https:// image URL (leave blank for icon stage)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-hairline text-xs text-carbon placeholder-graphite focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            {productImage && isValidReferenceUrl(productImage) && (
              <div className="mt-2 rounded-xl overflow-hidden border border-hairline aspect-[16/7] bg-surface">
                <img
                  src={productImage}
                  alt={productImageAlt || name || 'Edition preview'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Placeholder Icon Picker when no cover image is set */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-graphite font-medium mr-1">Fallback Icon:</span>
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setIconName(icon)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                    iconName === icon
                      ? 'bg-[#D4FF38] border-[#D4FF38] text-[#111114]'
                      : 'bg-surface border-hairline text-graphite hover:text-carbon'
                  }`}
                >
                  {renderCategoryIcon(icon, 'w-3 h-3')}
                  <span>{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-graphite-strong">Card Summary</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise 1–2 line summary displayed on storefront cards..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-graphite-strong">Full Edition Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed overview, included layers, grid specifications, and usage notes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* External Checkout & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">
                External Checkout URL (HTTPS)
              </label>
              <input
                type="url"
                value={externalCheckoutUrl}
                onChange={(e) => setExternalCheckoutUrl(e.target.value)}
                placeholder="https://gumroad.com/l/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-strong">
                Checkout Button Label
              </label>
              <input
                type="text"
                value={externalCheckoutLabel}
                onChange={(e) => setExternalCheckoutLabel(e.target.value)}
                placeholder="e.g. Purchase Edition"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-graphite-strong">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Branding, Vector, Swiss Grid, Poster"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-hairline text-sm text-carbon focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          {/* Cross-links (Services & Portfolio) */}
          {(services.length > 0 || portfolio.length > 0) && (
            <div className="space-y-3 pt-1">
              {services.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-graphite-strong">
                    Related Services (for custom variant inquiries)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {services.map((srv) => {
                      const active = relatedServiceIds.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() =>
                            toggleRelatedId(relatedServiceIds, setRelatedServiceIds, srv.id)
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 border-accent text-accent font-semibold'
                              : 'bg-surface-secondary border-hairline text-graphite hover:text-carbon'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span>{srv.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {portfolio.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-graphite-strong">
                    Related Portfolio Works
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {portfolio.slice(0, 8).map((proj) => {
                      const active = relatedPortfolioIds.includes(proj.id);
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() =>
                            toggleRelatedId(relatedPortfolioIds, setRelatedPortfolioIds, proj.id)
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#E0F2FE] dark:bg-[#0C4A6E]/50 border-accent text-accent font-semibold'
                              : 'bg-surface-secondary border-hairline text-graphite hover:text-carbon'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          <span className="max-w-[180px] truncate">{proj.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-carbon cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0284C7]"
              />
              <span>Featured Edition</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-carbon cursor-pointer">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0284C7]"
              />
              <span>Template System</span>
            </label>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploadingImage}
              className="px-5 py-2.5 rounded-full border border-hairline text-xs font-semibold text-carbon hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="btn-tactile inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#D4FF38] hover:bg-[#C4F024] text-[#111114] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{product ? 'Save Changes' : 'Publish Edition'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 3. Shop Product Delete Confirmation Modal
// ============================================================================

interface ShopDeleteModalProps {
  product: { id: string; name: string } | null;
  onClose: () => void;
}

export const ShopDeleteModal: React.FC<ShopDeleteModalProps> = ({ product, onClose }) => {
  const { currentUser, deleteShopProduct } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setDeleteError(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, isDeleting, onClose]);

  if (!product || !isAdmin) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteShopProduct(product.id);
      if (!res.success) {
        setDeleteError(res.error || 'Failed to delete edition.');
        return;
      }
      onClose();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete edition.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-shop-edition-title"
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
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
            <h3 id="delete-shop-edition-title" className="font-display text-base sm:text-lg font-bold text-carbon">
              Remove Storefront Edition
            </h3>
            <p className="text-xs sm:text-sm text-graphite leading-relaxed">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-carbon">"{product.name}"</span> from the storefront archive?
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
                <span>Removing...</span>
              </>
            ) : (
              <span>Remove Edition</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
