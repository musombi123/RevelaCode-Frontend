import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Filter,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import WhatsAppButton from "@/Dashboard/Community/WhatsAppButton.jsx";

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

function shortNumber(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en-KE", {
    notation: number >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
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
  const imageUrl =
    listing?.image_url ||
    listing?.photo_url ||
    listing?.cover_image_url ||
    listing?.thumbnail_url ||
    listing?.image?.url ||
    listing?.media?.[0]?.url ||
    "";
  const sellerName =
    listing?.seller?.name ||
    listing?.seller_name ||
    listing?.owner_name ||
    listing?.business_name ||
    "";
  const contactId =
    listing?.seller_user_id ??
    listing?.sellerId ??
    listing?.owner_user_id;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d1729] shadow-[0_8px_24px_rgba(0,0,0,.14)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_16px_32px_rgba(0,0,0,.22)]">
      <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-[#102d5c] via-[#123d75] to-[#087b8d]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            onError={(event) => { event.currentTarget.style.display = "none"; }}
          />
        ) : (
          <>
            <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border border-white/10" />
            <div className="absolute -bottom-20 left-8 h-48 w-48 rounded-full border border-cyan-100/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-100 shadow-xl backdrop-blur-sm">
                <ShoppingBag size={28} />
              </span>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061226]/90 via-[#061226]/15 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#07172e]/85 px-2.5 py-1 text-[9px] font-black capitalize tracking-wide text-white backdrop-blur">
            <Tag size={10} /> {category}
          </span>
          {isOwner ? (
            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/15 px-2.5 py-1 text-[9px] font-black text-cyan-100 backdrop-blur">
              Your listing
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {sellerName ? <p className="mb-1 truncate text-[9px] font-semibold text-white/70">{sellerName}</p> : null}
            <h3 className="line-clamp-2 break-words text-sm font-black leading-5 text-white sm:text-[15px]">
              {title}
            </h3>
          </div>
          <span className="shrink-0 rounded-xl border border-cyan-200/20 bg-cyan-300 px-2.5 py-1.5 text-[10px] font-black text-[#08213c] shadow-lg">
            {formatPrice(listing)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-4">
        <p className="line-clamp-3 min-h-[3.75rem] whitespace-pre-wrap break-words text-xs leading-[1.6] text-slate-300">
          {description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-medium text-slate-400">
          {Number.isFinite(quantity) ? (
            <span className="inline-flex items-center gap-1.5">
              <Package size={12} className="text-cyan-300" />
              {quantity} available
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex items-center gap-1.5 break-words">
              <MapPin size={12} className="text-cyan-300" />
              {location}
            </span>
          ) : null}
          <span>{formatListingDate(listing?.created_at || listing?.createdAt)}</span>
        </div>

        {!isOwner && contactId ? (
          <div className="mt-4 border-t border-white/[0.07] pt-3">
            <WhatsAppButton memberId={contactId} compact />
          </div>
        ) : null}

        {isOwner ? (
          <div className="mt-4 border-t border-white/[0.07] pt-3">
            <button
              type="button"
              onClick={() => { if (typeof onDelete === "function") onDelete(listing); }}
              disabled={deleting}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3 py-2 text-xs font-bold text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={14} />
              {deleting ? "Removing…" : "Manage listing · Remove"}
            </button>
          </div>
        ) : null}
      </div>
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
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/[0.10] bg-[#0d1729] p-5 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,.5)] sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
              Community exchange
            </p>
            <h2 id="community-marketplace-form-title" className="mt-1 text-xl font-black text-white">
              Create a listing
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Share a useful product or service with the Jumuiya community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { if (typeof onClose === "function") onClose(); }}
            disabled={saving}
            aria-label="Close listing form"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(event) => { if (typeof onSubmit === "function") onSubmit(event); else event.preventDefault(); }} className="mt-5 space-y-4">
          <div>
            <label htmlFor="marketplace-title" className="mb-1.5 block text-xs font-bold text-slate-300">
              Listing title *
            </label>
            <input
              id="marketplace-title"
              name="title"
              required
              maxLength={160}
              value={form.title}
              onChange={(event) => { if (typeof onChange === "function") onChange("title", event.target.value); }}
              placeholder="What are you offering?"
              className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
          </div>

          <div>
            <label htmlFor="marketplace-description" className="mb-1.5 block text-xs font-bold text-slate-300">
              Details
            </label>
            <textarea
              id="marketplace-description"
              name="description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => { if (typeof onChange === "function") onChange("description", event.target.value); }}
              placeholder="Describe condition, what is included, delivery options or the service you provide."
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-[#07111e] px-3.5 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{form.description.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="marketplace-category" className="mb-1.5 block text-xs font-bold text-slate-300">
                Category
              </label>
              <select
                id="marketplace-category"
                value={form.category}
                onChange={(event) => { if (typeof onChange === "function") onChange("category", event.target.value); }}
                className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                {CATEGORIES.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="marketplace-location" className="mb-1.5 block text-xs font-bold text-slate-300">
                Location
              </label>
              <input
                id="marketplace-location"
                name="location"
                maxLength={200}
                value={form.location}
                onChange={(event) => { if (typeof onChange === "function") onChange("location", event.target.value); }}
                placeholder="e.g. Mombasa or Online"
                className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="marketplace-price" className="mb-1.5 block text-xs font-bold text-slate-300">
                Price (KES) *
              </label>
              <input
                id="marketplace-price"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => { if (typeof onChange === "function") onChange("price", event.target.value); }}
                className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="marketplace-quantity" className="mb-1.5 block text-xs font-bold text-slate-300">
                Quantity *
              </label>
              <input
                id="marketplace-quantity"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.quantity_available}
                onChange={(event) => { if (typeof onChange === "function") onChange("quantity_available", event.target.value); }}
                className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="marketplace-unit" className="mb-1.5 block text-xs font-bold text-slate-300">
                Sold per
              </label>
              <input
                id="marketplace-unit"
                maxLength={40}
                value={form.unit}
                onChange={(event) => { if (typeof onChange === "function") onChange("unit", event.target.value); }}
                placeholder="piece, hour, kg…"
                className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.08] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => { if (typeof onClose === "function") onClose(); }}
              disabled={saving}
              className="min-h-11 rounded-xl border border-white/[0.10] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-2.5 text-xs font-black text-[#08213c] shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
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
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (
        document.visibilityState !== "hidden" &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        loadListings({ quiet: true });
      }
    };

    const onOnline = () => refreshWhenVisible();
    const interval = window.setInterval(refreshWhenVisible, 60000);

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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
    let rows = listings;

    if (activeTab === "mine") {
      rows = rows.filter(isOwner);
    } else if (activeTab === "free") {
      rows = rows.filter((listing) => Number(listing?.price) === 0);
    }

    if (query) {
      rows = rows.filter((listing) => [
        listing?.title,
        listing?.description,
        listing?.category,
        listing?.location,
        listing?.unit,
        listing?.seller?.name,
        listing?.seller_name,
        listing?.business_name,
      ].some((value) => String(value || "").toLowerCase().includes(query)));
    }

    return [...rows].sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a?.price || 0) - Number(b?.price || 0);
      }
      if (sortBy === "price-high") {
        return Number(b?.price || 0) - Number(a?.price || 0);
      }
      return new Date(b?.created_at || b?.createdAt || 0).getTime()
        - new Date(a?.created_at || a?.createdAt || 0).getTime();
    });
  }, [listings, searchTerm, activeTab, sortBy, isOwner]);

  const hasMarketplaceFilters = Boolean(
    searchTerm.trim() ||
    selectedCategory ||
    activeTab !== "all" ||
    sortBy !== "newest"
  );

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
      <section className="relative isolate min-h-[250px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#071a3c] text-white shadow-[0_14px_35px_rgba(3,12,31,.28)] sm:min-h-[270px]">
        <img
          src="https://images.pexels.com/photos/35856106/pexels-photo-35856106.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Colorful Nairobi market stalls displaying African textiles and handcrafted goods"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06142d]/95 via-[#071c3e]/78 to-[#08234a]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06142d]/60 via-transparent to-[#06142d]/10" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[26px] border-cyan-200/10" />
        <div className="relative flex min-h-[250px] flex-col justify-between gap-6 p-5 sm:min-h-[270px] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#07172e]/65 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.17em] text-cyan-100 backdrop-blur">
              <Store size={13} /> Jumuiya · Community marketplace
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1.5 text-[9px] font-bold text-emerald-100 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Local exchange
            </span>
          </div>

          <div className="max-w-[590px]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100/85">Discover · Connect · Trade</p>
            <h1 className="mt-2 text-[27px] font-black leading-[1.08] tracking-tight text-white sm:text-[36px]">
              Local business. Shared opportunity.
            </h1>
            <p className="mt-2 max-w-[470px] text-xs leading-5 text-blue-50/90 sm:text-[13px]">
              Discover useful products, local services and skills from people building businesses across Jumuiya.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan-300 px-4 py-2.5 text-xs font-black text-[#08213c] shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 active:scale-[0.98]"
              >
                <Plus size={15} /> Sell or offer
              </button>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/90 backdrop-blur">
                Made useful by the community
              </span>
            </div>
          </div>

          <a href="https://www.pexels.com/photo/vibrant-nairobi-market-stalls-displaying-african-textiles-35856106/" target="_blank" rel="noreferrer" className="absolute bottom-2 right-3 text-[8px] font-medium text-white/55 transition hover:text-white/90">Photo by Enoch Wafula · Pexels</a>
          <div className="grid max-w-[500px] grid-cols-3 gap-3 border-t border-white/20 pt-3">
            <div>
              <p className="text-xl font-black leading-none text-white">{shortNumber(listings.length)}</p>
              <p className="mt-1 text-[9px] font-semibold text-blue-100/75">Active listings</p>
            </div>
            <div>
              <p className="text-xl font-black leading-none text-white">{new Set(listings.map((item) => item?.category).filter(Boolean)).size}</p>
              <p className="mt-1 text-[9px] font-semibold text-blue-100/75">Categories</p>
            </div>
            <div>
              <p className="text-xl font-black leading-none text-white">{listings.filter(isOwner).length}</p>
              <p className="mt-1 text-[9px] font-semibold text-blue-100/75">Your listings</p>
            </div>
          </div>
        </div>
      </section>
      {notice ? (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14} /></button>
        </div>
      ) : null}

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-black">Marketplace could not be refreshed.</p>
          <p className="mt-1 break-words">{loadError}</p>
          <button type="button" onClick={() => loadListings()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-rose-700 dark:bg-[#0d1729] dark:text-rose-300">
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0d1729] p-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search marketplace</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products, skills, services or places..."
              className="min-h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111e] pl-10 pr-10 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear marketplace search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              ><X size={13} /></button>
            ) : null}
          </label>
          <label className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#07111e] px-3 text-[10px] font-bold text-slate-400">
            <SlidersHorizontal size={13} className="text-cyan-300" />
            <span className="hidden sm:inline">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort marketplace listings"
              className="min-w-0 bg-transparent text-[10px] font-bold text-slate-200 outline-none"
            >
              <option value="newest" className="bg-[#0d1729]">Newest first</option>
              <option value="price-low" className="bg-[#0d1729]">Price: low to high</option>
              <option value="price-high" className="bg-[#0d1729]">Price: high to low</option>
            </select>
            <ChevronDown size={12} />
          </label>
          <button
            type="button"
            onClick={() => loadListings({ quiet: true })}
            disabled={refreshing || loading}
            aria-label="Refresh marketplace"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3.5 text-xs font-bold text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/[0.04] disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto border-b border-white/[0.07] pb-3 [scrollbar-width:none]">
          {[
            { value: "all", label: "Explore all", count: listings.length },
            { value: "mine", label: "Your listings", count: listings.filter(isOwner).length },
            { value: "free", label: "Free & exchange", count: listings.filter((item) => Number(item?.price) === 0).length },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={"inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[10px] font-extrabold transition " + (activeTab === tab.value ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white")}
            >
              {tab.label}
              <span className={"rounded-full px-1.5 py-0.5 text-[9px] " + (activeTab === tab.value ? "bg-white/15 text-white" : "bg-white/[0.07] text-slate-400")}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Filter size={13} className="shrink-0 text-cyan-300" />
          <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">Categories</span>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {CATEGORIES.map((category) => (
              <button
                key={category.value || "all"}
                type="button"
                aria-pressed={selectedCategory === category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={"shrink-0 rounded-full border px-3 py-2 text-[10px] font-bold transition " + (selectedCategory === category.value ? "border-cyan-300/40 bg-cyan-300 text-[#08213c] shadow-sm" : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:border-cyan-300/30 hover:text-white")}
              >
                {category.label}
              </button>
            ))}
          </div>
          {(selectedCategory || searchTerm || activeTab !== "all" || sortBy !== "newest") ? (
            <button
              type="button"
              onClick={() => { setSelectedCategory(""); setSearchTerm(""); setActiveTab("all"); setSortBy("newest"); }}
              className="shrink-0 text-[9px] font-bold text-cyan-300 hover:text-cyan-100"
            >Reset</button>
          ) : null}
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300">Find your next good thing</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">Browse community listings</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {loading
                ? "Looking for active listings…"
                : `${filteredListings.length} ${filteredListings.length === 1 ? "listing" : "listings"} to explore`}
              {!loading ? (
                <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] text-cyan-600 dark:text-cyan-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />
                  Live inventory
                </span>
              ) : null}
            </p>
          </div>
          <button type="button" onClick={openCreateForm} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-cyan-300 px-3 py-2 text-[11px] font-black text-[#08213c] transition hover:bg-cyan-200">
            <Plus size={14} />
            List something
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d1729] p-4">
                <div className="h-32 rounded-xl bg-[#162943]" />
                <div className="mt-4 h-4 w-2/3 rounded bg-[#162943]" />
                <div className="mt-3 h-3 w-full rounded bg-[#162943]" />
                <div className="mt-2 h-3 w-4/5 rounded bg-[#162943]" />
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
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[0.12] bg-[#0d1729] px-5 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
              <ShoppingBag size={23} />
            </div>
            <h3 className="mt-4 text-base font-black text-white">
              {hasMarketplaceFilters ? "No matching listings" : activeTab === "mine" ? "You have no active listings yet" : "Be the first to list something"}
            </h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
              {hasMarketplaceFilters
                ? "No listing matches these filters. Clear your filters or try another search to see more from the community."
                : "Share a useful product, skill or service. Your listing will be stored on the marketplace and available to the Community hub."}
            </p>
            <button type="button" onClick={() => {
              if (hasMarketplaceFilters) {
                setSearchTerm("");
                setSelectedCategory("");
                setActiveTab("all");
                setSortBy("newest");
              } else {
                openCreateForm();
              }
            }} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-[#08213c] transition hover:bg-cyan-200">
              {hasMarketplaceFilters ? "Clear filters" : "Create first listing"}
              <Plus size={14} />
            </button>
          </div>
        )}
      </section>

      <section className="rounded-[20px] border border-cyan-500/15 bg-gradient-to-br from-[#0b2346] to-[#0b354b] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-100">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white">A community-first exchange</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Check product details and agree on payment and delivery directly with the seller. When contact details are available, use the listing's built-in seller contact option; Marketplace does not pretend to provide instant checkout.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={openCreateForm}
        aria-label="Create a Marketplace listing"
        className="fixed bottom-[88px] right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-cyan-300 px-4 text-xs font-black text-[#08213c] shadow-[0_12px_28px_rgba(0,0,0,.32)] transition hover:-translate-y-0.5 hover:bg-cyan-200 lg:bottom-7 lg:right-7"
      >
        <Plus size={17} /> <span className="hidden sm:inline">Sell or offer</span><span className="sm:hidden">Sell</span>
      </button>

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
          <section role="dialog" aria-modal="true" aria-labelledby="remove-listing-title" className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-[#0d1729] sm:rounded-3xl sm:p-6">
            <h2 id="remove-listing-title" className="text-lg font-black text-slate-950 dark:text-white">Remove this listing?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              “{deleteCandidate?.title || "Your listing"}” will no longer appear in the active marketplace. This action can’t be undone from this screen.
            </p>
            {loadError ? <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-300">{loadError}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteCandidate(null)} disabled={Boolean(deletingId)} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-white/[0.08] dark:text-slate-300">Keep listing</button>
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
