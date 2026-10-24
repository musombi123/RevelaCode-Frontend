import React from "react";
import {
  BookOpen,
  CircleDollarSign,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  ShieldCheck,
  Database,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";

const MODULES = [
  {
    title: "1. Identity, roles and account safety",
    icon: ShieldCheck,
    items: [
      "RevelaCode login and the existing users collection establish the person's identity. Browser role labels are not the source of authorization; protected operations re-check the current account role on the backend.",
      "RevelaCode Administrator owns ecosystem-wide access decisions. Support Administrator supervises support and maintains delegated study/policy content. Support Agents work assigned tickets. School and business roles remain scoped to their own workspaces.",
      "Ban blocks sign-in; unban/reactivate restores it. Delete is a soft delete: access is disabled and the password is invalidated, while audit and ecosystem references are retained. Platform-administrator accounts require stronger authority to change.",
    ],
  },
  {
    title: "2. Ecosystem architecture",
    icon: Database,
    items: [
      "One RevelaCode backend and shared identity sit underneath the ecosystem. Jumuiya modules are added to the existing backend and reuse its database and authentication bridge; do not create a second account or database system.",
      "Biashara handles business profiles and operations. Shamba handles farmer profiles, farm-rights reviews and agricultural work. Elimu handles school accounts and role-scoped school operations. Community is the shared connection and discovery layer.",
      "Faith & Scripture uses the existing Study service for curated study materials and lessons. RevelaAI is the AI service layer; it must not be treated as the system of record for users, billing or hub records.",
    ],
  },
  {
    title: "3. Support operating procedure",
    icon: Headphones,
    items: [
      "Start each shift by reviewing the support overview, unassigned requests, open/pending counts and the most recent activity. Assign each ticket to one active Support Agent and verify the assignment saved.",
      "Record a useful resolution note before resolving a ticket. Reopen or escalate issues that need engineering, platform-admin or payment-provider intervention; do not promise a fix that has not been verified.",
      "Review team activity and aging tickets daily. Escalate suspected account compromise, privacy incidents, payment mismatches, data-loss risks or repeated authorization failures immediately to the RevelaCode Administrator.",
    ],
  },
  {
    title: "4. Study and content governance",
    icon: GraduationCap,
    items: [
      "Only publish material after checking title, category, subcategory, source, copyright/permission status, lesson completeness and reference accuracy. Keep Faith content in the appropriate Faith category and educational resources in the Education category.",
      "Use the existing Study upload and curated Faith catalogue endpoints. Refresh curated entries only through the supported workflow; do not replace ordinary uploaded materials with seed data or report a catalogue as published unless the API confirms success.",
      "Support Administrators can manage study materials under the delegated role. They cannot grant themselves platform-admin access, alter account sanctions or approve financial operations.",
    ],
  },
  {
    title: "5. Policies, terms and privacy",
    icon: ClipboardCheck,
    items: [
      "Edit the correct document type (Terms of Service, Privacy Policy, Cookie Policy, Community Guidelines or Support Policy). Explain what changes, include effective dates where relevant, and have legal wording reviewed before publication.",
      "Publishing a legal document creates a new revision in the shared legaldocs store. Confirm the returned version and check the public legal route after publication. Do not say a policy is live if the backend did not confirm it.",
      "Keep internal operational policies separate from public Terms and Privacy documents. Record significant governance changes and escalate data-protection or legal questions to the RevelaCode Administrator.",
    ],
  },
  {
    title: "6. Money, billing and reconciliation",
    icon: CircleDollarSign,
    items: [
      "Review the existing Revenue Management view for plan publication, subscription status, M-Pesa checkout states and recorded transaction/ledger entries. Published plans and verified provider payments are different things.",
      "Only provider-confirmed payment should activate paid subscription access. A pending, failed, sandbox-verified or unresolved checkout is not proof of production revenue. Never ask a customer to pay a second time while a checkout is unresolved.",
      "The dashboard is an operations console, not a bank account or an automatic money-transfer tool. Reconcile provider receipts and official financial records; only the RevelaCode Administrator oversees financial decisions and access to any separately authorized payment/settlement systems.",
    ],
  },
  {
    title: "7. Release and incident discipline",
    icon: ClipboardCheck,
    items: [
      "Use repository pull requests and passing CI to validate changes. A green GitHub build does not prove a Render deployment or external email/payment provider is live; check the deployed service and a real, safe test path.",
      "For an incident: capture timestamp, affected user/workspace, request ID and exact error; protect private data; reproduce with minimum access; record the action; escalate high-risk issues instead of improvising production database edits.",
      "Never share passwords, JWTs, API keys, invitation tokens or private identity documents in ticket notes. Rotate exposed credentials and notify the RevelaCode Administrator if privileged credentials appear in frontend code or logs.",
    ],
  },
];

export default function AdminOperationsHandbook({ supervisorView = false }) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3"><BookOpen size={24} /></div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">{supervisorView ? "Support Admin Orientation" : "RevelaCode Operations Manual"}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{supervisorView ? "Learn the system from the ground up" : "Ecosystem control handbook"}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Use this as the operational orientation for understanding the whole ecosystem, safe escalation paths, role boundaries and what the live tools actually prove.</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">Ownership</p><p className="mt-1 text-sm font-bold">RevelaCode Administrator</p><p className="mt-1 text-xs leading-5 text-white/60">Ecosystem-wide authority, policy oversight, user sanctions and financial supervision.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">Operations</p><p className="mt-1 text-sm font-bold">Support Administrator</p><p className="mt-1 text-xs leading-5 text-white/60">Support team supervision, ticket monitoring and delegated Study/Policy work.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/50">Execution</p><p className="mt-1 text-sm font-bold">Support Agent</p><p className="mt-1 text-xs leading-5 text-white/60">Ticket triage, investigation, documented response and resolution within assigned duties.</p></div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {MODULES.map(({ title, icon: Icon, items }) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200"><Icon size={19} /></span><h3 className="text-base font-black text-slate-950 dark:text-white">{title}</h3></div>
            <ol className="mt-4 space-y-3">
              {items.map((item, index) => <li key={index} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-600 dark:bg-slate-900 dark:text-slate-300">{index + 1}</span><span>{item}</span></li>)}
            </ol>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:p-5">
        <div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" /><div><h3 className="font-black text-emerald-950 dark:text-emerald-200">First-week checklist</h3><p className="mt-1 text-sm leading-6 text-emerald-900 dark:text-emerald-100">Read the identity and roles section; review every Support view; practise assigning a non-production/test ticket; learn how to verify a study upload and legal revision; inspect the Revenue Management definitions; then rehearse an escalation without exposing customer secrets. Permission to use a tool is not proof that an operation succeeded—confirm the backend result each time.</p></div></div>
      </section>
    </div>
  );
}
