import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  HelpCircle,
  Compass,
  GitBranch,
  Layers,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const ATLAS_NODES = [
  {
    id: "daniel-2",
    reference: "Daniel 2:31–45",
    title: "The image and the kingdoms",
    category: "Prophecy",
    summary: "A royal dream presents an image made of different materials and a stone that becomes a great mountain.",
    textFocus: [
      "Notice the sequence of materials and how the text explains them.",
      "Identify what the stone does and how the vision ends.",
      "Separate the passage's own explanation from proposed historical identifications.",
    ],
    studyLens: "Historicist studies often compare this sequence with the kingdom imagery in Daniel 7. Record the textual reasons for each proposed parallel instead of treating the connection as self-evident.",
    questions: [
      "Which details does Daniel interpret directly?",
      "How does the ending differ from the earlier kingdoms?",
      "Which links to Daniel 7 are supported by shared details?",
    ],
    connects: ["daniel-7", "daniel-8", "matthew-24", "revelation-21"],
  },
  {
    id: "daniel-7",
    reference: "Daniel 7:1–28",
    title: "The beasts and the kingdom",
    category: "Prophecy",
    summary: "Daniel sees four beasts, a judgment scene, and a kingdom given to one like a son of man.",
    textFocus: [
      "Compare the four beasts and their stated features.",
      "Observe the court, the books, and the transfer of dominion.",
      "Track which details the interpretation in the chapter explains.",
    ],
    studyLens: "The chapter is frequently studied alongside Daniel 2. A historicist reading proposes historical referents for the kingdoms and symbols; examine the textual pattern and historical evidence for each proposal.",
    questions: [
      "Which symbols are explained inside the chapter?",
      "What changes when the judgment scene begins?",
      "How does this vision compare with Daniel 2?",
    ],
    connects: ["daniel-2", "daniel-8", "revelation-12", "revelation-13", "revelation-14"],
  },
  {
    id: "daniel-8",
    reference: "Daniel 8:1–27",
    title: "The ram, the goat, and the sanctuary",
    category: "Sanctuary",
    summary: "A vision uses animal imagery and raises questions about the sanctuary, time, and restoration.",
    textFocus: [
      "Record the ram and goat details and the explanations given in the chapter.",
      "Notice the sanctuary language and the question about its condition.",
      "Keep the vision's stated interpretation distinct from later applications.",
    ],
    studyLens: "Some Adventist interpretations connect Daniel 8 with Daniel 7 and 9 and with sanctuary passages elsewhere in Scripture. Make the chain of reasoning and any assumptions about chronology visible.",
    questions: [
      "Which symbols does the passage explicitly interpret?",
      "What does the sanctuary question ask?",
      "Which connections to Daniel 7 or 9 are direct, and which are inferred?",
    ],
    connects: ["daniel-7", "daniel-9", "leviticus-16", "hebrews-8-9"],
  },
  {
    id: "daniel-9",
    reference: "Daniel 9:20–27",
    title: "The seventy weeks",
    category: "Prophecy",
    summary: "Daniel's prayer is followed by an explanation involving a determined period, Jerusalem, and an anointed figure.",
    textFocus: [
      "Start with the passage's stated purpose and time expression.",
      "Mark the events named in the text before calculating a timeline.",
      "Write down the starting-date and chronology assumptions used by an interpretation.",
    ],
    studyLens: "Christian traditions differ on aspects of the passage's chronology and application. Show the date assumptions and interpretation being used; do not present a calculation without its premises.",
    questions: [
      "What is the time period said to concern?",
      "Which events are named in the passage?",
      "How do different starting-date assumptions change a proposed timeline?",
    ],
    connects: ["daniel-8", "matthew-24", "hebrews-8-9"],
  },
  {
    id: "revelation-12",
    reference: "Revelation 12:1–17",
    title: "The woman, child, and dragon",
    category: "Prophecy",
    summary: "A symbolic vision depicts conflict involving a woman, a child, a dragon, and the woman's offspring.",
    textFocus: [
      "List the characters and the actions attributed to each.",
      "Follow the sequence of conflict and protection.",
      "Compare the chapter's repeated themes before assigning symbolic identities.",
    ],
    studyLens: "Adventist historicist studies commonly read this chapter within the book's wider conflict theme and compare it with Daniel. Specific identifications should be supported with textual and historical evidence.",
    questions: [
      "Which descriptions repeat across the chapter?",
      "How does the conflict develop through the vision?",
      "Which themes recur in Revelation 13 and 14?",
    ],
    connects: ["daniel-7", "revelation-13", "revelation-14", "revelation-21"],
  },
  {
    id: "revelation-13",
    reference: "Revelation 13:1–18",
    title: "The beasts and worship",
    category: "Worship",
    summary: "The chapter describes two beasts, authority, worship, coercion, and a number associated with the second beast.",
    textFocus: [
      "Separate the descriptions and actions of the first and second beasts.",
      "Track the chapter's language about worship, authority, and allegiance.",
      "Read the mark and number in the flow of the whole chapter.",
    ],
    studyLens: "Interpretations of the beasts and the mark differ. A historicist Adventist reading is one established approach; clearly label its historical identifications and examine the reasons offered for them.",
    questions: [
      "What does the chapter say people are required to do?",
      "How are worship and authority connected in the text?",
      "How does Revelation 14 respond to the themes in this chapter?",
    ],
    connects: ["daniel-7", "revelation-12", "revelation-14", "exodus-20", "revelation-17"],
  },
  {
    id: "revelation-14",
    reference: "Revelation 14:6–12",
    title: "The three angels' messages",
    category: "Worship",
    summary: "Three messages address the everlasting gospel, worship, Babylon, warning, endurance, and faithfulness.",
    textFocus: [
      "Read the three messages as a sequence and note their distinct calls.",
      "Trace the references to worship and the Creator.",
      "Observe how the chapter describes the endurance and faith of the saints.",
    ],
    studyLens: "Seventh-day Adventist teaching gives these messages a central role in its end-time proclamation. Study that tradition alongside the text and distinguish denominational application from explicit wording.",
    questions: [
      "What does each message announce or call people to do?",
      "Which earlier biblical themes does the Creator language recall?",
      "How does this passage relate to Revelation 12 and 13?",
    ],
    connects: ["revelation-12", "revelation-13", "exodus-20", "revelation-17"],
  },
  {
    id: "revelation-17",
    reference: "Revelation 17:1–18",
    title: "The woman and the waters",
    category: "Prophecy",
    summary: "An angel explains a vision of a woman, waters, a beast, and kings using symbolic language.",
    textFocus: [
      "Record the symbols and the angel's own explanations.",
      "Notice the explicit explanations of waters, heads, horns, and the woman.",
      "Distinguish stated explanations from debated historical applications.",
    ],
    studyLens: "Historicist readings offer particular historical identifications for these symbols. The Atlas treats those as interpretations to investigate, not as a substitute for the chapter's text.",
    questions: [
      "Which symbols does the angel explain directly?",
      "How does the chapter describe the relationship between the woman and the beast?",
      "Which historical claims need independent evidence?",
    ],
    connects: ["revelation-13", "revelation-14", "daniel-7"],
  },
  {
    id: "leviticus-16",
    reference: "Leviticus 16",
    title: "The Day of Atonement",
    category: "Sanctuary",
    summary: "The chapter describes the annual sanctuary ritual, the high priest's actions, and the people's response.",
    textFocus: [
      "Map the actions, participants, and sacred spaces named in the chapter.",
      "Notice the repeated language of cleansing and atonement.",
      "Read the chapter in the wider context of Leviticus before drawing later parallels.",
    ],
    studyLens: "Christian sanctuary studies often compare this chapter with Hebrews 8–9. Such comparisons are theological readings across texts; identify the shared language and also note differences.",
    questions: [
      "What actions are assigned to the high priest?",
      "What does the chapter say is being cleansed?",
      "How does Hebrews use sanctuary imagery?",
    ],
    connects: ["daniel-8", "hebrews-8-9"],
  },
  {
    id: "hebrews-8-9",
    reference: "Hebrews 8–9",
    title: "Covenant and heavenly ministry",
    category: "Covenant",
    summary: "Hebrews compares covenant arrangements and discusses sanctuary imagery, priesthood, sacrifice, and access to God.",
    textFocus: [
      "Follow how Hebrews itself compares the covenants.",
      "Identify the author's use of sanctuary and priesthood language.",
      "Read the argument across both chapters rather than relying on a single phrase.",
    ],
    studyLens: "Interpretations differ on how Hebrews relates earthly sanctuary rituals to Christ's ministry. Compare the argument in Hebrews with Leviticus 16 and Daniel 8 before adopting a specific theological model.",
    questions: [
      "What contrast is Hebrews making between the covenants?",
      "How does the author use sanctuary language?",
      "Where do readers agree, and where do interpretations diverge?",
    ],
    connects: ["daniel-8", "daniel-9", "leviticus-16"],
  },
  {
    id: "exodus-20",
    reference: "Exodus 20:1–17",
    title: "The Ten Commandments",
    category: "Worship",
    summary: "The commandments describe Israel's obligations in the context of God's deliverance and covenant.",
    textFocus: [
      "Read the opening declaration before the individual commandments.",
      "Notice the order and language of the commands.",
      "Compare later biblical references to the commandments in their own contexts.",
    ],
    studyLens: "Christian traditions interpret the role of the commandments and Sabbath in different ways. Faith Atlas makes room to compare passages and traditions without conflating an interpretation with the biblical wording.",
    questions: [
      "How does the chapter introduce the commandments?",
      "What reasons does the Sabbath command give?",
      "How do later passages cite or apply these commandments?",
    ],
    connects: ["revelation-13", "revelation-14"],
  },
  {
    id: "matthew-24",
    reference: "Matthew 24",
    title: "Watchfulness and discernment",
    category: "Christian Life",
    summary: "Jesus speaks about the temple, deception, distress, signs, endurance, and readiness.",
    textFocus: [
      "Separate Jesus' warnings against deception from the signs described.",
      "Notice the instructions about endurance and watchfulness.",
      "Read parallel Gospel passages before assigning a modern event to a prophecy.",
    ],
    studyLens: "Readers differ about how sections of this chapter relate to Jerusalem's fall and future events. Keep historical context, literary structure, and any modern application distinct.",
    questions: [
      "What warning is repeated about deception?",
      "What does the chapter say about knowing the day or hour?",
      "How can a reader avoid treating headlines as proof of a prophetic fulfillment?",
    ],
    connects: ["daniel-2", "daniel-9", "revelation-21"],
  },
  {
    id: "revelation-21",
    reference: "Revelation 21:1–8",
    title: "The new creation",
    category: "Hope",
    summary: "John describes a new heaven and earth and the end of death, mourning, crying, and pain.",
    textFocus: [
      "Notice what is said to pass away and what is made new.",
      "Record the promises and the people addressed.",
      "Connect the chapter with the book's opening vision and final invitation.",
    ],
    studyLens: "This passage gives Christian hope its ultimate horizon. Keep the promised future in view when studying difficult prophetic imagery elsewhere in Daniel and Revelation.",
    questions: [
      "Which forms of suffering are explicitly said to end?",
      "What does the passage promise about God's presence?",
      "How does this hope frame the book of Revelation?",
    ],
    connects: ["daniel-2", "revelation-12", "matthew-24"],
  },
];

const FILTERS = ["All", "Prophecy", "Sanctuary", "Worship", "Covenant", "Christian Life", "Hope", "Saved"];

function primaryVerseReference(reference) {
  const value = String(reference || "").trim().replace(/[–—]/g, "-");
  const verseMatch = value.match(/^(.+?\s+\d+):(\d+)/);
  if (verseMatch) return verseMatch[1] + ":" + verseMatch[2];
  const chapterMatch = value.match(/^(.+?\s+)(\d+)$/);
  return chapterMatch ? chapterMatch[1] + chapterMatch[2] + ":1" : "";
}

function readSaved(key) {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((id) => ATLAS_NODES.some((node) => node.id === id)) : [];
  } catch {
    return [];
  }
}

export default function FaithAtlas({ userId = "guest", onOpenReference }) {
  const storageKey = "revelacode_faith_atlas_saved_v1_" + String(userId || "guest");
  const [savedIds, setSavedIds] = useState(() => readSaved(storageKey));
  const [selectedId, setSelectedId] = useState("daniel-7");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [promptOpen, setPromptOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");

  const visibleNodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ATLAS_NODES.filter((node) => {
      const matchesFilter = activeFilter === "All" || (activeFilter === "Saved" ? savedIds.includes(node.id) : node.category === activeFilter);
      const searchText = [node.title, node.reference, node.category, node.summary, node.textFocus.join(" "), node.studyLens, node.questions.join(" ")].join(" ").toLowerCase();
      return matchesFilter && (!query || searchText.includes(query));
    });
  }, [activeFilter, savedIds, search]);

  useEffect(() => {
    if (visibleNodes.length > 0 && !visibleNodes.some((node) => node.id === selectedId)) {
      setSelectedId(visibleNodes[0].id);
    }
  }, [selectedId, visibleNodes]);

  const selectedNode = ATLAS_NODES.find((node) => node.id === selectedId) || ATLAS_NODES[0];
  const relatedNodes = selectedNode.connects.map((id) => ATLAS_NODES.find((node) => node.id === id)).filter(Boolean);

  const toggleSaved = () => {
    const next = savedIds.includes(selectedNode.id) ? savedIds.filter((id) => id !== selectedNode.id) : [...savedIds, selectedNode.id];
    setSavedIds(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setCopyNotice(next.includes(selectedNode.id) ? "Saved to this device." : "Removed from saved topics.");
    } catch {
      setCopyNotice("Your browser did not allow this topic to be saved.");
    }
  };

  const buildStudyPrompt = () => [
    "Help me investigate this Faith Atlas topic using a source-grounded Bible study.",
    "Topic: " + selectedNode.title,
    "Main passage: " + selectedNode.reference,
    "Related passages: " + relatedNodes.map((node) => node.reference).join(", "),
    "Distinguish what each cited passage explicitly says from theological interpretation.",
    "Give passage references for every major claim, identify uncertainty or differing Christian interpretations, and do not invent Bible quotations.",
    "Questions to investigate:",
    ...selectedNode.questions.map((question) => "- " + question),
  ].join("\n");

  const copyStudyPrompt = async () => {
    setCopyNotice("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(buildStudyPrompt());
      setCopyNotice("Study prompt copied. Open RevelaAI and paste it to continue.");
      setPromptOpen(false);
    } catch {
      setPromptOpen(true);
      setCopyNotice("Copy was blocked by the browser. Select and copy the prompt below.");
    }
  };

  const selectNode = (id) => {
    setSelectedId(id);
    setCopyNotice("");
    setPromptOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <section className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-indigo-100"><Compass size={14} /> Faith Atlas · Preview</div>
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Explore how Scripture connects</h2>
            <p className="mt-3 text-sm leading-7 text-indigo-100/90 sm:text-base">Start with Daniel and Revelation. Explore related passages, compare study lenses, and keep the evidence separate from interpretation.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black">{ATLAS_NODES.length}</div><div className="mt-1 text-xs text-indigo-100/75">Starter topics</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><div className="text-2xl font-black">{savedIds.length}</div><div className="mt-1 text-xs text-indigo-100/75">Saved on this device</div></div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-indigo-100/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><ShieldCheck size={13} /> Passage references first</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><GitBranch size={13} /> Connected topic map</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Bookmark size={13} /> Local saves</span>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md"><span className="sr-only">Search Faith Atlas</span><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, passages, questions…" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-900/40" /></label>
          <div className="flex flex-wrap gap-2" aria-label="Filter atlas topics">
            {FILTERS.map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={"rounded-full px-3 py-2 text-xs font-bold transition " + (activeFilter === filter ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300")}>{filter === "Saved" ? "Saved (" + savedIds.length + ")" : filter}</button>)}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"><span>{visibleNodes.length} of {ATLAS_NODES.length} topics</span><span>Curated starter map · interpretations are labeled as study lenses</span></div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)]">
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
          <div><h3 className="flex items-center gap-2 text-base font-black text-gray-900 dark:text-white"><Layers size={18} className="text-indigo-600 dark:text-indigo-400" /> Scripture connection map</h3><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Choose a topic to inspect its references and connected studies.</p></div>
          {visibleNodes.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleNodes.map((node) => {
                const isSelected = node.id === selectedNode.id;
                const isSaved = savedIds.includes(node.id);
                return <button key={node.id} type="button" onClick={() => selectNode(node.id)} aria-pressed={isSelected} className={"group min-w-0 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 " + (isSelected ? "border-indigo-400 bg-indigo-50 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40" : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/70")}>
                  <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-indigo-600 dark:bg-gray-800 dark:text-indigo-300")}><BookOpen size={18} /></span><div className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{node.reference}</span><span className="mt-1 block text-sm font-black leading-5 text-gray-900 dark:text-white">{node.title}</span></div></div>{isSaved && <Bookmark size={15} className="shrink-0 fill-amber-400 text-amber-500" />}</div>
                  <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-600 dark:text-gray-300">{node.summary}</p>
                  <div className="mt-4 flex items-center justify-between gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{node.category}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300">Explore <ChevronRight size={14} /></span></div>
                </button>;
              })}
            </div>
          ) : <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700"><Search size={24} className="mx-auto text-gray-400" /><p className="mt-3 text-sm font-bold text-gray-800 dark:text-gray-100">No matching topics</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Try another term or select a different filter.</p><button type="button" onClick={() => { setSearch(""); setActiveFilter("All"); }} className="mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-300">Reset filters</button></div>}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <section className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900/60 dark:bg-gray-900 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[11px] font-black uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-300">Selected passage</span><h3 className="mt-1 text-xl font-black leading-tight text-gray-900 dark:text-white">{selectedNode.title}</h3><p className="mt-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">{selectedNode.reference}</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"><Compass size={21} /></span></div>
            <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-300">{selectedNode.summary}</p>
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"><h4 className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white"><BookOpen size={16} className="text-indigo-600 dark:text-indigo-300" /> Observe in the passage</h4><ul className="mt-3 space-y-2">{selectedNode.textFocus.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-gray-700 dark:text-gray-300"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /><span>{item}</span></li>)}</ul></div>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><h4 className="flex items-center gap-2 text-sm font-black text-amber-900 dark:text-amber-200"><HelpCircle size={16} /> Interpretive study lens</h4><p className="mt-2 text-xs leading-6 text-amber-950/90 dark:text-amber-100/90">{selectedNode.studyLens}</p></div>
            <div className="mt-4"><h4 className="text-sm font-black text-gray-900 dark:text-white">Questions worth investigating</h4><ol className="mt-2 list-inside list-decimal space-y-2">{selectedNode.questions.map((question) => <li key={question} className="text-xs leading-5 text-gray-700 dark:text-gray-300">{question}</li>)}</ol></div>
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onOpenReference?.(primaryVerseReference(selectedNode.reference))} disabled={!onOpenReference || !primaryVerseReference(selectedNode.reference)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"><BookOpen size={15} /> Open passage in Bible</button><button type="button" onClick={toggleSaved} className={"inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition " + (savedIds.includes(selectedNode.id) ? "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800")}><Bookmark size={15} /> {savedIds.includes(selectedNode.id) ? "Saved topic" : "Save topic"}</button><button type="button" onClick={copyStudyPrompt} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"><Sparkles size={15} /> Prepare AI study prompt</button></div>
            {copyNotice && <p role="status" className="mt-3 text-xs leading-5 text-gray-600 dark:text-gray-300">{copyNotice}</p>}
            {promptOpen && <textarea readOnly value={buildStudyPrompt()} rows={7} className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-800 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" onFocus={(event) => event.target.select()} aria-label="Study prompt to copy into RevelaAI" />}
            <p className="mt-3 text-[11px] leading-5 text-gray-500 dark:text-gray-400">Saved topics currently stay in this browser on this device. Account sync and source-verified AI answers are planned next.</p>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5"><h3 className="flex items-center gap-2 text-base font-black text-gray-900 dark:text-white"><Link2 size={17} className="text-emerald-600 dark:text-emerald-400" /> Connected studies <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-300">{relatedNodes.length}</span></h3><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">These are suggested study links, not claims that every interpretation is identical.</p><div className="mt-3 space-y-2">{relatedNodes.map((node) => <button key={node.id} type="button" onClick={() => selectNode(node.id)} className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-gray-800 dark:hover:bg-emerald-950/20"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><GitBranch size={16} /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{node.reference}</span><span className="mt-0.5 block text-sm font-bold text-gray-900 dark:text-white">{node.title}</span></span><ChevronRight size={16} className="shrink-0 text-gray-400" /></button>)}</div></section>
        </aside>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-5"><p className="flex items-start gap-2 text-xs leading-6 text-gray-600 dark:text-gray-300"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /><span><strong>Study integrity:</strong> This is a curated prototype, not a doctrinal verdict or an exhaustive Bible concordance. The references point to passages to read; the study lens is explicitly marked as interpretation. Future versions will link claims to reviewed source material and show citations from the selected Bible edition.</span></p></section>
    </div>
  );
}
