import React, { useMemo, useState } from "react";
import {
  Activity, ArrowRight, Box, CheckCircle2, ChevronRight, Code2, FolderOpen,
  HardDrive, Image as ImageIcon, Layers3, Music, Play, RefreshCw,
  ShieldCheck, Sparkles, Users, Zap, Monitor, Smartphone, AlertCircle,
  ClipboardCheck, Folder, X, ExternalLink, Clock, Terminal
} from "lucide-react";

const HERO_ART = import.meta.env.BASE_URL + "nexora-hero.webp";
const PROJECT_ART = import.meta.env.BASE_URL + "nexora-project-sprite.webp";

function getDate(item) {
  return item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || item?.timestamp || null;
}
function withinRange(item, range) {
  if (range === "all") return true;
  const stamp = getDate(item);
  if (!stamp) return true;
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() <= (range === "month" ? 30 : 7) * 86400000;
}
function makeTrend(items) {
  const values = Array(7).fill(0);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  (items || []).forEach(item => {
    const date = getDate(item);
    if (!date) return;
    const stamp = new Date(date).getTime();
    if (!Number.isFinite(stamp)) return;
    const parsed = new Date(stamp);
    const age = Math.floor((start - new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()) / 86400000);
    if (age >= 0 && age < 7) values[6 - age] += 1;
  });
  return values;
}
function Sparkline({ values = [], tone = "cyan" }) {
  if (!values.some(value => value > 0)) {
    return <svg viewBox="0 0 90 32" className="nx-sparkline" aria-hidden="true"><path d="M2 26H88" stroke="#263b56" strokeWidth="1" strokeDasharray="3 4"/></svg>;
  }
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => (index * 14 + 2) + "," + (27 - (value / max) * 22)).join(" ");
  const color = tone === "green" ? "#18e86d" : tone === "purple" ? "#be51ff" : tone === "amber" ? "#ff9d24" : "#08c9f2";
  return <svg viewBox="0 0 90 32" className="nx-sparkline" aria-label="Recent activity trend"><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function StatCard({ label, value, detail, icon: Icon, tone = "cyan", trend = [] }) {
  return <article className={"nx-stat nx-tone-" + tone}>
    <div className="nx-stat-icon"><Icon size={25} strokeWidth={2.2}/></div>
    <div className="nx-stat-copy">
      <div className="nx-stat-label">{label}</div>
      <div className="nx-stat-value">{value}</div>
      <div className="nx-stat-detail">{detail}</div>
    </div>
    <Sparkline values={trend} tone={tone}/>
  </article>;
}
function SectionTitle({ icon: Icon, children, action, onAction, tone = "cyan" }) {
  return <div className="nx-section-title">
    <h2><Icon size={19} className={"nx-title-icon nx-title-" + tone}/>{children}</h2>
    {action && <button type="button" onClick={onAction}>{action}<ArrowRight size={12}/></button>}
  </div>;
}
function initials(value) {
  return String(value || "—").split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "—";
}
function categoryFor(task) {
  const value = String(task?.category || "").toLowerCase();
  if (value.includes("art") || value.includes("design") || value.includes("animation")) return "Art";
  if (value.includes("audio") || value.includes("music") || value.includes("sound")) return "Audio";
  return "Code";
}
function CategoryTag({ category }) {
  return <span className={"nx-category nx-category-" + category.toLowerCase()}>{category}</span>;
}
function platformLabels(project) {
  const target = String(project?.settings?.target || "Desktop");
  const lower = target.toLowerCase();
  const values = [];
  if (lower.includes("android")) values.push("ANDROID");
  else if (lower.includes("desktop") || lower === "pc" || lower.includes("windows")) values.push("PC");
  else values.push(target.toUpperCase());
  return values;
}
function PlatformTags({ project }) {
  const platforms = platformLabels(project);
  return <div className="nx-platforms">{platforms.map(item => <span key={item}>{item === "ANDROID" ? <Smartphone size={12}/> : <Monitor size={12}/>} {item}</span>)}</div>;
}
function projectProgress(project, tasks) {
  const linked = tasks.filter(task => String(task.projectId || "") === String(project?.id || ""));
  return linked.length ? Math.round(linked.filter(task => task.status === "done").length / linked.length * 100) : null;
}
function shortTime(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function ProjectImage({ index = 0 }) {
  return <div className="nx-project-image" style={{ backgroundImage: 'url("' + PROJECT_ART + '")', backgroundPosition: (index * 50) + "% center" }}/>;
}
function Avatar({ label, tone = "purple" }) {
  return <span className={"nx-avatar nx-avatar-" + tone} title={label}>{initials(label)}</span>;
}

export default function NexoraStudioOverview({
  projects = [], activeProject, jobs = [], tasks = [], apiStatus = { state: "unknown", label: "Service state unavailable" },
  cloudProjectActive = false, dateRange = "week", onNavigate, onOpenProject, onNewProject,
  onQuickAction, onRefresh
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  const activeJobList = useMemo(() => jobs.filter(job => ["running","queued","in_progress","pending"].includes(String(job.state || "").toLowerCase())), [jobs]);
  const jobLogText = selectedJob ? (selectedJob.logs ?? selectedJob.log ?? selectedJob.output_log ?? selectedJob.output ?? null) : null;
  const activeProjects = useMemo(() => projects.filter(project => !project.archived), [projects]);
  const rangeTasks = useMemo(() => tasks.filter(task => withinRange(task, dateRange)), [tasks, dateRange]);
  const rangeJobs = useMemo(() => jobs.filter(job => withinRange(job, dateRange)), [jobs, dateRange]);
  const recentProjects = useMemo(() => [...activeProjects].sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || ""))).slice(0, 3), [activeProjects]);
  const recentTasks = useMemo(() => [...rangeTasks].sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || ""))).slice(0, 4), [rangeTasks]);
  const buildJobs = rangeJobs.filter(job => String(job.kind || "").toLowerCase().includes("build"));
  const finishedBuilds = buildJobs.filter(job => job.state === "completed" || job.state === "failed");
  const successfulBuilds = finishedBuilds.filter(job => job.state === "completed").length;
  const successRate = finishedBuilds.length ? (Math.round(successfulBuilds / finishedBuilds.length * 1000) / 10) + "%" : "—";
  const completedTasks = rangeTasks.filter(task => task.status === "done");
  const linkedTasks = activeProject ? tasks.filter(task => String(task.projectId || "") === String(activeProject.id)) : [];
  const progress = activeProject ? projectProgress(activeProject, tasks) : null;
  const assets = activeProject?.assets || [];
  const latestJob = [...jobs].sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const latestBuild = [...jobs].filter(job => String(job.kind || "").toLowerCase().includes("build")).sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const healthChecks = [
    { label: "Foundry service", detail: apiStatus.state === "online" ? "Connected" : "Unavailable", ok: apiStatus.state === "online" },
    { label: "Project workspace", detail: activeProject ? "Project selected" : "No project selected", ok: Boolean(activeProject) },
    { label: "Asset library", detail: assets.length ? assets.length + " asset" + (assets.length === 1 ? "" : "s") : "No project assets", ok: assets.length > 0 },
    { label: "Latest build", detail: latestBuild ? String(latestBuild.state || "queued").replaceAll("_", " ") : "No build recorded", ok: latestBuild?.state === "completed" }
  ];
  const healthScore = Math.round(healthChecks.filter(item => item.ok).length / healthChecks.length * 100);
  const pipeline = [
    { id: "backlog", label: "BACKLOG", tone: "slate" },
    { id: "in_progress", label: "IN PROGRESS", tone: "cyan" },
    { id: "in_review", label: "IN REVIEW", tone: "amber" },
    { id: "done", label: "DONE", tone: "green" }
  ];
  const latestProgress = latestJob?.progress != null && Number.isFinite(Number(latestJob.progress))
    ? Math.max(0, Math.min(100, Number(latestJob.progress))) : null;
  const status = latestJob?.state === "running" || latestJob?.state === "queued" ? "IN PRODUCTION"
    : activeProject?.build?.lastBuildStatus === "completed" ? "BUILD COMPLETE" : "PROJECT READY";

  return <div className="nexora-overview">
    <section className="nx-stats-grid">
      <StatCard label="Active Projects" value={String(activeProjects.length).padStart(2, "0")} detail={activeProjects.length + " in this workspace"} icon={Folder} tone="cyan" trend={makeTrend(activeProjects)}/>
      <StatCard label="Build Success" value={successRate} detail={finishedBuilds.length ? successfulBuilds + " successful · " + (finishedBuilds.length - successfulBuilds) + " failed" : "No completed build history"} icon={CheckCircle2} tone="green" trend={makeTrend(buildJobs.filter(job => job.state === "completed"))}/>
      <StatCard label="Tasks Completed" value={completedTasks.length} detail={rangeTasks.length + " tasks in selected period"} icon={ClipboardCheck} tone="purple" trend={makeTrend(completedTasks)}/>
      <StatCard label="Team Capacity" value="—" detail="Team capacity data unavailable" icon={Users} tone="amber" trend={[]}/>
    </section>

    <section className="nx-hero-grid">
      <article className="nx-hero-card">
        <div className="nx-hero-heading">
          <h2><Play size={18} fill="currentColor"/>Continue Working</h2>
          <button type="button" onClick={() => onNavigate("projects")}>Resume Your Project <ArrowRight size={13}/></button>
        </div>
        <div className="nx-hero-art" style={{ backgroundImage: 'linear-gradient(90deg, rgba(5,17,33,.88) 0%, rgba(6,20,39,.45) 38%, rgba(6,18,34,.02) 75%), linear-gradient(0deg, rgba(5,15,29,.32), transparent 48%), url("' + HERO_ART + '")' }}>
          {activeProject ? <div className="nx-hero-content">
            <div className="nx-project-state"><span className="nx-live-dot"/>{cloudProjectActive ? "CLOUD SYNCED" : "LOCAL PROJECT"}</div>
            <h2>{activeProject.name}</h2>
            <div className="nx-hero-meta"><PlatformTags project={activeProject}/><span className="nx-production-state"><i/>{status}</span></div>
            <div className="nx-hero-progress"><div><span style={{ width: (progress ?? latestProgress ?? 0) + "%" }}/></div><strong>{progress ?? latestProgress ?? "—"}{progress != null || latestProgress != null ? "%" : ""}</strong></div>
            <div className="nx-hero-actions">
              <button type="button" onClick={() => onOpenProject(activeProject)}><Play size={15} fill="currentColor"/>Open Project</button>
              <button type="button" onClick={() => onNavigate("build")}><Box size={17}/>View Build</button>
            </div>
          </div> : <div className="nx-hero-empty">
            <div className="nx-project-state"><span className="nx-live-dot"/>MAIN STUDIO</div>
            <h2>Your next game starts here</h2>
            <p>Create a project to unlock the editor, asset library and production tools</p>
            <button type="button" onClick={onNewProject}><FolderOpen size={15}/>New Project</button>
          </div>}
        </div>
      </article>

      <article className="nx-health-card">
        <SectionTitle icon={Activity} action="View Details" onAction={() => onNavigate("analytics")}>Production Health</SectionTitle>
        <div className="nx-health-gauge">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="49" fill="none" stroke="#18384b" strokeWidth="9"/>
            <circle cx="60" cy="60" r="49" fill="none" stroke="#11e5b3" strokeWidth="9" strokeLinecap="round" strokeDasharray={(healthScore / 100 * 307.9) + " 307.9"}/>
          </svg>
          <div><strong>{healthScore}%</strong><span>{healthScore >= 75 ? "Healthy" : "Attention"}</span></div>
        </div>
        <div className="nx-health-checks">{healthChecks.map(item => <div key={item.label}><span className={item.ok ? "is-ok" : "is-warn"}>{item.ok ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}</span><span>{item.label}</span><b>{item.detail}</b></div>)}</div>
      </article>
    </section>

    <section className="nx-live-jobs-card">
      <SectionTitle icon={Activity} action={latestJob ? "Inspect latest" : undefined} onAction={() => latestJob && setSelectedJob(latestJob)}>Production Jobs <span className="nx-live-job-count">{activeJobList.length} active</span></SectionTitle>
      {activeJobList.length ? <div className="nx-live-job-list">{activeJobList.slice(0,4).map(job => {
        const percent = Number.isFinite(Number(job.progress)) ? Math.max(0,Math.min(100,Number(job.progress))) : null;
        return <button key={job.id} type="button" className="nx-live-job-row" onClick={() => setSelectedJob(job)}>
          <span className="nx-live-job-indicator"><Activity size={15}/></span>
          <span className="nx-live-job-copy"><strong>{job.kind || "Production job"}</strong><small>{job.message || "Waiting for worker update"} · {shortTime(getDate(job))}</small></span>
          <span className="nx-live-job-state">{String(job.state).replaceAll("_"," ")}</span>
          {percent != null && <span className="nx-live-job-progress"><i style={{width:percent+"%"}}/><b>{percent}%</b></span>}
          <ChevronRight size={15}/>
        </button>;
      })}</div> : <div className="nx-live-jobs-empty">{jobs.length ? "No jobs are currently running. Select a recent job below to inspect its result." : "No production jobs yet. Jobs appear here when queued or received from the worker."}</div>}
      {jobs.length > 0 && <div className="nx-live-job-recent"><span>Recent job</span><button type="button" onClick={() => setSelectedJob(latestJob)}>{latestJob?.kind || "Production job"} · {String(latestJob?.state || "unknown").replaceAll("_"," ")} <ChevronRight size={13}/></button></div>}
    </section>

    <section className="nx-pipeline-card">
      <SectionTitle icon={Layers3} action="View All Tasks" onAction={() => onNavigate("team")}>Production Pipeline</SectionTitle>
      <div className="nx-pipeline-grid">{pipeline.map((column,index) => {
        const items = rangeTasks.filter(task => task.status === column.id);
        return <article key={column.id} className={"nx-pipeline-column nx-pipeline-" + column.tone}>
          <div className="nx-pipeline-label"><h3>{column.label}</h3><b>{items.length}</b></div>
          <div className="nx-task-list">
            {items.slice(0,3).map((task, taskIndex) => {
              const category = categoryFor(task);
              const Thumb = category === "Art" ? ImageIcon : category === "Audio" ? Music : Code2;
              return <button type="button" key={task.id} className="nx-task-row" onClick={() => onNavigate("team")}>
                <span className={"nx-task-thumb nx-task-thumb-" + taskIndex} style={{ backgroundImage: 'url("' + PROJECT_ART + '")' }}><Thumb size={15}/></span>
                <span className="nx-task-name">{task.title}</span>
                <CategoryTag category={category}/>
                <Avatar label={task.assignee || "Unassigned"} tone={index === 2 ? "blue" : "slate"}/>
              </button>;
            })}
            {!items.length && <div className="nx-no-tasks">No tasks in this stage</div>}
          </div>
        </article>;
      })}</div>
    </section>

    <section className="nx-bottom-grid">
      <article className="nx-recent-card">
        <SectionTitle icon={FolderOpen} action="View All" onAction={() => onNavigate("projects")}>Recent Projects</SectionTitle>
        <div className="nx-recent-grid">
          {recentProjects.length ? recentProjects.map((project,index) => {
            const percent = projectProgress(project,tasks);
            return <button key={project.id} type="button" className="nx-recent-project" onClick={() => onOpenProject(project)}>
              <ProjectImage index={index}/>
              <span className="nx-recent-project-name">{project.name}</span>
              <PlatformTags project={project}/>
              <span className="nx-recent-progress"><i><b style={{width: (percent ?? 0) + "%"}}/></i><strong>{percent == null ? "—" : percent + "%"}</strong></span>
            </button>;
          }) : [0,1,2].map(index => <button key={index} type="button" className="nx-recent-project nx-recent-placeholder" onClick={onNewProject}>
            <ProjectImage index={index}/>
            <span className="nx-recent-project-name">{["Orbit concept","Neon concept","Wildwood concept"][index]}</span>
            <span className="nx-concept-caption">START A PROJECT <ArrowRight size={11}/></span>
          </button>)}
        </div>
      </article>

      <article className="nx-activity-card">
        <SectionTitle icon={Users} action="View All" onAction={() => onNavigate("team")}>Team Activity</SectionTitle>
        <div className="nx-activity-list">
          {recentTasks.slice(0,3).map((task,index) => <div className="nx-activity-row" key={task.id}>
            <Avatar label={task.assignee || "Unassigned"} tone={index === 1 ? "blue" : index === 2 ? "amber" : "purple"}/>
            <span className="nx-activity-description"><b>{task.assignee || "Unassigned"}</b> {task.status === "done" ? "completed" : "updated"} <b>{task.title}</b><small>{String(task.status || "backlog").replaceAll("_"," ")}</small></span>
            <time>{shortTime(getDate(task))}</time>
          </div>)}
          {!recentTasks.length && <div className="nx-activity-empty">No recent team activity</div>}
        </div>
      </article>

      <article className="nx-build-card">
        <SectionTitle icon={Activity} action="View Builds" onAction={() => onNavigate("build")}>Build Monitor</SectionTitle>
        <div className={"nx-build-status " + (apiStatus.state === "online" ? "is-online" : "is-offline")}><span>{apiStatus.state === "online" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}</span>{apiStatus.state === "online" ? "All systems operational" : "Service needs attention"}</div>
        <div className="nx-build-latest">{latestBuild ? "Latest Build: " + (latestBuild.id || latestBuild.kind) + " · " + shortTime(getDate(latestBuild)) : "No production build recorded"}</div>
        <div className="nx-build-platforms"><span><Monitor size={13}/>PC</span><span><Smartphone size={13}/>ANDROID</span><span><Activity size={13}/>WEB</span></div>
        {latestProgress != null ? <div className="nx-build-progress"><div><i style={{width: latestProgress + "%"}}/></div><b>{latestProgress}%</b></div> : <div className="nx-build-spark"><svg viewBox="0 0 280 36" preserveAspectRatio="none"><path d="M1 24 L25 30 L49 19 L76 25 L101 21 L124 28 L150 16 L177 22 L202 12 L226 19 L253 8 L279 15" fill="none" stroke="#0bcab5" strokeWidth="2"/><path d="M1 24 L25 30 L49 19 L76 25 L101 21 L124 28 L150 16 L177 22 L202 12 L226 19 L253 8 L279 15 L279 36 L1 36Z" fill="#08cab5" opacity=".09"/></svg></div>}
        <div className="nx-build-footer"><span>{apiStatus.state === "online" ? "API CONNECTED" : "API: " + apiStatus.state}</span><button type="button" onClick={onRefresh}><RefreshCw size={12}/>Refresh</button></div>
      </article>
    </section>

    <section className="nx-quick-actions">
      <div className="nx-quick-label"><Zap size={21}/>Quick Actions</div>
      {[
        { label: "Create Scene", icon: Box, target: "scene" },
        { label: "Import Assets", icon: ImageIcon, target: "import" },
        { label: "Generate with AI", icon: Sparkles, target: "ai" },
        { label: "Run QA Test", icon: ShieldCheck, target: "playtest" }
      ].map((item,index) => {
        const Icon = item.icon;
        return <React.Fragment key={item.target}>
          {index > 0 && <span className="nx-quick-divider"/>}
          <button type="button" className="nx-quick-button" onClick={() => item.target === "ai" ? onNavigate("ai") : onQuickAction(item.target)}>
            <Icon size={25}/><span>{item.label}<ArrowRight size={13}/></span><ChevronRight size={15} className="nx-quick-arrow"/>
          </button>
        </React.Fragment>;
      })}
    </section>
    {selectedJob && <div className="nx-job-drawer-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedJob(null);}}>
      <aside className="nx-job-drawer" role="dialog" aria-modal="true" aria-label="Production job details">
        <header className="nx-job-drawer-header">
          <div><span className="nx-job-drawer-eyebrow">JOB INSPECTOR</span><h2>{selectedJob.kind || "Production job"}</h2><p>{selectedJob.id || "Job ID unavailable"}</p></div>
          <button type="button" aria-label="Close job inspector" onClick={() => setSelectedJob(null)}><X size={18}/></button>
        </header>
        <div className="nx-job-drawer-body">
          <div className={"nx-job-detail-status nx-job-state-"+String(selectedJob.state||"unknown").toLowerCase()}>{String(selectedJob.state || "unknown").replaceAll("_"," ")}{selectedJob.progress != null && Number.isFinite(Number(selectedJob.progress)) ? " · "+Math.max(0,Math.min(100,Number(selectedJob.progress)))+"%" : ""}</div>
          {selectedJob.progress != null && Number.isFinite(Number(selectedJob.progress)) && <div className="nx-job-detail-progress"><i style={{width:Math.max(0,Math.min(100,Number(selectedJob.progress)))+"%"}}/></div>}
          <dl className="nx-job-metadata">
            <div><dt>Target</dt><dd>{selectedJob.target || "Not reported"}</dd></div>
            <div><dt>Created</dt><dd>{getDate(selectedJob) ? new Date(getDate(selectedJob)).toLocaleString() : "Timestamp unavailable"}</dd></div>
            <div><dt>Updated</dt><dd>{selectedJob.updatedAt || selectedJob.updated_at ? new Date(selectedJob.updatedAt || selectedJob.updated_at).toLocaleString() : "Timestamp unavailable"}</dd></div>
            <div><dt>Worker message</dt><dd>{selectedJob.message || "No message returned"}</dd></div>
          </dl>
          <section className="nx-job-log-section"><h3><Terminal size={15}/>Execution output</h3>
            {jobLogText != null ? <pre className="nx-job-log-output">{typeof jobLogText === "string" ? jobLogText : JSON.stringify(jobLogText,null,2)}</pre> : <div className="nx-job-log-unavailable">Logs were not included in this job response. This inspector displays only output returned by the API; it does not invent or fetch a separate log source.</div>}
          </section>
          <section className="nx-job-artifacts"><h3><HardDrive size={15}/>Artifacts</h3>
            {Array.isArray(selectedJob.artifacts) && selectedJob.artifacts.length ? selectedJob.artifacts.map((artifact,index)=><div key={artifact.id || index} className="nx-job-artifact-row"><span>{artifact.name || artifact.filename || artifact.label || "Output artifact"}</span>{artifact.url || artifact.download_url ? <a href={artifact.url || artifact.download_url} target="_blank" rel="noreferrer" aria-label="Open artifact"><ExternalLink size={14}/></a> : <small>Link unavailable</small>}</div>) : <div className="nx-job-log-unavailable">No artifact details returned for this job.</div>}
          </section>
        </div>
      </aside>
    </div>}
  </div>;
}
