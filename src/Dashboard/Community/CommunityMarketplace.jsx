import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const CATEGORIES = [
  { value: "", label: "Everything" },
  { value: "services", label: "Services" },
  { value: "food", label: "Food & produce" },
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home & living" },
  { value: "clothing", label: "Clothing" },
  { value: "education", label: "Learning" },
  { value: "general", label: "Other" },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "general",
  price: "0",
  unit: "piece",
  quantity_available: "1",
  location: "",
};

function extractListings(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.listings)) return value.listings;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.listings)) return value.data.listings;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
}

function listingId(listing) {
  const value = listing?.id ?? listing?._id ?? listing?.listing_id;
  return value === undefined || value === null ? "" : String(value);
}

function formatPrice(listing) {
  const raw = Number(listing?.price);
  if (!Number.isFinite(raw)) return "Ask for price";
  if (raw === 0) return "Free / exchange";
  const currency = String(listing?.currency || "KES").toUpperCase();
  const amount = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(raw) ? 0 : 2,
  }).format(raw);
  const unit = String(listing?.unit || "").trim();
  return `${currency} ${amount}${unit ? ` / ${unit}` : ""}`;
}

function formatListingDate(value) {
  if (!value) return "Recently listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently listed";
  const elapsed = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);
  const days = Math.floor(elapsed / 86400000);
  if (minutes < 1) return "Just listed";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function ListingCard({ listing, isOwner, deleting, onDelete }) {
  const quantity = Number(listing?.quantity_available);
  const category = String(listing?.category || "general").replace(/[_-]+/g, " ");
  const title = String(listing?.title || "Community listing");
  const description = String(
    listing?.description || "Contact the seller for more information.",
  );
  const location = String(listing?.location || "").trim();

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-700/50 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShoppingBag size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Tag size={11} />
              {category}
            </span>
            {isOwner ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Your listing
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 break-words text-sm font-black text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
      </div>

      <p className="mt-3 min-h-[2.5rem] whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 dark:text-slate-300">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-2 text-base font-black tracking-tight text-slate-950 dark:text-white">
        <CircleDollarSign size={17} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="break-words">{formatPrice(listing)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-400">
        {Number.isFinite(quantity) ? (
          <span className="inline-flex items-center gap-1">
            <Package size={12} />
            {quantity} available
          </span>
        ) : null}
        {location ? (
          <span className="inline-flex items-center gap-1 break-words">
            <MapPin size={12} />
            {location}
          </span>
        ) : null}
        <span>{formatListingDate(listing?.created_at || listing?.createdAt)}</span>
      </div>

      {isOwner ? (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5">
          <button
            type="button"
            onClick={() => onDelete(listing)}
            disabled={deleting}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
          >
            <Trash2 size={14} />
            {deleting ? "Removing…" : "Remove listing"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ListingForm({ form, saving, error, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-marketplace-form-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Community exchange
            </p>
            <h2 id="community-marketplace-form-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              Create a listing
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Share a useful product or service with the Jumuiya community.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close listing form"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="marketplace-title" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
              Listing title *
            </label>
            <input
              id="marketplace-title"
              name="title"
              required
              maxLength={160}
              value={form.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="What are you offering?"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="marketplace-description" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
              Details
            </label>
            <textarea
              id="marketplace-description"
              name="description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Describe condition, what is included, delivery options or the service you provide."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{form.description.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="marketplace-category" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                Category
              </label>
              <select
                id="marketplace-category"
                value={form.category}
                onChange={(event) => onChange("category", event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              >
                {CATEGORIES.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="marketplace-location" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                Location
              </label>
              <input
                id="marketplace-location"
                name="location"
                maxLength={200}
                value={form.location}
                onChange={(event) => onChange("location", event.target.value)}
                placeholder="e.g. Mombasa or Online"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="marketplace-price" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                Price (KES) *
              </label>
              <input
                id="marketplace-price"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => onChange("price", event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="marketplace-quantity" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                Quantity *
              </label>
              <input
                id="marketplace-quantity"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.quantity_available}
                onChange={(event) => onChange("quantity_available", event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="marketplace-unit" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                Sold per
              </label>
              <input
                id="marketplace-unit"
                maxLength={40}
                value={form.unit}
                onChange={(event) => onChange("unit", event.target.value)}
                placeholder="piece, hour, kg…"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-white/5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Publishing…" : "Publish listing"}
              <ArrowLeft className="rotate-180" size={14} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function CommunityMarketplace({ onNavigate }) {
  const { user } = useAuth();
  const {
    getMarketplaceListings,
    createMarketplaceListing,
    deleteMarketplaceListing,
  } = useJumuiyaApi();

  const [listings, setListings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const loadListings = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setLoadError("");

    try {
      const response = await getMarketplaceListings({
        hub: "community",
        category: selectedCategory,
      });
      const rows = extractListings(response);
      setListings(rows.filter((item) => (
        !item?.hub || String(item.hub).toLowerCase() === "community"
      )));
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getMarketplaceListings, selectedCategory]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const ownUserIds = useMemo(() => (
    [
      user?.id,
      user?._id,
      user?.user_id,
      user?.userId,
      user?.sub,
    ].filter((value) => value !== undefined && value !== null && String(value).trim())
      .map(String)
  ), [user]);

  const isOwner = useCallback((listing) => {
    const sellerId = listing?.seller_user_id ?? listing?.sellerId ?? listing?.owner_user_id;
    return sellerId !== undefined && sellerId !== null && ownUserIds.includes(String(sellerId));
  }, [ownUserIds]);

  const filteredListings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return listings;
    return listings.filter((listing) => [
      listing?.title,
      listing?.description,
      listing?.category,
      listing?.location,
      listing?.unit,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [listings, searchTerm]);

  const updateField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCreateListing = useCallback(async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const price = Number(form.price);
    const quantity = Number(form.quantity_available);

    if (!form.title.trim()) {
      setFormError("Add a clear title for your listing.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be zero or a positive amount.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setFormError("Quantity must be zero or a positive amount.");
      return;
    }

    setSaving(true);
    try {
      await createMarketplaceListing({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || "general",
        hub: "community",
        price,
        currency: "KES",
        unit: form.unit.trim() || "piece",
        quantity_available: quantity,
        location: form.location.trim(),
      });

      setCreateOpen(false);
      setForm(INITIAL_FORM);
      setNotice("Your listing is published. The Community marketplace is updated.");
      await loadListings({ quiet: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }, [createMarketplaceListing, form, loadListings]);

  const handleDeleteListing = useCallback(async () => {
    const id = listingId(deleteCandidate);
    if (!id || deletingId) return;
    setDeletingId(id);
    setLoadError("");
    setNotice("");

    try {
      await deleteMarketplaceListing(id);
      setListings((current) => current.filter((item) => listingId(item) !== id));
      setDeleteCandidate(null);
      setNotice("Your listing has been removed.");
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setDeletingId("");
    }
  }, [deleteCandidate, deleteMarketplaceListing, deletingId]);

  const openCreateForm = useCallback(() => {
    setFormError("");
    setCreateOpen(true);
  }, []);

  return (
    <div className="min-w-0 space-y-5 pb-24 lg:pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <button
            type="button"
            onClick={() => onNavigate?.("community")}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} />
            Community home
          </button>

          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
                <Sparkles size={13} />
                Community marketplace
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Useful things. Real people. Local value.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                Discover goods, skills and services offered by the community, or publish something that can help someone nearby.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-emerald-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              <Plus size={16} />
              Sell or offer
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:max-w-lg sm:gap-3">
            <div>
              <p className="text-lg font-black">{listings.length}</p>
              <p className="mt-0.5 text-[10px] text-white/50">Active listings</p>
            </div>
            <div>
              <p className="text-lg font-black">{new Set(listings.map((item) => item?.category).filter(Boolean)).size}</p>
              <p className="mt-0.5 text-[10px] text-white/50">Categories</p>
            </div>
            <div>
              <p className="text-lg font-black">{listings.filter(isOwner).length}</p>
              <p className="mt-0.5 text-[10px] text-white/50">Your listings</p>
            </div>
          </div>
        </div>
      </section>

      {notice ? (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14} /></button>
        </div>
      ) : null}

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-black">Marketplace could not be refreshed.</p>
          <p className="mt-1 break-words">{loadError}</p>
          <button type="button" onClick={() => loadListings()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-rose-700 dark:bg-slate-900 dark:text-rose-300">
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search marketplace</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, skills, services or places…"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
            />
          </label>
          <button
            type="button"
            onClick={() => loadListings({ quiet: true })}
            disabled={refreshing || loading}
            aria-label="Refresh marketplace"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((category) => (
            <button
              key={category.value || "all"}
              type="button"
              aria-pressed={selectedCategory === category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`shrink-0 rounded-full px-3.5 py-2.5 text-[10px] font-bold transition ${selectedCategory === category.value ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Made useful by the community</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {loading ? "Looking for active listings…" : `${filteredListings.length} ${filteredListings.length === 1 ? "listing" : "listings"} to explore`}
            </p>
          </div>
          <button type="button" onClick={openCreateForm} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100">
            <Plus size={14} />
            List something
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : filteredListings.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing, index) => {
              const id = listingId(listing);
              return (
                <ListingCard
                  key={id || `listing-${index}`}
                  listing={listing}
                  isOwner={isOwner(listing)}
                  deleting={deletingId === id}
                  onDelete={setDeleteCandidate}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShoppingBag size={23} />
            </div>
            <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
              {searchTerm || selectedCategory ? "No matching listings" : "Be the first to list something"}
            </h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              {searchTerm || selectedCategory
                ? "Try a different search or category. You can also clear the search and browse everything."
                : "Share a useful product, skill or service. Your listing will be stored on the marketplace and available to the Community hub."}
            </p>
            <button type="button" onClick={() => {
              if (searchTerm || selectedCategory) {
                setSearchTerm("");
                setSelectedCategory("");
              } else {
                openCreateForm();
              }
            }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700">
              {searchTerm || selectedCategory ? "Clear filters" : "Create first listing"}
              <Plus size={14} />
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">A community-first exchange</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Check details carefully before paying or sharing personal information. Seller contact details are not exposed by the current marketplace API, so no fake contact or checkout action is shown.
            </p>
          </div>
        </div>
      </section>

      {createOpen ? (
        <ListingForm
          form={form}
          saving={saving}
          error={formError}
          onChange={updateField}
          onClose={() => {
            if (!saving) {
              setCreateOpen(false);
              setFormError("");
            }
          }}
          onSubmit={handleCreateListing}
        />
      ) : null}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="remove-listing-title" className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
            <h2 id="remove-listing-title" className="text-lg font-black text-slate-950 dark:text-white">Remove this listing?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              “{deleteCandidate?.title || "Your listing"}” will no longer appear in the active marketplace. This action can’t be undone from this screen.
            </p>
            {loadError ? <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-300">{loadError}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteCandidate(null)} disabled={Boolean(deletingId)} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">Keep listing</button>
              <button type="button" onClick={handleDeleteListing} disabled={Boolean(deletingId)} className="min-h-11 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
                {deletingId ? "Removing…" : "Remove listing"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
