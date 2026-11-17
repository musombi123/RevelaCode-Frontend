import React from "react";
import { Smartphone, PackageCheck, ShieldCheck, Cable, AlertTriangle } from "lucide-react";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300";

export default function AndroidBuildConsole({ settings, onChange, onBuild, iconAssets = [], disabled, deviceStatus = "Device testing requires the NEXORA desktop companion." }) {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));
  return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><Smartphone size={19}/></span><div><h3 className="font-black">Android Build Console</h3><p className="text-xs text-slate-500">Configure, compile and package a real Android game build.</p></div></div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Desktop build worker</span>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className={labelClass}>Application name<input className={inputClass} maxLength={48} value={settings.app_name} onChange={(e)=>update("app_name",e.target.value)}/></label>
      <label className={labelClass}>Package ID<input className={inputClass} maxLength={180} placeholder="ke.studio.game" value={settings.package_id} onChange={(e)=>update("package_id",e.target.value)}/></label>
      <label className={labelClass}>Version name<input className={inputClass} maxLength={32} value={settings.version_name} onChange={(e)=>update("version_name",e.target.value)}/></label>
      <label className={labelClass}>Version code<input className={inputClass} type="number" min="1" value={settings.version_code} onChange={(e)=>update("version_code",Math.max(1,Number(e.target.value)||1))}/></label>
      <label className={labelClass}>Build type<select className={inputClass} value={settings.build_type} onChange={(e)=>update("build_type",e.target.value)}><option value="debug">Debug · device testing</option><option value="release">Release · signed candidate</option></select></label>
      <label className={labelClass}>Package format<select className={inputClass} value={settings.artifact_format} onChange={(e)=>update("artifact_format",e.target.value)}><option value="apk">APK · direct installation</option><option value="aab">AAB · store distribution</option></select></label>
      <label className={labelClass}>Orientation<select className={inputClass} value={settings.orientation} onChange={(e)=>update("orientation",e.target.value)}><option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="sensor">Sensor · auto rotate</option></select></label>
      <label className={labelClass}>Launcher icon<select className={inputClass} value={settings.icon_asset_id || ""} onChange={(e)=>update("icon_asset_id",e.target.value || null)}><option value="">Use Godot default icon</option>{iconAssets.map((asset)=><option key={asset.id} value={asset.id}>{asset.name}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-slate-500">Upload a PNG in Asset Factory first. Godot uses it as the main launcher icon.</span></label>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
      {[["internet_permission","Internet access"],["camera_permission","Camera"],["microphone_permission","Microphone"]].map(([key,label])=><label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"><input type="checkbox" checked={Boolean(settings[key])} onChange={(e)=>update(key,e.target.checked)}/>{label}</label>)}
    </div>
    {settings.build_type === "release" && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle size={16} className="mt-0.5 shrink-0"/>Release builds require a protected signing keystore configured on the build worker. The console never asks for or stores your private signing password.</div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-500">The worker compiles the game, validates the package signature and stores the artifact with a checksum.</p><div className="flex flex-wrap gap-2"><button type="button" disabled={disabled} onClick={()=>onBuild({ ...settings, build_type: "debug", artifact_format: "apk" })} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"><PackageCheck size={14}/> Build debug APK</button><button type="button" disabled={disabled} onClick={()=>onBuild(settings)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><ShieldCheck size={14}/> Build selected package</button></div></div>
    <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500 dark:border-slate-800"><Cable size={15} className="mt-0.5 shrink-0"/>{deviceStatus} USB/wireless ADB installation and logcat must run through a trusted local desktop agent; a cloud worker cannot access your computer's connected phone.</div>
  </section>;
}
