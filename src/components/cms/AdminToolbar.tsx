import { useUser } from "@/contexts/UserContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Pencil, Save, X, Loader2 } from "lucide-react";

const LANG_LABELS: Record<string, string> = {
    en: "EN",
    ku: "KU",
    ar: "AR",
};

/**
 * AdminToolbar — floating pill at the bottom of the screen.
 * Only visible to admins. Shows edit mode toggle, language badge,
 * save and cancel buttons.
 */
export function AdminToolbar() {
    const { isAdmin } = useUser();
    const { isEditMode, toggleEditMode, saveAll, cancelAll, hasPendingEdits, isSaving } = useEditMode();
    const { language } = useLanguage();

    // Never render for non-admins
    if (!isAdmin) return null;

    return (
        <div
            className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]",
                "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl",
                "border transition-all duration-300",
                isEditMode
                    ? "bg-amber-500 border-amber-400 text-black"
                    : "bg-zinc-900 border-zinc-700 text-white"
            )}
        >
            {/* Language badge */}
            <span
                className={cn(
                    "text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full",
                    isEditMode ? "bg-black/20 text-black" : "bg-white/10 text-white"
                )}
            >
                {LANG_LABELS[language] ?? language.toUpperCase()}
            </span>

            <div className="w-px h-4 bg-current opacity-20" />

            {/* Edit mode toggle */}
            <button
                onClick={toggleEditMode}
                title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
                className={cn(
                    "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                    isEditMode
                        ? "bg-black/20 hover:bg-black/30"
                        : "bg-white/10 hover:bg-white/20"
                )}
            >
                <Pencil className="w-3.5 h-3.5" />
                {isEditMode ? "Editing" : "Edit Mode"}
            </button>

            {/* Save button — only when there are pending edits */}
            {isEditMode && hasPendingEdits && (
                <button
                    onClick={saveAll}
                    disabled={isSaving}
                    title="Save all changes"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-60"
                >
                    {isSaving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="w-3.5 h-3.5" /> Save</>
                    )}
                </button>
            )}

            {/* Cancel button — only in edit mode */}
            {isEditMode && (
                <button
                    onClick={cancelAll}
                    title="Cancel and exit edit mode"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/30 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                </button>
            )}
        </div>
    );
}
