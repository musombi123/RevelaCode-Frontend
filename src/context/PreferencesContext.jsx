import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const PreferencesContext = createContext(null);

const PREFERENCES_STORAGE_KEY = "preferences";
const LANGUAGE_STORAGE_KEY = "revelacode_language";
const READING_SCALE_STORAGE_KEY = "revelacode_reading_scale";

const FONT_SCALE = {
  sm: 0.92,
  md: 1,
  lg: 1.12,
};

const TRANSLATIONS = {
  en: {},
  sw: {
    "Preferences & Experience": "Mapendeleo na Uzoefu",
    "Appearance": "Muonekano",
    "Theme": "Mandhari",
    "Light": "Mwangaza",
    "Dark": "Giza",
    "System": "Mfumo",
    "Reading size": "Ukubwa wa maandishi",
    "Decrease reading size": "Punguza maandishi",
    "Increase reading size": "Ongeza maandishi",
    "Small": "Ndogo",
    "Medium": "Wastani",
    "Large": "Kubwa",
    "Reading preview": "Mfano wa maandishi",
    "Language": "Lugha",
    "Set your preferred display language.": "Chagua lugha unayopendelea kutumia.",
    "Interface language": "Lugha ya kiolesura",
    "English interface": "Kiolesura cha Kiingereza",
    "Kiolesura cha Kiswahili": "Kiolesura cha Kiswahili",
    "Interface française": "Kiolesura cha Kifaransa",
    "Your Hubs": "Vituo Vyako",
    "Access the platforms that power your world.": "Fikia majukwaa yanayokuwezesha.",
    "Ecosystem Overview": "Muhtasari wa Mfumo",
    "Live information returned by your connected RevelaCode services.": "Taarifa za moja kwa moja kutoka huduma zako za RevelaCode.",
    "Notifications": "Arifa",
    "Wallet Balance": "Salio la Pochi",
    "Biashara Orders": "Maagizo ya Biashara",
    "Biashara Products": "Bidhaa za Biashara",
    "Shamba Farms": "Mashamba",
    "Active Crops": "Mazao Yanayokua",
    "Education Assignments": "Kazi za Elimu",
    "Community Activity": "Shughuli za Jamii",
    "Faith & Scripture": "Imani na Maandiko",
    "Faith": "Imani",
    "Education": "Elimu",
    "Shamba": "Shamba",
    "Biashara": "Biashara",
    "Community": "Jamii",
    "Bible study, prophecy and SDA lessons": "Masomo ya Biblia, unabii na masomo ya SDA",
    "Schools, classes, fees and projects": "Shule, madarasa, ada na miradi",
    "Farms, crops and market insights": "Mashamba, mazao na taarifa za soko",
    "Products, sales and business growth": "Bidhaa, mauzo na ukuaji wa biashara",
    "Community, groups and opportunities": "Jamii, vikundi na fursa",
    "RevelaCode ecosystem": "Mfumo wa RevelaCode",
    "AI assistant": "Msaidizi wa AI",
    "Open workspace": "Fungua eneo la kazi",
    "Open Hub": "Fungua Kituo",
    "Most used": "Kinachotumika zaidi",
    "Quick access": "Ufikiaji wa haraka",
    "Your quick access": "Ufikiaji wako wa haraka",
    "Your hubs are ready when you are.": "Vituo vyako viko tayari.",
    "Personalized": "Imebinafsishwa",
    "Think with RevelaAI": "Fikiri pamoja na RevelaAI",
    "Start a conversation": "Anza mazungumzo",
    "Five connected hubs": "Vituo vitano vilivyounganishwa",
    "Intelligence built in": "Akili bandia imejumuishwa",
    "Welcome back,": "Karibu tena,",
    "One connected place to learn, build, grow and connect. Pick up where you left off or jump straight into your world.": "Mahali pamoja pa kujifunza, kujenga, kukua na kuungana. Endelea ulipoishia au nenda moja kwa moja kwenye kituo chako.",
  },
  fr: {
    "Preferences & Experience": "Préférences et expérience",
    "Appearance": "Apparence",
    "Theme": "Thème",
    "Light": "Clair",
    "Dark": "Sombre",
    "System": "Système",
    "Reading size": "Taille du texte",
    "Decrease reading size": "Réduire le texte",
    "Increase reading size": "Agrandir le texte",
    "Small": "Petit",
    "Medium": "Moyen",
    "Large": "Grand",
    "Reading preview": "Aperçu du texte",
    "Language": "Langue",
    "Set your preferred display language.": "Choisissez votre langue d’affichage préférée.",
    "Interface language": "Langue de l’interface",
    "English interface": "Interface anglaise",
    "Kiolesura cha Kiswahili": "Interface en swahili",
    "Interface française": "Interface française",
    "Your Hubs": "Vos espaces",
    "Access the platforms that power your world.": "Accédez aux plateformes qui vous accompagnent.",
    "Ecosystem Overview": "Vue d’ensemble de l’écosystème",
    "Live information returned by your connected RevelaCode services.": "Informations en direct de vos services RevelaCode connectés.",
    "Notifications": "Notifications",
    "Wallet Balance": "Solde du portefeuille",
    "Biashara Orders": "Commandes Biashara",
    "Biashara Products": "Produits Biashara",
    "Shamba Farms": "Exploitations Shamba",
    "Active Crops": "Cultures actives",
    "Education Assignments": "Devoirs éducatifs",
    "Community Activity": "Activité communautaire",
    "Faith & Scripture": "Foi et Écritures",
    "Faith": "Foi",
    "Education": "Éducation",
    "Shamba": "Shamba",
    "Biashara": "Biashara",
    "Community": "Communauté",
    "Bible study, prophecy and SDA lessons": "Étude biblique, prophéties et leçons adventistes",
    "Schools, classes, fees and projects": "Écoles, classes, frais et projets",
    "Farms, crops and market insights": "Exploitations, cultures et tendances du marché",
    "Products, sales and business growth": "Produits, ventes et croissance commerciale",
    "Community, groups and opportunities": "Communauté, groupes et opportunités",
    "RevelaCode ecosystem": "Écosystème RevelaCode",
    "AI assistant": "Assistant IA",
    "Open workspace": "Ouvrir l’espace",
    "Open Hub": "Ouvrir l’espace",
    "Most used": "Le plus utilisé",
    "Quick access": "Accès rapide",
    "Your quick access": "Votre accès rapide",
    "Your hubs are ready when you are.": "Vos espaces sont prêts.",
    "Personalized": "Personnalisé",
    "Think with RevelaAI": "Réfléchir avec RevelaAI",
    "Start a conversation": "Commencer une conversation",
    "Five connected hubs": "Cinq espaces connectés",
    "Intelligence built in": "Intelligence intégrée",
    "Welcome back,": "Bon retour,",
    "One connected place to learn, build, grow and connect. Pick up where you left off or jump straight into your world.": "Un espace connecté pour apprendre, créer, progresser et échanger. Reprenez là où vous en étiez ou accédez directement à votre espace.",
  },
};

function translate(language, value) {
  return TRANSLATIONS[language]?.[value] || value;
}

function readStoredPreferences() {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Unable to load RevelaCode preferences:", error);
  }
  return {};
}

function readLanguage() {
  try {
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return ["en", "sw", "fr"].includes(language) ? language : "en";
  } catch {
    return "en";
  }
}

function readFontSize(preferences) {
  try {
    const saved = preferences?.fontSize || localStorage.getItem("revelacode_font_size");
    return ["sm", "md", "lg"].includes(saved) ? saved : "md";
  } catch {
    return ["sm", "md", "lg"].includes(preferences?.fontSize)
      ? preferences.fontSize
      : "md";
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);
  const [fontSize, setFontSizeState] = useState(() => readFontSize(readStoredPreferences()));
  const [language, setLanguageState] = useState(readLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify({ ...preferences, fontSize })
      );
      localStorage.setItem("revelacode_font_size", fontSize);
    } catch (error) {
      console.warn("Unable to save RevelaCode preferences:", error);
    }
  }, [preferences, fontSize]);

  useEffect(() => {
    const scale = FONT_SCALE[fontSize] || FONT_SCALE.md;
    const root = document.documentElement;

    // Tailwind's rem-based sizing follows the root font size, so this
    // applies the preference to the actual interface, not just its preview.
    root.style.fontSize = `${16 * scale}px`;
    root.style.setProperty("--revelacode-reading-scale", String(scale));
    root.dataset.readingScale = String(scale);

    try {
      localStorage.setItem(READING_SCALE_STORAGE_KEY, String(scale));
    } catch {
      // The setting still applies for the current session.
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:readingscalechange", {
        detail: { scale, fontSize },
      })
    );
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The setting still applies for the current session.
    }

    window.dispatchEvent(
      new CustomEvent("revelacode:languagechange", {
        detail: { language },
      })
    );
  }, [language]);

  const setFontSize = useCallback((nextSize) => {
    if (!Object.prototype.hasOwnProperty.call(FONT_SCALE, nextSize)) return;
    setFontSizeState(nextSize);
    setPreferences((current) => ({ ...current, fontSize: nextSize }));
  }, []);

  const setLanguage = useCallback((nextLanguage) => {
    if (!["en", "sw", "fr"].includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
  }, []);

  const setPreference = useCallback((key, value) => {
    if (!key) return;
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({});
    setFontSizeState("md");
    setLanguageState("en");
    try {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      localStorage.removeItem("revelacode_font_size");
      localStorage.removeItem(READING_SCALE_STORAGE_KEY);
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // State still resets for the current session.
    }
  }, []);

  const t = useCallback(
    (value) => translate(language, value),
    [language]
  );

  const value = useMemo(
    () => ({
      preferences,
      setPreference,
      resetPreferences,
      fontSize,
      setFontSize,
      language,
      setLanguage,
      t,
    }),
    [
      preferences,
      setPreference,
      resetPreferences,
      fontSize,
      setFontSize,
      language,
      setLanguage,
      t,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("PreferencesContext missing");
  }
  return context;
}
