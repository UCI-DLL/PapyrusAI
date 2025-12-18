import i18n from "./config";

/**
 * Change the application language
 * @param language - Language code ("en" for English, "es" for Spanish)
 */
export const changeLanguage = (language: "en" | "es"): void => {
  i18n.changeLanguage(language);
};

/**
 * Get the current language code
 * @returns Current language code ("en" or "es")
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || "en";
};

export default i18n;

