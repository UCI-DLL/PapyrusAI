import { useTranslation as useI18nTranslation } from "react-i18next";

/**
 * Custom hook for translations
 * Usage: const { t } = useTranslation();
 * Then use: t("common.save") or t("your.namespace.key")
 */
export const useTranslation = () => {
  return useI18nTranslation();
};

