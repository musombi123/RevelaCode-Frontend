import React, { useMemo } from "react";
import {
  Activity, ArrowRight, Box, CheckCircle2, ChevronRight, Code2, FolderOpen,
  HardDrive, Image as ImageIcon, Layers3, Music, Play, RefreshCw,
  ShieldCheck, Sparkles, Users, Zap, Monitor, Smartphone, AlertCircle
} from "lucide-react";

const panel = "rounded-xl border border-[#20334B] bg-[#0D1828]";
const muted = "text-slate-500";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function getDate(item) {
  return item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || item?.timestamp || null;
}
function inRange(item, range) {
  if (range === "all") return true;
  const stamp = getDate(item);
  if (!stamp) return true;
  const age = Date.now() - new Date(stamp).getTime();
  return Number.isNaN(age) || age <= (range === "month" ? 30 : 7) * 86400000;
}
function trendValues(items) {
  const now = new Date();
  const values = Array(7).fill(0);
  items.forEach(item => {
    const stamp = getDate(item);
    if (!stamp) return;
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) return;
    const daysAgo = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) values[6 - daysAgo] += 1;
  });
  return values;
}
function Sparkline({ values, tone = "cyan" }) {
  if (!values?.some(value => value > 0)) return <div className="h-8 w-20 border-b border-dashed border-slate-700/80" aria-hidden="true"/>;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => (index * 15) + "," + (27 - (value / max) * 23)).join(" ");
  const colors = { cyan: "#10D5F2", green: "#19E76B", purple: "#B34BFF", amber: "#FF9D24" };
  return <svg viewBox="0 0 90 32" className="h-8 w-[90px] shrink-0" aria-label="Recent seven-day activity trend"><polyline points={points} fill="none" stroke={colors[tone] || colors.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function StatCard({ label, value, detail, icon: Icon, tone = "cyan", trend = [] }) {
  const tones = {
    cyan: "bg-cyan-500/15 text-cyan-300 shadow-[0_0_22px_rgba(16,213,242,.12)]",
    green: "bg-emerald-500/15 text-emerald-300 shadow-[0_0_22px_rgba(25,231,107,.1)]",
    purple: "bg-violet-500/15 text-violet-300 shadow-[0_0_22px_rgba(179,75,255,.1)]",
    amber: "bg-amber-500/15 text-amber-300 shadow-[0_0_22px_rgba(255,157,36,.1)]"
  };
  return <article className={panel + " flex min-h-[70px] items-center gap-3 px-4 py-3"}>
    <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " + tones[tone]}><Icon size={23}/></div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[11px] font-medium text-slate-400">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2"><strong className="text-[24px] font-black leading-none tracking-tight text-white">{value}</strong></div>
      <div className="mt-1 truncate text-[9px] text-slate-500">{detail}</div>
    </div>
    <Sparkline values={trend} tone={tone}/>
  </article>;
}
function SectionHeading({ icon: Icon, title, action, onAction, right }) {
  return <div className="mb-3 flex min-h-5 items-center justify-between gap-3">
    <h2 className="flex min-w-0 items-center gap-2 text-[14px] font-extrabold tracking-tight text-slate-100"><Icon size={18} className="shrink-0 text-cyan-300"/>{title}</h2>
    <div className="flex shrink-0 items-center gap-3">{right}{action && <button type="button" onClick={onAction} className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 hover:text-cyan-100">{action}<ArrowRight size={12}/></button>}</div>
  </div>;
}
function SceneArtwork({ variant = "orbit" }) {
  const filter = variant === "neon" ? "hue-rotate(65deg) saturate(1.35)" : variant === "forest" ? "hue-rotate(135deg) saturate(1.2)" : "none";
  return <div className="absolute inset-0 overflow-hidden" aria-hidden="true" style={{ filter }}>
    <svg viewBox="0 0 1100 270" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id="nexoraSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#091a38"/><stop offset=".52" stopColor="#315c91"/><stop offset="1" stopColor="#e38ab1"/></linearGradient>
        <linearGradient id="nexoraWater" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#153e67"/><stop offset="1" stopColor="#07172a"/></linearGradient>
        <linearGradient id="nexoraGlow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#12def8"/><stop offset="1" stopColor="#625dff"/></linearGradient>
        <radialGradient id="nexoraMoon"><stop stopColor="#fff4ed"/><stop offset=".75" stopColor="#c8bbf7"/><stop offset="1" stopColor="#8b8ad6"/></radialGradient>
      </defs>
      <rect width="1100" height="270" fill="url(#nexoraSky)"/>
      <circle cx="278" cy="70" r="54" fill="#d6cbff" opacity=".12"/>
      <circle cx="278" cy="70" r="43" fill="url(#nexoraMoon)"/>
      <path d="M0 135 Q95 92 190 132 T390 124 T590 139 T800 122 T1100 130 V190 H0Z" fill="#314d79" opacity=".52"/>
      <path d="M0 170 L150 111 223 164 327 122 434 170 540 117 634 172 742 127 865 169 986 117 1100 164 V270 H0Z" fill="#243b65"/>
      <path d="M0 196 L120 151 221 190 352 148 456 207 573 157 676 201 809 153 930 198 1068 151 1100 173 V270 H0Z" fill="#152c4e"/>
      <g fill="#0b1b32">
        <path d="M0 190 L130 154 205 190 190 270 H0Z"/><path d="M770 173 L855 135 924 174 914 270 H760Z"/><path d="M950 168 L1034 126 1100 162 V270 H930Z"/>
      </g>
      <g fill="#122b4a" stroke="#20d9f4" strokeOpacity=".42" strokeWidth="2">
        <path d="M595 175 V96 L614 78 632 96 V175Z"/><path d="M638 181 V55 L658 32 678 55 V181Z"/><path d="M680 180 V112 L696 96 712 112 V180Z"/>
        <path d="M720 181 V87 L747 61 775 87 V181Z"/><path d="M785 177 V118 L801 99 818 118 V177Z"/><path d="M837 181 V96 L864 74 891 96 V181Z"/>
        <path d="M900 181 V128 L918 110 936 128 V181Z"/><path d="M970 182 V101 L999 75 1028 101 V182Z"/>
      </g>
      <g fill="#38dff9" opacity=".9">
        <rect x="607" y="109" width="5" height="9" rx="1"/><rect x="620" y="109" width="5" height="9" rx="1"/>
        <rect x="651" y="61" width="6" height="10" rx="1"/><rect x="666" y="61" width="6" height="10" rx="1"/>
        <rect x="651" y="85" width="6" height="10" rx="1"/><rect x="666" y="85" width="6" height="10" rx="1"/>
        <rect x="737" y="94" width="7" height="11" rx="1"/><rect x="752" y="94" width="7" height="11" rx="1"/>
        <rect x="850" y="104" width="6" height="10" rx="1"/><rect x="868" y="104" width="6" height="10" rx="1"/>
        <rect x="987" y="111" width="7" height="12" rx="1"/><rect x="1006" y="111" width="7" height="12" rx="1"/>
      </g>
      <path d="M0 220 Q200 180 380 218 T730 213 T1100 205 V270 H0Z" fill="url(#nexoraWater)" opacity=".94"/>
      <path d="M0 218 Q190 190 380 218 T735 213 T1100 205" fill="none" stroke="#7beaff" strokeOpacity=".45" strokeWidth="2"/>
      <path d="M0 238 Q250 211 475 243 T900 232 T1100 233" fill="none" stroke="#61cffa" strokeOpacity=".22" strokeWidth="4"/>
      <g fill="#d3eaff" opacity=".48"><ellipse cx="530" cy="210" rx="220" ry="10"/><ellipse cx="810" cy="222" rx="180" ry="8"/><ellipse cx="245" cy="226" rx="180" ry="7"/></g>
      <g fill="#f6d4ff" opacity=".85"><circle cx="78" cy="36" r="1.8"/><circle cx="139" cy="88" r="1.4"/><circle cx="405" cy="36" r="1.4"/><circle cx="517" cy="73" r="1.2"/><circle cx="930" cy="37" r="1.6"/><circle cx="1040" cy="58" r="1.2"/></g>
      <path d="M0 0 H1100 V270 H0Z" fill="url(#nexoraGlow)" opacity=".07"/>
    </svg>
    <div className="absolute inset-0 bg-gradient-to-r from-[#071322]/65 via-[#071322]/15 to-transparent"/>
    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#071322]/70 to-transparent"/>
  </div>;
}
function Avatar({ label }) {
  const text = String(label || "—").trim();
  const initials = text.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "—";
  return <span title={text} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-blue-600 text-[8px] font-black text-white">{initials}</span>;
}
function categoryFor(task) {
  const value = String(task.category || "").toLowerCase();
  if (value.includes("art") || value.includes("design") || value.includes("animation")) return "Art";
  if (value.includes("audio") || value.includes("music") || value.includes("sound")) return "Audio";
  return "Code";
}
function CategoryPill({ category }) {
  const classes = category === "Art" ? "border-violet-500/50 bg-violet-500/10 text-violet-200" : category === "Audio" ? "border-amber-500/50 bg-amber-500/10 text-amber-200" : "border-blue-500/50 bg-blue-500/10 text-blue-200";
  return <span className={"rounded-full border px-2 py-0.5 text-[8px] font-bold " + classes}>{category}</span>;
}
function ProjectPlatforms({ project }) {
  const target = String(project?.settings?.target || "Desktop");
  const items = target.toLowerCase().includes("android") ? ["ANDROID"] : [];
  if (target.toLowerCase().includes("desktop") || target.toLowerCase() === "pc") items.unshift("PC");
  if (!items.length) items.push(target.toUpperCase());
  return <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold text-slate-300">{items.map(item => <span key={item} className="inline-flex items-center gap-1 rounded bg-black/35 px-1.5 py-1">{item === "ANDROID" ? <Smartphone size={10}/> : <Monitor size={10}/>} {item}</span>)}</div>;
}
function projectProgress(project, tasks) {
  const linked = tasks.filter(task => String(task.projectId || "") === String(project?.id || ""));
  if (!linked.length) return null;
  return Math.round(linked.filter(task => task.status === "done").length / linked.length * 100);
}
function TrendLabel({ count, noun }) {
  return <span className="text-[9px] text-slate-500">{count} {noun}</span>;
}

export default function NexoraStudioOverview({
  projects = [], activeProject, jobs = [], tasks = [], apiStatus = { state: "unknown", label: "Service state unavailable" },
  cloudProjectActive = false, dateRange = "week", onNavigate, onOpenProject, onNewProject, onQuickAction, onRefresh
}) {
  const rangeTasks = useMemo(() => tasks.filter(item => inRange(item, dateRange)), [tasks, dateRange]);
  const rangeJobs = useMemo(() => jobs.filter(item => inRange(item, dateRange)), [jobs, dateRange]);
  const activeProjects = useMemo(() => projects.filter(project => !project.archived), [projects]);
  const recentProjects = useMemo(() => [...activeProjects].filter(item => inRange(item, dateRange)).sort((a, b) => String(getDate(b) || "").localeCompare(String(getDate(a) || ""))).slice(0, 3), [activeProjects, dateRange]);
  const recentTasks = useMemo(() => [...rangeTasks].sort((a, b) => String(getDate(b) || "").localeCompare(String(getDate(a) || ""))).slice(0, 4), [rangeTasks]);
  const buildJobs = rangeJobs.filter(job => job.kind === "build.export");
  const finishedBuilds = buildJobs.filter(job => job.state === "completed" || job.state === "failed");
  const successfulBuilds = buildJobs.filter(job => job.state === "completed").length;
  const successRate = finishedBuilds.length ? (Math.round(successfulBuilds / finishedBuilds.length * 1000) / 10) + "%" : "—";
  const completedTasks = rangeTasks.filter(task => task.status === "done");
  const linkedTasks = activeProject ? tasks.filter(task => String(task.projectId || "") === String(activeProject.id)) : [];
  const progress = activeProject ? projectProgress(activeProject, tasks) : null;
  const assets = activeProject?.assets || [];
  const latestJob = [...jobs].sort((a, b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const latestBuild = [...jobs].filter(job => job.kind === "build.export").sort((a, b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const healthChecks = [
    { label: "Foundry connection", detail: apiStatus.state === "online" ? "Service connected" : (apiStatus.state || "Unknown").replaceAll("_", " "), ok: apiStatus.state === "online" },
    { label: "Project workspace", detail: activeProject ? (cloudProjectActive ? "Cloud project linked" : "Local project open") : "No project selected", ok: Boolean(activeProject) },
    { label: "Asset library", detail: assets.length ? assets.length + " project asset(s)" : "No project assets", ok: assets.length > 0 },
    { label: "Latest build", detail: latestBuild ? String(latestBuild.state || "queued") : "No build recorded", ok: latestBuild?.state === "completed" }
  ];
  const healthScore = Math.round(healthChecks.filter(item => item.ok).length / healthChecks.length * 100);
  const pipelineColumns = [
    { id: "backlog", label: "BACKLOG", tone: "slate" },
    { id: "in_progress", label: "IN PROGRESS", tone: "cyan" },
    { id: "in_review", label: "IN REVIEW", tone: "amber" },
    { id: "done", label: "DONE", tone: "green" }
  ];
  const latestProgress = latestJob?.progress != null && Number.isFinite(Number(latestJob.progress)) ? Math.max(0, Math.min(100, Number(latestJob.progress))) : null;

  return <div className="space-y-3">
    <section className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-4">
      <StatCard label="Active Projects" value={String(activeProjects.length).padStart(2, "0")} detail={activeProjects.length + " available in this workspace"} icon={FolderOpen} tone="cyan" trend={trendValues(activeProjects)}/>
      <StatCard label="Build Success" value={successRate} detail={finishedBuilds.length ? successfulBuilds + " successful · " + (finishedBuilds.length - successfulBuilds) + " failed" : "No completed build history"} icon={CheckCircle2} tone="green" trend={trendValues(buildJobs.filter(job => job.state === "completed"))}/>
      <StatCard label="Tasks Completed" value={completedTasks.length} detail={rangeTasks.length + " tasks in selected period"} icon={ShieldCheck} tone="purple" trend={trendValues(completedTasks)}/>
      <StatCard label="Team Capacity" value="—" detail="Team roster and capacity service not connected" icon={Users} tone="amber" trend={[]}/>
    </section>

    <section className="grid gap-3 2xl:grid-cols-[minmax(0,2.45fr)_minmax(300px,.95fr)]">
      <article className={panel + " overflow-hidden"}>
        <div className="flex h-9 items-center justify-between border-b border-[#20334B] bg-[#0E1B2D] px-3.5">
          <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-white"><Play size={16} className="fill-cyan-400 text-cyan-400"/>Continue Working</h2>
          <button type="button" onClick={() => onNavigate("projects")} className="text-[10px] font-semibold text-cyan-300 hover:text-white">Resume Your Project <ArrowRight size={12} className="ml-1 inline"/></button>
        </div>
        {activeProject ? <div className="relative min-h-[222px] overflow-hidden">
          <SceneArtwork variant="orbit"/>
          <div className="relative z-10 flex min-h-[222px] flex-col justify-end p-4 sm:p-5">
            <span className="w-fit rounded-md border border-white/15 bg-black/35 px-2 py-1 text-[8px] font-extrabold tracking-wide text-cyan-100">{cloudProjectActive ? "CLOUD SYNCED" : "LOCAL DRAFT"}</span>
            <h2 className="mt-2 max-w-2xl truncate text-[23px] font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg sm:text-[27px]">{activeProject.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <ProjectPlatforms project={activeProject}/>
              <span className={"inline-flex items-center gap-1 text-[9px] font-extrabold " + (latestJob?.state === "running" || latestJob?.state === "queued" ? "text-cyan-200" : "text-emerald-300")}><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#19e76b]"/>{latestJob?.state === "running" || latestJob?.state === "queued" ? "IN PRODUCTION" : activeProject.build?.lastBuildStatus === "completed" ? "BUILD COMPLETE" : "PROJECT READY"}</span>
            </div>
            <div className="mt-3 flex max-w-[390px] items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/45"><div className="h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(16,213,242,.65)]" style={{ width: (progress == null ? 0 : progress) + "%" }}/></div>
              <span className="min-w-9 text-right text-[11px] font-extrabold text-white">{progress == null ? "—" : progress + "%"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onOpenProject(activeProject)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-[11px] font-black text-[#04111A] shadow-lg transition hover:bg-cyan-300"><Play size={13} fill="currentColor"/>Open Project</button>
              <button type="button" onClick={() => onNavigate("build")} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#091525]/75 px-3.5 py-2 text-[11px] font-bold text-white hover:border-cyan-300/70"><Box size={15}/>View Build</button>
            </div>
            {linkedTasks.length === 0 && <span className="mt-2 text-[9px] text-white/65">Add tasks linked to this project to calculate its completion progress.</span>}
          </div>
        </div> : <div className="relative flex min-h-[222px] items-center justify-center overflow-hidden bg-[#0A1524] p-6 text-center"><SceneArtwork variant="orbit"/><div className="relative z-10 max-w-md"><div className="text-lg font-black text-white">Your studio is ready for its first project</div><p className="mt-2 text-xs leading-5 text-slate-300">Create a project to unlock the editor, asset library and production tools.</p><button type="button" onClick={onNewProject} className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-black text-[#04111A]"><span className="inline-flex items-center gap-2"><Play size={13}/>Create your first project</span></button></div></div>}
      </article>

      <article className={panel + " p-3.5"}>
        <SectionHeading icon={Activity} title="Production Health" action="View Details" onAction={() => onNavigate("analytics")}/>
        <div className="flex items-center justify-center border-b border-white/5 pb-3 pt-1">
          <div className="relative flex h-[112px] w-[112px] items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90"><circle cx="60" cy="60" r="49" fill="none" stroke="#18364a" strokeWidth="9"/><circle cx="60" cy="60" r="49" fill="none" stroke="#13e5bb" strokeWidth="9" strokeLinecap="round" strokeDasharray={(healthScore / 100 * 307.9) + " 307.9"} className="drop-shadow-[0_0_7px_rgba(19,229,187,.5)]"/></svg>
            <div className="text-center"><div className="text-[27px] font-black leading-none text-white">{healthScore}%</div><div className="mt-1 text-[10px] font-bold text-emerald-300">{healthScore >= 75 ? "Healthy" : "Attention"}</div></div>
          </div>
        </div>
        <div className="mt-3 space-y-2.5">{healthChecks.map(item => <div key={item.label} className="flex items-center gap-2.5 text-[10px]"><span className={"flex h-4 w-4 shrink-0 items-center justify-center rounded-full " + (item.ok ? "bg-emerald-500 text-[#04150d]" : "bg-amber-500/15 text-amber-300")}>{item.ok ? <CheckCircle2 size={13} strokeWidth={3}/> : <AlertCircle size={13}/>}</span><span className="min-w-0 flex-1 text-slate-200">{item.label}</span><span className={"max-w-[48%] truncate text-right " + (item.ok ? "text-emerald-300" : "text-amber-200")}>{item.detail}</span></div>)}</div>
      </article>
    </section>

    <section className={panel + " p-3"}>
      <SectionHeading icon={Layers3} title="Production Pipeline" action="View All Tasks" onAction={() => onNavigate("team")}/>
      <div className="grid gap-2.5 xl:grid-cols-4">
        {pipelineColumns.map((column, index) => {
          const items = rangeTasks.filter(task => task.status === column.id);
          const toneClass = index === 1 ? "border-cyan-500/40 bg-cyan-500/[.035]" : index === 2 ? "border-amber-500/40 bg-amber-500/[.035]" : index === 3 ? "border-emerald-500/40 bg-emerald-500/[.035]" : "border-[#29415F] bg-[#101D30]";
          const titleTone = index === 1 ? "text-cyan-300" : index === 2 ? "text-amber-200" : index === 3 ? "text-emerald-300" : "text-slate-300";
          return <article key={column.id} className={"min-w-0 rounded-lg border p-2.5 " + toneClass}>
            <div className="mb-2 flex items-center justify-between"><h3 className={"text-[10px] font-black tracking-wide " + titleTone}>{column.label}</h3><span className="text-[10px] font-bold text-slate-300">{items.length}</span></div>
            <div className="space-y-1.5">{items.slice(0, 3).map((task, taskIndex) => {
              const category = categoryFor(task);
              const ThumbIcon = category === "Art" ? ImageIcon : category === "Audio" ? Music : Code2;
              return <button type="button" key={task.id} onClick={() => onNavigate("team")} className="flex w-full min-w-0 items-center gap-2 rounded-md border border-white/5 bg-[#17263C] px-2 py-1.5 text-left transition hover:border-cyan-400/40">
                <span className={"flex h-8 w-9 shrink-0 items-center justify-center rounded bg-gradient-to-br " + (taskIndex % 3 === 0 ? "from-sky-500/40 to-indigo-950" : taskIndex % 3 === 1 ? "from-orange-400/35 to-slate-900" : "from-emerald-500/30 to-slate-900")}><ThumbIcon size={15} className="text-slate-100"/></span>
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-100">{task.title}</span>
                <CategoryPill category={category}/>
                <Avatar label={task.assignee || "Unassigned"}/>
              </button>;
            })}{items.length > 3 && <button type="button" onClick={() => onNavigate("team")} className="w-full pt-1 text-left text-[9px] font-semibold text-cyan-300">+ {items.length - 3} more tasks</button>}{!items.length && <div className="rounded-md border border-dashed border-white/10 px-2 py-4 text-center text-[9px] text-slate-600">No tasks in this stage</div>}</div>
          </article>;
        })}
      </div>
    </section>

    <section className="grid gap-3 2xl:grid-cols-[minmax(0,1.45fr)_minmax(270px,.9fr)_minmax(250px,.85fr)]">
      <article className={panel + " min-w-0 p-3"}>
        <SectionHeading icon={FolderOpen} title="Recent Projects" action="View All" onAction={() => onNavigate("projects")}/>
        {recentProjects.length ? <div className="grid gap-2 sm:grid-cols-3">{recentProjects.map((project, index) => {
          const value = projectProgress(project, tasks);
          return <button type="button" key={project.id} onClick={() => onOpenProject(project)} className="group min-w-0 overflow-hidden rounded-lg border border-[#29415F] bg-[#101D30] text-left transition hover:border-cyan-400/60">
            <div className="relative h-[62px] overflow-hidden"><SceneArtwork variant={index === 0 ? "orbit" : index === 1 ? "neon" : "forest"}/><div className="absolute inset-0 bg-gradient-to-t from-[#081321]/65 to-transparent"/></div>
            <div className="p-2">
              <div className="truncate text-[10px] font-extrabold text-white">{project.name}</div>
              <div className="mt-1"><ProjectPlatforms project={project}/></div>
              <div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#24364e]"><div className="h-full rounded-full bg-cyan-400" style={{ width: (value == null ? 0 : value) + "%" }}/></div><span className="text-[9px] font-bold text-slate-300">{value == null ? "—" : value + "%"}</span></div>
            </div>
          </button>;
        })}</div> : <div className="flex h-[115px] items-center justify-center text-center text-[10px] text-slate-500">No projects in this period. Create a project to see it here.</div>}
      </article>

      <article className={panel + " min-w-0 p-3"}>
        <SectionHeading icon={Users} title="Team Activity" action="View All" onAction={() => onNavigate("team")}/>
        {recentTasks.length ? <div className="space-y-2.5">{recentTasks.slice(0, 3).map(task => <div key={task.id} className="flex min-w-0 items-start gap-2 border-b border-white/5 pb-2.5 last:border-0 last:pb-0"><Avatar label={task.assignee || "Unassigned"}/><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-slate-200">{task.assignee || "Unassigned"} · {task.title}</div><div className="mt-0.5 text-[9px] text-slate-500">{String(task.status || "backlog").replaceAll("_", " ")} · {formatDate(getDate(task))}</div></div></div>)}</div> : <div className="py-6 text-center text-[10px] text-slate-500">Task activity will appear here.</div>}
        <div className="mt-2 border-t border-white/5 pt-2 text-[8px] leading-4 text-slate-600">Activity is derived from task records. Live team presence and member event feeds are not connected.</div>
      </article>

      <article className={panel + " min-w-0 p-3"}>
        <SectionHeading icon={Activity} title="Build Monitor" action="View Builds" onAction={() => onNavigate("build")}/>
        <div className="flex items-center gap-2 text-[11px] font-bold"><span className={"h-2.5 w-2.5 rounded-full " + (apiStatus.state === "online" ? "bg-emerald-400 shadow-[0_0_9px_#19e76b]" : "bg-amber-400")}/><span className={apiStatus.state === "online" ? "text-emerald-300" : "text-amber-200"}>{apiStatus.state === "online" ? "Foundry service operational" : "Service needs attention"}</span></div>
        <div className="mt-2 border-b border-white/5 pb-2 text-[9px] text-slate-400">{latestJob ? <><span className="text-slate-500">Latest job:</span> {latestJob.kind || "Production job"} · {String(latestJob.state || "queued").toUpperCase()}</> : "No production jobs recorded yet"}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{activeProject ? <ProjectPlatforms project={activeProject}/> : <span className="text-[9px] text-slate-500">Open a project to view its targets</span>}</div>
        {latestProgress != null ? <div className="mt-3"><div className="mb-1 flex justify-between text-[9px] text-slate-400"><span>Latest job progress</span><b className="text-cyan-200">{latestProgress}%</b></div><div className="h-2 overflow-hidden rounded-full bg-[#20334B]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: latestProgress + "%" }}/></div></div> : <div className="mt-3 flex h-8 items-center gap-2 text-[9px] text-slate-500"><HardDrive size={13}/>Live progress appears when the worker reports it.</div>}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-2 text-[9px] text-slate-500"><span>API: {apiStatus.state}</span><button type="button" onClick={onRefresh} className="inline-flex items-center gap-1 font-bold text-cyan-300 hover:text-white"><RefreshCw size={11}/> Refresh</button></div>
      </article>
    </section>

    <section className={panel + " flex flex-wrap items-center gap-2 p-2.5"}>
      <div className="mr-1 flex min-w-[118px] items-center gap-2 px-1.5 text-[13px] font-extrabold text-slate-100"><Zap size={18} className="text-amber-400"/>Quick Actions</div>
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          { label: "Create Scene", icon: Layers3, target: "scene" },
          { label: "Import Assets", icon: ImageIcon, target: "import" },
          { label: "Generate with AI", icon: Sparkles, target: "ai" },
          { label: "Run QA Test", icon: ShieldCheck, target: "playtest" }
        ].map(item => {
          const Icon = item.icon;
          return <button type="button" key={item.target} onClick={() => item.target === "ai" ? onNavigate("ai") : onQuickAction(item.target)} className="group flex min-w-0 items-center gap-3 rounded-lg border border-[#20334B] bg-[#142238] px-3 py-2.5 text-left transition hover:border-cyan-400/55 hover:bg-[#192c45]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300"><Icon size={19}/></span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-100">{item.label}</span><ChevronRight size={15} className="shrink-0 text-cyan-400 transition group-hover:translate-x-1"/>
          </button>;
        })}
      </div>
    </section>
  </div>;
}
