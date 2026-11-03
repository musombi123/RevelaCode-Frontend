const bi = (en, sw) => ({ en, sw });
const step = (target, route, enTitle, swTitle, enBody, swBody, action = "none", demoValue = "", placement = "auto") => ({
  target, route, title: bi(enTitle, swTitle), body: bi(enBody, swBody),
  action, demoValue, placement, mobilePlacement: "sheet",
});

const CURATED = {
  welcome: {
    id: "welcome", icon: "sparkles", title: bi("Welcome to RevelaCode", "Karibu RevelaCode"),
    summary: bi("One account connects your work, learning, faith and community.", "Akaunti moja inaunganisha kazi, masomo, imani na jamii yako."),
    whoFor: bi("For anyone exploring the ecosystem for the first time.", "Kwa mtu yeyote anayeanza kuchunguza mfumo huu."),
    benefits: [
      bi("Explore safely before creating an account.", "Chunguza kwa usalama kabla ya kufungua akaunti."),
      bi("Use one identity across connected hubs.", "Tumia utambulisho mmoja katika vitovu vilivyounganishwa."),
      bi("Choose guest access or register when ready.", "Chagua kuingia kama mgeni au kujisajili ukiwa tayari."),
    ],
    steps: [
      step("welcome-entry", "welcome", "Choose how to begin", "Chagua jinsi ya kuanza", "Sign in, create an account, or explore first as a guest.", "Ingia, fungua akaunti, au anza kwa kuchunguza kama mgeni."),
      step("welcome-guest", "welcome", "Explore as a guest", "Chunguza kama mgeni", "Choose Continue as guest. This tour uses sample data only.", "Chagua Endelea kama mgeni. Ziara hii hutumia data za mfano pekee.", "click"),
      step("home-welcome", "home", "Meet your home hub", "Fahamu kitovu cha nyumbani", "Your home brings the connected workspaces together in one place.", "Ukurasa wa nyumbani unaunganisha vitovu vyako vyote sehemu moja."),
    ],
    challenge: bi("Find the hub you would use most often.", "Tafuta kitovu utakachotumia mara nyingi."),
  },
  home: {
    id: "home", icon: "house", title: bi("Home hub", "Kitovu cha Nyumbani"),
    summary: bi("Your starting point for every connected workspace.", "Sehemu ya kuanzia kwa kila kitovu kilichounganishwa."),
    whoFor: bi("For every RevelaCode user who wants one clear starting point.", "Kwa kila mtumiaji anayetaka sehemu moja rahisi ya kuanzia."),
    benefits: [
      bi("See your connected hubs together.", "Ona vitovu vyako vyote pamoja."),
      bi("Return to recent work quickly.", "Rudi haraka kwenye kazi ulizoanza."),
      bi("Open RevelaAI from the home screen.", "Fungua RevelaAI moja kwa moja nyumbani."),
    ],
    steps: [
      step("home-welcome", "home", "Your workspace at a glance", "Muhtasari wa nafasi yako", "See your welcome, activity and shortcuts without searching through menus.", "Ona salamu, shughuli na njia za mkato bila kutafuta menyu."),
      step("home-hubs", "home", "Choose a connected hub", "Chagua kitovu", "Each card opens a workspace built for a different part of life or work.", "Kila kadi hufungua kitovu kilichoundwa kwa kazi au maisha tofauti."),
      step("home-hub-biashara", "home", "Open a business workspace", "Fungua kitovu cha biashara", "Tap Biashara to see how a business is managed from one place.", "Gusa Biashara kuona jinsi biashara inavyosimamiwa sehemu moja.", "click"),
    ],
    challenge: bi("Choose one hub you want to explore next.", "Chagua kitovu unachotaka kuchunguza baadaye."),
  },
  biashara: {
    id: "biashara", registryKey: "biashara", icon: "store", title: bi("Biashara", "Biashara"),
    summary: bi("Run sales, stock, orders, customers and business operations.", "Simamia mauzo, bidhaa, oda, wateja na shughuli za biashara."),
    whoFor: bi("For shop owners, traders, service providers and growing businesses.", "Kwa wamiliki wa maduka, wafanyabiashara, watoa huduma na biashara zinazokua."),
    benefits: [
      bi("Keep products, orders and sales connected.", "Unganisha bidhaa, oda na mauzo."),
      bi("Spot stock and cash-flow issues earlier.", "Tambua mapema changamoto za bidhaa na fedha."),
      bi("Give each team member the right workspace.", "Mpe kila mfanyakazi nafasi inayofaa."),
    ],
    steps: [
      step("biashara-overview", "biashara", "Your business overview", "Muhtasari wa biashara", "See your business identity, live figures and stock alerts together.", "Ona utambulisho wa biashara, takwimu na tahadhari za bidhaa pamoja."),
      step("biashara-nav-products", "biashara", "Open Products and stock", "Fungua Bidhaa na stoo", "Choose Products to review stock and add an item to your catalogue.", "Chagua Bidhaa kukagua stoo na kuongeza bidhaa kwenye orodha.", "click"),
      step("biashara-product-name", "biashara", "Name a sample product", "Weka jina la bidhaa ya mfano", "Enter the sample name below. It will fill the product form without saving yet.", "Weka jina la mfano hapa chini. Litajaza fomu bila kuhifadhi bado.", "type", "Demo maize flour"),
      step("biashara-create-product", "biashara", "Try creating the product", "Jaribu kuunda bidhaa", "Tap Create product. Demo mode simulates the request and saves nothing.", "Gusa Unda bidhaa. Hali ya onyesho huiga ombi bila kuhifadhi chochote.", "click"),
    ],
    challenge: bi("Find Orders and check which orders need attention.", "Tafuta Oda na uangalie oda zinazohitaji kushughulikiwa."),
  },
  shamba: {
    id: "shamba", registryKey: "shamba", icon: "sprout", title: bi("Shamba", "Shamba"),
    summary: bi("Manage farms, crops, field records, weather and markets.", "Simamia mashamba, mazao, kumbukumbu, hali ya hewa na masoko."),
    whoFor: bi("For farmers, farm teams and agricultural advisers.", "Kwa wakulima, timu za mashamba na washauri wa kilimo."),
    benefits: [
      bi("Keep each farm and crop record organised.", "Panga taarifa za kila shamba na zao."),
      bi("Use weather and market information to plan.", "Tumia taarifa za hali ya hewa na soko kupanga."),
      bi("Review crop and soil guidance with AI tools.", "Pata mwongozo wa mazao na udongo kwa zana za AI."),
    ],
    steps: [
      step("shamba-overview", "shamba", "Your farm home", "Nyumbani kwa shamba lako", "Start with your farmer profile, farm status and current farm information.", "Anza na wasifu wa mkulima, hali ya uthibitishaji na taarifa za shamba."),
      step("shamba-nav-farms", "shamba", "Open your farms", "Fungua mashamba yako", "Tap Farms to view registered farms and open a farm record.", "Gusa Mashamba kuona mashamba yaliyosajiliwa na kufungua rekodi.", "click"),
      step("shamba-farms-screen", "shamba", "Review a farm record", "Kagua rekodi ya shamba", "Check the location, size, crop and verification status before recording activity.", "Kagua eneo, ukubwa, zao na hali ya uthibitishaji kabla ya kurekodi shughuli."),
    ],
    challenge: bi("Find the crop and soil scan tool in More.", "Tafuta zana ya kuchunguza mazao na udongo kwenye Zaidi."),
  },
  education: {
    id: "education", registryKey: "education", icon: "graduation-cap", title: bi("Elimu", "Elimu"),
    summary: bi("Coordinate schools, staff, learners, fees and academic work.", "Ratibu shule, wafanyakazi, wanafunzi, ada na shughuli za masomo."),
    whoFor: bi("For school owners, principals, bursars, registrars and teachers.", "Kwa wamiliki wa shule, wakuu, wahasibu, wasajili na walimu."),
    benefits: [
      bi("Give each school role the right access.", "Mpe kila jukumu la shule ruhusa inayofaa."),
      bi("Keep learner, class and fee records organised.", "Panga kumbukumbu za wanafunzi, madarasa na ada."),
      bi("Share school information through public pages and portals.", "Shiriki taarifa za shule kupitia kurasa na mifumo ya umma."),
    ],
    steps: [
      step("elimu-overview", "education", "Your school workspace", "Nafasi ya kazi ya shule", "The dashboard adapts to your school role and permissions.", "Dashibodi hubadilika kulingana na jukumu na ruhusa zako shuleni."),
      step("elimu-nav-website", "education", "Open school pages", "Fungua kurasa za shule", "Choose Public website to review the school's public information.", "Chagua Tovuti ya Umma kukagua taarifa za shule.", "click"),
      step("elimu-school-pages", "education", "Review your school pages", "Kagua kurasa za shule", "Check the school identity, public information and family-facing pages.", "Kagua utambulisho wa shule, taarifa za umma na kurasa za wazazi."),
      step("elimu-nav-students", "education", "Open learner records", "Fungua kumbukumbu za wanafunzi", "Choose Students to see where enrolment and learner records are managed.", "Chagua Wanafunzi kuona mahali pa kusimamia usajili na taarifa zao.", "click"),
      step("elimu-student-records", "education", "Review learner management", "Kagua usimamizi wa wanafunzi", "Student records are protected by your school role and permissions.", "Kumbukumbu za wanafunzi zinalindwa na jukumu na ruhusa zako shuleni."),
    ],
    challenge: bi("Find the module your school role uses most.", "Tafuta sehemu inayotumiwa zaidi na jukumu lako shuleni."),
  },
  faith: {
    id: "faith", registryKey: "faith", icon: "book-open", title: bi("Faith & Scripture", "Imani na Maandiko"),
    summary: bi("Study Scripture with a library, reading tools and saved notes.", "Jifunze Maandiko kwa kutumia maktaba, zana za kusoma na nukuu."),
    whoFor: bi("For readers, Bible study groups, teachers and faith communities.", "Kwa wasomaji, vikundi vya Biblia, walimu na jumuiya za imani."),
    benefits: [
      bi("Find guided study materials in one library.", "Pata masomo yaliyoongozwa katika maktaba moja."),
      bi("Save bookmarks and continue reading later.", "Hifadhi alamisho na uendelee kusoma baadaye."),
      bi("Explore Bible, prophecy and learning resources.", "Chunguza Biblia, unabii na nyenzo za kujifunza."),
    ],
    steps: [
      step("faith-overview", "faith", "Your study home", "Nyumbani pa masomo", "Use the Faith hub to reach Scripture, prophecy, events and study resources.", "Tumia kitovu cha Imani kufikia Maandiko, unabii, matukio na nyenzo za masomo."),
      step("faith-study-library", "faith", "Open the Study Library", "Fungua Maktaba ya Masomo", "Tap Study Library to browse curated lessons and source-linked guides.", "Gusa Maktaba ya Masomo kuvinjari masomo na miongozo yenye marejeo.", "click"),
      step("faith-study-root", "faith", "Choose a study resource", "Chagua nyenzo ya kujifunza", "Open a resource, read at your pace and save useful material for later.", "Fungua nyenzo, soma kwa kasi yako na hifadhi mambo muhimu."),
    ],
    challenge: bi("Open one study topic and find its bookmark control.", "Fungua mada moja na utafute kitufe cha kuweka alamisho."),
  },
  community: {
    id: "community", registryKey: "community", icon: "users", title: bi("Community — Jumuiya", "Jamii — Jumuiya"),
    summary: bi("Connect with people, groups, posts, opportunities and chats.", "Ungana na watu, vikundi, machapisho, fursa na mazungumzo."),
    whoFor: bi("For neighbours, groups, organisations, creators and local networks.", "Kwa majirani, vikundi, mashirika, wabunifu na mitandao ya eneo."),
    benefits: [
      bi("Share useful updates with your community.", "Shiriki taarifa muhimu na jamii yako."),
      bi("Find people and groups with shared interests.", "Tafuta watu na vikundi vyenye maslahi yanayofanana."),
      bi("Continue conversations through community chat.", "Endeleza mazungumzo kupitia gumzo la jamii."),
    ],
    steps: [
      step("community-overview", "community", "Your community feed", "Mtiririko wa jamii yako", "Browse updates, groups and useful local conversations.", "Vinjari taarifa, vikundi na mazungumzo muhimu ya eneo lako."),
      step("community-create-post", "community", "Start a post", "Anzisha chapisho", "Tap Create post to open the composer. Demo mode blocks publishing.", "Gusa Tengeneza chapisho kufungua sehemu ya kuandika. Hali ya onyesho huzuia uchapishaji.", "click"),
      step("community-composer-title", "community", "Write a sample title", "Andika kichwa cha mfano", "Enter a short title below. It fills the draft but does not publish it.", "Weka kichwa kifupi hapa chini. Hujaza rasimu bila kuichapisha.", "type", "A useful community update"),
      step("community-chat-nav", "community", "Open Jumuiya chat", "Fungua gumzo la Jumuiya", "Open Chats to find private messages and group conversations.", "Fungua Gumzo kupata ujumbe binafsi na mazungumzo ya vikundi.", "click"),
    ],
    challenge: bi("Find a group or person you would like to connect with.", "Tafuta kikundi au mtu unayetaka kuungana naye."),
  },
  ai: {
    id: "ai", registryKey: "ai", icon: "bot", title: bi("RevelaAI assistant", "Msaidizi wa RevelaAI"),
    summary: bi("Ask questions and work with text, voice and vision across hubs.", "Uliza maswali na tumia maandishi, sauti na picha katika vitovu."),
    whoFor: bi("For learners, farmers, teams, builders and anyone needing guidance.", "Kwa wanafunzi, wakulima, timu, wabunifu na yeyote anayehitaji mwongozo."),
    benefits: [
      bi("Get help in the context of the active hub.", "Pata msaada kulingana na kitovu unachotumia."),
      bi("Use voice and image tools when available.", "Tumia zana za sauti na picha zinapopatikana."),
      bi("Turn questions into practical next steps.", "Badilisha maswali kuwa hatua za vitendo."),
    ],
    steps: [
      step("ai-overview", "ai", "Meet your assistant", "Kutana na msaidizi wako", "RevelaAI can help with questions across the connected workspaces.", "RevelaAI inaweza kusaidia maswali katika vitovu vilivyounganishwa."),
      step("ai-chat-input", "ai", "Ask a simple question", "Uliza swali rahisi", "Type the sample question below to see the message field in action.", "Andika swali la mfano hapa chini kuona jinsi sehemu ya ujumbe inavyofanya kazi.", "type", "Show me three ways to improve my work today."),
      step("ai-vision-tools", "ai", "Explore voice and vision", "Chunguza sauti na picha", "Use voice or camera controls to explore other ways to communicate.", "Tumia vitufe vya sauti au kamera kuchunguza njia nyingine za kuwasiliana."),
    ],
    challenge: bi("Ask RevelaAI for one practical next step in your chosen hub.", "Uliza RevelaAI hatua moja ya vitendo kwa kitovu unachochagua."),
  },
  account: {
    id: "account", icon: "user-round", title: bi("Account Center", "Kituo cha Akaunti"),
    summary: bi("Manage your profile, settings, payments, security and support.", "Simamia wasifu, mipangilio, malipo, usalama na msaada."),
    whoFor: bi("For every member who wants control over their account and preferences.", "Kwa kila mwanachama anayetaka kudhibiti akaunti na mapendeleo yake."),
    benefits: [
      bi("Keep your profile and preferences current.", "Sasisha wasifu na mapendeleo yako."),
      bi("Review wallet activity and payment records.", "Kagua shughuli za pochi na rekodi za malipo."),
      bi("Manage security, notifications and support.", "Simamia usalama, arifa na msaada."),
    ],
    steps: [
      step("account-overview", "profile", "Your Account Center", "Kituo chako cha Akaunti", "Your personal tools are grouped in one account workspace.", "Zana zako binafsi zimepangwa katika nafasi moja ya akaunti."),
      step("account-menu-profile", "profile", "Review your profile", "Kagua wasifu wako", "Open Profile to check your personal information and account identity.", "Fungua Wasifu kukagua taarifa binafsi na utambulisho wa akaunti.", "click"),
      step("account-menu-payments", "profile", "Find payments and wallet", "Tafuta malipo na pochi", "Open Payments to review the wallet and transaction area.", "Fungua Malipo kukagua pochi na sehemu ya miamala.", "click"),
      step("account-menu-accounts", "profile", "Check account security", "Kagua usalama wa akaunti", "Open Account and Security to review sign-in protection options.", "Fungua Akaunti na Usalama kukagua njia za kulinda kuingia.", "click"),
      step("account-menu-help", "profile", "Find help and notifications", "Tafuta msaada na arifa", "Open Help for support. Notifications are listed in the same Account Center menu.", "Fungua Msaada kupata huduma. Arifa zimo kwenye menyu hiyo hiyo ya Akaunti.", "click"),
    ],
    challenge: bi("Find the notifications area and locate the support contact in Help.", "Tafuta sehemu ya arifa na mawasiliano ya huduma kwenye Msaada."),
  },
};

const FINISH = {
  id: "finish", icon: "flag", title: bi("You are ready", "Uko tayari"),
  summary: bi("You have toured the main RevelaCode and Jumuiya workspaces.", "Umetembelea vitovu vikuu vya RevelaCode na Jumuiya."),
  whoFor: bi("For every new member ready to explore independently.", "Kwa kila mwanachama mpya aliye tayari kujifunza mwenyewe."),
  benefits: [
    bi("You know where each workspace lives.", "Unajua mahali pa kila kitovu."),
    bi("You have practised the main navigation.", "Umejaribu urambazaji mkuu."),
    bi("You can create an account whenever you are ready.", "Unaweza kufungua akaunti ukiwa tayari."),
  ],
  steps: [],
  challenge: bi("Choose one workspace and try its main task on your own.", "Chagua kitovu kimoja na ujaribu kazi yake kuu mwenyewe."),
};

const CORE_ORDER = ["biashara", "shamba", "education", "faith", "community"];
const RESERVED = new Set([
  "home", "biashara", "shamba", "education", "faith", "community",
  "ai", "profile", "settings", "accounts", "payments", "bible", "prophecy",
  "events", "referential", "notifications",
]);

function generatedChapter(entry, homeHub = false) {
  const key = String(entry?.key || entry?.id || "").trim();
  const label = String(entry?.title || entry?.label || key || "Workspace");
  if (!key) return null;
  const benefits = [
    bi("Keep related work in one place.", "Weka kazi zinazohusiana sehemu moja."),
    bi("Use the tools available to your role.", "Tumia zana zinazoruhusiwa kwa jukumu lako."),
    bi("Return to this workspace whenever you need it.", "Rudi kwenye kitovu hiki unapokihitaji."),
  ];
  return {
    id: key,
    registryKey: key,
    icon: "layers",
    title: bi(label, label),
    summary: bi("Explore this connected RevelaCode workspace and its main tools.", "Chunguza kitovu hiki cha RevelaCode na zana zake kuu."),
    whoFor: bi("For people whose work or interests match this workspace.", "Kwa watu ambao kazi au maslahi yao yanaendana na kitovu hiki."),
    benefits,
    steps: homeHub
      ? [
          step("home-hub-" + key, "home", "Find this workspace", "Tafuta kitovu hiki", "Open this hub card to enter its workspace.", "Fungua kadi hii kuingia kwenye kitovu.", "click"),
          step(null, key, "Explore the main tools", "Chunguza zana kuu", "Look through the workspace and find the tool you need most.", "Chunguza kitovu na utafute zana unayohitaji zaidi."),
          step(null, key, "Choose a next action", "Chagua hatua inayofuata", "Use the workspace navigation to continue with a task.", "Tumia urambazaji wa kitovu kuendelea na kazi."),
        ]
      : [
          step(null, key, "Open the workspace", "Fungua kitovu", "Start from the workspace overview and look for its main tools.", "Anza kwenye muhtasari na utafute zana kuu."),
          step(null, key, "Find a main tool", "Tafuta zana kuu", "Choose one tool that matches the task you want to complete.", "Chagua zana inayolingana na kazi unayotaka kufanya."),
          step(null, key, "Review the next step", "Kagua hatua inayofuata", "Use the workspace navigation to continue safely.", "Tumia urambazaji wa kitovu kuendelea kwa usalama."),
        ],
    challenge: bi("Choose one task you want to try in this workspace.", "Chagua kazi moja unayotaka kujaribu katika kitovu hiki."),
    generated: true,
  };
}

export function buildDemoChapters(homeHubs = [], dashboards = []) {
  const homeKeys = new Set(homeHubs.map((hub) => String(hub?.key || "")).filter(Boolean));
  const dashboardByKey = new Map(dashboards.map((item) => [String(item?.key || ""), item]));
  const hubIds = CORE_ORDER.filter((key) => homeKeys.has(key) || dashboardByKey.has(key));
  const chapters = [CURATED.welcome, CURATED.home];
  hubIds.forEach((key) => {
    const curated = CURATED[key];
    const dashboard = dashboardByKey.get(key);
    const homeHub = homeHubs.find((hub) => hub?.key === key);
    if (curated) chapters.push(curated);
    else if (homeHub || dashboard) chapters.push(generatedChapter(homeHub || dashboard, Boolean(homeHub)));
  });

  const extras = [];
  homeHubs.forEach((hub) => {
    const key = String(hub?.key || "");
    if (key && !RESERVED.has(key)) extras.push(generatedChapter(hub, true));
  });
  dashboards.forEach((dashboard) => {
    const key = String(dashboard?.key || "");
    if (!key || RESERVED.has(key) || dashboard.hidden || extras.some((item) => item?.id === key)) return;
    extras.push(generatedChapter(dashboard, false));
  });

  chapters.push(CURATED.ai, CURATED.account, ...extras.filter(Boolean), FINISH);
  return chapters;
}

export const DEMO_DEFAULT_CHAPTERS = buildDemoChapters();
