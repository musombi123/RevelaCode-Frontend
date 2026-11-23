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
  if (!stamp) return range === "all";
  const date = new Date(stamp);
  if (Number.isNaN(date.getTime())) return range === "all";
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
  if (lower.includes("desktop") || lower === "pc" || lower.includes("windows")) values.push("PC");
  if (!values.length) values.push(target.toUpperCase());
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
  onQuickAction, onRefresh, localAgentConnected = false, localAgentState = "offline",
  localAgentCapabilities = null, onRetryJob,
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  React.useEffect(() => {
    if (!selectedJob?.id) return;
    const latest = jobs.find(job => String(job.id) === String(selectedJob.id));
    if (latest && latest !== selectedJob) setSelectedJob(latest);
  }, [jobs, selectedJob?.id]);
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
  const progress = activeProject ? projectProgress(activeProject, tasks) : null;
  const latestJob = [...jobs].sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const latestBuild = [...jobs].filter(job => String(job.kind || "").toLowerCase().includes("build")).sort((a,b) => String(getDate(b) || "").localeCompare(String(getDate(a) || "")))[0] || null;
  const totalAssets = activeProjects.reduce((sum, project) => sum + (Array.isArray(project.assets) ? project.assets.length : 0), 0);
  const toolchainKeys = [["blender","Blender"],["godot","Godot"],["ffmpeg","FFmpeg"],["ffprobe","FFprobe"],["java","Java"],["adb","ADB"]];
  const reportedTools = localAgentCapabilities?.tools || null;
  const availableTools = reportedTools ? toolchainKeys.filter(([key]) => reportedTools[key]?.available).length : null;
  const pipeline = [
    { id: "backlog", label: "BACKLOG", tone: "slate" },
    { id: "in_progress", label: "IN PROGRESS", tone: "cyan" },
    { id: "in_review", label: "IN REVIEW", tone: "amber" },
    { id: "done", label: "DONE", tone: "green" }
  ];
  const latestProgress = latestJob?.progress != null && Number.isFinite(Number(latestJob.progress))
    ? Math.max(0, Math.min(100, Number(latestJob.progress))) : null;
  const status = latestJob?.state === "running" || latestJob?.state === "queued" || latestJob?.state === "in_progress" ? "IN PRODUCTION"
    : activeProject?.build?.lastBuildStatus ? String(activeProject.build.lastBuildStatus).replaceAll("_"," ").toUpperCase()
    : "STATUS NOT REPORTED";
  const engineLabel = typeof activeProject?.engine === "string" ? activeProject.engine
    : activeProject?.engine?.name || activeProject?.settings?.engine || "Engine not reported";

  return <div className="nexora-overview">
    <section className="nx-stats-grid">
      <StatCard label="Active Projects" value={String(activeProjects.length).padStart(2, "0")} detail="Non-archived projects" icon={Folder} tone="cyan" trend={makeTrend(activeProjects)}/>
      <StatCard label={dateRange === "week" ? "Builds This Week" : dateRange === "month" ? "Builds This Month" : "Builds · All Time"} value={buildJobs.length} detail={buildJobs.length ? "Build jobs in the selected period" : "No build records in this period"} icon={Activity} tone="purple" trend={makeTrend(buildJobs)}/>
      <StatCard label="Build Success" value={successRate} detail={finishedBuilds.length ? successfulBuilds + " successful · " + (finishedBuilds.length - successfulBuilds) + " failed · n=" + finishedBuilds.length : "No completed or failed builds in this period"} icon={CheckCircle2} tone="green" trend={makeTrend(buildJobs.filter(job => job.state === "completed"))}/>
      <StatCard label="Assets" value={totalAssets} detail="Assets in loaded projects" icon={HardDrive} tone="amber" trend={makeTrend(activeProjects.flatMap(project => project.assets || []))}/>
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
            <div className="nx-project-context"><span>{engineLabel}</span><span>{getDate(activeProject) ? "Updated " + shortTime(getDate(activeProject)) : "Last edit time not reported"}</span></div>
            <div className="nx-hero-progress"><div><span style={{ width: (progress ?? latestProgress ?? 0) + "%" }}/></div><strong>{progress ?? latestProgress ?? "—"}{progress != null || latestProgress != null ? "%" : ""}</strong></div>
            <div className="nx-hero-actions">
              <button type="button" onClick={() => onOpenProject(activeProject)}><Play size={15} fill="currentColor"/>Open Project</button>
              <button type="button" onClick={() => onNavigate("build")}><Box size={17}/>View Builds</button>
              <button type="button" onClick={() => onNavigate("ai")}><Sparkles size={15}/>Ask AI</button>
            </div>
          </div> : <div className="nx-hero-empty">
            <div className="nx-project-state"><span className="nx-live-dot"/>MAIN STUDIO</div>
            <h2>Your next game starts here</h2>
            <p>Create a project to unlock the editor, asset library and production tools</p>
            <button type="button" onClick={onNewProject}><FolderOpen size={15}/>New Project</button>
          </div>}
        </div>
      </article>

      <article className="nx-agent-card">
        <SectionTitle icon={Activity} action="Open Device Lab" onAction={() => onNavigate("device-lab")}>Local Agent</SectionTitle>
        <div className="nx-agent-status">
          <span className={"nx-agent-indicator "+(localAgentConnected ? "is-connected" : localAgentState === "checking" ? "is-checking" : "is-offline")}/>
          <div className="min-w-0">
            <strong>{localAgentConnected ? "Connected · account paired" : localAgentState === "checking" ? "Checking local agent" : "Agent offline"}</strong>
            <p>{localAgentConnected ? "The local capabilities endpoint responded and the paired account matches this session." : localAgentState === "checking" ? "Verifying the local agent and its account pairing." : "Pair or reconnect your desktop computer in Device Lab to run local production work."}</p>
          </div>
        </div>
        <div className="nx-agent-toolchain">
          <div className="nx-agent-toolchain-heading"><span>Toolchain verification</span><b>{availableTools == null ? "Not checked" : availableTools + "/" + toolchainKeys.length + " detected"}</b></div>
          {reportedTools ? <div className="nx-agent-tool-list">{toolchainKeys.map(([key,label])=><span key={key} className={reportedTools[key]?.available ? "is-available" : "is-missing"}>{reportedTools[key]?.available ? "✓" : "–"} {label}</span>)}</div> : <p className="nx-agent-no-tools">Tool inventory is not available in this session. Device Lab performs the detailed environment preflight.</p>}
        </div>
        <div className="nx-agent-actions">
          <span>{localAgentConnected ? "Local execution endpoint verified" : "Local builds are unavailable while offline"}</span>
          <button type="button" onClick={() => onNavigate("device-lab")}>{localAgentConnected ? "Manage Agent" : "Connect Computer"} <ArrowRight size={12}/></button>
        </div>
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
          }) : <div className="nx-recent-empty"><p>No projects to resume yet. Create a game to start building your workspace.</p><button type="button" onClick={onNewProject}>Create your first game <ArrowRight size={12}/></button></div>}
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
        <div className={"nx-build-status " + (apiStatus.state === "online" ? "is-online" : "is-offline")}><span>{apiStatus.state === "online" ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}</span>{apiStatus.state === "online" ? "NEXORA service reachable" : "NEXORA service unavailable"}</div>
        <div className="nx-build-latest">{latestBuild ? "Latest Build: " + (latestBuild.id || latestBuild.kind) + " · " + shortTime(getDate(latestBuild)) : "No production build recorded"}</div>
        <div className="nx-build-platforms"><span><Monitor size={13}/>PC</span><span><Smartphone size={13}/>ANDROID</span><span><Activity size={13}/>WEB</span></div>
        {latestProgress != null ? <div className="nx-build-progress"><div><i style={{width: latestProgress + "%"}}/></div><b>{latestProgress}%</b></div> : <div className="nx-build-no-progress">Worker progress not reported</div>}
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
          {(selectedJob.stage || selectedJob.current_stage) && <div className="nx-job-stage"><span>Current stage</span><strong>{selectedJob.stage || selectedJob.current_stage}</strong></div>}
          {Array.isArray(selectedJob.timeline || selectedJob.events || selectedJob.stages) && (selectedJob.timeline || selectedJob.events || selectedJob.stages).length > 0 && <section className="nx-job-timeline"><h3>Execution timeline</h3>{(selectedJob.timeline || selectedJob.events || selectedJob.stages).map((event,index)=><div key={event.id || event.name || event.stage || index}><i/><span><b>{event.name || event.stage || event.title || event.state || "Execution event"}</b><small>{event.message || event.detail || event.status || ""}{(event.timestamp || event.created_at) ? " · " + shortTime(event.timestamp || event.created_at) : ""}</small></span></div>)}</section>}
          <dl className="nx-job-metadata">
            <div><dt>Target</dt><dd>{selectedJob.target || "Not reported"}</dd></div>
            <div><dt>Created</dt><dd>{getDate(selectedJob) ? new Date(getDate(selectedJob)).toLocaleString() : "Timestamp unavailable"}</dd></div>
            <div><dt>Updated</dt><dd>{selectedJob.updatedAt || selectedJob.updated_at ? new Date(selectedJob.updatedAt || selectedJob.updated_at).toLocaleString() : "Timestamp unavailable"}</dd></div>
            <div><dt>Worker message</dt><dd>{selectedJob.message || "No message returned"}</dd></div>
          </dl>
          <section className="nx-job-log-section"><h3><Terminal size={15}/>Execution output</h3>
            {jobLogText != null ? <pre className="nx-job-log-output">{typeof jobLogText === "string" ? jobLogText : JSON.stringify(jobLogText,null,2)}</pre> : <div className="nx-job-log-unavailable">Logs were not included in this job response. This inspector displays only output returned by the API; it does not invent or fetch a separate log source.</div>}
          </section>
          {selectedJob.state === "failed" && ["scene.generate","build.export","playtest"].includes(selectedJob.kind) && onRetryJob && <button type="button" className="nx-job-retry" onClick={() => onRetryJob(selectedJob)}>Retry supported job <ArrowRight size={13}/></button>}
          <section className="nx-job-artifacts"><h3><HardDrive size={15}/>Artifacts</h3>
            {Array.isArray(selectedJob.artifacts) && selectedJob.artifacts.length ? selectedJob.artifacts.map((artifact,index)=><div key={artifact.id || index} className="nx-job-artifact-row"><span>{artifact.name || artifact.filename || artifact.label || "Output artifact"}</span>{artifact.url || artifact.download_url ? <a href={artifact.url || artifact.download_url} target="_blank" rel="noreferrer" aria-label="Open artifact"><ExternalLink size={14}/></a> : <small>Link unavailable</small>}</div>) : <div className="nx-job-log-unavailable">No artifact details returned for this job.</div>}
          </section>
        </div>
      </aside>
    </div>}
  </div>;
}
