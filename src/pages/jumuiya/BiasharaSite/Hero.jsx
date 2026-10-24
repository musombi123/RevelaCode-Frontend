import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react";
import {
  HERO_ROTATE_MS,
  contrastColor,
  isDirectVideo,
  safeHttpsMedia,
  usePrefersReducedMotion,
  videoEmbedUrl,
} from "./utils.jsx";

function VideoFrame({ url, title }) {
  const safeUrl = safeHttpsMedia(url);
  if (!safeUrl) return null;
  const embed = videoEmbedUrl(safeUrl);
  if (embed) {
    return (
      <iframe
        src={embed}
        title={title || "Business video"}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full border-0 bg-slate-950"
      />
    );
  }
  if (isDirectVideo(safeUrl)) {
    return <video src={safeUrl} title={title || "Business video"} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full bg-slate-950 object-contain" />;
  }
  return (
    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-6 text-center text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10"><Play size={22} fill="currentColor" /></span>
      <span className="text-sm font-bold">Open featured video</span>
      <span className="text-xs text-white/60">The video opens in a new tab.</span>
    </a>
  );
}

function AnimatedStat({ value, label, primary }) {
  const nodeRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const numericValue = Math.max(0, Number(value) || 0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setStarted(true);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!started) return undefined;
    if (reducedMotion || numericValue === 0) {
      setShown(numericValue);
      return undefined;
    }
    let frame = 0;
    const steps = 18;
    const timer = window.setInterval(() => {
      frame += 1;
      const eased = 1 - Math.pow(1 - frame / steps, 3);
      setShown(Math.min(numericValue, Math.round(numericValue * eased)));
      if (frame >= steps) window.clearInterval(timer);
    }, 36);
    return () => window.clearInterval(timer);
  }, [started, numericValue, reducedMotion]);

  return (
    <div ref={nodeRef} className="min-w-0 px-2 py-3 text-center sm:px-3">
      <p className="text-xl font-black tracking-tight text-white sm:text-2xl" style={{ color: "#ffffff", textShadow: "0 1px 8px " + primary + "40" }}>{shown}</p>
      <p className="mt-1 text-[9px] font-semibold leading-4 text-white/65 sm:text-[10px]">{label}</p>
    </div>
  );
}

export default function Hero({
  business = {},
  website = {},
  slides = [],
  index = 0,
  setIndex = () => {},
  heroImage = "",
  heroVideo = "",
  productCount = 0,
  serviceCount = 0,
  mediaCount = 0,
  socialCount = 0,
  canContact = true,
  whatsappDigits = "",
  primary = "#1d4ed8",
  accent = "#0f766e",
  theme,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStart = useRef(null);
  const slideCount = Math.max(1, slides.length);
  const slide = slides[index] || slides[0] || {};
  const safeWhatsApp = /^\d{7,15}$/.test(whatsappDigits) ? "https://wa.me/" + whatsappDigits : "";
  const location = [business.location, business.county].filter((part) => String(part || "").trim()).join(", ");
  const title = slide.title || website.headline || business.name || "Welcome";
  const subtitle = slide.subtitle || website.tagline || "";
  const activeImage = heroImage || safeHttpsMedia(slide.image_url);
  const activeVideo = heroVideo || slide.video_url;

  useEffect(() => {
    setProgress(0);
  }, [index, slideCount]);

  useEffect(() => {
    if (paused || reducedMotion || slideCount < 2) return undefined;
    const increment = 100 / (HERO_ROTATE_MS / 100);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + increment));
    }, 100);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, setIndex, slideCount]);

  useEffect(() => {
    if (progress < 100 || paused || reducedMotion || slideCount < 2) return;
    setProgress(0);
    setIndex((currentIndex) => (currentIndex + 1) % slideCount);
  }, [progress, paused, reducedMotion, setIndex, slideCount]);

  const move = (direction) => {
    if (slideCount < 2) return;
    setProgress(0);
    setIndex((current) => (current + direction + slideCount) % slideCount);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  const onTouchStart = (event) => {
    touchStart.current = event.touches?.[0]?.clientX ?? null;
  };
  const onTouchEnd = (event) => {
    if (touchStart.current === null || slideCount < 2) return;
    const endX = event.changedTouches?.[0]?.clientX;
    if (typeof endX === "number") {
      const delta = endX - touchStart.current;
      if (Math.abs(delta) > 48) move(delta > 0 ? -1 : 1);
    }
    touchStart.current = null;
  };
  const resumeFocus = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };

  return (
    <section
      aria-label="Business introduction"
      className="relative isolate overflow-hidden text-white"
      style={{ background: (theme?.heroGradient || "linear-gradient(125deg, " + primary + ", " + accent + ")") }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={resumeFocus}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-90" style={{ background: theme?.aurora || "radial-gradient(circle at 12% 10%, " + accent + " 0, transparent 45%)" }} />
      {activeImage ? (
        <img
          key={activeImage}
          src={activeImage}
          alt={slide.alt || ""}
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
        />
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(2,6,23,.82)_0%,rgba(2,6,23,.66)_50%,rgba(2,6,23,.56)_100%)]" />
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 md:pt-20 lg:grid-cols-[minmax(0,1.06fr)_minmax(330px,.94fr)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="mx-auto w-full max-w-3xl text-center lg:mx-0 lg:text-left">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.09] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/85 shadow-sm backdrop-blur sm:text-xs">
            <Sparkles size={14} aria-hidden="true" />
            <span className="truncate">{business.category || business.business_type || "Discover this business"}</span>
          </div>
          <h1 key={title} className="mt-6 break-words text-[2.45rem] font-semibold leading-[1.04] tracking-[-.055em] sm:text-6xl md:text-7xl lg:text-[4.65rem] xl:text-[5rem]">
            {title}
          </h1>
          {subtitle ? <p className="mx-auto mt-6 max-w-2xl break-words text-base leading-7 text-white/78 sm:text-lg sm:leading-8 lg:mx-0">{subtitle}</p> : (
            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/72 sm:text-base lg:mx-0">Explore this business, learn what it offers, and get in touch when you are ready.</p>
          )}
          {location ? (
            <p className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-white/75 sm:text-sm lg:justify-start">
              <MapPin size={15} aria-hidden="true" /> <span className="break-words">{location}</span>
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {productCount > 0 && website.show_products !== false ? (
              <a href="#products" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_35px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 motion-reduce:transform-none">
                Explore products <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
              </a>
            ) : null}
            {canContact ? (
              <a href="#contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-white/55 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Let's talk <ArrowUpRight size={16} />
              </a>
            ) : null}
            {safeWhatsApp ? (
              <a href={safeWhatsApp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transform-none" style={{ backgroundColor: accent, color: theme?.accentInk || contrastColor(accent) }}>
                <MessageCircle size={17} /> WhatsApp
              </a>
            ) : null}
          </div>

          {slideCount > 1 ? (
            <div className="mx-auto mt-9 flex max-w-xl items-center gap-3 lg:mx-0">
              <button type="button" onClick={() => move(-1)} aria-label="Previous hero slide" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/[0.08] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <ChevronLeft size={19} />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {slides.map((item, slideIndex) => (
                  <button key={slideIndex} type="button" onClick={() => { setIndex(slideIndex); setProgress(0); }} aria-label={"Go to slide " + (slideIndex + 1)} aria-current={slideIndex === index ? "true" : undefined} className="group min-w-0 flex-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <span className="block h-1 overflow-hidden rounded-full bg-white/30">
                      <span className="block h-full rounded-full bg-white transition-[width] duration-100" style={{ width: slideIndex === index ? progress + "%" : slideIndex < index ? "100%" : "0%" }} />
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => move(1)} aria-label="Next hero slide" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/[0.08] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <ChevronRight size={19} />
              </button>
              <span className="sr-only" aria-live="polite">Slide {index + 1} of {slideCount}{paused ? ", paused" : ""}</span>
            </div>
          ) : null}
          <a href="#about" className="mx-auto mt-9 inline-flex items-center gap-2 text-xs font-semibold text-white/60 transition hover:text-white lg:mx-0">
            <ArrowDown size={14} /> Discover more
          </a>
        </div>

        <div className="mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2.25rem] opacity-60 blur-2xl" style={{ background: "linear-gradient(130deg, " + accent + "55, " + primary + "33)" }} />
            <div className="relative rounded-[2rem] border border-white/20 bg-white/[0.09] p-2.5 shadow-[0_30px_90px_rgba(0,0,0,.3)] backdrop-blur-xl sm:p-3">
              <div className="relative aspect-[4/4.5] min-h-[260px] overflow-hidden rounded-[1.45rem] bg-slate-950 sm:aspect-[4/4.2] sm:min-h-[360px]">
                {activeVideo ? (
                  <VideoFrame url={activeVideo} title={(business.name || "Business") + " featured video"} />
                ) : activeImage ? (
                  <img
                    key={activeImage + "-card"}
                    src={activeImage}
                    alt={slide.alt || (business.name || "Business") + " featured image"}
                    decoding="async"
                    className={"absolute inset-0 h-full w-full object-cover " + (reducedMotion ? "" : "biashara-kenburns")}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,.18),transparent_40%),linear-gradient(145deg,rgba(15,23,42,.94),rgba(2,6,23,.98))] p-7 text-center sm:p-10">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/15 bg-white/10 text-white shadow-xl"><Globe size={28} /></span>
                    <p className="mt-5 max-w-sm break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">{business.name || "Your business"}</p>
                    {website.tagline ? <p className="mt-3 max-w-xs break-words text-sm leading-6 text-white/65">{website.tagline}</p> : null}
                    <span className="mt-6 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-white/60">Business showcase</span>
                  </div>
                )}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                  <div className="min-w-0">
                    {location ? <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/75"><MapPin size={13} />{location}</p> : null}
                    <p className="max-w-md break-words text-lg font-bold tracking-tight text-white sm:text-xl">{business.name || "A local business"}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.15em] text-white/55">{business.category || business.business_type || "Featured"}</p>
                  </div>
                  {slideCount > 1 ? <span className="shrink-0 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-[10px] font-bold text-white backdrop-blur">{String(index + 1).padStart(2, "0")} <span className="text-white/45">/ {String(slideCount).padStart(2, "0")}</span></span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/10 backdrop-blur sm:grid-cols-4">
            <AnimatedStat value={productCount} label="Products" primary={primary} />
            <AnimatedStat value={serviceCount} label="Services" primary={primary} />
            <AnimatedStat value={mediaCount} label="Media" primary={primary} />
            <AnimatedStat value={socialCount} label="Social links" primary={primary} />
          </div>
          <p className="mt-3 text-center text-[10px] font-medium text-white/45 sm:text-xs">Swipe to explore the showcase · More details below</p>
        </div>
      </div>
      <style>{'@keyframes biashara-kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.075); } } .biashara-kenburns { animation: biashara-kenburns 24s ease-in-out alternate infinite; } @media (prefers-reduced-motion: reduce) { .biashara-kenburns { animation: none !important; } }'}</style>
    </section>
  );
}
