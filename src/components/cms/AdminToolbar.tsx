import { useUser } from "@/contexts/UserContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { useLayoutEditor } from "@/contexts/LayoutEditorContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Pencil, Save, X, Loader2, Layout, Smartphone, Monitor } from "lucide-react";

const LANG_LABELS: Record<string, string> = {
    en: "EN",
    ku: "KU",
    ar: "AR",
};

/**
 * AdminToolbar — floating pill at the bottom of the screen.
 * Only visible to admins (desktop + mobile).
 * Controls: Text Edit Mode, Layout Edit Mode, Save, Cancel.
 */
export function AdminToolbar() {
    const { isAdmin, loading } = useUser();
    const { isEditMode, toggleEditMode, saveAll, cancelAll, hasPendingEdits, isSaving } = useEditMode();
    const {
        isLayoutEditMode,
        toggleLayoutEditMode,
        saveLayouts,
        isSavingLayout,
        hasPendingLayoutEdits,
        activeBreakpoint,
    } = useLayoutEditor();
    const { language } = useLanguage();

    // Never render for non-admins or while auth is loading
    if (!isAdmin || loading) return null;

    // Determine active page slug for saving layout
    const pagePath = window.location.pathname;
    const pageSlug = pagePath === "/" ? "index" : pagePath.replace(/^\//, "").replace(/\//g, "_");

    const anyActive = isEditMode || isLayoutEditMode;

    return (
        <div
            className={cn(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]",
                "flex items-center gap-1.5 px-3 py-2 rounded-full shadow-2xl",
                "border transition-all duration-300 backdrop-blur-md",
                anyActive
                    ? "bg-amber-500/95 border-amber-400 text-black"
                    : "bg-zinc-900/95 border-zinc-700 text-white"
            )}
        >
            {/* Language badge */}
            <span
                className={cn(
                    "text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full",
                    anyActive ? "bg-black/20 text-black" : "bg-white/10 text-white"
                )}
            >
                {LANG_LABELS[language] ?? language.toUpperCase()}
            </span>

            <div className="w-px h-4 bg-current opacity-20" />

            {/* Text Edit Mode toggle */}
            <button
                onClick={toggleEditMode}
                title={isEditMode ? "Exit Text Edit Mode" : "Text Edit Mode"}
                className={cn(
                    "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all",
                    isEditMode
                        ? "bg-black/25 hover:bg-black/35"
                        : anyActive
                            ? "bg-black/10 hover:bg-black/20"
                            : "bg-white/10 hover:bg-white/20"
                )}
            >
                <Pencil className="w-3 h-3" />
                <span className="hidden sm:inline">{isEditMode ? "Text" : "Text"}</span>
            </button>

            {/* Layout Edit Mode toggle + breakpoint indicator */}
            <button
                onClick={toggleLayoutEditMode}
                title={isLayoutEditMode ? "Exit Layout Edit Mode" : "Layout Edit Mode"}
                className={cn(
                    "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all",
                    isLayoutEditMode
                        ? "bg-black/25 hover:bg-black/35"
                        : anyActive
                            ? "bg-black/10 hover:bg-black/20"
                            : "bg-white/10 hover:bg-white/20"
                )}
            >
                <Layout className="w-3 h-3" />
                <span className="hidden sm:inline">Layout</span>
                {isLayoutEditMode && (
                    <span className="text-[9px] font-mono opacity-70">
                        {activeBreakpoint === "mobile" ? "📱" : "🖥"}
                    </span>
                )}
            </button>

            {/* Save text edits */}
            {isEditMode && hasPendingEdits && (
                <>
                    <div className="w-px h-4 bg-current opacity-20" />
                    <button
                        onClick={saveAll}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-60"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> <span className="hidden sm:inline">Saving</span></>
                        ) : (
                            <><Save className="w-3 h-3" /> <span className="hidden sm:inline">Save Text</span></>
                        )}
                    </button>
                </>
            )}

            {/* Save layout */}
            {isLayoutEditMode && hasPendingLayoutEdits && (
                <>
                    <div className="w-px h-4 bg-current opacity-20" />
                    <button
                        onClick={() => saveLayouts(pageSlug)}
                        disabled={isSavingLayout}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-60"
                    >
                        {isSavingLayout ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> <span className="hidden sm:inline">Saving</span></>
                        ) : (
                            <><Save className="w-3 h-3" /> <span className="hidden sm:inline">Save Layout</span></>
                        )}
                    </button>
                </>
            )}

            {/* Cancel — shown when either mode is active */}
            {anyActive && (
                <>
                    <div className="w-px h-4 bg-current opacity-20" />
                    <button
                        onClick={() => { if (isEditMode) cancelAll(); if (isLayoutEditMode) toggleLayoutEditMode(); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-black/20 hover:bg-black/35 transition-all"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </>
            )}
        </div>
    );
}
