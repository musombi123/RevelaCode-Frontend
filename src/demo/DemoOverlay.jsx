import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  ArrowLeft, ArrowRight, BookOpen, Bot, Check, ChevronDown, CircleHelp,
  Flag, GraduationCap, House, Languages, Leaf, Lightbulb, List, Pause,
  Play, RotateCcw, ShoppingBag, SkipForward, Sparkles, Sprout, Store,
  Users, Volume2, VolumeX, X,
} from "lucide-react";
import { useDemo } from "./DemoProvider.jsx";
import "./demo.css";

const ICONS = {
  sparkles: Sparkles, house: House, store: Store, sprout: Sprout,
  "graduation-cap": GraduationCap, "book-open": BookOpen, users: Users,
  bot: Bot, "user-round": CircleHelp, flag: Flag, layers: List,
};

const TEXT = {
  en: {
    demoMode: "Demo mode — nothing is saved",
    chapter: "Chapter",
    step: "Step",
    of: "of",
    back: "Back",
    next: "Next",
    nextChapter: "Next chapter",
    skip: "Skip chapter",
    exit: "Exit demo",
    chapters: "Chapters",
    benefits: "Benefits",
    tryIt: "Try it yourself",
    challenge: "Mini challenge",
    language: "Language",
    readAloud: "Read aloud",
    stopVoice: "Stop reading",
    exitQuestion: "Exit demo?",
    exitHelp: "Your progress is saved. You can resume later.",
    stay: "Keep exploring",
    confirmExit: "Exit demo",
    finish: "Demo complete",
    create: "Create free account",
    guest: "Continue as guest",
    restart: "Restart demo",
    rating: "How useful was this tour?",
    comment: "Optional comment",
    sendRating: "Send feedback",
    done: "Done",
    waiting: "Finding this part of the app…",
    centered: "This step is shown here because its page is still loading.",
    close: "Close",
  },
  sw: {
    demoMode: "Hali ya onyesho — hakuna kinachohifadhiwa",
    chapter: "Sura",
    step: "Hatua",
    of: "ya",
    back: "Rudi",
    next: "Endelea",
    nextChapter: "Sura inayofuata",
    skip: "Ruka sura",
    exit: "Toka kwenye onyesho",
    chapters: "Sura",
    benefits: "Faida",
    tryIt: "Jaribu mwenyewe",
    challenge: "Changamoto fupi",
    language: "Lugha",
    readAloud: "Soma kwa sauti",
    stopVoice: "Simamisha usomaji",
    exitQuestion: "Utoke kwenye onyesho?",
    exitHelp: "Maendeleo yako yamehifadhiwa. Unaweza kuendelea baadaye.",
    stay: "Endelea kuchunguza",
    confirmExit: "Toka kwenye onyesho",
    finish: "Onyesho limekamilika",
    create: "Fungua akaunti bila malipo",
    guest: "Endelea kama mgeni",
    restart: "Anza upya",
    rating: "Onyesho hili limekusaidia kwa kiasi gani?",
    comment: "Maoni (si lazima)",
    sendRating: "Tuma maoni",
    done: "Imekamilika",
    waiting: "Inatafuta sehemu hii ya programu…",
    centered: "Hatua hii inaonyeshwa hapa kwa sababu ukurasa bado unafunguka.",
    close: "Funga",
  },
};

function getRouteHub(route) {
  if (!route || route === "welcome") return null;
  const aliases = { elimu: "education", account: "profile" };
  return aliases[route] || route;
}

function localized(value, lang) {
  if (value && typeof value === "object") return value[lang] || value.en || "";
  return value || "";
}

function getFocusable(root) {
  if (!root) return [];
  return Array.from(root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'))
    .filter((node) => node.getAttribute("aria-hidden") !== "true" && node.offsetParent !== null);
}

export default function DemoOverlay() {
  const demo = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    active, chapterId, stepIndex, lang, voiceOn, chapters,
    next, back, skip, jumpToChapter, exit, setLang, setVoiceOn, restart, completed,
  } = demo;
  const [targetElement, setTargetElement] = useState(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingSent, setRatingSent] = useState(false);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const chapter = chapters.find((item) => item.id === chapterId) || chapters[0];
  const isFinish = chapterId === "finish";
  const step = chapter?.steps?.[stepIndex] || null;
  const t = TEXT[lang] || TEXT.en;
  const Icon = ICONS[chapter?.icon] || Sparkles;
  const isLastStep = Boolean(chapter?.steps?.length && stepIndex >= chapter.steps.length - 1);

  const routeHub = getRouteHub(step?.route);
  useEffect(() => {
    if (!active || !routeHub) return;
    const currentHub = new URLSearchParams(location.search).get("hub");
    if (location.pathname !== "/app" || currentHub !== routeHub) {
      navigate("/app?hub=" + encodeURIComponent(routeHub), { replace: false });
    }
  }, [active, routeHub, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!active) return undefined;
    previousFocusRef.current = document.activeElement;
    return undefined;
  }, [active]);

  useEffect(() => {
    if (!active || !step?.target || isFinish) {
      setTargetElement(null);
      setTargetMissing(false);
      return undefined;
    }
    let disposed = false;
    let observer = null;
    let timeoutId = null;
    const locate = () => {
      if (disposed) return;
      const found = document.querySelector('[data-demo="' + String(step.target).replace(/["\\]/g, "") + '"]');
      if (found) {
        setTargetElement(found);
        setTargetMissing(false);
        observer?.disconnect();
        if (timeoutId) window.clearTimeout(timeoutId);
        return;
      }
      setTargetElement(null);
    };
    locate();
    observer = new MutationObserver(locate);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    timeoutId = window.setTimeout(() => {
      if (disposed) return;
      locate();
      if (!document.querySelector('[data-demo="' + String(step.target).replace(/["\\]/g, "") + '"]')) setTargetMissing(true);
      observer?.disconnect();
    }, 3000);
    return () => {
      disposed = true;
      observer?.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [active, chapterId, stepIndex, step?.target, isFinish]);

  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!active || !targetElement) {
      setRect(null);
      return undefined;
    }
    const update = () => {
      if (!targetElement.isConnected) {
        setTargetElement(null);
        setRect(null);
        return;
      }
      const bounds = targetElement.getBoundingClientRect();
      setRect({ top: bounds.top, left: bounds.left, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    resizeObserver?.observe(targetElement);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      resizeObserver?.disconnect();
    };
  }, [active, targetElement]);

  useEffect(() => {
    if (!active || !step || step.action === "none" || !targetElement) return undefined;
    const onClick = (event) => {
      if (step.action === "click") next();
      if (step.action === "type") {
        const control = event.target;
        if (control && (control.matches?.("input,textarea") || control.isContentEditable)) {
          const currentValue = String(control.value || control.textContent || "");
          const expected = String(step.demoValue || "");
          if (expected ? currentValue.trim().toLowerCase() === expected.trim().toLowerCase() : currentValue.trim().length > 0) next();
        }
      }
    };
    const onInput = (event) => {
      if (step.action !== "type") return;
      const control = event.target;
      if (!control || !(control.matches?.("input,textarea") || control.isContentEditable)) return;
      const currentValue = String(control.value || control.textContent || "");
      const expected = String(step.demoValue || "");
      if (expected ? currentValue.trim().toLowerCase() === expected.trim().toLowerCase() : currentValue.trim().length > 0) next();
    };
    targetElement.addEventListener("click", onClick, true);
    targetElement.addEventListener("input", onInput, true);
    if (step.action === "type") {
      const input = targetElement.matches?.("input,textarea") ? targetElement : targetElement.querySelector("input,textarea");
      input?.focus();
    }
    return () => {
      targetElement.removeEventListener("click", onClick, true);
      targetElement.removeEventListener("input", onInput, true);
    };
  }, [active, step, targetElement, next]);

  useEffect(() => {
    if (!active) {
      setMenuOpen(false);
      setExitConfirm(false);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        window.requestAnimationFrame(() => {
          const launcher = document.querySelector("[data-demo-launcher]");
          (launcher || previousFocusRef.current)?.focus?.();
        });
      }
      return undefined;
    }
    window.requestAnimationFrame(() => getFocusable(dialogRef.current)[0]?.focus());
    return undefined;
  }, [active, chapterId, stepIndex]);

  useEffect(() => {
    if (!active || !step || !voiceOn || typeof window === "undefined" || !window.speechSynthesis) return undefined;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const desired = lang === "sw" ? "sw-KE" : "en-KE";
    const voice = voices.find((item) => item.lang.toLowerCase() === desired.toLowerCase()) ||
      voices.find((item) => item.lang.toLowerCase().startsWith(lang + "-"));
    if (!voice) return undefined;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(localized(step.title, lang) + ". " + localized(step.body, lang));
    utterance.voice = voice;
    utterance.lang = voice.lang;
    synth.speak(utterance);
    return () => synth.cancel();
  }, [active, chapterId, stepIndex, voiceOn, lang, step]);

  useEffect(() => {
    if (!active || Capacitor.getPlatform() !== "android") return undefined;
    let disposed = false;
    let listener = null;
    App.addListener("backButton", () => {
      const globalIndex = chapters.findIndex((item) => item.id === chapterId);
      if (globalIndex === 0 && stepIndex === 0) setExitConfirm(true);
      else back();
    }).then((registered) => {
      if (disposed) registered.remove();
      else listener = registered;
    }).catch(() => {});
    return () => { disposed = true; listener?.remove(); };
  }, [active, chapters, chapterId, stepIndex, back]);

  const onDialogKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (exitConfirm) setExitConfirm(false);
      else setExitConfirm(true);
      return;
    }
    if (event.key === "ArrowRight" && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === "ArrowLeft" && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) {
      event.preventDefault();
      back();
      return;
    }
    if (event.key === "Tab") {
      const items = getFocusable(dialogRef.current);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }, [exitConfirm, next, back]);

  const chapterIndex = Math.max(0, chapters.findIndex((item) => item.id === chapterId));
  const stepCount = chapter?.steps?.length || 0;
  const stepNumber = Math.min(stepIndex + 1, Math.max(1, stepCount));
  const completedStepCount = chapters.slice(0, chapterIndex).reduce((sum, item) => sum + (item.steps?.length || 0), 0) + Math.min(stepIndex, stepCount);
  const totalStepCount = chapters.reduce((sum, item) => sum + (item.steps?.length || 0), 0);
  const progress = totalStepCount ? Math.min(100, Math.round((completedStepCount / totalStepCount) * 100)) : 0;

  const handleExit = () => {
    exit();
    setExitConfirm(false);
  };

  const goCreateAccount = () => {
    exit();
    navigate("/login?mode=register");
  };

  const submitRating = () => {
    if (!rating) return;
    const analytics = window.revelacodeAnalytics || window.revelaAnalytics;
    if (analytics && typeof analytics.trackDemo === "function") {
      try { analytics.trackDemo("demo_rating", { rating, comment }); } catch {}
    }
    setRatingSent(true);
  };

  if (!active) return null;

  const panelStyle = rect && !targetMissing && !isFinish ? {
    top: Math.max(16, Math.min(window.innerHeight - 150, rect.top + rect.height + 14)),
    left: Math.max(12, Math.min(window.innerWidth - 420, rect.left)),
  } : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  const backdropStyle = { background: "rgba(2, 8, 23, .70)" };
  const titleText = localized(chapter?.title, lang);
  const bodyText = localized(step?.body, lang);

  return (
    <div className="rc-demo-layer" onKeyDown={onDialogKeyDown}>
      {rect && !targetMissing && !isFinish ? (
        <>
          <div className="rc-demo-mask" style={{ ...backdropStyle, top: 0, left: 0, right: 0, height: Math.max(0, rect.top - 6) }} />
          <div className="rc-demo-mask" style={{ ...backdropStyle, top: rect.bottom + 6, left: 0, right: 0, bottom: 0 }} />
          <div className="rc-demo-mask" style={{ ...backdropStyle, top: Math.max(0, rect.top - 6), left: 0, width: Math.max(0, rect.left - 6), height: rect.height + 12 }} />
          <div className="rc-demo-mask" style={{ ...backdropStyle, top: Math.max(0, rect.top - 6), left: rect.right + 6, right: 0, height: rect.height + 12 }} />
          <div className="rc-demo-spotlight" style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }} />
        </>
      ) : <div className="rc-demo-mask rc-demo-mask-full" style={backdropStyle} />}

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rc-demo-title"
        aria-describedby="rc-demo-body"
        className={"rc-demo-card " + (isFinish ? "rc-demo-finish" : "") + (!rect || targetMissing ? " rc-demo-centered" : "")}
        style={panelStyle}
      >
        <div className="rc-demo-topline">
          <span className="rc-demo-brand"><Icon size={17} aria-hidden="true" /> RevelaCode Demo</span>
          <span className="rc-demo-safe">{t.demoMode}</span>
          <button type="button" className="rc-demo-icon-button" aria-label={t.close} onClick={() => setExitConfirm(true)}><X size={18} /></button>
        </div>

        {!isFinish ? (
          <>
            <div className="rc-demo-progress-track" aria-hidden="true"><span style={{ width: progress + "%" }} /></div>
            <div className="rc-demo-meta">
              <span>{t.step} {stepNumber} {t.of} {stepCount || 1} — {titleText}</span>
              <div className="rc-demo-tools">
                <button type="button" className="rc-demo-text-button" onClick={() => setLang(lang === "en" ? "sw" : "en")} aria-label={t.language}><Languages size={16} /> {lang.toUpperCase()}</button>
                <button type="button" className="rc-demo-text-button" onClick={() => setVoiceOn(!voiceOn)} aria-pressed={voiceOn} aria-label={voiceOn ? t.stopVoice : t.readAloud}>{voiceOn ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
                <button type="button" className="rc-demo-text-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}><List size={16} /> {t.chapters}</button>
              </div>
            </div>

            {menuOpen ? (
              <nav className="rc-demo-chapter-menu" aria-label={t.chapters}>
                {chapters.filter((item) => item.id !== "finish").map((item, index) => (
                  <button key={item.id} type="button" onClick={() => { jumpToChapter(item.id); setMenuOpen(false); }} className="rc-demo-chapter-link">
                    <span className="rc-demo-chapter-number">{completed.includes(item.id) ? <Check size={14} /> : index + 1}</span>
                    <span>{localized(item.title, lang)}</span>
                    {item.id === chapterId ? <span className="rc-demo-current">●</span> : null}
                  </button>
                ))}
              </nav>
            ) : null}

            <div aria-live="polite" className="rc-demo-copy">
              <p className="rc-demo-eyebrow">{t.chapter} {chapterIndex + 1}</p>
              <h2 id="rc-demo-title">{localized(step?.title, lang)}</h2>
              <p id="rc-demo-body">{bodyText}</p>
              {targetMissing ? <p className="rc-demo-missing">{t.centered}</p> : !targetElement && step?.target ? <p className="rc-demo-missing">{t.waiting}</p> : null}
            </div>

            {isLastStep && chapter?.benefits?.length ? (
              <section className="rc-demo-benefits">
                <h3>{t.benefits}</h3>
                <ul>{chapter.benefits.slice(0, 3).map((benefit, index) => <li key={index}><Check size={15} /> {localized(benefit, lang)}</li>)}</ul>
              </section>
            ) : null}
            {isLastStep && chapter?.challenge ? (
              <p className="rc-demo-challenge"><strong>{t.challenge}:</strong> {localized(chapter.challenge, lang)}</p>
            ) : null}
          </>
        ) : (
          <div className="rc-demo-finish-content" aria-live="polite">
            <p className="rc-demo-eyebrow">{t.finish}</p>
            <h2 id="rc-demo-title">{localized(chapter.title, lang)}</h2>
            <p id="rc-demo-body">{localized(chapter.summary, lang)}</p>
            <div className="rc-demo-recap">
              {chapters.filter((item) => item.id !== "finish").map((item) => (
                <div key={item.id} className="rc-demo-recap-row">
                  <span className={completed.includes(item.id) ? "rc-demo-tick is-complete" : "rc-demo-tick"}>{completed.includes(item.id) ? <Check size={14} /> : "•"}</span>
                  <span>{localized(item.title, lang)}</span>
                </div>
              ))}
            </div>
            <section className="rc-demo-rating">
              <h3>{t.rating}</h3>
              <div className="rc-demo-stars" role="group" aria-label={t.rating}>
                {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={String(value) + " stars"} aria-pressed={rating === value} onClick={() => setRating(value)}>{rating >= value ? "★" : "☆"}</button>)}
              </div>
              <label className="rc-demo-comment">
                <span>{t.comment}</span>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={500} />
              </label>
              <button type="button" onClick={submitRating} disabled={!rating || ratingSent} className="rc-demo-secondary">{ratingSent ? t.done : t.sendRating}</button>
            </section>
            <div className="rc-demo-finish-actions">
              <button type="button" onClick={goCreateAccount} className="rc-demo-primary">{t.create}</button>
              <button type="button" onClick={handleExit} className="rc-demo-secondary">{t.guest}</button>
              <button type="button" onClick={restart} className="rc-demo-secondary"><RotateCcw size={16} /> {t.restart}</button>
            </div>
          </div>
        )}

        {exitConfirm ? (
          <div className="rc-demo-confirm" role="alertdialog" aria-labelledby="rc-demo-exit-title">
            <h3 id="rc-demo-exit-title">{t.exitQuestion}</h3>
            <p>{t.exitHelp}</p>
            <div>
              <button type="button" className="rc-demo-secondary" onClick={() => setExitConfirm(false)}>{t.stay}</button>
              <button type="button" className="rc-demo-primary" onClick={handleExit}>{t.confirmExit}</button>
            </div>
          </div>
        ) : null}

        {!isFinish ? (
          <footer className="rc-demo-actions">
            <button type="button" className="rc-demo-secondary" onClick={back} disabled={chapterIndex === 0 && stepIndex === 0}><ArrowLeft size={16} /> {t.back}</button>
            <button type="button" className="rc-demo-text-button" onClick={skip}><SkipForward size={15} /> {t.skip}</button>
            <button type="button" className="rc-demo-primary" onClick={next}>{isLastStep ? t.nextChapter : t.next} <ArrowRight size={16} /></button>
            <button type="button" className="rc-demo-text-button" onClick={() => setExitConfirm(true)}>{t.exit}</button>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
