import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "@capacitor/app";
import {
  ArrowLeft, Copy, Filter, Save, X
} from "lucide-react";
import FaithWorkspaceLayout from "./faith/workspace/FaithWorkspaceLayout.jsx";
import StudyReader from "./study/StudyReader.jsx";
import StudyFeed from "./study/StudyFeed.jsx";
import SdaLessonAIChat from "./faith/SdaLessonAIChat.jsx";
import { ATLAS_NODES } from "./faith/FaithAtlas.jsx";
import {
  AskBar, ConnectivityPill, StartChainCard, ChainList, ChainBuilder,
  AddPassageSheet, PassageDetailSheet, LibraryStatusCard
} from "./faith/ReferentialMobileComponents.jsx";

const CHAINS_KEY = "revelacode_referential_saved_chains_v1";
const ATLAS_HANDOFF_KEY = "revelacode_referential_pending_atlas_chain";
const BIBLE_REFERENCE_KEY = "revelacode_pending_bible_reference";

function readSavedChains() {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem(CHAINS_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter(item => item && typeof item === "object" && item.id && Array.isArray(item.passages)) : [];
  } catch {
    return [];
  }
}

function newId(prefix = "chain") {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return prefix + "-" + crypto.randomUUID();
  } catch {}
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function isBibleReference(value) {
  return /^(?:(?:1|2|3)\s*)?[A-Za-z][A-Za-z\s]*\s+\d{1,3}(?::\s*\d{1,3}(?:\s*[-–—]\s*\d{1,3})?)?$/.test(String(value || "").trim());
}

function atlasMatch(query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return null;
  const reference = value.match(/^(?:(?:1|2|3)\s*)?([a-z][a-z\s]*?)\s+(\\d{1,3})(?::|$)/i);
  if (reference) {
    const book = reference[1].replace(/\s+/g, " ").trim();
    const chapter = Number(reference[2]);
    const byChapter = ATLAS_NODES.find(node => {
      const nodeReference = String(node.reference || "").replace(/[–—]/g, "-").toLowerCase();
      return nodeReference.startsWith(book + " " + chapter + ":");
    });
    if (byChapter) return byChapter;
  }
  return ATLAS_NODES.find(node => {
    const searchable = [node.title, node.reference, node.category, node.summary, ...(node.textFocus || []), ...(node.questions || [])].join(" ").toLowerCase();
    return searchable.includes(value) || value.split(/\s+/).every(token => searchable.includes(token));
  }) || null;
}

function passageTextFromNode(node) {
  if (!node) return "";
  return [node.summary, node.studyLens, ...(node.textFocus || [])].filter(Boolean).join("\n\n");
}

function makeChain(value) {
  const seed = String(value || "").trim();
  if (!seed) return null;
  const node = atlasMatch(seed);
  const directReference = isBibleReference(seed);
  const reference = directReference ? seed : node?.reference || "Theme · " + seed;
  const title = directReference ? seed + " study chain" : seed;
  return {
    id: newId(),
    title,
    savedOffline: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passages: [{
      id: newId("passage"),
      reference,
      relation: "Starting passage",
      subtitle: node?.summary || (directReference ? "Starting point. Read the passage in its chapter context." : "A thematic starting point. Add supporting passages to build the chain."),
      text: passageTextFromNode(node),
    }],
  };
}

function formatLibraryStatus(status) {
  return status?.state || "loading";
}

export default function ReferentialDashboard({ user, onOpenAI, onNavigate, onBack }) {
  const userId = user?.id ?? user?._id ?? user?.user_id ?? user?.contact ?? "guest";
  const [chains, setChains] = useState(readSavedChains);
  const [chainInput, setChainInput] = useState("");
  const [activeChain, setActiveChain] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSheet, setActiveSheet] = useState("");
  const [passageDetail, setPassageDetail] = useState(null);
  const [addReference, setAddReference] = useState("");
  const [addRelation, setAddRelation] = useState("Same theme");
  const [addSubtitle, setAddSubtitle] = useState("");
  const [addText, setAddText] = useState("");
  const [connectionOffline, setConnectionOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  const [libraryStatus, setLibraryStatus] = useState({ state: "loading" });
  const [libraryRetrying, setLibraryRetrying] = useState(false);
  const [aiMaterial, setAiMaterial] = useState(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiCopied, setAiCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [saveError, setSaveError] = useState("");

  const onLibraryStatusChange = useCallback(next => {
    setLibraryStatus(next || { state: "loading" });
    if (next?.state && next.state !== "loading") setLibraryRetrying(false);
  }, []);

  useEffect(() => {
    const update = () => setConnectionOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  const closeSheet = () => {
    setActiveSheet("");
    setPassageDetail(null);
  };

  const handleBack = useCallback(() => {
    if (activeSheet) { setActiveSheet(""); setPassageDetail(null); return; }
    if (activeChain) { setActiveChain(null); setSavedToast(false); setSaveError(""); return; }
    if (selectedMaterial) { setSelectedMaterial(null); return; }
    if (typeof onBack === "function") onBack();
    else if (typeof onNavigate === "function") onNavigate("faith");
    else window.history.back();
  }, [activeSheet, activeChain, selectedMaterial, onBack, onNavigate]);

  useEffect(() => {
    const onEscape = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleBack();
      }
    };
    document.addEventListener("keydown", onEscape);
    let subscription;
    App.addListener("backButton", handleBack).then(result => { subscription = result; }).catch(() => {});
    return () => {
      document.removeEventListener("keydown", onEscape);
      subscription?.remove?.();
    };
  }, [handleBack]);

  const startChain = () => {
    const next = makeChain(chainInput);
    if (!next) return;
    setActiveChain(next);
    setChainInput("");
    setSaveError("");
    setSavedToast(false);
  };

  const updateActiveChain = next => {
    setActiveChain(next);
    setSavedToast(false);
    setSaveError("");
  };

  const saveChain = () => {
    if (!activeChain || !Array.isArray(activeChain.passages) || !activeChain.passages.length) return;
    const saved = {
      ...activeChain,
      title: String(activeChain.title || "Untitled chain").trim() || "Untitled chain",
      savedOffline: true,
      updatedAt: new Date().toISOString(),
      passages: activeChain.passages.map(passage => ({
        ...passage,
        reference: String(passage.reference || "").trim(),
        text: String(passage.text || ""),
        subtitle: String(passage.subtitle || ""),
      })),
    };
    try {
      const current = readSavedChains();
      const next = [saved, ...current.filter(chain => chain.id !== saved.id)].slice(0, 100);
      localStorage.setItem(CHAINS_KEY, JSON.stringify(next));
      setChains(next);
      setActiveChain(saved);
      setSavedToast(true);
      setSaveError("");
      window.setTimeout(() => setSavedToast(false), 2400);
    } catch (error) {
      console.error("Referential chain save failed:", error);
      setSaveError("Couldn't save this chain on the device. Check available storage.");
      setSavedToast(false);
    }
  };

  const retryLibrary = () => {
    if (typeof libraryStatus.retry !== "function") return;
    setLibraryRetrying(true);
    setLibraryStatus(current => ({ ...current, state: "retrying" }));
    libraryStatus.retry();
  };

  const addSuggestions = useMemo(() => {
    const value = addReference.trim().toLowerCase();
    if (!value) return ATLAS_NODES.slice(0, 4);
    return ATLAS_NODES.filter(node => [node.title, node.reference, node.category, node.summary].join(" ").toLowerCase().includes(value)).slice(0, 5);
  }, [addReference]);

  const pickSuggestion = node => {
    setAddReference(node.reference);
    setAddSubtitle(node.summary || "");
    setAddText(passageTextFromNode(node));
  };

  const addPassage = () => {
    if (!activeChain || !addReference.trim()) return;
    const query = addReference.trim();
    const node = atlasMatch(query);
    const reference = isBibleReference(query) ? query : node?.reference || query;
    const passage = {
      id: newId("passage"),
      reference,
      relation: addRelation,
      subtitle: addSubtitle.trim() || node?.summary || "Related passage. Review the connection in its chapter context.",
      text: addText.trim() || passageTextFromNode(node),
    };
    updateActiveChain({ ...activeChain, passages: [...activeChain.passages, passage], updatedAt: new Date().toISOString() });
    setAddReference("");
    setAddRelation("Same theme");
    setAddSubtitle("");
    setAddText("");
    setActiveSheet("");
  };

  const openPassage = passage => {
    if (!passage) return;
    setPassageDetail(passage);
    setActiveSheet("passage");
  };

  const openBible = reference => {
    const value = String(reference || "").trim();
    if (!value) return;
    try { localStorage.setItem(BIBLE_REFERENCE_KEY, value); }
    catch (error) { console.error("Pending Bible reference could not be stored:", error); }
    setActiveSheet("");
    setPassageDetail(null);
    setActiveChain(null);
    setSelectedMaterial(null);
    onNavigate?.("bible");
  };

  const openAtlas = () => {
    if (!activeChain) return;
    try {
      localStorage.setItem(ATLAS_HANDOFF_KEY, JSON.stringify({
        ...activeChain,
        savedOffline: Boolean(activeChain.savedOffline),
        handedOffAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Atlas chain handoff could not be stored:", error);
      setSaveError("Couldn't pass this chain to Faith Atlas. Try saving the chain first.");
      return;
    }
    window.dispatchEvent(new CustomEvent("revelacode:open-faith-atlas"));
    onNavigate?.("faith");
  };

  const chainContext = activeChain || chains[0] || null;
  const askForContext = chain => {
    if (!chain) {
      setAiMaterial({
        title: "Referential study",
        description: "Explore how Bible passages, symbols, promises, themes and quotations connect.",
        content: "No specific chain is selected yet. Help the student start with Scripture in context and distinguish direct textual links from proposed interpretations.",
        metadata: { day: "Referential" },
      });
      return;
    }
    const passages = (chain.passages || []).map((passage, index) => [
      (index + 1) + ". " + passage.reference,
      "Relationship: " + (passage.relation || "Starting passage"),
      passage.subtitle,
      passage.text,
    ].filter(Boolean).join("\n")).join("\n\n");
    setAiMaterial({
      id: chain.id,
      title: chain.title || "Scripture study chain",
      description: "A student-created chain of related Scripture passages. Assess the connection carefully and distinguish textual evidence from interpretation.",
      content: passages,
      metadata: { day: "Referential study chain" },
    });
  };

  const askAI = question => {
    const prompt = String(question || "").trim();
    if (!prompt) return;
    askForContext(chainContext);
    setAiQuestion(prompt);
    setAiCopied(false);
    setActiveSheet("ai");
  };

  const openInRevelaAI = () => {
    const payload = {
      question: aiQuestion,
      contextType: "referential",
      contextData: {
        chain: aiMaterial?.title || "Referential study",
        passages: aiMaterial?.content || "",
      },
    };
    onOpenAI?.(payload);
    setActiveSheet("");
  };

  const copyQuestion = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(aiQuestion);
      setAiCopied(true);
    } catch (error) {
      console.error("Referential question copy failed:", error);
    }
  };

  const handleOpenMaterial = material => {
    if (!material) return;
    const id = material.id ?? material._id ?? material.material_id ?? material.materialId;
    if (id == null) {
      console.error("Study material has no usable ID:", material);
      return;
    }
    setSelectedMaterial({ ...material, id: String(id) });
  };

  const currentLibraryState = formatLibraryStatus(libraryStatus);

  if (selectedMaterial?.id) {
    return <FaithWorkspaceLayout page="referential" title="Study reader" contextData={{ material: selectedMaterial.title || "Saved study material" }} onOpenAI={onOpenAI} onNavigate={onNavigate} onBack={handleBack} panel={false} showOfflineBanner={false} showHeader={false} showAskBar={false}>
      <main className="min-w-0 space-y-3 overflow-x-clip pb-24">
        <header className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <button type="button" onClick={handleBack} aria-label="Back to study chains" className={touch + " border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}><ArrowLeft size={18}/></button>
          <div className="min-w-0"><p className="text-[0.65rem] text-slate-500">Faith / Referential / Reader</p><h1 className="truncate text-base font-black">{selectedMaterial.title || "Study material"}</h1></div>
        </header>
        <StudyReader materialId={selectedMaterial.id} userId={userId} initialMaterial={selectedMaterial} onBack={handleBack}/>
      </main>
    </FaithWorkspaceLayout>;
  }

  return <FaithWorkspaceLayout
    page="referential"
    title={activeChain ? activeChain.title : "Study chains"}
    description="Build and save Scripture connections."
    contextData={{ chain: activeChain?.title || "My chains", passages: activeChain?.passages?.length || 0 }}
    onOpenAI={onOpenAI}
    onNavigate={onNavigate}
    onBack={handleBack}
    panel={false}
    showOfflineBanner={false}
    showHeader={false}
    showAskBar={false}
  >
    <main className="w-full min-w-0 space-y-3 overflow-x-clip pb-24">
      {activeChain ? <>
        <header className="flex min-w-0 items-center justify-between gap-2 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={handleBack} aria-label="Back to Referential" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><ArrowLeft size={19}/></button>
            <div className="min-w-0"><p className="truncate text-[0.65rem] text-slate-500">Referential / Chain</p><h1 className="truncate text-base font-black">{activeChain.title || "New chain"}</h1></div>
          </div>
          <button type="button" onClick={saveChain} aria-label="Save chain" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"><Save size={18}/></button>
        </header>
        <ChainBuilder
          chain={activeChain}
          onChange={updateActiveChain}
          onAddPassage={() => { setActiveSheet("add"); setAddReference(""); setAddRelation("Same theme"); setAddSubtitle(""); setAddText(""); }}
          onOpenPassage={openPassage}
          onOpenAtlas={openAtlas}
          onAsk={() => askAI("Explain how the passages in this chain connect, including the textual evidence and alternative interpretations.")}
          onSave={saveChain}
          savedToast={savedToast}
          saving={false}
        />
        {saveError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{saveError}</p>}
      </> : <>
        <header className="flex min-w-0 items-center justify-between gap-2 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={handleBack} aria-label="Back to Faith" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><ArrowLeft size={19}/></button>
            <div className="min-w-0"><p className="truncate text-[0.65rem] text-slate-500">Faith / Referential</p><h1 className="truncate text-lg font-black">Study chains</h1></div>
          </div>
          <button type="button" onClick={() => setActiveSheet("filter")} aria-label="Filter saved chains" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><Filter size={18}/></button>
        </header>
        <ConnectivityPill state={connectionOffline ? "offline" : "online"} offlineText="Offline · saved chains available"/>
        <AskBar online={!connectionOffline} onAsk={askAI} placeholder="Ask how passages connect" offlinePlaceholder="Ask how passages connect" storageKey="revelacode_referential_saved_questions_v1"/>
        <StartChainCard value={chainInput} onChange={setChainInput} onStart={startChain}/>
        <ChainList
          chains={chains}
          filter={activeFilter}
          onFilterChange={setActiveFilter}
          onOpen={chain => { setActiveChain({ ...chain, passages: [...chain.passages] }); setSavedToast(true); }}
          onStart={() => { setChainInput(""); const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches; window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); window.requestAnimationFrame(() => document.getElementById("referential-chain-start-input")?.focus()); }}
        />
        <LibraryStatusCard state={currentLibraryState} onRetry={retryLibrary} retrying={libraryRetrying}/>
        <StudyFeed userId={userId} onOpen={handleOpenMaterial} onStatusChange={onLibraryStatusChange}/>
      </>}
    </main>

    {activeSheet === "filter" && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-2" role="dialog" aria-modal="true" aria-label="Filter chains" onClick={closeSheet}>
      <section className="w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-black">Filter chains</h2><button type="button" onClick={closeSheet} aria-label="Close filters" className={touch}><X size={18}/></button></div>
        {[["all","All chains"],["offline","Offline saved"]].map(([value,label])=><button key={value} type="button" onClick={()=>{setActiveFilter(value);closeSheet();}} className={"mb-2 flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-sm font-bold "+(activeFilter===value?"bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200":"bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300")}>{label}{activeFilter===value&&<span>✓</span>}</button>)}
      </section>
    </div>}

    <AddPassageSheet
      open={activeSheet === "add"}
      query={addReference}
      onQueryChange={setAddReference}
      relation={addRelation}
      onRelationChange={setAddRelation}
      subtitle={addSubtitle}
      onSubtitleChange={setAddSubtitle}
      text={addText}
      onTextChange={setAddText}
      suggestions={addSuggestions}
      onPickSuggestion={pickSuggestion}
      onAdd={addPassage}
      onClose={closeSheet}
    />
    <PassageDetailSheet passage={activeSheet === "passage" ? passageDetail : null} onOpenBible={openBible} onClose={closeSheet}/>

    {activeSheet === "ai" && aiMaterial && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-2" role="dialog" aria-modal="true" aria-label="Referential AI assistant" onClick={closeSheet}>
      <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-950" onClick={event=>event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">RevelaAI · Referential</p><h2 className="truncate text-base font-black">{aiMaterial.title}</h2></div><button type="button" onClick={closeSheet} aria-label="Close AI sheet" className={touch}><X size={18}/></button></div>
        <SdaLessonAIChat key={(aiMaterial.id || aiMaterial.title) + "-" + aiQuestion} material={aiMaterial} initialQuestion={aiQuestion} onClose={closeSheet}/>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={openInRevelaAI} className={touch + " bg-indigo-600 px-3 text-xs font-black text-white"}>Open in RevelaAI</button>
          {(aiQuestion.trim().split(/\s+/).length > 25 || /\b(compare|explain in depth|analyse|analyze|research|historical)\b/i.test(aiQuestion)) && <button type="button" onClick={copyQuestion} className={touch + " gap-1.5 border border-slate-200 px-3 text-xs font-bold dark:border-slate-700"}><Copy size={14}/>{aiCopied ? "Copied" : "Copy question"}</button>}
        </div>
      </section>
    </div>}
  </FaithWorkspaceLayout>;
}
