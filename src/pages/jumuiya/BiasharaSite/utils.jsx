import React, { useEffect, useRef, useState } from "react";

export const HERO_ROTATE_MS = 30000;

const DEFAULT_PRIMARY = "#1d4ed8";
const DEFAULT_ACCENT = "#0f766e";

function normalizeHex(value, fallback) {
  const raw = String(value || "").trim();
  const match = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return fallback;
  const digits = match[1].length === 3
    ? match[1].split("").map((part) => part + part).join("")
    : match[1];
  return "#" + digits.toLowerCase();
}

export function safeHttpsMedia(value) {
  const raw = String(value || "").trim();
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function isDirectVideo(value) {
  try {
    const safe = safeHttpsMedia(value);
    if (!safe || safe.startsWith("data:")) return false;
    return /\.(?:mp4|webm|ogg)$/i.test(new URL(safe).pathname);
  } catch {
    return false;
  }
}

export function videoEmbedUrl(value) {
  try {
    const safe = safeHttpsMedia(value);
    if (!safe) return "";
    const url = new URL(safe);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1] || "";
    }
    if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0";
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const match = url.pathname.match(/\/(?:video\/)?(\d{5,})/);
      if (match) return "https://player.vimeo.com/video/" + match[1];
    }
    return "";
  } catch {
    return "";
  }
}

export function formatPrice(value, currency) {
  const code = String(currency || "KES").toUpperCase();
  const amount = Number(value);
  if (!Number.isFinite(amount)) return code + " —";
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return code + " " + amount.toLocaleString("en-KE");
  }
}

export function hexToRgba(hex, alpha = 1) {
  const normalized = normalizeHex(hex, DEFAULT_PRIMARY).slice(1);
  const number = parseInt(normalized, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  const opacity = Math.max(0, Math.min(1, Number(alpha)));
  return "rgba(" + red + ", " + green + ", " + blue + ", " + opacity + ")";
}

function relativeLuminance(hex) {
  const normalized = normalizeHex(hex, DEFAULT_PRIMARY).slice(1);
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastColor(hex) {
  return relativeLuminance(hex) > 0.42 ? "#111827" : "#ffffff";
}

export function readableBrandText(hex) {
  const luminance = relativeLuminance(hex);
  const contrastAgainstWhite = 1.05 / (luminance + 0.05);
  return contrastAgainstWhite >= 4.5 ? normalizeHex(hex, DEFAULT_PRIMARY) : "#334155";
}

export function createBrandTheme(primaryValue, accentValue) {
  const primary = normalizeHex(primaryValue, DEFAULT_PRIMARY);
  const accent = normalizeHex(accentValue, DEFAULT_ACCENT);
  return {
    primary,
    accent,
    primaryInk: contrastColor(primary),
    accentInk: contrastColor(accent),
    primaryTextOnLight: readableBrandText(primary),
    accentTextOnLight: readableBrandText(accent),
    primarySoft: hexToRgba(primary, 0.075),
    primaryBorder: hexToRgba(primary, 0.2),
    primaryGlow: hexToRgba(primary, 0.24),
    accentSoft: hexToRgba(accent, 0.1),
    heroGradient: "linear-gradient(125deg, " + hexToRgba(primary, 0.98) + " 0%, " + hexToRgba(primary, 0.87) + " 48%, " + hexToRgba(accent, 0.86) + " 100%)",
    aurora: "radial-gradient(circle at 10% 10%, " + hexToRgba(accent, 0.42) + " 0, transparent 38%), radial-gradient(circle at 90% 20%, " + hexToRgba(primary, 0.4) + " 0, transparent 40%)",
  };
}

export function safeTelephoneHref(value) {
  const raw = String(value || "").trim();
  const compact = raw.replace(/[^\d+]/g, "");
  if (!compact || !/^\+?\d{5,20}$/.test(compact)) return "";
  return "tel:" + compact;
}

export function safeEmailHref(value) {
  const raw = String(value || "").trim();
  if (raw.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(raw)) return "";
  return "mailto:" + encodeURIComponent(raw).replace(/%40/gi, "@").replace(/%2E/gi, ".");
}

export function normalizeOpeningHours(openingHours) {
  if (!openingHours || typeof openingHours !== "object" || Array.isArray(openingHours)) return [];
  const dayNames = {
    monday: "Monday", mon: "Monday",
    tuesday: "Tuesday", tue: "Tuesday", tues: "Tuesday",
    wednesday: "Wednesday", wed: "Wednesday",
    thursday: "Thursday", thu: "Thursday", thur: "Thursday", thurs: "Thursday",
    friday: "Friday", fri: "Friday",
    saturday: "Saturday", sat: "Saturday",
    sunday: "Sunday", sun: "Sunday",
  };
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return Object.entries(openingHours)
    .map(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().replace(/[_\s-]+/g, "");
      const day = dayNames[normalizedKey] || String(key).replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      let hours = "";
      let closed = false;
      if (typeof value === "string" || typeof value === "number") {
        hours = String(value).trim();
        closed = /^closed|^off$/i.test(hours);
      } else if (value && typeof value === "object") {
        closed = value.closed === true;
        hours = closed ? "Closed" : [value.open, value.close].filter(Boolean).join(" – ");
        if (value.open_24_hours === true || value.always_open === true) hours = "Open 24 hours";
      }
      return { key: normalizedKey, day, hours, closed, source: value };
    })
    .filter((entry) => entry.hours)
    .sort((a, b) => {
      const ai = dayOrder.indexOf(a.day);
      const bi = dayOrder.indexOf(b.day);
      if (ai < 0 && bi < 0) return a.day.localeCompare(b.day);
      if (ai < 0) return 1;
      if (bi < 0) return -1;
      return ai - bi;
    });
}

function parseClock(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const period = match[3];
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === "am" && hour === 12) hour = 0;
    if (period === "pm" && hour !== 12) hour += 12;
  }
  return hour * 60 + minute;
}

function getRangeFromHours(entry) {
  if (!entry || entry.closed || /^(?:closed|off)$/i.test(String(entry.hours || "").trim())) return null;
  if (/24\s*hours|always open/i.test(String(entry.hours || ""))) return { open: 0, close: 1440, overnight: false };
  const raw = entry.source && typeof entry.source === "object"
    ? String(entry.source.open || "") + " – " + String(entry.source.close || "")
    : String(entry.hours || "");
  const matches = raw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/ig);
  if (!matches || matches.length < 2) return null;
  const open = parseClock(matches[0]);
  const close = parseClock(matches[1]);
  if (open === null || close === null) return null;
  return { open, close, overnight: close <= open };
}

function getDayKey(date) {
  const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return keys[date.getDay()];
}

export function getOpeningStatus(openingHours, date = new Date()) {
  const entries = normalizeOpeningHours(openingHours);
  if (!entries.length) return { label: "Hours not listed", isOpen: null, todayKey: getDayKey(date), todayHours: "" };

  const todayKey = getDayKey(date);
  const today = entries.find((entry) => entry.key === todayKey || entry.day.toLowerCase() === todayKey);
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const todayRange = getRangeFromHours(today);

  if (todayRange) {
    const isOpen = todayRange.overnight
      ? nowMinutes >= todayRange.open || nowMinutes < todayRange.close
      : nowMinutes >= todayRange.open && nowMinutes < todayRange.close;
    if (isOpen) return { label: "Open now", isOpen: true, todayKey, todayHours: today?.hours || "" };
  }

  const yesterdayDate = new Date(date.getTime());
  yesterdayDate.setDate(date.getDate() - 1);
  const yesterdayKey = getDayKey(yesterdayDate);
  const yesterday = entries.find((entry) => entry.key === yesterdayKey || entry.day.toLowerCase() === yesterdayKey);
  const yesterdayRange = getRangeFromHours(yesterday);
  if (yesterdayRange?.overnight && nowMinutes < yesterdayRange.close) {
    return { label: "Open now", isOpen: true, todayKey, todayHours: today?.hours || "" };
  }

  if (today && /^closed|^off$/i.test(today.hours)) {
    return { label: "Closed today", isOpen: false, todayKey, todayHours: today.hours };
  }
  if (!todayRange) return { label: today?.hours ? "Hours available" : "Hours not listed", isOpen: null, todayKey, todayHours: today?.hours || "" };
  return { label: "Closed now", isOpen: false, todayKey, todayHours: today?.hours || "" };
}

export function formatBusinessLocation(business) {
  return [business?.location, business?.county].filter((part) => String(part || "").trim()).join(", ");
}

export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    if (media.matches || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible || reduceMotion ? 1 : 0,
        transform: visible || reduceMotion ? "translate3d(0, 0, 0)" : "translate3d(0, 16px, 0)",
        transition: reduceMotion ? "none" : "opacity 600ms ease, transform 600ms cubic-bezier(.2,.7,.2,1)",
        transitionDelay: reduceMotion ? "0ms" : Math.max(0, delay) + "ms",
      }}
    >
      {children}
    </Tag>
  );
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);
  return reduced;
}

export function SectionEyebrow({ children, primary, className = "" }) {
  return (
    <p className={"text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs " + className} style={{ color: primary }}>
      {children}
    </p>
  );
}
