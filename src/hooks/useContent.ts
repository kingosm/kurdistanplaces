import { useLanguage } from "@/contexts/LanguageContext";
import { useEditMode } from "@/contexts/EditModeContext";

/**
 * Drop-in replacement for t(key) that also checks DB overrides.
 * Priority: pending edit → DB override → hardcoded translation
 *
 * Usage:
 *   const c = useContent();
 *   <h1>{c('hero.title')}</h1>
 *
 * Or use <EditableText contentKey="hero.title" /> for inline editing.
 */
export const useContent = () => {
    const { language, t } = useLanguage();
    const { getContent } = useEditMode();

    return (key: string, params?: Record<string, string | number>): string => {
        const fallback = t(key, params);
        return getContent(key, language as "en" | "ku" | "ar", fallback);
    };
};
