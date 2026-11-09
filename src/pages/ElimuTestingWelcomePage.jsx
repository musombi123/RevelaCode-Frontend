import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, CheckCircle2, ClipboardList, Download,
  GraduationCap, MonitorDown, ShieldCheck, Smartphone, Users
} from "lucide-react";

const ANDROID_DOWNLOAD_URL = "https://github.com/musombi123/RevelaCode-Android/releases/latest/download/RevelaCode-Android.apk";
const WINDOWS_DOWNLOAD_URL = "https://github.com/musombi123/RevelaCode-Windows/releases/latest/download/RevelaCode-Windows-Setup.exe";

const responsibilities = [
  ["School Administration", "School profile, academic years, terms, classes, streams and institutional settings."],
  ["Student Management", "Student registration, admission numbers, profiles, class allocation and student records."],
  ["Staff Management", "Staff registration, roles, permissions and departmental assignments."],
  ["Finance & Bursary", "Fee structures, voteheads, invoices, payments, balances, receipts and financial reporting."],
  ["Academic Management", "Subjects, teacher assignments, examination records, grading and academic reports."],
  ["Attendance", "Student and staff attendance recording and reporting."],
  ["Communication", "School announcements, notifications and parent communication."],
  ["Administration & Security", "User management, role-based access, authentication and permissions."],
  ["Reports & Insights", "School statistics, financial summaries and operational reports."],
];

const guidelines = [
  "Treat the sample school as an operational institution, not merely a demonstration.",
  "Enter realistic test information where necessary.",
  "Test complete workflows rather than clicking through individual screens.",
  "Verify that information remains consistent across different modules.",
  "Test permissions using the different assigned user roles.",
  "Report errors, unexpected behaviour, missing features and usability concerns.",
  "Never assume that a successful button click means the underlying operation succeeded.",
  "Do not enter real students' sensitive personal information or make real financial transactions during testing.",
];

function Section({ number, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{number}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <div className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function ElimuTestingWelcomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-black tracking-tight"><span>Revela</span><span className="text-emerald-600 dark:text-emerald-400">Code</span></Link>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">Elimu · Live testing</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10304B] via-[#0A74DA] to-[#16734C] px-6 py-9 text-white shadow-xl sm:px-10 sm:py-12">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90"><GraduationCap size={15} /> RevelaCode Elimu</div>
            <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">Live School Testing Programme</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Welcome to RevelaCode Elimu</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">You are invited to help us test and validate our school management system in a real-world school environment. For this exercise, RevelaCode will operate as our sample school.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/login?mode=register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-emerald-50">Create your RevelaCode account <ArrowRight size={17} /></a>
              <a href="/app" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">Open web application</a>
            </div>
            <p className="mt-4 text-xs leading-5 text-blue-100">Already have an account? Sign in when prompted. Use the account assigned to you for the testing exercise.</p>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[36px] border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-24 h-72 w-72 rounded-full border-[1px] border-white/15" />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <a href={ANDROID_DOWNLOAD_URL} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Smartphone size={23} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm font-bold">Download Android APK</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Install RevelaCode on your Android phone.</span></span>
            <Download size={18} className="shrink-0 text-emerald-700 transition group-hover:translate-y-0.5 dark:text-emerald-300" />
          </a>
          <a href={WINDOWS_DOWNLOAD_URL} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><MonitorDown size={23} /></span>
            <span className="min-w-0 flex-1"><strong className="block text-sm font-bold">Download Windows app</strong><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Install the desktop application on Windows.</span></span>
            <Download size={18} className="shrink-0 text-blue-700 transition group-hover:translate-y-0.5 dark:text-blue-300" />
          </a>
        </section>

        <div className="mt-10 space-y-4">
          <Section number="01" title="Our mission">
            Our objective is to establish whether RevelaCode Elimu is ready to serve real educational institutions by testing its functionality, reliability, usability, financial accuracy and overall operational performance. We want to identify weaknesses, uncover unexpected behaviours and improve the system before wider deployment.
          </Section>

          <Section number="02" title="Your testing responsibilities">
            <p>Every team member is expected to explore the system and test the workflows associated with their assigned responsibilities. Areas to test include:</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {responsibilities.map(([title, description]) => (
                <div key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                  <p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section number="03" title="Important testing guidelines">
            <ol className="space-y-3">
              {guidelines.map((item, index) => <li key={item} className="flex gap-3"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600" /><span><strong className="mr-1">{index + 1}.</strong>{item}</span></li>)}
            </ol>
          </Section>

          <Section number="04" title="Reporting issues">
            <p>Whenever you encounter a problem, document the following details:</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {["The module where the issue occurred","The action you performed","What you expected to happen","What actually happened","Screenshots or recordings where possible","The severity of the issue"].map(item => <li key={item} className="flex gap-2"><ClipboardList size={16} className="mt-1 shrink-0 text-blue-600" /><span>{item}</span></li>)}
            </ul>
            <p className="mt-3">Distinguish between critical failures, functional defects and improvement suggestions.</p>
          </Section>

          <Section number="05" title="Our standard">
            We are not testing Elimu simply to confirm that it works. We are testing it to discover where it fails, where it can improve and whether it can reliably support the daily operations of a real school. Be thorough. Challenge the system. Test unusual scenarios. Verify the results.
          </Section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-8">
            <div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-1 shrink-0 text-emerald-700 dark:text-emerald-300" /><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300">06 · Final welcome</p><h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Welcome aboard!</h2><p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">Your feedback and participation will directly contribute to making RevelaCode Elimu a dependable, professional and scalable school management platform. Let's build, test and deliver technology that transforms education.</p><p className="mt-5 font-extrabold text-slate-900 dark:text-white">REVELACODE ELIMU</p><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">School Management. Simplified. Connected. Empowered.</p><p className="mt-2 text-xs font-bold tracking-wide text-slate-600 dark:text-slate-400">Code. Innovate. Transform.</p></div></div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="/login?mode=register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Create your account <ArrowRight size={17} /></a>
              <a href="/app" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">Continue on the web</a>
            </div>
          </section>
        </div>

        <footer className="py-8 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
          <p>RevelaCode · Elimu Live School Testing Programme</p>
          <p>Use test data only. Do not enter real student-sensitive information or process real payments.</p>
        </footer>
      </div>
    </main>
  );
}
