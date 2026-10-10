
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
  Building2,
  FileText,
  Lightbulb,
} from "lucide-react";

const SERVICES = [
  {
    icon: BookOpen,
    title: "Teaching & learning",
    description:
      "A connected learning environment for lessons, assignments, assessments and academic progress.",
    accent: "blue",
  },
  {
    icon: Users,
    title: "School administration",
    description:
      "Bring school operations, staff responsibilities and learner administration into one workspace.",
    accent: "green",
  },
  {
    icon: CalendarDays,
    title: "Activities & timetables",
    description:
      "Keep school activities, important dates, class schedules and announcements organized.",
    accent: "violet",
  },
  {
    icon: Wallet,
    title: "School finance",
    description:
      "Support organized fee administration, statements and financial reporting through authorized access.",
    accent: "amber",
  },
  {
    icon: Lightbulb,
    title: "CBC projects",
    description:
      "Showcase approved competency-based learning projects and student achievements.",
    accent: "rose",
  },
  {
    icon: ShieldCheck,
    title: "Responsible access",
    description:
      "Keep private learner and financial information available only to verified, authorized users.",
    accent: "cyan",
  },
];

const PUBLIC_SECTIONS = [
  {
    number: "01",
    title: "Discover the school",
    description:
      "Explore the school's identity, learning environment, programmes, activities and published announcements.",
  },
  {
    number: "02",
    title: "Stay connected",
    description:
      "Give parents and learners dedicated entry points for their own authorized school information.",
  },
  {
    number: "03",
    title: "Support learning",
    description:
      "Connect academic activities, classroom learning and school-community communication.",
  },
];

const DEMOS = {
  student: {
    title: "Student portal preview",
    subtitle: "A sample learner experience",
    items: [
      ["Lessons", "Find learning materials and subject activities."],
      ["Assignments", "Review assigned work and due dates."],
      ["Timetable", "See your scheduled learning activities."],
      ["Academic progress", "Review results when released and authorized."],
    ],
  },
  parent: {
    title: "Parent portal preview",
    subtitle: "A sample family experience",
    items: [
      ["Linked learners", "Manage access to verified children."],
      ["Academic reports", "View reports released to your account."],
      ["School activities", "Keep up with published notices and events."],
      ["Fee information", "View authorized statements and payment records."],
    ],
  },
};

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  const accentClasses = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    green:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
  };

  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClasses[feature.accent]}`}
      >
        <Icon size={23} strokeWidth={1.9} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
        {feature.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {feature.description}
      </p>
    </article>
  );
}

function PortalPreview({ type, onClose }) {
  const demo = DEMOS[type];

  if (!demo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="elimu-preview-heading"
        className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles size={14} />
              Preview mode
            </span>

            <h2
              id="elimu-preview-heading"
              className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white"
            >
              {demo.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {demo.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {demo.items.map(([title, description], index) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {index + 1}
                </span>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            This is a preview of planned portal features, not a live account.
            No real student records, documents or financial information are
            displayed here.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Return to Elimu
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ElimuPublicPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(null);

  const goToWorkspace = () => {
    navigate("/jumuiya/elimu/workspace");
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Public navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Jumuiya Elimu home"
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <GraduationCap size={25} />
            </span>

            <span>
              <span className="block text-base font-extrabold tracking-tight">
                Jumuiya <span className="text-blue-600">Elimu</span>
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Connected school communities
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection("elimu-services")}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
            >
              Services
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("elimu-portals")}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
            >
              Portals
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("elimu-public-information")}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600 dark:text-slate-300"
            >
              School information
            </button>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => setActivePreview("student")}
              className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Explore
            </button>

            <button
              type="button"
              onClick={goToWorkspace}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              School access <ArrowRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-2">
              <button
                type="button"
                onClick={() => scrollToSection("elimu-services")}
                className="rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Services
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("elimu-portals")}
                className="rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Student and parent portals
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("elimu-public-information")}
                className="rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                School information
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActivePreview("student");
                }}
                className="rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Explore preview
              </button>

              <button
                type="button"
                onClick={goToWorkspace}
                className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
              >
                School access <ArrowRight size={16} />
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_48%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.10),transparent_45%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <Sparkles size={15} />
              A connected future for education
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Every school community,
              <span className="mt-2 block text-blue-600">
                better connected.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              Jumuiya Elimu connects school administration, teaching,
              learning and family engagement through one organized digital
              experience. It is designed to help schools coordinate their
              work while keeping private information protected.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={goToWorkspace}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                School workspace <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("elimu-portals")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                Explore the portals
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 dark:text-slate-300">
              {[
                "Role-based access",
                "Connected school workflows",
                "Mobile-friendly design",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-emerald-600"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Product illustration built with UI components */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-200/60 via-indigo-100/50 to-emerald-100/70 blur-2xl dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-emerald-900/20" />

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                    Jumuiya Elimu
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                    School operations, connected
                  </h2>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <GraduationCap size={23} />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 sm:gap-4 sm:p-6">
                {[
                  {
                    icon: Users,
                    title: "Learner records",
                    description: "Organized school information",
                  },
                  {
                    icon: BookOpen,
                    title: "Learning",
                    description: "Lessons and assignments",
                  },
                  {
                    icon: CalendarDays,
                    title: "Activities",
                    description: "Schedules and attendance",
                  },
                  {
                    icon: Wallet,
                    title: "Finance",
                    description: "Fees and reporting",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        <Icon size={20} />
                      </span>

                      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mx-5 mb-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 sm:mx-6 sm:mb-6">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Privacy by responsibility
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Learner documents, academic records and financial details
                    belong behind verified, authorized access.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Product overview · Illustrative interface, not live school data
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="elimu-services"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/80 py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">
              The Elimu ecosystem
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              The tools schools need, working together
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Support everyday school activities through connected,
              purpose-built administrative and learning workflows.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {SERVICES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Public information */}
      <section
        id="elimu-public-information"
        className="scroll-mt-24 py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">
              School community
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Make school information easier to find.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Each school's public website can become a central place for
              families and visitors to learn about the school, discover
              activities and explore approved learning projects.
            </p>

            <div className="mt-7 space-y-5">
              {PUBLIC_SECTIONS.map((item) => (
                <div key={item.number} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {item.number}
                  </span>

                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Building2 size={24} />
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Public school website
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  A school's digital front door
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                [BookOpen, "School profile and programmes"],
                [CalendarDays, "Published activities and announcements"],
                [Lightbulb, "Approved CBC projects"],
                [HeartHandshake, "Community and family engagement"],
                [FileText, "Public notices and documents"],
              ].map(([Icon, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <Icon
                    size={18}
                    className="shrink-0 text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                  <CheckCircle2
                    size={16}
                    className="ml-auto shrink-0 text-emerald-600"
                  />
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
              This is a proposed public information layout. Published school
              content will be connected after the public API and publication
              permissions are implemented.
            </p>
          </div>
        </div>
      </section>

      {/* Portals */}
      <section
        id="elimu-portals"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/80 py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">
              Dedicated access
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              One school community. Different experiences.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Learners, parents and school teams need different tools and
              different levels of access. Each portal should respect those
              boundaries.
            </p>
          </div>

          <div className="mt-9 grid gap-5 lg:grid-cols-3">
            <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <BookOpen size={24} />
              </span>

              <h3 className="mt-5 text-xl font-bold">Student Portal</h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A learner's own lessons, assignments, timetable, attendance,
                results and permitted academic documents.
              </p>

              <button
                type="button"
                onClick={() => setActivePreview("student")}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                Explore student preview <ChevronRight size={16} />
              </button>
            </article>

            <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <HeartHandshake size={24} />
              </span>

              <h3 className="mt-5 text-xl font-bold">Parent Portal</h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Link all children to a verified parent account, then access
                each child's authorized school records and finance details.
              </p>

              <button
                type="button"
                onClick={() => setActivePreview("parent")}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                Explore parent preview <ChevronRight size={16} />
              </button>
            </article>

            <article className="flex flex-col rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-slate-950 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <GraduationCap size={24} />
              </span>

              <h3 className="mt-5 text-xl font-bold">School Workspace</h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Authorized school leaders and staff manage school operations
                through the private administration workspace.
              </p>

              <button
                type="button"
                onClick={goToWorkspace}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                School access <ArrowRight size={16} />
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* Privacy commitment */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:flex-row sm:items-start sm:p-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
              <ShieldCheck size={25} />
            </span>

            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Learner privacy is a requirement, not an option.
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                A parent must complete verification and establish authorized
                links to their children before accessing learner-specific
                details. Academic records, documents, attendance and financial
                information must be checked by the backend on every request.
                A frontend selection alone must never grant access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-7 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            <span className="font-bold text-slate-900 dark:text-white">
              Jumuiya Elimu
            </span>{" "}
            · Part of Jumuiya OS
          </p>

          <p>Education · Administration · Community</p>
        </div>
      </footer>

      {activePreview && (
        <PortalPreview
          type={activePreview}
          onClose={() => setActivePreview(null)}
        />
      )}
    </main>
  );
}