import React from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  GraduationCap,
  Layers3,
  Menu,
  Moon,
  ShieldCheck,
  Smartphone,
  Sprout,
  Store,
  Sun,
  Users,
  X,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../components/hooks/useTheme.jsx";
import "./PlatformWelcomePage.css";

const ANDROID_RELEASES_URL =
  "https://github.com/musombi123/RevelaCode-Frontend/releases";

const ANDROID_DOWNLOAD_URL =
  String(import.meta.env.VITE_ANDROID_APK_URL || "").trim() ||
  ANDROID_RELEASES_URL;

const capabilities = [
  {
    title: "One connected ecosystem",
    description: "Business, agriculture, education and community tools in one place.",
  },
  {
    title: "Built for real work",
    description: "Practical digital workflows, with AI and offline support across the ecosystem.",
  },
  {
    title: "Choose how you access it",
    description: "Use the Android app on your phone or continue in your browser.",
  },
];

const sectors = [
  {
    key: "education",
    name: "Elimu",
    category: "Education",
    description: "Discover school tools, learning resources and education workflows.",
    icon: GraduationCap,
    tone: "emerald",
    href: "/explore/education",
  },
  {
    key: "shamba",
    name: "Shamba",
    category: "Agriculture",
    description: "Explore farming tools, crop planning and market information.",
    icon: Sprout,
    tone: "emerald",
    href: "/explore/shamba",
  },
  {
    key: "biashara",
    name: "Biashara",
    category: "Business",
    description: "Preview business tools for products, sales and operations.",
    icon: Store,
    tone: "blue",
    href: "/explore/biashara",
  },
  {
    key: "community",
    name: "Community",
    category: "Communities · Jumuiya",
    description: "Explore people, groups, discussions and shared opportunities.",
    icon: Users,
    tone: "blue",
    href: "/explore/community",
  },
];

const faqs = [
  {
    q: "Can I explore RevelaCode without creating an account?",
    a: "Yes. Select any hub and choose Explore as guest. RevelaCode opens that hub in a guest session. Some actions that require an account, ownership, verification or payment remain unavailable until you sign in.",
  },
  {
    q: "Which hubs can I explore?",
    a: "You can open Faith & Scripture, Elimu, Shamba, Biashara and Community directly from this page. Each card takes you to its corresponding dashboard.",
  },
  {
    q: "Will guest access let me manage a school, farm or business?",
    a: "Guest access is for exploring the platform. Managing private records, school operations, farm data, business transactions or other owner-only functions requires the appropriate account and permissions.",
  },
  {
    q: "Can I switch to my account later?",
    a: "Yes. Use the sign-in option inside the application to access your account. Your account permissions and verification status determine which protected features are available.",
  },
  {
    q: "Should I use the Android app or the web app?",
    a: "Both provide access to the RevelaCode ecosystem. Use the web app in your browser, or download the Android app for phone access. The Android download link opens the official Releases page unless a direct APK URL has been configured.",
  },
];

const greetingWords = ["Karibu", "Welcome", "Bienvenue", "Willkommen"];

function NetworkBackdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        className="text-blue-500/30"
      >
        <path className="welcome-network-line" d="M95 125 L260 205 L410 110 L595 205 L790 105 L1005 205" />
        <path className="welcome-network-line" d="M260 205 L315 390 L520 465 L720 355 L910 420 L1090 315" />
        <path className="welcome-network-line" d="M410 110 L520 465" />
        <path className="welcome-network-line" d="M595 205 L720 355 L1005 205" />
        <path className="welcome-network-line" d="M790 105 L910 420" />
        <path className="welcome-network-line" d="M95 125 L315 390" />
      </g>
      <g>
        <circle className="welcome-network-node welcome-node-one fill-blue-500" cx="95" cy="125" r="4.5" />
        <circle className="welcome-network-node welcome-node-two fill-emerald-500" cx="260" cy="205" r="5" />
        <circle className="welcome-network-node welcome-node-three fill-blue-500" cx="410" cy="110" r="4.5" />
        <circle className="welcome-network-node welcome-node-four fill-emerald-500" cx="595" cy="205" r="5" />
        <circle className="welcome-network-node welcome-node-five fill-amber-400" cx="790" cy="105" r="5" />
        <circle className="welcome-network-node welcome-node-six fill-blue-500" cx="1005" cy="205" r="5" />
        <circle className="welcome-network-node welcome-node-seven fill-emerald-500" cx="720" cy="355" r="5" />
        <circle className="welcome-network-node welcome-node-eight fill-blue-500" cx="1090" cy="315" r="4.5" />
      </g>
    </svg>
  );
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}

function ProductCard({ product }) {
  const ProductIcon = product.icon;
  const colorClasses =
    product.tone === "blue"
      ? {
          tile: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
          hover: "hover:border-blue-500",
          check: "text-blue-600 dark:text-blue-400",
          link: "text-blue-700 dark:text-blue-400",
        }
      : {
          tile: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
          hover: "hover:border-emerald-500",
          check: "text-emerald-600 dark:text-emerald-400",
          link: "text-emerald-700 dark:text-emerald-400",
        };

  return (
    <article
      className={
        "group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-7 " +
        colorClasses.hover
      }
    >
      <div className="flex items-start justify-between gap-4">
        <span className={"grid h-12 w-12 shrink-0 place-items-center rounded-xl " + colorClasses.tile}>
          <ProductIcon size={23} strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
          RevelaCode ecosystem · Connected
        </span>
      </div>
      <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
        {product.name}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
        {product.description}
      </p>
      <ul className="mt-5 space-y-3">
        {product.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <Check size={16} className={"mt-1 shrink-0 " + colorClasses.check} aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href={product.href}
        className={"mt-auto inline-flex min-h-11 items-center gap-2 pt-6 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " + colorClasses.link}
      >
        {product.cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </a>
    </article>
  );
}

function SectorCard({ sector }) {
  const SectorIcon = sector.icon;
  const isEmerald = sector.tone === "emerald";

  return (
    <a
      href={sector.href}
      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-500 sm:p-6"
      aria-label={"Explore " + sector.name + " as a guest"}
    >
      <span className={"grid h-11 w-11 place-items-center rounded-xl " + (isEmerald ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400")}>
        <SectorIcon size={21} aria-hidden="true" />
      </span>
      <span className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
        {sector.category}
      </span>
      <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
        {sector.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {sector.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400">
        Explore as guest <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </a>
  );
}

export default function PlatformWelcomePage() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [greetingIndex, setGreetingIndex] = React.useState(0);
  const [greetingVisible, setGreetingVisible] = React.useState(true);

  React.useEffect(() => {
    const query = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    if (query?.matches) return undefined;

    let swapTimer = null;
    const interval = window.setInterval(() => {
      setGreetingVisible(false);
      if (swapTimer) window.clearTimeout(swapTimer);
      swapTimer = window.setTimeout(() => {
        setGreetingIndex((current) => (current + 1) % greetingWords.length);
        setGreetingVisible(true);
      }, 350);
    }, 2400);

    return () => {
      window.clearInterval(interval);
      if (swapTimer) window.clearTimeout(swapTimer);
    };
  }, []);

  React.useEffect(() => {
    const query = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const revealNodes = Array.from(document.querySelectorAll(".welcome-reveal"));

    if (query?.matches || typeof IntersectionObserver === "undefined") {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    revealNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (theme !== "system" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    query.addListener?.(sync);
    return () => query.removeListener?.(sync);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    setIsDark(nextTheme === "dark");
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const products = [
    {
      name: "RevelaAI",
      description: "Intelligence across your workflow.",
      icon: Sparkles,
      tone: "blue",
      href: "/app",
      cta: "Explore RevelaAI",
      features: [
        "AI-powered technology",
        "Practical software and tools built around real needs",
        "Part of the connected RevelaCode ecosystem",
      ],
    },
    {
      name: "Jumuiya OS",
      description: "One connected ecosystem for the tools you need.",
      icon: Layers3,
      tone: "emerald",
      href: "#sectors",
      cta: "Explore the hubs",
      features: [
        "Business, agriculture, education and community tools in one place",
        "Practical digital workflows, with AI and offline support across the ecosystem",
        "Use the Android app on your phone or continue in your browser",
      ],
    },
  ];

  return (
    <div className="revelacode-homepage min-h-screen overflow-x-clip bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-white">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <a href="/" aria-label="RevelaCode home" className="inline-flex shrink-0 items-center text-xl font-extrabold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="text-slate-950 dark:text-white">Revela</span><span className="text-emerald-600 dark:text-emerald-400">Code</span>
          </a>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
            <a href="#products" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-400">Products</a>
            <a href="#sectors" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-400">Sectors</a>
            <a href="#impact" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-400">Impact</a>
            <a href="#contact" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:text-blue-400">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="/app" className="welcome-cta-sheen hidden min-h-10 items-center justify-center gap-2 overflow-hidden rounded-full bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:inline-flex">
              Open web app <ArrowRight size={15} aria-hidden="true" />
            </a>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="welcome-mobile-menu"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
            >
              {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div
          id="welcome-mobile-menu"
          aria-hidden={!mobileOpen}
          className={"welcome-mobile-menu border-t border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 md:hidden " + (mobileOpen ? "is-open" : "")}
        >
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl gap-1 py-3">
            <a onClick={closeMobileMenu} tabIndex={mobileOpen ? 0 : -1} href="#products" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-900">Products</a>
            <a onClick={closeMobileMenu} tabIndex={mobileOpen ? 0 : -1} href="#sectors" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-900">Sectors</a>
            <a onClick={closeMobileMenu} tabIndex={mobileOpen ? 0 : -1} href="#impact" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-900">Impact</a>
            <a onClick={closeMobileMenu} tabIndex={mobileOpen ? 0 : -1} href="#contact" className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-900">Contact</a>
            <a onClick={closeMobileMenu} tabIndex={mobileOpen ? 0 : -1} href="/app" className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Open web app <ArrowRight size={15} aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">\n      <section className="welcome-hero relative isolate overflow-hidden bg-white dark:bg-slate-950">
        <div aria-hidden="true" className="welcome-dot-grid pointer-events-none absolute inset-0 text-slate-300 dark:text-slate-800" />
        <div aria-hidden="true" className="welcome-grid-mask pointer-events-none absolute inset-0">
          <NetworkBackdrop />
        </div>

        <div className="relative mx-auto flex min-h-[650px] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[700px] sm:px-6 sm:py-24 lg:px-8">
          <p
            className="welcome-entrance mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400"
            style={{ "--welcome-delay": "0s" }}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={"welcome-greeting " + (greetingVisible ? "" : "is-hidden")}>{greetingWords[greetingIndex]}</span>
          </p>

          <div className="welcome-entrance mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300" style={{ "--welcome-delay": "0.15s" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            </span>
            A smarter way to move forward
          </div>

          <h1 className="max-w-5xl text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-950 dark:text-white sm:text-6xl">
            <span className="welcome-entrance inline-block" style={{ "--welcome-delay": "0.3s" }}>Code.</span>{" "}
            <span className="welcome-entrance inline-block text-blue-600 dark:text-blue-400" style={{ "--welcome-delay": "0.5s" }}>Innovate.</span>{" "}
            <span className="welcome-entrance inline-block text-emerald-600 dark:text-emerald-400" style={{ "--welcome-delay": "0.7s" }}>Transform.</span>
          </h1>

          <p className="welcome-entrance mt-7 text-base font-semibold text-slate-700 dark:text-slate-200 sm:text-lg" style={{ "--welcome-delay": "0.95s" }}>
            Your ideas deserve better technology.
          </p>
          <p className="welcome-entrance mt-3 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg" style={{ "--welcome-delay": "0.95s" }}>
            Welcome to RevelaCode. Explore a connected digital ecosystem for business, agriculture, education and communities — powered by practical software, AI and tools built around real needs.
          </p>

          <div className="welcome-entrance mt-9 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row" style={{ "--welcome-delay": "1.15s" }}>
            <a
              href={ANDROID_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="welcome-cta-sheen inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download size={18} aria-hidden="true" />
              Download Android app
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a
              href="/app"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <Smartphone size={18} aria-hidden="true" />
              Continue to web app
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>

          <p className="welcome-entrance mt-4 max-w-xl text-xs leading-6 text-slate-500 dark:text-slate-400" style={{ "--welcome-delay": "1.25s" }}>
            Android downloads open the official Releases page unless a direct APK URL is configured. The web app opens in this browser.
          </p>

          <div className="welcome-entrance mt-12 grid w-full max-w-4xl grid-cols-2 gap-0 border-t border-slate-200 pt-6 dark:border-slate-800 sm:grid-cols-4" style={{ "--welcome-delay": "1.4s" }} aria-label="RevelaCode ecosystem">
            {[
              ["Business", "Biashara"],
              ["Agriculture", "Shamba"],
              ["Education", "Elimu"],
              ["Communities", "Jumuiya"],
            ].map(([label, hub], index) => (
              <div key={label} className={"px-3 py-3 " + (index % 2 === 0 ? "sm:border-r sm:border-slate-200 dark:sm:border-slate-800" : "") + (index < 2 ? " border-b border-slate-200 dark:border-slate-800 sm:border-b-0" : "")}>
                <span className="block text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{label}</span>
                <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{hub}</span>
              </div>
            ))}
          </div>
          <div className="welcome-entrance mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-semibold text-slate-500 dark:text-slate-400" style={{ "--welcome-delay": "1.4s" }}>
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Secure account access</span>
            <span className="inline-flex items-center gap-2"><Smartphone size={15} className="text-blue-600 dark:text-blue-400" aria-hidden="true" /> Android and web</span>
          </div>
        </div>
      </section>

      <section id="products" className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900/50 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="welcome-reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Products</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">A connected ecosystem. Practical tools.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">Move between the tools you need without losing sight of the bigger picture.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {products.map((product) => <div key={product.name} className="welcome-reveal h-full"><ProductCard product={product} /></div>)}
          </div>
        </div>
      </section>

      <section id="sectors" className="scroll-mt-20 bg-white py-20 dark:bg-slate-950 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="welcome-reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Explore the ecosystem</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Choose a hub. Start exploring.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">Open any hub directly. You can look around as a guest without creating an account first.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck size={15} aria-hidden="true" /> Guest access available
            </span>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sectors.map((sector) => <div key={sector.key} className="welcome-reveal"><SectorCard sector={sector} /></div>)}
          </div>

          <a href="/explore/faith" className="welcome-reveal group mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500 dark:hover:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Explore Faith and Scripture as a guest">
            <span className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"><Sparkles size={21} aria-hidden="true" /></span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Faith hub</span>
                <span className="mt-1 block text-lg font-extrabold text-slate-950 dark:text-white">Faith &amp; Scripture</span>
                <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">Explore Bible study, scripture resources and faith learning.</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400">Explore as guest <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
          </a>
        </div>
      </section>

      <section id="impact" className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900/50 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="welcome-reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Impact</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">One platform. More possibilities.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">Practical digital workflows, with AI and offline support across the ecosystem.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map((item, index) => (
              <article key={item.title} className="welcome-reveal rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:p-7">
                <span className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">0{index + 1}</span>
                <h3 className="mt-4 text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
      </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-950 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="welcome-reveal">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Help centre</p>
            <h2 id="welcome-faq-title" className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">A few things to know before you start exploring RevelaCode.</p>
          </div>

          <div className="welcome-reveal mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 text-left dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950 sm:px-7">
            {faqs.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-sm font-bold text-slate-900 marker:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white">
                  {item.q}
                  <ChevronDown size={18} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-3xl pt-3 pr-8 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-slate-50 py-20 dark:bg-slate-900/50 sm:py-24">
        <div className="welcome-reveal mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">RevelaCode Software Solutions</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Your ideas deserve better technology.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">Welcome to RevelaCode. Explore the connected digital ecosystem in your browser or on Android.</p>
          <a href="/app" className="welcome-cta-sheen mt-8 inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Continue to web app <ArrowRight size={16} aria-hidden="true" />
          </a>
          <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
            Questions? <a href="mailto:support@revelacode.co.ke" className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400">Contact RevelaCode</a>
          </p>
        </div>
      </section>

      </main>\n\n      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} RevelaCode Software Solutions</span>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#products" className="transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-400">Products</a>
            <a href="#sectors" className="transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-400">Sectors</a>
            <a href="#contact" className="transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-400">Contact</a>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Code. Innovate. Transform. · Built to code. Built to innovate. Built to transform.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
