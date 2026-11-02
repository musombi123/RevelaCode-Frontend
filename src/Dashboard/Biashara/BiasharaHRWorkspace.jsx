import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, MapPin, Plus, RefreshCw, Users } from "lucide-react";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";

const unwrap = (v) => v?.data?.data ?? v?.data ?? v?.result ?? v;
const rows = (v) => {
  const x = unwrap(v);
  return Array.isArray(x) ? x : x?.items || x?.employees || x?.attendance || x?.rows || [];
};
const idOf = (x) => String(x?.id || x?._id || "");
const timeLabel = (v) => v ? new Date(v).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }) : "—";
const mins = (v) => { const n=Math.max(0,Number(v)||0); return Math.floor(n/60) ? `${Math.floor(n/60)}h ${n%60}m` : `${n}m`; };
const Field = ({label,value,onChange,type="text",required=false}) => <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span><input type={type} required={required} value={value ?? ""} onChange={e=>onChange(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600"/></label>;
const Panel = ({title,children}) => <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="mb-4 text-base font-bold text-slate-950">{title}</h2>{children}</section>;
const Empty = ({children}) => <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;

async function gps() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return {};
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(
    p => resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy_meters:p.coords.accuracy}),
    () => resolve({}),
    {enableHighAccuracy:true,timeout:8000,maximumAge:60000},
  ));
}

export default function BiasharaHRWorkspace({business,onRefresh}) {
  const {
    getBiasharaEmployees,createBiasharaEmployee,getBiasharaAttendance,
    getBiasharaMyAttendance,clockInBiashara,clockOutBiashara,
  } = useJumuiyaApi();
  const businessId=String(business?.id || business?._id || "");
  const [tab,setTab]=useState("employees");
  const [employees,setEmployees]=useState([]);
  const [attendance,setAttendance]=useState([]);
  const [mine,setMine]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [form,setForm]=useState({name:"",phone:"",email:"",user_id:"",department:"",job_title:"",role:"employee",shift_start:"08:00",shift_end:"17:00",late_grace_minutes:"10"});

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const results=await Promise.allSettled([
      getBiasharaEmployees(businessId),
      getBiasharaAttendance(businessId),
      getBiasharaMyAttendance(businessId),
    ]);
    if(results[0].status==="fulfilled")setEmployees(rows(results[0].value));
    if(results[1].status==="fulfilled")setAttendance(rows(results[1].value));
    if(results[2].status==="fulfilled")setMine(unwrap(results[2].value));
    const failures=results.slice(0,2).filter(x=>x.status==="rejected");
    if(failures.length)setError(failures.map(x=>x.reason?.message||"An HR service could not be loaded.").join(" "));
    setLoading(false);
  },[businessId,getBiasharaEmployees,getBiasharaAttendance,getBiasharaMyAttendance]);
  useEffect(()=>{load();},[load]);

  const run=async(action,message)=>{
    setSaving(true);setError("");setNotice("");
    try{await action();setNotice(message);await load();if(typeof onRefresh==="function")await onRefresh();}
    catch(e){setError(e?.message||"The HR operation failed.");}
    finally{setSaving(false);}
  };
  const submitEmployee=e=>{
    e.preventDefault();
    run(async()=>{
      await createBiasharaEmployee(businessId,{...form,name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim(),user_id:form.user_id.trim(),late_grace_minutes:Number(form.late_grace_minutes)});
      setForm({name:"",phone:"",email:"",user_id:"",department:"",job_title:"",role:"employee",shift_start:"08:00",shift_end:"17:00",late_grace_minutes:"10"});
    },"Employee registered and System ID generated.");
  };
  const clock=kind=>run(async()=>{
    const location=await gps();
    if(kind==="in")await clockInBiashara(businessId,location);
    else await clockOutBiashara(businessId,location);
  },kind==="in"?"Clock-in recorded.":"Clock-out recorded.");

  return <div className="min-h-full bg-slate-50 px-3 py-4 sm:px-5 sm:py-6"><div className="mx-auto max-w-screen-2xl space-y-4">
    <header className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-lg sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-xs font-semibold text-blue-200"><Users size={14}/> Company people operations</div>
        <h1 className="text-2xl font-bold sm:text-3xl">HR & Attendance</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Employee register, System IDs, shifts and clock-in/out for {business?.name||"this company"}.</p>
      </div><button type="button" onClick={load} disabled={loading||saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold"><RefreshCw size={16}/> Refresh HR</button></div>
    </header>
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">{[["employees","Employees",Users],["attendance","Attendance log",CalendarClock],["my-shift","My shift",Clock3]].map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${tab===key?"bg-blue-700 text-white":"text-slate-600 hover:bg-slate-100"}`}><Icon size={16}/>{label}</button>)}</nav>
    {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

    {tab==="employees"&&<div className="space-y-4">
      <Panel title="Register employee"><p className="mb-4 text-xs leading-5 text-slate-500">The System ID identifies the employee. For self-service attendance, link an account that has already accepted a company invitation with the Employee role. HR records do not create logins or grant permissions.</p>
        <form onSubmit={submitEmployee} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Full name" required value={form.name} onChange={v=>setForm(x=>({...x,name:v}))}/>
          <Field label="Phone" required value={form.phone} onChange={v=>setForm(x=>({...x,phone:v}))}/>
          <Field label="Email" type="email" value={form.email} onChange={v=>setForm(x=>({...x,email:v}))}/>
          <Field label="Existing company User ID (optional)" value={form.user_id} onChange={v=>setForm(x=>({...x,user_id:v}))}/>
          <Field label="Department" value={form.department} onChange={v=>setForm(x=>({...x,department:v}))}/>
          <Field label="Job title" value={form.job_title} onChange={v=>setForm(x=>({...x,job_title:v}))}/>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Platform role</span><select value={form.role} onChange={e=>setForm(x=>({...x,role:e.target.value}))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="employee">Employee</option><option value="factory_floor_lead">Factory Floor Lead</option><option value="sales_agent">Sales Agent</option><option value="store_keeper">Store Keeper</option><option value="accountant">Accountant</option><option value="hr_manager">HR Manager</option><option value="operations_manager">Operations Manager</option><option value="manager">Manager</option></select></label>
          <Field label="Shift start (24h)" required value={form.shift_start} onChange={v=>setForm(x=>({...x,shift_start:v}))}/>
          <Field label="Shift end (24h)" required value={form.shift_end} onChange={v=>setForm(x=>({...x,shift_end:v}))}/>
          <Field label="Late grace (minutes)" type="number" value={form.late_grace_minutes} onChange={v=>setForm(x=>({...x,late_grace_minutes:v}))}/>
          <div className="flex items-end"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50"><Plus size={16}/>{saving?"Saving…":"Register employee"}</button></div>
        </form>
      </Panel>
      <Panel title={`Employee register · ${employees.length}`}>{loading?<p className="text-sm text-slate-500">Loading…</p>:employees.length?<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-slate-500"><th className="py-3 pr-3">System ID</th><th className="py-3 pr-3">Employee</th><th className="py-3 pr-3">Department</th><th className="py-3 pr-3">Role</th><th className="py-3 pr-3">Shift</th><th>Status</th></tr></thead><tbody>{employees.map(x=><tr key={idOf(x)} className="border-b border-slate-50"><td className="py-3 pr-3 font-mono text-xs font-bold text-blue-700">{x.system_id}</td><td className="py-3 pr-3"><b>{x.name}</b><p className="text-xs text-slate-500">{x.phone}</p></td><td className="py-3 pr-3">{x.department||"—"}</td><td className="py-3 pr-3 capitalize">{String(x.role||"employee").replace(/_/g," ")}</td><td className="py-3 pr-3">{x.shift_start}–{x.shift_end}</td><td>{x.status}</td></tr>)}</tbody></table></div>:<Empty>No employees registered yet.</Empty>}</Panel>
    </div>}

    {tab==="attendance"&&<Panel title="Attendance register"><p className="mb-4 text-xs text-slate-500">Times are stored in UTC and displayed in Africa/Nairobi. Late minutes use each employee's configured shift start and grace period.</p>{loading?<p>Loading…</p>:attendance.length?<div className="space-y-3">{attendance.map(x=><div key={idOf(x)} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-slate-900">{x.employee_name||x.system_id}</b><p className="text-xs text-slate-500">{x.system_id} · {x.local_date}</p><p className="text-xs text-slate-500">In: {timeLabel(x.clock_in_at)} · Out: {timeLabel(x.clock_out_at)}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1">Late {mins(x.late_minutes)}</span><span className="rounded-full bg-slate-100 px-3 py-1">Worked {x.worked_minutes==null?"Open":mins(x.worked_minutes)}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Overtime {x.overtime_minutes==null?"—":mins(x.overtime_minutes)}</span></div></div>)}</div>:<Empty>No attendance records yet.</Empty>}</Panel>}

    {tab==="my-shift"&&<Panel title="My attendance"><p className="mb-4 text-xs leading-5 text-slate-500">Clocking is available after HR links your login to an active employee record. GPS permission is optional. The timestamp is saved even when location is declined.</p>{mine?.employee?<div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Employee</p><p className="mt-1 text-lg font-bold text-slate-900">{mine.employee.name}</p><p className="font-mono text-sm text-blue-700">{mine.employee.system_id}</p></div>
      {mine.open_shift?<div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><b className="text-amber-900">Shift open</b><p className="mt-1 text-xs text-amber-800">Clocked in {timeLabel(mine.open_shift.clock_in_at)}</p><button type="button" disabled={saving} onClick={()=>clock("out")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"><CheckCircle2 size={16}/> Clock out</button></div>:<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><b className="text-emerald-900">No open shift</b><button type="button" disabled={saving} onClick={()=>clock("in")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white"><MapPin size={16}/> Clock in</button></div>}
      <div><h3 className="mb-2 text-sm font-bold">Recent shifts</h3>{(mine.recent||[]).map(x=><div key={idOf(x)} className="flex justify-between border-b border-slate-100 py-2 text-xs"><span>{x.local_date} · {timeLabel(x.clock_in_at)}</span><b>{x.worked_minutes==null?"Open":mins(x.worked_minutes)}</b></div>)}</div>
    </div>:<Empty>Your login is not linked to an employee record. Ask HR to link your account to a company System ID.</Empty>}</Panel>}

    <footer className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Attendance timestamps are auditable. GPS is optional. No face recognition or biometric template is collected.</span><span className="inline-flex items-center gap-1.5"><CalendarClock size={14}/> Africa/Nairobi</span></footer>
  </div></div>;
}
