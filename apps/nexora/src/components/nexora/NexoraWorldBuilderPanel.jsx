import React, { useCallback, useEffect, useState } from "react";
import { Cloud, Droplets, Layers3, Plus, RefreshCw, Save, Sun, Trash2 } from "lucide-react";

const surface = "rounded-2xl border border-[#20334B] bg-[#101B2C]";
const defaultWorld = (project) => ({
  seed: Number(project?.seed || 784215),
  world: { width:96,depth:96,resolution:48,amplitude:9,frequency:0.055,biomes:["rocky-desert","alien-forest"],weather:true },
  objects: [],
  terrain_edits: [],
  sun_angle: -28,
  fog: true,
  water_level: -1.5,
});
const input = "mt-1 w-full rounded-lg border border-[#29415F] bg-[#0B1625] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400/60";
const label = "block text-[10px] font-semibold text-slate-400";

export default function NexoraWorldBuilderPanel({project,cloudProjectActive,nexoraAuthFetch,onNotice}) {
  const [document,setDocument] = useState(()=>defaultWorld(project));
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [loaded,setLoaded] = useState(false);

  const loadWorld = useCallback(async ()=>{
    if (!project?._remoteVersion || !cloudProjectActive) {
      setDocument(defaultWorld(project));
      setLoaded(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await nexoraAuthFetch("/api/projects/"+encodeURIComponent(project.id)+"/world", {headers:{Accept:"application/json"},cache:"no-store"});
      const payload = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(payload?.detail || "World document could not be loaded.");
      const base = defaultWorld(project);
      setDocument({
        ...base,
        ...payload,
        seed:Number(payload.seed ?? base.seed),
        world:{...base.world,...(payload.world||{})},
        objects:Array.isArray(payload.objects)?payload.objects:[],
        terrain_edits:Array.isArray(payload.terrain_edits)?payload.terrain_edits:[],
        sun_angle:Number(payload.sun_angle ?? base.sun_angle),
        fog:payload.fog ?? base.fog,
        water_level:Number(payload.water_level ?? base.water_level),
      });
      setLoaded(true);
    } catch (e) {
      setError(e.message || "World document could not be loaded.");
      setLoaded(false);
    } finally {setLoading(false);}
  },[project?.id,project?._remoteVersion,cloudProjectActive,nexoraAuthFetch]);

  useEffect(()=>{loadWorld();},[loadWorld]);

  const patchWorld = (field,value) => setDocument(current=>({...current,world:{...current.world,[field]:value}}));
  const patchObject = (id,field,value) => setDocument(current=>({...current,objects:current.objects.map(item=>item.id===id?{...item,[field]:value}:item)}));
  const patchTerrainEdit = (id,field,value) => setDocument(current=>({...current,terrain_edits:current.terrain_edits.map(item=>item.id===id?{...item,[field]:value}:item)}));
  const addObject = () => setDocument(current=>({...current,objects:[...current.objects,{id:"world-object-"+Date.now().toString(36),name:"New World Object",kind:"crate",x:0,y:0,z:0,rotation:0,scale:1,color:"#8ba7c7",model_asset_id:null}]}));
  const addTerrainEdit = () => setDocument(current=>({...current,terrain_edits:[...current.terrain_edits,{id:"terrain-edit-"+Date.now().toString(36),operation:"raise",x:0,z:0,radius:6,strength:2}]}));

  const saveWorld = async () => {
    if (!project?._remoteVersion || !cloudProjectActive) {
      setError("Save or migrate this project to NEXORA cloud before persisting its world document.");
      return;
    }
    setSaving(true);setError("");
    try {
      const response=await nexoraAuthFetch("/api/projects/"+encodeURIComponent(project.id)+"/world",{
        method:"PUT",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(document),
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(payload?.detail || "World document could not be saved.");
      setDocument(current=>({...current,...payload,world:{...current.world,...(payload.world||{})}}));
      setLoaded(true);
      onNotice?.("World settings and scene objects saved to the NEXORA project.");
    }catch(e){setError(e.message||"World save failed.");}
    finally{setSaving(false);}
  };

  if(!project) return <div className={surface+" p-6 text-center"}><h2 className="text-sm font-extrabold text-white">Select a project first</h2><p className="mt-1 text-xs text-slate-500">World Builder stores terrain settings and scene objects inside the selected project.</p></div>;

  return <div className="space-y-4">
    <div className={surface+" flex flex-wrap items-center justify-between gap-3 p-4"}>
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300"><Layers3 size={20}/></span><div><h2 className="text-sm font-extrabold text-white">World Builder</h2><p className="mt-1 text-[10px] text-slate-500">{project.name} · persisted WorldDocument</p></div></div>
      <div className="flex items-center gap-2"><span className={"rounded-lg px-2 py-1 text-[9px] font-bold "+(loaded?"bg-emerald-500/10 text-emerald-300":"bg-amber-500/10 text-amber-200")}>{loaded?"CLOUD WORLD LOADED":"NOT SAVED / LOCAL"}</span><button type="button" onClick={loadWorld} disabled={loading} className="rounded-lg border border-[#29415F] px-3 py-2 text-[10px] font-bold text-slate-300"><RefreshCw size={12} className="mr-1 inline"/> Refresh</button><button type="button" onClick={saveWorld} disabled={saving||!cloudProjectActive} className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-black text-[#04111A] disabled:opacity-40"><Save size={12} className="mr-1 inline"/>{saving?"Saving…":"Save World"}</button></div>
    </div>
    {!cloudProjectActive&&<div className="rounded-xl border border-amber-700/40 bg-amber-500/5 p-3 text-[11px] text-amber-100">This project is a local draft. World Builder can edit the draft in memory, but durable server saving is enabled only for cloud-synced projects.</div>}
    {loading&&<div className="text-xs text-cyan-200">Loading saved world document…</div>}
    {error&&<div role="alert" className="rounded-xl border border-rose-800/50 bg-rose-500/5 p-3 text-xs text-rose-200">{error}</div>}

    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.85fr)]">
      <section className={surface+" overflow-hidden"}>
        <div className="flex items-center justify-between border-b border-[#20334B] px-4 py-3"><h3 className="flex items-center gap-2 text-xs font-extrabold text-white"><Layers3 size={16} className="text-cyan-300"/> World configuration</h3><span className="text-[9px] text-slate-500">Terrain parameters</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className={label}>WORLD SEED<input className={input} type="number" min="0" max="4294967295" value={document.seed} onChange={e=>setDocument(current=>({...current,seed:Number(e.target.value)}))}/></label>
          <label className={label}>WIDTH<input className={input} type="number" min="16" max="512" value={document.world.width} onChange={e=>patchWorld("width",Number(e.target.value))}/></label>
          <label className={label}>DEPTH<input className={input} type="number" min="16" max="512" value={document.world.depth} onChange={e=>patchWorld("depth",Number(e.target.value))}/></label>
          <label className={label}>RESOLUTION<input className={input} type="number" min="8" max="256" value={document.world.resolution} onChange={e=>patchWorld("resolution",Number(e.target.value))}/></label>
          <label className={label}>TERRAIN AMPLITUDE<input className={input} type="number" min="0" max="100" step="0.5" value={document.world.amplitude} onChange={e=>patchWorld("amplitude",Number(e.target.value))}/></label>
          <label className={label}>FREQUENCY<input className={input} type="number" min="0.002" max="1" step="0.001" value={document.world.frequency} onChange={e=>patchWorld("frequency",Number(e.target.value))}/></label>
          <label className={label}>BIOMES (COMMA SEPARATED)<input className={input} value={(document.world.biomes||[]).join(", ")} onChange={e=>patchWorld("biomes",e.target.value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,16))}/></label>
          <label className={label}>SUN ANGLE<input className={input} type="number" min="-180" max="180" value={document.sun_angle} onChange={e=>setDocument(current=>({...current,sun_angle:Number(e.target.value)}))}/></label>
          <label className={label}>WATER LEVEL<input className={input} type="number" min="-20" max="20" step="0.1" value={document.water_level} onChange={e=>setDocument(current=>({...current,water_level:Number(e.target.value)}))}/></label>
        </div>
        <div className="flex flex-wrap gap-5 border-t border-white/5 px-4 py-3">
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={Boolean(document.world.weather)} onChange={e=>patchWorld("weather",e.target.checked)} className="accent-cyan-400"/> Weather enabled</label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={Boolean(document.fog)} onChange={e=>setDocument(current=>({...current,fog:e.target.checked}))} className="accent-cyan-400"/> Fog enabled</label>
        </div>
        <div className="border-t border-[#20334B] p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-extrabold text-white">World objects</h3><button type="button" onClick={addObject} className="rounded-lg border border-cyan-500/30 px-3 py-2 text-[10px] font-bold text-cyan-200"><Plus size={12} className="mr-1 inline"/> Add Object</button></div>
          <div className="space-y-2">
            {document.objects.map(item=><div key={item.id} className="grid gap-2 rounded-xl border border-[#29415F] bg-[#0B1625] p-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className={label}>NAME<input className={input} maxLength="80" value={item.name} onChange={e=>patchObject(item.id,"name",e.target.value)}/></label>
              <label className={label}>KIND<select className={input} value={item.kind} onChange={e=>patchObject(item.id,"kind",e.target.value)}>{["outpost","beacon","tree","rock","crate","custom"].map(value=><option key={value}>{value}</option>)}</select></label>
              <div className="grid grid-cols-3 gap-1">
                {["x","y","z"].map(axis=><label key={axis} className={label}>{axis.toUpperCase()}<input className={input} type="number" step="0.1" value={item[axis] ?? 0} onChange={e=>patchObject(item.id,axis,Number(e.target.value))}/></label>)}
              </div>
              <label className={label}>ROTATION<input className={input} type="number" min="-360" max="360" step="1" value={item.rotation ?? 0} onChange={e=>patchObject(item.id,"rotation",Number(e.target.value))}/></label>
              <div className="flex items-end justify-between gap-2"><label className={label}>SCALE<input className={input} type="number" min="0.25" max="4" step="0.1" value={item.scale} onChange={e=>patchObject(item.id,"scale",Number(e.target.value))}/></label><label className={label}>COLOR<input className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-[#29415F] bg-[#0B1625] p-1" type="color" value={item.color || "#8ba7c7"} onChange={e=>patchObject(item.id,"color",e.target.value)}/></label><button type="button" onClick={()=>setDocument(current=>({...current,objects:current.objects.filter(row=>row.id!==item.id)}))} className="mb-1 rounded-lg border border-rose-900/50 p-2 text-rose-300" aria-label="Remove world object"><Trash2 size={13}/></button></div>
            </div>)}
            {!document.objects.length&&<p className="rounded-lg border border-dashed border-[#29415F] p-5 text-center text-[10px] text-slate-500">No custom world objects yet.</p>}
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <section className={surface+" p-4"}>
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-extrabold text-white"><Sun size={16} className="text-amber-300"/> Terrain & atmosphere</h3><span className="text-[9px] text-slate-500">Saved parameters</span></div>
          <div className="rounded-xl border border-[#29415F] bg-[radial-gradient(circle_at_50%_40%,rgba(16,213,242,.16),transparent_42%),linear-gradient(135deg,#172A42,#0A1422)] p-5">
            <div className="grid grid-cols-4 gap-2">{Array.from({length:16},(_,i)=><span key={i} className="aspect-square rounded-md border border-cyan-200/10 bg-emerald-300/5" style={{opacity:.25+(i%4)*.12}}/>)}</div>
            <p className="mt-3 text-center text-[9px] text-slate-400">World specification preview · generated terrain appears after a Foundry build</p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span><Cloud size={12} className="mr-1 inline"/> Weather</span><b className={document.world.weather?"text-emerald-300":"text-slate-500"}>{document.world.weather?"Enabled":"Disabled"}</b></div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span><Droplets size={12} className="mr-1 inline"/> Water level</span><b className="text-cyan-200">{document.water_level}</b></div>
        </section>
        <section className={surface+" p-4"}>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-extrabold text-white">Terrain sculpt operations</h3><button type="button" onClick={addTerrainEdit} className="rounded-lg border border-cyan-500/30 px-2 py-1.5 text-[9px] font-bold text-cyan-200"><Plus size={11} className="mr-1 inline"/> Add</button></div>
          <div className="space-y-2">{document.terrain_edits.map(edit=><div key={edit.id} className="rounded-lg border border-[#29415F] bg-[#0B1625] p-2">
            <div className="flex items-center gap-2"><select value={edit.operation} onChange={e=>patchTerrainEdit(edit.id,"operation",e.target.value)} className="min-w-0 flex-1 rounded-md border border-[#29415F] bg-[#101B2C] px-2 py-1.5 text-[10px] text-slate-200">{["raise","lower","smooth"].map(value=><option key={value}>{value}</option>)}</select><button type="button" onClick={()=>setDocument(current=>({...current,terrain_edits:current.terrain_edits.filter(row=>row.id!==edit.id)}))} className="rounded border border-rose-900/50 p-1.5 text-rose-300" aria-label="Remove terrain edit"><Trash2 size={12}/></button></div>
            <div className="mt-2 grid grid-cols-2 gap-2">{["x","z","radius","strength"].map(key=><label key={key} className={label}>{key.toUpperCase()}<input type="number" step="0.1" value={edit[key]} onChange={e=>patchTerrainEdit(edit.id,key,Number(e.target.value))} className="mt-1 w-full rounded-md border border-[#29415F] bg-[#101B2C] px-2 py-1.5 text-[10px] text-white"/></label>)}</div>
          </div>)}{!document.terrain_edits.length&&<p className="text-[10px] text-slate-500">No terrain sculpt operations saved.</p>}</div>
        </section>
      </div>
    </div>
  </div>;
}
