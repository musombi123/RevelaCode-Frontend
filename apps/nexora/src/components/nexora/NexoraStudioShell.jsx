import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Archive, BarChart3, Box, Gamepad2, HardDrive, Home, Layers3, LayoutGrid, HelpCircle, Play, Plus, Settings2, Smartphone,
  ShieldCheck, Sparkles, FolderOpen, MoreHorizontal, X, ChevronRight,
  RefreshCw, Search, Bell, Menu, ChevronDown, Users, ShoppingCart, Calendar,
  Wrench, PackageCheck, Laptop
} from "lucide-react";

const NAV_GROUPS = [
  { label: "STUDIO", items: [
    { id: "overview", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "game-editor", label: "Create Game", icon: Gamepad2 },
    { id: "ai", label: "AI Studio", icon: Sparkles },
  ]},
  { label: "PRODUCTION", items: [
    { id: "assets", label: "Asset Library", icon: Layers3 },
    { id: "build", label: "Build & Test", icon: Play },
    { id: "device-lab", label: "Device Lab", icon: Smartphone },
  ]},
];

const ADVANCED_NAV_ITEMS = [
  { id: "world", label: "World Builder", icon: Box },
  { id: "team", label: "Team & Tasks", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "factory", label: "Project Factory", icon: Laptop },
  { id: "toolchains", label: "Toolchain Manager", icon: Wrench },
  { id: "backups", label: "Backup & Versions", icon: Archive },
  { id: "release-center", label: "Release Center", icon: PackageCheck },
];

export default function NexoraStudioShell({
  activeView, onNavigate, title, subtitle, children,
  user, connectionLabel, connectionState, onSignOut,
  onNewProject, searchValue, onSearchChange, searchResults = [],
  onSelectSearchResult, alertItems = [], storageLabel = "No project selected",
  storagePercent = null, dateRange = "week", onDateRangeChange,
  localAgentConnected = false, localAgentState = "offline", localAgentCapabilities = null,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const navLookup = useMemo(() => [...NAV_GROUPS.flatMap(group => group.items), ...ADVANCED_NAV_ITEMS], []);
  const commandResults = navLookup.filter(item =>
    item.label.toLowerCase().includes(commandQuery.trim().toLowerCase())
  );

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(value => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setHelpOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
        setWorkspaceOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (ADVANCED_NAV_ITEMS.some(item => item.id === activeView)) setAdvancedOpen(true);
  }, [activeView]);

  const navigate = (id) => {
    onNavigate(id);
    setMobileOpen(false);
    setCommandOpen(false);
    setWorkspaceOpen(false);
  };
  const userLabel = user?.display_name || user?.name || user?.email || "NEXORA Creator";
  const initials = userLabel.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "NX";

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#20334B] px-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center"><svg viewBox="0 0 48 48" className="h-11 w-11 drop-shadow-[0_0_10px_rgba(16,213,242,.2)]" aria-hidden="true"><path d="M24 2.8 44 14v20L24 45.2 4 34V14Z" fill="#0B1B2D" stroke="#10D5F2" strokeWidth="3"/><path d="M14 34V14l20 20V14" fill="none" stroke="#10D5F2" strokeWidth="4" strokeLinejoin="round"/></svg></div>
        {(!collapsed || mobile) && <div className="min-w-0 leading-none"><div className="text-[17px] font-black tracking-[.12em] text-white">NEXORA</div><div className="mt-1 text-[11px] font-bold tracking-[.18em] text-cyan-300">STUDIO PRO</div></div>}
        {mobile && <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Close navigation"><X size={18}/></button>}
      </div>
      <div className="nexora-sidebar-nav min-h-0 flex-1 overflow-y-auto px-2 py-3.5">
        {NAV_GROUPS.map(group => <div key={group.label} className="mb-[18px]">
          {(!collapsed || mobile) && <div className="mb-2 px-3 text-[10px] font-bold tracking-[.18em] text-slate-500">{group.label}</div>}
          <div className="space-y-1">{group.items.map(item => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return <button key={item.id} type="button" title={collapsed && !mobile ? item.label : undefined}
              onClick={() => navigate(item.id)}
              className={"group relative flex h-[45px] w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium transition "+(active
                ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-200 shadow-[inset_3px_0_0_#10D5F2]"
                : "text-slate-400 hover:bg-white/[.045] hover:text-slate-100")}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.9} className={active ? "shrink-0 text-cyan-300" : "shrink-0 text-slate-500 group-hover:text-cyan-200"}/>
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
              {active && (!collapsed || mobile) && <ChevronRight size={14} className="ml-auto text-cyan-300"/>}
            </button>;
          })}</div>
        </div>)}
        <div className="mt-1">
          {(!collapsed || mobile) && <div className="mb-2 px-3 text-[10px] font-bold tracking-[.18em] text-slate-500">TOOLS & INFRASTRUCTURE</div>}
          <button type="button" title={collapsed && !mobile ? "Tools & Infrastructure" : undefined}
            aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(value => !value)}
            className="flex h-[42px] w-full items-center gap-3 rounded-lg px-3 text-left text-[12px] font-bold text-slate-400 transition hover:bg-white/[.045] hover:text-slate-100">
            <Wrench size={17} className="shrink-0 text-slate-500"/>
            {(!collapsed || mobile) && <><span className="min-w-0 flex-1">Advanced workspace</span><ChevronDown size={13} className={advancedOpen ? "rotate-180 transition-transform" : "transition-transform"}/></>}
          </button>
          {advancedOpen && <div className="mt-1 space-y-1">{ADVANCED_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return <button key={item.id} type="button" title={collapsed && !mobile ? item.label : undefined}
              onClick={() => navigate(item.id)}
              className={"flex h-[39px] w-full items-center gap-3 rounded-lg px-3 text-left text-[12px] font-medium transition "+(active ? "bg-cyan-500/15 text-cyan-200" : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200")}>
              <Icon size={16} className="shrink-0"/>{(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </button>;
          })}</div>}
        </div>
      </div>
      {(!collapsed || mobile) && <div className="shrink-0 space-y-3 border-t border-[#20334B] p-3">
        <div className="rounded-xl border border-[#20334B] bg-[#0C1727] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-white">Local Agent</span>
            <span className={"flex items-center gap-1.5 text-[9px] font-bold "+(localAgentConnected ? "text-emerald-300" : localAgentState === "checking" ? "text-amber-300" : "text-slate-500")}>
              <i className={"h-1.5 w-1.5 rounded-full "+(localAgentConnected ? "bg-emerald-400" : localAgentState === "checking" ? "bg-amber-300" : "bg-slate-500")}/>
              {localAgentConnected ? "CONNECTED" : localAgentState === "checking" ? "CHECKING" : "OFFLINE"}
            </span>
          </div>
          <p className="text-[10px] leading-4 text-slate-400">{localAgentConnected ? "Paired computer verified for this account." : localAgentState === "checking" ? "Checking the paired desktop agent." : "Connect your computer to run local production jobs."}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[9px] text-slate-500">{localAgentCapabilities?.tools ? (() => { const keys = ["blender","godot","ffmpeg","ffprobe","java","adb"]; const ready = keys.filter(key => localAgentCapabilities.tools?.[key]?.available).length; return "Toolchains detected · " + ready + "/" + keys.length; })() : "Toolchain inventory not checked"}</span>
            <button type="button" onClick={() => navigate("device-lab")} className="shrink-0 rounded-md border border-cyan-800/70 px-2 py-1 text-[9px] font-extrabold text-cyan-200 hover:bg-cyan-500/10">{localAgentConnected ? "Manage" : "Connect"}</button>
          </div>
        </div>
        <div className="rounded-xl border border-[#20334B] bg-[#0C1727] p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300"><span>Storage Usage</span><span className="text-cyan-300">{storagePercent == null ? "LOCAL" : Math.round(storagePercent)+"%"}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#20334B]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" style={{width: storagePercent == null ? "0%" : Math.max(0,Math.min(100,storagePercent))+"%"}}/></div>
          <p className="mt-2 truncate text-[10px] text-slate-400">{storageLabel}</p>
        </div>
        <button type="button" onClick={() => navigate("ai")} className="flex w-full items-center gap-3 rounded-xl border border-violet-500/40 bg-violet-500/10 p-3 text-left hover:bg-violet-500/15">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300"><Sparkles size={18}/></span>
          <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-white">STUDIO PLANS</span><span className="mt-1 block text-[10px] text-violet-300">View plans & billing</span></span>
          <ChevronRight size={15} className="text-violet-300"/>
        </button>
      </div>}
      {collapsed && !mobile && <div className="border-t border-[#20334B] p-2 space-y-1">
        <button type="button" onClick={()=>navigate("device-lab")} title={localAgentConnected ? "Local Agent connected — manage" : "Local Agent offline — connect"} className="flex w-full justify-center rounded-lg p-3 text-cyan-200 hover:bg-cyan-500/10"><span className={"h-2.5 w-2.5 rounded-full "+(localAgentConnected ? "bg-emerald-400" : localAgentState === "checking" ? "bg-amber-300" : "bg-slate-500")}/></button>
        <button type="button" onClick={()=>navigate("ai")} title="Creator plans" className="flex w-full justify-center rounded-lg p-3 text-violet-300 hover:bg-violet-500/10"><Sparkles size={18}/></button>
      </div>}
    </div>
  );

  return (
    <div className="dark nexora-shell min-h-screen bg-[#070D16] text-slate-100">
      <aside className={"fixed inset-y-0 left-0 z-40 hidden border-r border-[#20334B] bg-[#0A1220] transition-all duration-200 xl:block "+(collapsed?"w-[76px]":"w-[230px]")}>
        <SidebarContent/>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-50 xl:hidden"><button type="button" aria-label="Close menu overlay" onClick={()=>setMobileOpen(false)} className="absolute inset-0 bg-black/70"/><aside className="relative h-full w-[min(300px,86vw)] border-r border-[#20334B] bg-[#0A1220]"><SidebarContent mobile/></aside></div>}

      <div className={"min-h-screen transition-[padding] duration-200 "+(collapsed?"xl:pl-[76px]":"xl:pl-[230px]")}>
        <header className="nexora-topbar sticky top-0 z-30 flex h-[58px] items-center gap-3 border-b border-[#20334B] bg-[#080F1B]/95 px-[14px] backdrop-blur-xl">
          <button type="button" onClick={()=>setMobileOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/5 xl:hidden" aria-label="Open navigation"><Menu size={19}/></button>
          
          <div className="relative shrink-0">
            <button type="button" onClick={()=>setWorkspaceOpen(value=>!value)} className="flex h-[37px] w-[224px] shrink-0 items-center gap-2 rounded-[9px] border border-[#20334B] bg-[#0D1929] px-3 text-[11px] font-extrabold tracking-wide text-cyan-300 hover:border-cyan-500/50">
              <LayoutGrid size={17} className="text-cyan-400"/><span>MAIN STUDIO</span><ChevronDown size={14} className="ml-auto"/>
            </button>
            {workspaceOpen && <div className="absolute left-0 top-12 z-50 w-56 rounded-xl border border-[#29415F] bg-[#101C2D] p-2 shadow-2xl">
              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Current workspace</div>
              <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 px-2 py-2 text-xs font-bold text-cyan-200"><span className="h-2 w-2 rounded-full bg-cyan-300"/> Main Studio <span className="ml-auto text-[9px]">ACTIVE</span></div>
              <p className="px-2 pt-2 text-[10px] leading-4 text-slate-500">Projects and production data belong to your signed-in NEXORA account.</p>
            </div>}
          </div>

          <div className="relative min-w-0 max-w-[646px] flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search size={17}/></div>
            <input value={searchValue} onChange={event=>onSearchChange(event.target.value)} onFocus={()=>setWorkspaceOpen(false)}
              placeholder="Search projects, assets, tasks…" className="h-[37px] w-full rounded-[9px] border border-[#20334B] bg-[#0D1929] pl-10 pr-14 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"/>
            <button type="button" onClick={()=>setCommandOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-[#29415F] px-1.5 py-1 text-[9px] font-bold text-slate-500 hover:text-cyan-200">⌘ K</button>
            {searchValue.trim() && <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-[#29415F] bg-[#101C2D] shadow-2xl">
              {searchResults.length ? searchResults.slice(0,8).map(result=><button key={result.id} type="button" onClick={()=>{onSelectSearchResult(result);onSearchChange("");}} className="flex w-full items-center gap-3 border-b border-white/5 px-3 py-3 text-left hover:bg-white/5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">{result.kind==="Project"?<FolderOpen size={15}/>:result.kind==="Asset"?<Box size={15}/>:<Activity size={15}/>}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-white">{result.title}</span><span className="block text-[10px] text-slate-500">{result.kind} · {result.subtitle || "Open item"}</span></span>
                <ChevronRight size={14} className="text-slate-600"/>
              </button>) : <div className="p-4 text-xs text-slate-500">No matching projects, assets or local tasks.</div>}
            </div>}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button type="button" onClick={()=>setHelpOpen(true)} className="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cyan-200 md:block" title="Workspace help" aria-label="Workspace help"><HelpCircle size={21}/></button>
            <div className="relative">
              <button type="button" onClick={()=>setNotificationsOpen(value=>!value)} className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-cyan-200" aria-label="Notifications"><Bell size={18}/>{alertItems.length>0&&<span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{Math.min(9,alertItems.length)}</span>}</button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-80 max-w-[88vw] rounded-xl border border-[#29415F] bg-[#101C2D] p-2 shadow-2xl">
                <div className="flex items-center justify-between px-2 py-2"><b className="text-xs text-white">Production alerts</b><span className="text-[9px] text-slate-500">{alertItems.length} open</span></div>
                {alertItems.length ? alertItems.slice(0,5).map(item=><button key={item.id} type="button" onClick={()=>{navigate(item.kind==="build"?"build":"ai");setNotificationsOpen(false);}} className="flex w-full items-start gap-2 border-t border-white/5 px-2 py-3 text-left hover:bg-white/5"><span className={"mt-1 h-2 w-2 rounded-full "+(item.severity==="error"?"bg-rose-400":"bg-amber-300")}/><span className="min-w-0"><b className="block text-[11px] text-slate-200">{item.title}</b><span className="block text-[10px] leading-4 text-slate-500">{item.description}</span></span></button>) : <div className="p-4 text-center text-xs text-slate-500">No active production alerts.</div>}
              </div>}
            </div>
            <div className="relative">
              <button type="button" onClick={()=>setProfileOpen(value=>!value)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/15 text-[10px] font-black text-cyan-100">{initials}</span><ChevronDown size={13} className="text-slate-400"/>
              </button>
              {profileOpen && <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[#29415F] bg-[#101C2D] p-2 shadow-2xl">
                <div className="border-b border-white/5 px-2 pb-3 pt-1"><div className="truncate text-xs font-bold text-white">{userLabel}</div><div className="mt-1 text-[10px] text-slate-500">{connectionLabel}</div></div>
                <button type="button" onClick={()=>{navigate("settings");setProfileOpen(false);}} className="mt-2 w-full rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-white/5">Account & settings</button>
                <button type="button" onClick={()=>{onSignOut();setProfileOpen(false);}} className="w-full rounded-lg px-2 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10">Sign out</button>
              </div>}
            </div>
          </div>
        </header>

        <main className="nexora-main-content w-full">
          <div className="nexora-page-heading mb-[11px] flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-[28px] font-black leading-[32px] tracking-tight text-white">{title}</h1><p className="mt-[1px] text-[16px] leading-[20px] text-slate-400">{subtitle}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {activeView === "overview" && <label className="flex h-[38px] items-center gap-2 rounded-[9px] border border-[#20334B] bg-[#0D1929] px-3 text-xs font-semibold text-slate-200"><Calendar size={16} className="text-slate-400"/><select aria-label="Overview date range" value={dateRange} onChange={event=>onDateRangeChange?.(event.target.value)} className="max-w-[125px] bg-transparent text-xs font-semibold text-slate-200 outline-none"><option value="week">Last 7 days</option><option value="month">Last 30 days</option><option value="all">All time</option></select><ChevronDown size={13} className="text-slate-400"/></label>}
              <button type="button" onClick={onNewProject} className="inline-flex h-[38px] items-center gap-2 rounded-[9px] bg-[#10D5F2] px-4 text-xs font-black text-[#04111A] shadow-[0_8px_28px_rgba(16,213,242,.16)] transition hover:-translate-y-0.5 hover:bg-cyan-300"><Plus size={16}/> New Project</button>
            </div>
          </div>
          {children}
          {activeView !== "overview" && <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[#20334B] py-4 text-[10px] text-slate-600"><span>NEXORA STUDIO PRO · {connectionLabel}</span><span>Project files and builds stay on your paired computer · Account identity and billing use the NEXORA control plane</span></footer>}
        </main>
      </div>

      {commandOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[12vh]" onMouseDown={event=>{if(event.target===event.currentTarget)setCommandOpen(false);}}>
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#29415F] bg-[#101C2D] shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 p-4"><Search size={18} className="text-cyan-300"/><input autoFocus value={commandQuery} onChange={event=>setCommandQuery(event.target.value)} placeholder="Type a page or action…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"/><kbd className="rounded border border-[#29415F] px-2 py-1 text-[9px] text-slate-500">ESC</kbd></div>
          <div className="max-h-[55vh] overflow-y-auto p-2">{commandResults.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" onClick={()=>navigate(item.id)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-cyan-500/10"><Icon size={17} className="text-cyan-300"/><span className="text-xs font-semibold text-slate-200">{item.label}</span><span className="ml-auto text-[9px] text-slate-600">OPEN PAGE</span></button>})}{!commandResults.length&&<div className="p-6 text-center text-xs text-slate-500">No matching workspace page.</div>}</div>
        </div>
      </div>}

      {helpOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onMouseDown={event=>{if(event.target===event.currentTarget)setHelpOpen(false);}}>
        <div className="w-full max-w-md rounded-2xl border border-[#29415F] bg-[#101C2D] p-5 shadow-2xl">
          <div className="flex items-center justify-between"><h2 className="text-sm font-black text-white">NEXORA workspace help</h2><button type="button" onClick={()=>setHelpOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/5"><X size={17}/></button></div>
          <p className="mt-2 text-xs leading-5 text-slate-400">Use the left navigation to move between production areas. Search finds your account projects, imported assets and this browser’s task list. Press Ctrl+K to open the command palette.</p>
          <div className="mt-4 rounded-xl border border-[#20334B] bg-[#0B1625] p-3"><div className="text-[10px] text-slate-500">FOUNDRY CONNECTION</div><div className="mt-1 text-xs font-bold text-cyan-200">{connectionLabel}</div><div className="mt-1 text-[10px] text-slate-500">State: {connectionState}</div></div>
        </div>
      </div>}
    </div>
  );
}
