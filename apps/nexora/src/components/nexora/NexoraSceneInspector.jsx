import React from "react";
import { Box, Save, Download, Trash2, Plus, RefreshCw } from "lucide-react";

export default function NexoraSceneInspector({
  project, nodes=[], selectedObject, selectedObjectId,
  onSelect, onAdd, onUpdate, onDeleteSelected,
  onSaveRevision, onExport, onDeleteProject, onCheckService,
  validationIssues=[],
}) {
  return <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(220px,.8fr)]">
    <div className="rounded-2xl border border-[#20334B] bg-[#101B2C] p-3">
      <div className="flex items-center justify-between"><h2 className="text-xs font-black text-slate-100">SCENE HIERARCHY</h2><span className="text-[9px] text-slate-500">{nodes.length} nodes</span></div>
      <div className="mt-3 max-h-[440px] space-y-1 overflow-auto">{nodes.map(object=><button key={object.id} type="button" onClick={()=>onSelect(object.id)} className={"flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-[10px] "+(selectedObject?.id===object.id?"border-cyan-500/50 bg-cyan-500/10 text-cyan-100":"border-transparent bg-[#0B1625] text-slate-300 hover:border-[#29415F]")}><Box size={13} className="shrink-0 text-cyan-300"/><span className="min-w-0 flex-1 truncate">{object.name}</span><span className="text-[8px] text-slate-600">{object.type}</span></button>)}</div>
      <button type="button" onClick={onAdd} disabled={!project} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold text-cyan-200 disabled:opacity-40"><Plus size={13}/> Add Scene Node</button>
    </div>
    <div className="rounded-2xl border border-[#20334B] bg-[#101B2C] p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-black text-slate-100">INSPECTOR</h2><span className="text-[9px] text-slate-500">{selectedObject?.type || "Nothing selected"}</span></div>
      {selectedObject ? <div className="space-y-3">
        <label className="block text-[10px] font-semibold text-slate-400">OBJECT NAME<input value={selectedObject.name||""} onChange={event=>onUpdate("name",event.target.value)} className="mt-1 w-full rounded-lg border border-[#29415F] bg-[#0B1625] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/60"/></label>
        {["position","rotation","scale"].map(field=><fieldset key={field}><legend className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{field}</legend><div className="grid grid-cols-3 gap-2">{(selectedObject[field]||[0,0,0]).map((value,index)=><label key={index} className="text-[8px] text-slate-600">{["X","Y","Z"][index]}<input type="number" step="0.1" value={value} onChange={event=>{const next=[...(selectedObject[field]||[0,0,0])];next[index]=Number(event.target.value);onUpdate(field,next);}} className="mt-1 w-full rounded-lg border border-[#29415F] bg-[#0B1625] px-2 py-2 text-[10px] text-slate-200 outline-none focus:border-cyan-400/60"/></label>)}</div></fieldset>)}
        <button type="button" onClick={onDeleteSelected} className="rounded-lg border border-rose-900/50 px-3 py-2 text-[10px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 size={12} className="mr-1 inline"/> Delete Selected Object</button>
      </div> : <div className="flex min-h-48 items-center justify-center text-center text-xs text-slate-500">Select a scene node to inspect its transform.</div>}
    </div>
    <div className="rounded-2xl border border-[#20334B] bg-[#101B2C] p-4">
      <h2 className="text-xs font-black text-slate-100">PROJECT OPERATIONS</h2>
      <div className="mt-3 space-y-2">
        <button type="button" onClick={onSaveRevision} disabled={!project} className="w-full rounded-lg border border-[#29415F] px-3 py-2 text-left text-[10px] font-bold text-slate-200 hover:border-cyan-500/50"><Save size={13} className="mr-2 inline text-cyan-300"/> Save Checkpoint</button>
        <button type="button" onClick={onExport} disabled={!project} className="w-full rounded-lg border border-[#29415F] px-3 py-2 text-left text-[10px] font-bold text-slate-200 hover:border-cyan-500/50"><Download size={13} className="mr-2 inline text-cyan-300"/> Export Project JSON</button>
        <button type="button" onClick={onCheckService} className="w-full rounded-lg border border-[#29415F] px-3 py-2 text-left text-[10px] font-bold text-slate-200 hover:border-cyan-500/50"><RefreshCw size={13} className="mr-2 inline text-cyan-300"/> Check Foundry Service</button>
        <button type="button" onClick={onDeleteProject} disabled={!project} className="w-full rounded-lg border border-rose-900/50 px-3 py-2 text-left text-[10px] font-bold text-rose-300 hover:bg-rose-500/10"><Trash2 size={13} className="mr-2 inline"/> Delete Project</button>
      </div>
      {validationIssues.length>0&&<div className="mt-4 rounded-lg border border-amber-700/40 bg-amber-500/5 p-2"><div className="text-[9px] font-black text-amber-200">VALIDATION ISSUES</div><ul className="mt-1 space-y-1 text-[9px] text-amber-100/80">{validationIssues.slice(0,6).map((issue,index)=><li key={index}>• {issue}</li>)}</ul></div>}
      {project&&<div className="mt-4 border-t border-white/5 pt-3 text-[9px] text-slate-500">Project: {project.name}<br/>Saved state: {project._remoteVersion?"Cloud document":"Local draft"}</div>}
    </div>
  </section>;
}
