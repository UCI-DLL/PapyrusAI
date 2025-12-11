import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";

// Get language from localStorage or default to English
const getStoredLanguage = (): string => {
  try {
    const storedUser = localStorage.getItem("papyrusai_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const language = user["custom:language"];
      if (language === "spanish") {
        return "es";
      }
    }
  } catch (error) {
    console.error("Error reading language from localStorage:", error);
  }
  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      es: {
        translation: esTranslations,
      },
    },
    lng: getStoredLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;

