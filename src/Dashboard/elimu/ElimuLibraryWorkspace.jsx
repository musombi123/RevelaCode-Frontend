import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Loader2, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";
import { useElimuApi } from "@/services/elimuApi.jsx";

function unwrap(value) {
  let current = value;
  for (let i = 0; i < 6; i += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return current;
    if (Object.prototype.hasOwnProperty.call(current, "data")) { current = current.data; continue; }
    if (Object.prototype.hasOwnProperty.call(current, "result")) { current = current.result; continue; }
    return current;
  }
  return current;
}
function rows(value,key) { const data=unwrap(value); if(Array.isArray(data))return data; if(Array.isArray(data?.[key]))return data[key]; if(Array.isArray(data?.data?.[key]))return data.data[key]; return []; }
function errText(error) { return error?.payload?.message || error?.payload?.error?.message || error?.message || "The request could not be completed."; }
function bookId(row) { return row?.id || row?._id || row?.book_id || ""; }
function loanId(row) { return row?.id || row?._id || row?.loan_id || ""; }
function Field({ label,name,value,onChange,type="text",required=false,placeholder="" }) { return <label className="block min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}<input name={name} type={type} required={required} min={type==="number"?1:undefined} value={value??""} onChange={onChange} placeholder={placeholder} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label>; }

export default function ElimuLibraryWorkspace({ role="", school }) {
  const api=useElimuApi();
  const [books,setBooks]=useState([]);
  const [loans,setLoans]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [query,setQuery]=useState("");
  const [bookForm,setBookForm]=useState({title:"",author:"",isbn:"",category:"Textbook",shelf_location:"",copies_total:"1",description:""});
  const [loanForm,setLoanForm]=useState({book_id:"",borrower_name:"",admission_number:"",due_date:"",notes:""});
  const schoolName=school?.name||school?.school_name||"Your school";

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const r=await Promise.allSettled([api.getLibraryBooks(),api.getLibraryLoans()]);
    if(r[0].status==="fulfilled") setBooks(rows(r[0].value,"books")); else setError(errText(r[0].reason));
    if(r[1].status==="fulfilled") setLoans(rows(r[1].value,"loans")); else if(r[0].status==="fulfilled") setError(errText(r[1].reason));
    setLoading(false);
  },[api]);
  useEffect(()=>{load();},[load]);
  const change=(setter)=>(e)=>setter(old=>({...old,[e.target.name]:e.target.value}));
  const addBook=async(e)=>{
    e.preventDefault();setSaving("book");setError("");setNotice("");
    try{await api.createLibraryBook({...bookForm,copies_total:Number(bookForm.copies_total||1)});setBookForm({title:"",author:"",isbn:"",category:"Textbook",shelf_location:"",copies_total:"1",description:""});setNotice("Book added to the school catalogue.");await load();}
    catch(ex){setError(errText(ex));}finally{setSaving("");}
  };
  const issueBook=async(e)=>{
    e.preventDefault();setSaving("loan");setError("");setNotice("");
    try{await api.createLibraryLoan(loanForm);setLoanForm({book_id:"",borrower_name:"",admission_number:"",due_date:"",notes:""});setNotice("Book issued and the available-copy count updated.");await load();}
    catch(ex){setError(errText(ex));}finally{setSaving("");}
  };
  const returnBook=async(loan)=>{
    const id=loanId(loan);if(!id)return setError("This loan record has no valid ID.");
    setSaving(id);setError("");setNotice("");
    try{await api.returnLibraryLoan(id);setNotice("Book return recorded; available copies updated.");await load();}
    catch(ex){setError(errText(ex));}finally{setSaving("");}
  };
  const filtered=books.filter(book=>JSON.stringify(book).toLowerCase().includes(query.toLowerCase()));
  const activeLoans=loans.filter(loan=>["active","overdue"].includes(String(loan.status||"").toLowerCase()));
  return <div className="space-y-5">
    <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Elimu · Optional staff workspace</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">School library</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Maintain the catalogue, track available copies, and record book check-outs and returns using the school's shared Elimu backend.</p><p className="mt-2 text-xs text-slate-400">{schoolName}</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 sm:self-auto"><RefreshCw size={15} className={loading?"animate-spin":""}/>Refresh</button></div></header>
    {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}
    {notice&&<div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 size={16}/>{notice}</div>}
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">Catalogue titles</p><p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{books.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">Active loans</p><p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{activeLoans.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-500">Copies available</p><p className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{books.reduce((sum,book)=>sum+Number(book.copies_available||0),0)}</p></div></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5"><div className="mb-4"><h2 className="font-bold text-slate-950 dark:text-white">Add catalogue title</h2><p className="mt-1 text-xs leading-5 text-slate-500">Copies available are maintained automatically when books are issued and returned.</p></div><form onSubmit={addBook} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Book title" name="title" value={bookForm.title} onChange={change(setBookForm)} required/><Field label="Author" name="author" value={bookForm.author} onChange={change(setBookForm)}/><Field label="ISBN / reference" name="isbn" value={bookForm.isbn} onChange={change(setBookForm)}/><Field label="Category / subject" name="category" value={bookForm.category} onChange={change(setBookForm)}/><Field label="Shelf location" name="shelf_location" value={bookForm.shelf_location} onChange={change(setBookForm)}/><Field label="Total copies" name="copies_total" type="number" value={bookForm.copies_total} onChange={change(setBookForm)} required/><Field label="Description" name="description" value={bookForm.description} onChange={change(setBookForm)}/><div className="flex items-end"><button disabled={saving==="book"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">{saving==="book"?<Loader2 size={16} className="animate-spin"/>:<Plus size={16}/>} Add book</button></div></form></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-bold text-slate-950 dark:text-white">Catalogue</h2><p className="mt-1 text-xs text-slate-500">Search titles, authors, ISBNs and categories.</p></div><label className="relative block w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Search library catalogue" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search catalogue…" className="min-h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"/></label></div>
    {loading?<p className="py-8 text-center text-sm text-slate-500">Loading catalogue…</p>:filtered.length===0?<p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">No catalogue titles found.</p>:<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-full divide-y divide-slate-200 text-left dark:divide-slate-800"><thead className="bg-slate-50 dark:bg-slate-900"><tr>{["Title / Author","Category / shelf","Copies","ISBN"].map(v=><th key={v} className="whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase text-slate-500">{v}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((book,index)=><tr key={bookId(book)||index}><td className="px-3 py-3"><p className="font-semibold text-slate-900 dark:text-white">{book.title}</p><p className="mt-0.5 text-xs text-slate-500">{book.author||"Author not recorded"}</p></td><td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">{book.category||"General"}<p className="mt-0.5 text-xs text-slate-500">{book.shelf_location||"Shelf not assigned"}</p></td><td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">{book.copies_available??0} available / {book.copies_total??0}</td><td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300">{book.isbn||"—"}</td></tr>)}</tbody></table></div>}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5"><div className="mb-4"><h2 className="font-bold text-slate-950 dark:text-white">Issue a book</h2><p className="mt-1 text-xs text-slate-500">Issuing a book decrements the available-copy count atomically on the backend.</p></div><form onSubmit={issueBook} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Available book<select name="book_id" value={loanForm.book_id} onChange={change(setLoanForm)} required className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="">Select available book</option>{books.filter(book=>Number(book.copies_available||0)>0).map((book,index)=><option key={bookId(book)||index} value={bookId(book)}>{book.title} · {book.copies_available} available</option>)}</select></label><Field label="Borrower name" name="borrower_name" value={loanForm.borrower_name} onChange={change(setLoanForm)} required/><Field label="Admission / borrower ID" name="admission_number" value={loanForm.admission_number} onChange={change(setLoanForm)}/><Field label="Due date" name="due_date" type="date" value={loanForm.due_date} onChange={change(setLoanForm)} required/><div className="sm:col-span-2 xl:col-span-4"><Field label="Loan notes" name="notes" value={loanForm.notes} onChange={change(setLoanForm)} placeholder="Optional note"/></div><div className="sm:col-span-2 xl:col-span-4"><button disabled={saving==="loan"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900">{saving==="loan"?<Loader2 size={16} className="animate-spin"/>:<BookOpen size={16}/>} Issue book</button></div></form></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5"><h2 className="font-bold text-slate-950 dark:text-white">Loan register</h2><p className="mb-4 mt-1 text-xs text-slate-500">Open loans can be returned here. Overdue state is calculated from the recorded due date.</p>{loans.length===0?<p className="py-7 text-center text-sm text-slate-500">No loan records yet.</p>:<div className="space-y-2">{loans.map((loan,index)=>{const status=String(loan.status||"active").toLowerCase();const id=loanId(loan);return <article key={id||index} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{loan.book_title||"Book"} → {loan.borrower_name||"Borrower"}</p><p className="mt-1 text-xs text-slate-500">{loan.admission_number ? loan.admission_number+" · " : ""}Due {loan.due_date||"not set"} · {status}</p></div>{["active","overdue"].includes(status)&&<button type="button" disabled={Boolean(saving)} onClick={()=>returnBook(loan)} className="inline-flex min-h-9 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><RotateCcw size={14}/>{saving===id?"Returning…":"Record return"}</button>}</article>})}</div>}</section>
  </div>;
}
