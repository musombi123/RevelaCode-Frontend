import React, { useMemo, useState } from "react";
import { BookOpen, Bookmark, Check, ExternalLink, Search, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readAccessToken, readTokenType } from "@/auth/tokenStorage.mjs";

const API = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://revelacode-backend.onrender.com"
).replace(/\/+$/, "");

const ROOT_SOURCES = {
  yaleBiblicalLanguages: {
    label: "Yale University Library · Biblical language resources",
    url: "https://guides.library.yale.edu/electronic_religion/languages",
  },
  comprehensiveAramaicLexicon: {
    label: "Comprehensive Aramaic Lexicon · Hebrew Union College",
    url: "https://cal.huc.edu/",
  },
  lexicalMethod: {
    label: "Biblical lexicology · lexical meaning and context",
    url: "https://www.thetbs.org/study-materials/wp-content/uploads/2023/02/Biblical-Lexicology-Hebrew-and-Greek.-Semantics-%E2%80%93-Exegesis-%E2%80%93-Translation-by-Eberhard-Bons-Jan-Joosten-Regine-Hunziker-Rodewald-eds.-z-lib.org_.pdf",
  },
  quranicArabicCorpus: {
    label: "Quranic Arabic Corpus · word and root analysis",
    url: "https://corpus.quran.com/",
  },
};

const WORD_ROOTS = [
  {
    id: "shalom",
    term: "שָׁלוֹם",
    transliteration: "shalom",
    pronunciation: "shah-LOHM",
    language: "Biblical Hebrew",
    era: "Hebrew Bible / Jewish textual tradition",
    root: "ש־ל־ם · š-l-m",
    gloss: "Peace, well-being, safety, welfare; in some contexts, completeness or wholeness.",
    context: "The word's force changes with context: it can refer to a greeting, a person's welfare, communal peace, or well-being. Do not assume every occurrence carries every possible nuance.",
    passages: [
      { label: "Numbers 6:24–26", url: "https://www.sefaria.org/Numbers.6.24-26" },
      { label: "Genesis 43:27–28", url: "https://www.sefaria.org/Genesis.43.27-28" },
    ],
    traditions: ["Jewish", "Christian", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "In Jewish texts and practice, shalom can concern personal and communal welfare as well as peace; its meaning still depends on the passage or use." },
      { tradition: "Christian", note: "Christian readers encounter the term in the Hebrew Bible and may connect its contexts with peace and reconciliation. Those later theological connections should be identified as interpretation, not substituted for the Hebrew passage." },
      { tradition: "Comparative", note: "Arabic salām belongs to a related Semitic root family. This linguistic relationship is worth studying, but it does not make Jewish, Christian, and Muslim teachings about peace identical." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/7965.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "A root or etymological connection cannot by itself determine the meaning of a word in a particular sentence.",
  },
  {
    id: "hesed",
    term: "חֶסֶד",
    transliteration: "ḥesed / hesed",
    pronunciation: "KHEH-sed (approximate)",
    language: "Biblical Hebrew",
    era: "Hebrew Bible / Jewish textual tradition",
    root: "ח־ס־ד · ḥ-s-d",
    gloss: "Kindness, loyal love, covenant faithfulness, or mercy, depending on context.",
    context: "No single English equivalent covers all uses. Read the people, relationship, action, and surrounding lines before selecting 'mercy', 'kindness', or 'steadfast love'.",
    passages: [
      { label: "Exodus 34:6–7", url: "https://www.sefaria.org/Exodus.34.6-7" },
      { label: "Psalm 136", url: "https://www.sefaria.org/Psalms.136" },
      { label: "Hosea 6:6", url: "https://www.sefaria.org/Hosea.6.6" },
    ],
    traditions: ["Jewish", "Christian", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "In the Hebrew Bible and Jewish interpretation, ḥesed can describe acts of kindness and steadfast covenant loyalty. Different passages foreground different aspects." },
      { tradition: "Christian", note: "Christian translations often render the term as steadfast love, mercy, or lovingkindness; Christian theology may draw broader conclusions from these passages, which should be distinguished from a dictionary gloss." },
      { tradition: "Comparative", note: "It can be compared thematically with mercy or compassion terms in other traditions, but it is not a lexical synonym for any one Arabic or Greek term." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/2617.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not use one English rendering to flatten the full range of uses across the Hebrew Bible.",
  },
  {
    id: "emunah",
    term: "אֱמוּנָה",
    transliteration: "emunah",
    pronunciation: "eh-moo-NAH",
    language: "Biblical Hebrew",
    era: "Hebrew Bible / Jewish textual tradition",
    root: "א־מ־ן · ʾ-m-n",
    gloss: "Faithfulness, reliability, firmness, trust; sometimes rendered 'faith'.",
    context: "The surrounding clause matters. Some translations emphasize steadfastness or faithfulness, while others emphasize faith. The grammar and literary argument should be checked rather than deciding from the English word alone.",
    passages: [
      { label: "Habakkuk 2:4", url: "https://www.sefaria.org/Habakkuk.2.4" },
      { label: "Deuteronomy 32:4", url: "https://www.sefaria.org/Deuteronomy.32.4" },
    ],
    traditions: ["Jewish", "Christian", "Muslim", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "Jewish readings consider the word in its Hebrew literary and theological contexts, including discussions of reliability, faithfulness, and trust." },
      { tradition: "Christian", note: "Christian discussions often examine Habakkuk 2:4 alongside its quotations and uses in the New Testament. Interpreters differ about emphasis, so the Hebrew context and each later text should be read independently." },
      { tradition: "Muslim", note: "Arabic īmān is a related Semitic word family worth comparing linguistically. Its role in Islamic belief and theology is not interchangeable with the uses of emunah in Jewish or Christian texts." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/530.htm" },
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "Related forms in Semitic languages are evidence for comparison, not proof that the religious concepts have the same boundaries.",
  },
  {
    id: "ruach",
    term: "רוּחַ",
    transliteration: "rûaḥ / ruach",
    pronunciation: "ROO-akh (approximate)",
    language: "Biblical Hebrew",
    era: "Hebrew Bible",
    root: "ר־ו־ח · r-w-ḥ",
    gloss: "Wind, breath, spirit, or disposition, depending on the passage.",
    context: "A polysemous word can legitimately have several related senses. Genesis 1:2, a description of wind, a person's spirit, and a later doctrinal discussion need not use it identically.",
    passages: [
      { label: "Genesis 1:2", url: "https://www.sefaria.org/Genesis.1.2" },
      { label: "Ezekiel 37:1–14", url: "https://www.sefaria.org/Ezekiel.37.1-14" },
    ],
    traditions: ["Jewish", "Christian", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "Jewish interpretation reads ruach in the literary and grammatical context of each Hebrew passage; translations may choose wind, breath, or spirit." },
      { tradition: "Christian", note: "Christian readers may connect selected passages with teachings about God's Spirit, while taking care not to make every occurrence a technical statement about later Christian doctrine." },
      { tradition: "Comparative", note: "Greek pneuma is used as a translation equivalent in some biblical contexts. It is a Greek word with its own history, not the Hebrew root translated into Greek." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/7307.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "A translation choice is a context-based judgment; one English word cannot represent every occurrence.",
  },
  {
    id: "davar",
    term: "דָּבָר",
    transliteration: "dābār / davar",
    pronunciation: "dah-VAHR",
    language: "Biblical Hebrew",
    era: "Hebrew Bible",
    root: "ד־ב־ר · d-b-r",
    gloss: "Word, speech, matter, affair, or thing in different contexts.",
    context: "Hebrew often uses the same form across what English separates as 'word' and 'matter'. Translate by the sentence and discourse, not by a fixed root slogan.",
    passages: [
      { label: "Deuteronomy 8:3", url: "https://www.sefaria.org/Deuteronomy.8.3" },
      { label: "Psalm 33:6", url: "https://www.sefaria.org/Psalms.33.6" },
    ],
    traditions: ["Jewish", "Christian", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "The term is used in ordinary and theological Hebrew discourse; a passage's syntax determines whether 'word', 'matter', or another rendering fits best." },
      { tradition: "Christian", note: "A Christian reader may compare davar with the Greek logos in selected passages, but this is a comparison between words in different languages, not a one-to-one lexical identity." },
      { tradition: "Comparative", note: "Comparative study should show the actual passage and translation pathway rather than assume all traditions use a single universal concept of 'the Word'." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/1697.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not conclude that every occurrence of davar has the theological force of the phrase 'Word of God'.",
  },
  {
    id: "qadosh",
    term: "קָדוֹשׁ",
    transliteration: "qādôš / qadosh",
    pronunciation: "kah-DOHSH (approximate)",
    language: "Biblical Hebrew",
    era: "Hebrew Bible / Jewish textual tradition",
    root: "ק־ד־ש · q-d-š",
    gloss: "Holy, sacred, set apart; implications vary with the noun and literary setting.",
    context: "The term can describe God, people, places, times, or objects designated as holy. Later theological concepts of holiness may develop from these texts but should not be mistaken for a lexical gloss.",
    passages: [
      { label: "Leviticus 19:2", url: "https://www.sefaria.org/Leviticus.19.2" },
      { label: "Isaiah 6:3", url: "https://www.sefaria.org/Isaiah.6.3" },
    ],
    traditions: ["Jewish", "Christian", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "In Jewish interpretation, holiness is explored through the Hebrew text, covenant, worship, and ethical practice; the emphasis differs by passage and tradition." },
      { tradition: "Christian", note: "Christian traditions discuss holiness in relation to God, community, and ethical life, drawing on both biblical testaments. Those doctrines should be described with their sources rather than projected onto every Hebrew occurrence." },
    ],
    sourceLinks: [
      { label: "Hebrew lexicon entry", url: "https://biblehub.com/hebrew/6918.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "The English expression 'set apart' can be useful, but is not a complete definition for every use.",
  },
  {
    id: "logos",
    term: "λόγος",
    transliteration: "logos",
    pronunciation: "LOH-gos",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "λόγος · lemma logos",
    gloss: "Word, speech, statement, account, discourse, or reason in different settings.",
    context: "The Greek term had a broad range of use in ordinary and philosophical writing. In John 1:1–18 it appears in a specific literary and theological argument; that passage should not be reduced to a dictionary definition alone.",
    passages: [
      { label: "John 1:1–18", url: "https://www.biblegateway.com/passage/?search=John%201%3A1-18" },
      { label: "Acts 18:14–15", url: "https://www.biblegateway.com/passage/?search=Acts%2018%3A14-15" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Many Christian traditions read the Logos of John 1 as a central Christological claim about Jesus. The details of this doctrine developed through Christian interpretation and should be explained with the text and the relevant tradition's own sources." },
      { tradition: "Comparative", note: "Comparisons with Hebrew davar or Arabic kalima can illuminate translation choices and themes, but the words do not automatically carry the same doctrinal content." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/3056.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not infer John's full Christology from etymology alone; read the literary argument of John 1.",
  },
  {
    id: "pistis",
    term: "πίστις",
    transliteration: "pistis",
    pronunciation: "PIS-tis",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "πιστ- · related to the pist- word family",
    gloss: "Trust, faith, confidence, or faithfulness, depending on syntax and context.",
    context: "Scholarly discussion sometimes differs over whether a passage emphasizes human trust, faithfulness, or a related sense. The grammar and argument of each passage need to be assessed before reaching a theological conclusion.",
    passages: [
      { label: "Galatians 5:22", url: "https://www.biblegateway.com/passage/?search=Galatians%205%3A22" },
      { label: "Romans 1:16–17", url: "https://www.biblegateway.com/passage/?search=Romans%201%3A16-17" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian theology gives pistis an important role, especially in discussions of trust, faith, and faithfulness. Traditions differ in how particular passages relate faith, works, grace, and covenant, so these questions should be studied in context." },
      { tradition: "Comparative", note: "It can be compared thematically with trust and faith vocabulary in other religions, but the Greek lexeme should not be treated as an exact equivalent of Hebrew emunah or Arabic īmān." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/4102.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not assert that pistis always means one theological formula; usages and scholarly interpretations vary.",
  },
  {
    id: "agape",
    term: "ἀγάπη",
    transliteration: "agapē / agape",
    pronunciation: "ah-GAH-pay (approximate)",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "ἀγαπ- · agap- word family",
    gloss: "Love or affection; the intended nuance is shaped by speaker, object, genre, and context.",
    context: "It is inaccurate to claim that agapē always means a uniquely divine, unconditional, or selfless type of love simply because of the word itself. Such interpretations need to be argued from specific passages and their literary use.",
    passages: [
      { label: "John 13:34–35", url: "https://www.biblegateway.com/passage/?search=John%2013%3A34-35" },
      { label: "1 Corinthians 13", url: "https://www.biblegateway.com/passage/?search=1%20Corinthians%2013" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian readers often study agapē in relation to love of God and neighbour, the teachings of Jesus, and Pauline ethics. The theological conclusion comes from reading these contexts, not from a supposedly magical distinction between Greek words for love." },
      { tradition: "Comparative", note: "Other traditions have rich vocabularies for love, compassion, benevolence, and mercy; meaningful comparison requires specific texts and careful definitions rather than ranking words or religions." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/26.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Avoid the popular but oversimplified claim that each Greek word for love has one fixed, non-overlapping meaning.",
  },
  {
    id: "pneuma",
    term: "πνεῦμα",
    transliteration: "pneuma",
    pronunciation: "PNEW-mah",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "πνευ- · pneu- word family",
    gloss: "Wind, breath, spirit, or an inner disposition in different settings.",
    context: "The relationship between wind and spirit can be important in a passage, including John 3:5–8. Yet not every occurrence has every sense and no single gloss decides the theology of a text.",
    passages: [
      { label: "John 3:5–8", url: "https://www.biblegateway.com/passage/?search=John%203%3A5-8" },
      { label: "1 Corinthians 2:10–14", url: "https://www.biblegateway.com/passage/?search=1%20Corinthians%202%3A10-14" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian interpretation discusses pneuma in relation to human spirit and the Spirit of God, with doctrinal detail depending on the passage and denomination." },
      { tradition: "Comparative", note: "The term can be compared with Hebrew ruach where Greek texts translate Hebrew texts. A translation correspondence is not the same thing as a shared linguistic root." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/4151.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Distinguish lexical senses, translation decisions, and later doctrinal formulations.",
  },
  {
    id: "metanoia",
    term: "μετάνοια",
    transliteration: "metanoia",
    pronunciation: "meh-TAH-noy-ah",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "μετανο- · metano- word family",
    gloss: "A change of mind or outlook; in many New Testament contexts, repentance or a changed response to God.",
    context: "A simple literal breakdown such as 'change your mind' does not fully define the word's use in a religious passage. Observe the surrounding commands, actions, and narrative.",
    passages: [
      { label: "Mark 1:14–15", url: "https://www.biblegateway.com/passage/?search=Mark%201%3A14-15" },
      { label: "Luke 24:45–47", url: "https://www.biblegateway.com/passage/?search=Luke%2024%3A45-47" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian traditions connect repentance with turning from wrongdoing, renewed understanding, confession, and changed life, but differ in theological framing and pastoral practice." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/3341.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not infer a full doctrine of repentance from a literal word-part analysis alone.",
  },
  {
    id: "abba",
    term: "אַבָּא",
    transliteration: "abbā / Abba",
    pronunciation: "AB-bah",
    language: "Biblical Aramaic",
    era: "Aramaic expression preserved in New Testament Greek",
    root: "Aramaic אבא · father",
    gloss: "Father; a family or address term used in an intimate but not necessarily childish or informal way.",
    context: "The New Testament preserves the Aramaic form in Greek text. Rendering it simply as 'Daddy' can overstate the register; 'Father' often communicates the address without deciding the social tone in every setting.",
    passages: [
      { label: "Mark 14:36", url: "https://www.biblegateway.com/passage/?search=Mark%2014%3A36" },
      { label: "Romans 8:15", url: "https://www.biblegateway.com/passage/?search=Romans%208%3A15" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian readings connect Abba with Jesus' prayer and the language of adoption in Paul's letters. These are interpretations of the texts' usage, not proof that all Aramaic speech was informal or childlike." },
      { tradition: "Comparative", note: "A multilingual comparison should distinguish the Aramaic form from Greek translations and from later theological explanations of divine fatherhood." },
    ],
    sourceLinks: [
      ROOT_SOURCES.comprehensiveAramaicLexicon,
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "The text preserves an Aramaic form, but register and theological force must be inferred from context.",
  },
  {
    id: "amen",
    term: "אָמֵן / آمِين",
    transliteration: "amen / amīn",
    pronunciation: "ah-MEN / aa-MEEN (approximate)",
    language: "Cross-language Semitic term",
    era: "Hebrew, Aramaic, Greek and Arabic religious use",
    root: "Semitic ʾ-m-n word family",
    gloss: "An affirmation associated with reliability, truth, or assent; specific use depends on language and prayer context.",
    context: "Forms related to the Semitic ʾ-m-n family appear across Jewish, Christian, and Muslim prayer traditions. A shared or borrowed prayer word is a linguistic connection; it does not make the communities' prayers or beliefs identical.",
    passages: [
      { label: "Deuteronomy 27:15–26", url: "https://www.sefaria.org/Deuteronomy.27.15-26" },
      { label: "1 Corinthians 14:16", url: "https://www.biblegateway.com/passage/?search=1%20Corinthians%2014%3A16" },
      { label: "Qur'an 1:1–7", url: "https://quran.com/1" },
    ],
    traditions: ["Jewish", "Christian", "Muslim", "Comparative"],
    lenses: [
      { tradition: "Jewish", note: "Amen is used as a response of affirmation in Jewish prayer and textual settings; interpret a given instance within its liturgical or literary context." },
      { tradition: "Christian", note: "Christian communities use amen in prayer, worship, and New Testament contexts. Its usage may be shared while the prayers themselves differ." },
      { tradition: "Muslim", note: "Āmīn is said in Muslim prayer after al-Fātiḥah. This shared or cognate expression does not imply that the full prayer texts or doctrines are the same." },
      { tradition: "Comparative", note: "This is a useful case study in related languages and religious use: identify the form, transmission, and context rather than using a shared word to erase difference." },
    ],
    sourceLinks: [
      ROOT_SOURCES.yaleBiblicalLanguages,
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "Do not infer doctrinal agreement or direct borrowing in a particular setting without evidence for that claim.",
  },
  {
    id: "rahma",
    term: "رَحْمَة",
    transliteration: "raḥma / rahma",
    pronunciation: "RAH-mah (approximate)",
    language: "Qur'anic Arabic",
    era: "Qur'an / classical Arabic religious use",
    root: "ر־ح־م · r-ḥ-m",
    gloss: "Mercy, compassion, or gracious care in context.",
    context: "The root family has wider lexical associations, but a theological reading must begin with how raḥma is used in the passage. Do not reduce the Qur'anic term to a single etymological story.",
    passages: [
      { label: "Qur'an 1:1–3", url: "https://quran.com/1/1-3" },
      { label: "Qur'an 21:107", url: "https://quran.com/21/107" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "In Islamic theology, divine mercy is a major Qur'anic theme. Particular interpretations should be grounded in the verse, the surrounding Qur'anic context, and reputable Islamic commentary." },
      { tradition: "Comparative", note: "The term may be compared with biblical words translated mercy or compassion, but these words have their own histories and doctrinal settings; none is a complete one-word replacement for raḥma." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "Etymology may suggest a relationship, but the actual contextual use is the primary guide to meaning.",
  },
  {
    id: "taqwa",
    term: "تَقْوَى",
    transliteration: "taqwā / taqwa",
    pronunciation: "taq-WAH (approximate)",
    language: "Qur'anic Arabic",
    era: "Qur'an / Islamic theology",
    root: "و־ق־ي · w-q-y",
    gloss: "God-consciousness, piety, reverent restraint, or guarding oneself from wrongdoing, depending on context and translation.",
    context: "English versions use several terms because no single gloss covers every context. Do not reduce taqwa to fear alone or pretend that one English rendering captures its whole religious meaning.",
    passages: [
      { label: "Qur'an 2:197", url: "https://quran.com/2/197" },
      { label: "Qur'an 49:13", url: "https://quran.com/49/13" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Taqwa is an important Islamic ethical and spiritual concept. Its practical meaning should be explored through Qur'anic usage and the interpretive tradition, not solely from a dictionary gloss." },
      { tradition: "Comparative", note: "It can be compared thematically with reverence, righteousness, or moral vigilance in other traditions, but it is not an exact equivalent of any single Hebrew or Greek term." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "A single English word such as 'fear' or 'piety' can narrow the meaning if it is used without context.",
  },
  {
    id: "iman",
    term: "إِيمَان",
    transliteration: "īmān / iman",
    pronunciation: "ee-MAAN (approximate)",
    language: "Qur'anic Arabic",
    era: "Qur'an / Islamic theology",
    root: "أ־م־ن · ʾ-m-n",
    gloss: "Faith or belief, with a range shaped by the passage and theological tradition.",
    context: "The Qur'an distinguishes terms and states in particular contexts; for example, Qur'an 49:14 contrasts saying 'we believe' with a fuller description of faith. Read that argument rather than treating iman as a simple dictionary synonym for every use of 'faith' elsewhere.",
    passages: [
      { label: "Qur'an 49:14", url: "https://quran.com/49/14" },
      { label: "Qur'an 2:177", url: "https://quran.com/2/177" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Islamic theology discusses iman in relation to belief, confession, action, and other concepts, with differences among schools and scholars." },
      { tradition: "Comparative", note: "The Arabic root family may be studied beside Hebrew emunah. The forms are linguistically related, but their passages, grammatical uses, and later theological frameworks are not identical." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "A cognate relationship does not establish that a theological term carries the same scope in different scriptures.",
  },
  {
    id: "islam",
    term: "إِسْلَام",
    transliteration: "islām / Islam",
    pronunciation: "is-LAAM",
    language: "Qur'anic Arabic",
    era: "Qur'an / Islamic theology",
    root: "س־ل־م · s-l-m",
    gloss: "In Islamic religious use, submission or surrender to God; related forms in the root family include words for peace and safety.",
    context: "A common oversimplification says 'Islam simply means peace'. The root family connects forms such as islām and salām, but the religious term's established usage and theology cannot be replaced with a single related English gloss.",
    passages: [
      { label: "Qur'an 3:19", url: "https://quran.com/3/19" },
      { label: "Qur'an 5:3", url: "https://quran.com/5/3" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Islamic self-understanding centers on worship and submission to God. The word is interpreted through the Qur'an and Islamic scholarly traditions; it should not be defined by a slogan or by a critic's characterization." },
      { tradition: "Comparative", note: "The same broad Semitic root family also contains Arabic salām and is related to Hebrew forms such as shalom. Linguistic relatedness does not imply identical theology or prove that all teachings about peace are the same." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "Do not translate Islam simply as 'peace' or use the word's root alone as a complete definition of Islam.",
  },
  {
    id: "salaam",
    term: "سَلَام",
    transliteration: "salām / salaam",
    pronunciation: "sah-LAAM",
    language: "Qur'anic Arabic",
    era: "Classical Arabic / Qur'anic use",
    root: "س־ل־م · s-l-m",
    gloss: "Peace, safety, or a greeting of peace in context.",
    context: "The term can function in greetings, descriptions, and religious texts. Its relation to Hebrew shalom is a useful linguistic comparison, but the specific meaning in any Qur'anic verse depends on that verse.",
    passages: [
      { label: "Qur'an 13:24", url: "https://quran.com/13/24" },
      { label: "Qur'an 10:10", url: "https://quran.com/10/10" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Salām appears in Qur'anic and everyday Muslim usage, including greetings of peace. Its theological significance depends on its context and the practice being discussed." },
      { tradition: "Comparative", note: "The relationship with Hebrew shalom illustrates shared Semitic vocabulary. Neither word should be used to claim that Judaism, Christianity, and Islam have no meaningful doctrinal differences." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
      { label: "Hebrew lexicon entry for shalom", url: "https://biblehub.com/hebrew/7965.htm" },
    ],
    related: ["shalom"],
    caveat: "Shared roots and cognates support careful comparison—not automatic equivalence of meaning or belief.",
  },
  {
    id: "rabb",
    term: "رَبّ",
    transliteration: "rabb",
    pronunciation: "rab(b)",
    language: "Qur'anic Arabic",
    era: "Qur'an / Islamic theology",
    root: "ر־ب־ب · r-b-b",
    gloss: "Lord, master, owner, sustainer, or nurturer in different contexts.",
    context: "In Qur'anic usage, rabb is a relational and theological term whose translation depends on the phrase and passage. Do not assume that an English translation such as 'Lord' makes it doctrinally identical to a Christian use of that English word.",
    passages: [
      { label: "Qur'an 1:2", url: "https://quran.com/1/2" },
      { label: "Qur'an 2:30", url: "https://quran.com/2/30" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Rabb al-ʿālamīn in al-Fātiḥah is commonly translated as 'Lord of the worlds'. Muslim readings interpret the phrase within Qur'anic theology and worship." },
      { tradition: "Comparative", note: "The English word 'Lord' can translate terms from more than one language. Matching English translations do not make the source words or their full doctrines interchangeable." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "Always state which source language and passage you are describing when using a translation such as 'Lord'.",
  },
  {
    id: "ayah",
    term: "آيَة",
    transliteration: "āyah / ayah",
    pronunciation: "AA-yah",
    language: "Qur'anic Arabic",
    era: "Qur'an / Islamic theology",
    root: "آ־ي־ة · ʾ-y-t (word formation varies)",
    gloss: "Sign, sign of evidence, portent, or Qur'anic verse, depending on context.",
    context: "The Qur'an uses ayah for signs in creation and for its own verses. Translating it only as 'verse' can conceal other uses, while translating every occurrence as 'miracle' can overstate the passage.",
    passages: [
      { label: "Qur'an 2:164", url: "https://quran.com/2/164" },
      { label: "Qur'an 45:3–6", url: "https://quran.com/45/3-6" },
    ],
    traditions: ["Muslim", "Comparative"],
    lenses: [
      { tradition: "Muslim", note: "Ayah is used for Qur'anic verses and for signs that invite reflection. The sense should be identified from syntax and context." },
      { tradition: "Comparative", note: "Other scriptures have words translated as 'sign' or 'verse', but comparing translations alone is not enough to establish a shared concept." },
    ],
    sourceLinks: [
      ROOT_SOURCES.quranicArabicCorpus,
    ],
    caveat: "A translated English word such as 'sign' or 'verse' is not itself evidence that source-language terms are synonymous.",
  },
  {
    id: "dikaiosyne",
    term: "δικαιοσύνη",
    transliteration: "dikaiosynē",
    pronunciation: "dee-kai-oh-SOO-nay",
    language: "Koine Greek",
    era: "Hellenistic Greek / New Testament",
    root: "δικαι- · dikai- word family",
    gloss: "Righteousness or justice, with the nuance shaped by the passage's argument and historical setting.",
    context: "Translation choices can lead into substantive Christian debates about justice, right conduct, covenant, and Paul's argument. A word study should describe the debate and evidence rather than declare a disputed doctrine settled by etymology.",
    passages: [
      { label: "Matthew 5:6", url: "https://www.biblegateway.com/passage/?search=Matthew%205%3A6" },
      { label: "Romans 3:21–26", url: "https://www.biblegateway.com/passage/?search=Romans%203%3A21-26" },
    ],
    traditions: ["Christian", "Comparative"],
    lenses: [
      { tradition: "Christian", note: "Christian interpreters disagree on how particular texts connect righteousness with faith, covenant, justice, and ethical practice. The competing arguments should be described fairly and linked to the passages." },
      { tradition: "Comparative", note: "It can be compared with Hebrew words translated as righteousness or justice, but a matching English gloss does not make the source terms equivalent." },
    ],
    sourceLinks: [
      { label: "Greek lexicon entry", url: "https://biblehub.com/greek/1343.htm" },
      ROOT_SOURCES.yaleBiblicalLanguages,
    ],
    caveat: "Do not use a single gloss to erase ongoing translation and theological discussions.",
  },
];

const LANGUAGE_OPTIONS = ["All languages", "Biblical Hebrew", "Biblical Aramaic", "Koine Greek", "Qur'anic Arabic", "Cross-language Semitic term"];
const TRADITION_OPTIONS = ["All perspectives", "Jewish", "Christian", "Muslim", "Comparative"];
const SAVED_KEY = "revelacode_ancient_word_roots_saved_v1";

function readSavedRoots() {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((id) => WORD_ROOTS.some((item) => item.id === id)) : [];
  } catch {
    return [];
  }
}

function ErrorText({ children }) {
  return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">{children}</div>;
}

async function faithCompanion(question, discussionMode) {
  const token = readAccessToken();
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) headers.Authorization = (readTokenType() || "Bearer") + " " + token;

  const response = await fetch(API + "/api/study/faith/companion", {
    method: "POST",
    headers,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({
      course_slug: "scripture-study-method",
      lesson_slug: "observe-before-interpreting",
      question,
      discussion_mode: discussionMode,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error?.message || (typeof data?.error === "string" ? data.error : "") || "Ancient Word Roots Companion request failed (" + response.status + ").";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function RootPill({ children }) {
  return <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300">{children}</span>;
}

function SourceLink({ source }) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 underline-offset-2 transition hover:border-violet-300 hover:text-violet-700 hover:underline dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-violet-300">
      {source.label} <ExternalLink size={12} className="shrink-0" />
    </a>
  );
}

export default function AncientWordRootsWorkspace({ onOpenAcademy, onLogin }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All languages");
  const [tradition, setTradition] = useState("All perspectives");
  const [selectedId, setSelectedId] = useState("shalom");
  const [savedIds, setSavedIds] = useState(readSavedRoots);
  const [savedOnly, setSavedOnly] = useState(false);
  const [discussionMode, setDiscussionMode] = useState("interpret");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = WORD_ROOTS.find((item) => item.id === selectedId) || WORD_ROOTS[0];

  const visibleRoots = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return WORD_ROOTS.filter((item) => {
      const matchesLanguage = language === "All languages" || item.language === language;
      const matchesTradition = tradition === "All perspectives" || item.traditions.includes(tradition);
      const matchesSaved = !savedOnly || savedIds.includes(item.id);
      const searchable = [
        item.term,
        item.transliteration,
        item.pronunciation,
        item.language,
        item.era,
        item.root,
        item.gloss,
        item.context,
        item.caveat,
        item.passages.map((p) => p.label).join(" "),
        item.lenses.map((lens) => lens.tradition + " " + lens.note).join(" "),
      ].join(" ").toLowerCase();
      return matchesLanguage && matchesTradition && matchesSaved && (!needle || searchable.includes(needle));
    });
  }, [query, language, tradition, savedOnly, savedIds]);

  const toggleSaved = (id) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // Word-study browsing remains available without persistent storage.
      }
      return next;
    });
  };

  const buildQuestion = (mode) => {
    const userQuestion = question.trim();
    return [
      "Study this ancient-language word without ranking, attacking, or privileging any religion or its followers.",
      "Method requirements:",
      "1. Distinguish the attested form, likely root or word family, contextual gloss, translation decision, and later theological interpretation.",
      "2. Do not infer an entire theology from etymology alone. Explain the immediate passage and note uncertainty.",
      "3. Represent Jewish, Christian, Muslim, or other relevant perspectives fairly, and only make claims that can be grounded in a named primary source or reputable lexical resource.",
      "4. Do not force equivalence between traditions. Where a genuine doctrinal difference exists, describe it calmly, with comparable care, and without declaring a religion or its adherents superior.",
      "5. If a source does not support a claim, say so instead of inventing a citation.",
      "",
      "Selected word entry:",
      "Term: " + selected.term + " (" + selected.transliteration + ")",
      "Language/period: " + selected.language + " · " + selected.era,
      "Root/form family: " + selected.root,
      "Starter gloss: " + selected.gloss,
      "Context note: " + selected.context,
      "Caveat: " + selected.caveat,
      "Passages: " + selected.passages.map((p) => p.label).join("; "),
      "Sources: " + selected.sourceLinks.map((s) => s.label + " — " + s.url).join("; "),
      "User's study question: " + (userQuestion || "Explain the word's range of meaning and show how context affects translation."),
    ].join("\n");
  };

  const runCompanion = async (mode) => {
    if (!readAccessToken()) {
      setNotice("Sign in to request AI-assisted word interpretation. The glossary remains available without signing in.");
      if (onLogin) onLogin();
      return;
    }
    setDiscussionMode(mode);
    setWorking(true);
    setError("");
    setNotice("");
    setAnswer("");
    try {
      const result = await faithCompanion(buildQuestion(mode), mode);
      setAnswer(result?.answer || result?.content || "The companion returned no answer.");
    } catch (requestError) {
      if (requestError.status === 401) {
        setNotice("Your session may have expired. Sign in again to continue with AI-assisted word study.");
        if (onLogin) onLogin();
      } else if (requestError.status === 402) {
        setNotice("AI-assisted root interpretation is covered by the existing Faith Study Companion access. You can keep using the word library or review access in Faith Academy.");
      } else {
        setError(requestError.message || "Unable to reach the Faith Study Companion.");
      }
    } finally {
      setWorking(false);
    }
  };

  const copyStudyPrompt = async () => {
    const prompt = buildQuestion(discussionMode);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(prompt);
      setNotice("Study prompt copied. You can use it in your connected AI study workflow.");
    } catch {
      setNotice(prompt);
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-4 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-100">
              <BookOpen size={14} /> Faith language study
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Ancient Word Roots</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/90">
              Search original-language terms and explore their use in Jewish, Christian, and Muslim texts. Compare carefully: shared words can illuminate history without making theologies identical.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[210px]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-black">{WORD_ROOTS.length}</div>
              <p className="mt-1 text-[11px] text-violet-100/75">Starter entries</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-black">{savedIds.length}</div>
              <p className="mt-1 text-[11px] text-violet-100/75">Saved words</p>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-violet-100/90">
          <strong>Method:</strong> study the form, grammar, immediate context, and historical use first. A root may suggest a relationship, but it cannot prove a theological doctrine by itself.
        </div>
      </section>

      <section className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1.5fr)_minmax(170px,0.75fr)_minmax(170px,0.75fr)] sm:p-4">
        <label className="relative block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Search word, root, meaning, or reference</span>
          <Search size={16} className="absolute left-3 top-[39px] text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. shalom, taqwa, Spirit, peace…" className="w-full min-w-0 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-violet-950/50" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            {LANGUAGE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Perspective</span>
          <select value={tradition} onChange={(event) => setTradition(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            {TRADITION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => setSavedOnly((value) => !value)} className={"inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition sm:col-span-3 " + (savedOnly ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300")}>
          <Bookmark size={14} /> {savedOnly ? "Showing saved words" : "Show saved words"}
        </button>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Word index</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{visibleRoots.length} found</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {visibleRoots.map((item) => (
              <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setAnswer(""); setError(""); setNotice(""); }} className={"min-w-0 rounded-xl border p-3 text-left transition " + (selectedId === item.id ? "border-violet-300 bg-violet-50 shadow-sm dark:border-violet-800 dark:bg-violet-950/30" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700")}>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-950 dark:text-white" lang={item.language === "Qur'anic Arabic" ? "ar" : item.language === "Koine Greek" ? "el" : "he"} dir={["Biblical Hebrew","Biblical Aramaic"].includes(item.language) ? "rtl" : "auto"}>{item.term}</p>
                    <p className="mt-0.5 truncate text-xs font-bold text-violet-700 dark:text-violet-300">{item.transliteration}</p>
                  </div>
                  <button type="button" aria-label={savedIds.includes(item.id) ? "Remove saved word" : "Save word"} onClick={(event) => { event.stopPropagation(); toggleSaved(item.id); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-950/50">
                    {savedIds.includes(item.id) ? <Check size={15} className="text-violet-600 dark:text-violet-300" /> : <Bookmark size={15} />}
                  </button>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.gloss}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <RootPill>{item.language}</RootPill>
                  {item.traditions.includes("Comparative") && <RootPill>Comparative</RootPill>}
                </div>
              </button>
            ))}
            {visibleRoots.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No words match those filters. Try another spelling, language, or perspective.
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  <RootPill>{selected.language}</RootPill>
                  <RootPill>{selected.era}</RootPill>
                </div>
                <h3 className="mt-3 break-words text-3xl font-black text-slate-950 dark:text-white" lang={selected.language === "Qur'anic Arabic" ? "ar" : selected.language === "Koine Greek" ? "el" : "he"} dir={["Biblical Hebrew","Biblical Aramaic"].includes(selected.language) ? "rtl" : "auto"}>{selected.term}</h3>
                <p className="mt-1 text-sm font-bold text-violet-700 dark:text-violet-300">{selected.transliteration} · {selected.pronunciation}</p>
              </div>
              <button type="button" onClick={() => toggleSaved(selected.id)} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-violet-950/30">
                {savedIds.includes(selected.id) ? <Check size={14} /> : <Bookmark size={14} />}
                {savedIds.includes(selected.id) ? "Saved" : "Save word"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Root / word family</p>
                <p className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">{selected.root}</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/30">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">Context-aware gloss</p>
                <p className="mt-1 text-sm leading-6 text-slate-800 dark:text-slate-100">{selected.gloss}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Read the context</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{selected.context}</p>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300">Important caution</p>
              <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-100">{selected.caveat}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Theological lenses</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">These notes summarize perspectives for study, not a ruling for every member or school within a religion.</p>
            <div className="mt-3 grid gap-2">
              {selected.lenses.map((lens) => (
                <div key={lens.tradition} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">{lens.tradition}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{lens.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Passages and lexical resources</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.passages.map((passage) => <SourceLink key={passage.label} source={passage} />)}
              {selected.sourceLinks.map((source) => <SourceLink key={source.label} source={source} />)}
            </div>
            {selected.related?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Related entry</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.related.map((id) => {
                    const entry = WORD_ROOTS.find((item) => item.id === id);
                    return entry ? <button key={id} type="button" onClick={() => { setSelectedId(id); setAnswer(""); }} className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/30">{entry.transliteration} · {entry.term}</button> : null;
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm dark:border-violet-900/50 dark:bg-slate-900 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300"><Sparkles size={13} /> Faith Study Companion</div>
                <h4 className="mt-1 text-base font-black text-slate-950 dark:text-white">Interpret with context, compare respectfully</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Uses RevelaCode's existing authenticated Faith Companion access. AI output is an aid to study, not a substitute for a lexicon or a tradition's own scholars.</p>
              </div>
            </div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">What would you like to examine?</span>
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={1600} placeholder="e.g. Compare how context shapes this term without treating the traditions as identical." className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-violet-950/50" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => runCompanion("interpret")} disabled={working} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"><Sparkles size={14} /> {working && discussionMode === "interpret" ? "Interpreting…" : "Interpret this word"}</button>
              <button type="button" onClick={() => runCompanion("debate")} disabled={working} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300"><BookOpen size={14} /> {working && discussionMode === "debate" ? "Comparing…" : "Compare perspectives"}</button>
              <button type="button" onClick={copyStudyPrompt} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Copy study prompt</button>
            </div>
            {notice && <div className="mt-3 whitespace-pre-wrap rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">{notice}{notice.includes("Faith Academy") && onOpenAcademy && <button type="button" onClick={onOpenAcademy} className="ml-1 font-black underline">Open Faith Academy</button>}</div>}
            {error && <div className="mt-3"><ErrorText>{error}</ErrorText></div>}
            {answer && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/60 dark:bg-violet-950/20 sm:p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-violet-800 dark:text-violet-300"><Sparkles size={14} /> Study response</div>
                <div className="max-w-none text-sm leading-7 text-slate-700 dark:text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">How to use this responsibly</h4>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>Begin with the original form, grammar, and immediate passage.</li>
              <li>Check the source lexicon and more than one translation when possible.</li>
              <li>State which religious tradition is speaking; don't present one interpretation as every believer's view.</li>
              <li>Recognize genuine differences calmly without insulting people, erasing disagreements, or declaring a winning religion.</li>
            </ol>
          </section>
        </section>
      </div>
    </div>
  );
}
