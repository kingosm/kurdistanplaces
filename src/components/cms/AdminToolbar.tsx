import { useUser } from "@/contexts/UserContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { useLayoutEditor } from "@/contexts/LayoutEditorContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LayoutPresets } from "@/components/cms/LayoutPresets";
import {
    Pencil, Save, X, Loader2, Layout, Layers,
    Undo2, Redo2, Smartphone, Tablet, Monitor,
} from "lucide-react";

const LANG_LABELS: Record<string, string> = { en: "EN", ku: "KU", ar: "AR" };

/**
 * AdminToolbar — floating pill. Admin only. Mobile + Desktop.
 * Controls: Text Edit, Layout Edit, Breakpoint switch, Undo, Redo, Save, Cancel.
 */
export function AdminToolbar() {
    const { isAdmin, loading } = useUser();
    const { isEditMode, toggleEditMode, saveAll, cancelAll, hasPendingEdits, isSaving } = useEditMode();
    const {
        isLayoutEditMode, toggleLayoutEditMode,
        activeBreakpoint, setBreakpoint,
        saveLayouts, isSavingLayout, hasPendingLayoutEdits,
        undo, redo, canUndo, canRedo,
    } = useLayoutEditor();
    const { language } = useLanguage();
    const [showPresets, setShowPresets] = useState(false);

    if (!isAdmin || loading) return null;

    const pageSlug = window.location.pathname === "/"
        ? "index"
        : window.location.pathname.replace(/^\//, "").replace(/\//g, "_");

    const anyActive = isEditMode || isLayoutEditMode;

    return (
        <div
            className={cn(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]",
                "flex items-center gap-1 px-2.5 py-2 rounded-full shadow-2xl",
                "border transition-all duration-300 backdrop-blur-md max-w-[calc(100vw-2rem)] overflow-x-auto",
                anyActive
                    ? "bg-amber-500/95 border-amber-400 text-black"
                    : "bg-zinc-900/95 border-zinc-700 text-white"
            )}
        >
            {/* Language badge */}
            <span className={cn(
                "text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full shrink-0",
                anyActive ? "bg-black/20" : "bg-white/10"
            )}>
                {LANG_LABELS[language] ?? language.toUpperCase()}
            </span>

            <Sep />

            {/* Text Edit toggle */}
            <ToolBtn
                onClick={toggleEditMode}
                active={isEditMode}
                anyActive={anyActive}
                title={isEditMode ? "Exit Text Edit" : "Text Edit"}
                icon={<Pencil className="w-3 h-3" />}
                label="Text"
            />

            {/* Layout Edit toggle */}
            <ToolBtn
                onClick={toggleLayoutEditMode}
                active={isLayoutEditMode}
                anyActive={anyActive}
                title={isLayoutEditMode ? "Exit Layout Edit" : "Layout Edit"}
                icon={<Layout className="w-3 h-3" />}
                label="Layout"
            />

            {/* Breakpoint switcher — only in layout edit mode */}
            {isLayoutEditMode && (
                <>
                    <Sep />
                    <button
                        onClick={() => setBreakpoint("mobile")}
                        title="Edit Mobile layout"
                        className={cn(
                            "p-1.5 rounded-full transition-all",
                            activeBreakpoint === "mobile"
                                ? "bg-black/30 text-black"
                                : "hover:bg-black/10 opacity-50 hover:opacity-100"
                        )}
                    ><Smartphone className="w-3.5 h-3.5" /></button>
                    <button
                        onClick={() => setBreakpoint("tablet")}
                        title="Edit Tablet layout"
                        className={cn(
                            "p-1.5 rounded-full transition-all",
                            activeBreakpoint === "tablet"
                                ? "bg-black/30 text-black"
                                : "hover:bg-black/10 opacity-50 hover:opacity-100"
                        )}
                    ><Tablet className="w-3.5 h-3.5" /></button>
                    <button
                        onClick={() => setBreakpoint("desktop")}
                        title="Edit Desktop layout"
                        className={cn(
                            "p-1.5 rounded-full transition-all",
                            activeBreakpoint === "desktop"
                                ? "bg-black/30 text-black"
                                : "hover:bg-black/10 opacity-50 hover:opacity-100"
                        )}
                    ><Monitor className="w-3.5 h-3.5" /></button>
                </>
            )}

            {/* Undo / Redo — only in layout edit mode */}
            {isLayoutEditMode && (
                <>
                    <Sep />
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={cn(
                            "p-1.5 rounded-full transition-all",
                            canUndo ? "hover:bg-black/20" : "opacity-30 cursor-not-allowed"
                        )}
                    ><Undo2 className="w-3.5 h-3.5" /></button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                        className={cn(
                            "p-1.5 rounded-full transition-all",
                            canRedo ? "hover:bg-black/20" : "opacity-30 cursor-not-allowed"
                        )}
                    ><Redo2 className="w-3.5 h-3.5" /></button>

                    {/* Presets button */}
                    <Sep />
                    <button
                        onClick={() => setShowPresets(p => !p)}
                        title="Layout Presets"
                        className={cn(
                            "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full transition-all",
                            showPresets ? "bg-black/30" : "hover:bg-black/10 opacity-70 hover:opacity-100"
                        )}
                    >
                        <Layers className="w-3 h-3" />
                        <span className="hidden sm:inline">Presets</span>
                    </button>
                </>
            )}

            {/* Presets panel */}
            {isLayoutEditMode && showPresets && (
                <LayoutPresets onClose={() => setShowPresets(false)} />
            )}

            {/* Save text edits */}
            {isEditMode && hasPendingEdits && (
                <>
                    <Sep />
                    <button
                        onClick={saveAll} disabled={isSaving}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-60 shrink-0"
                    >
                        {isSaving
                            ? <><Loader2 className="w-3 h-3 animate-spin" /><span className="hidden sm:inline">Saving</span></>
                            : <><Save className="w-3 h-3" /><span className="hidden sm:inline">Save Text</span></>
                        }
                    </button>
                </>
            )}

            {/* Save layout */}
            {isLayoutEditMode && hasPendingLayoutEdits && (
                <>
                    <Sep />
                    <button
                        onClick={() => saveLayouts(pageSlug)} disabled={isSavingLayout}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-60 shrink-0"
                    >
                        {isSavingLayout
                            ? <><Loader2 className="w-3 h-3 animate-spin" /><span className="hidden sm:inline">Saving</span></>
                            : <><Save className="w-3 h-3" /><span className="hidden sm:inline">Save Layout</span></>
                        }
                    </button>
                </>
            )}

            {/* Cancel / Exit */}
            {anyActive && (
                <>
                    <Sep />
                    <button
                        onClick={() => { if (isEditMode) cancelAll(); if (isLayoutEditMode) toggleLayoutEditMode(); }}
                        className="p-1.5 rounded-full hover:bg-black/20 transition-all"
                        title="Exit"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </>
            )}
        </div>
    );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Sep() {
    return <div className="w-px h-4 bg-current opacity-20 shrink-0 mx-0.5" />;
}

function ToolBtn({
    onClick, active, anyActive, title, icon, label,
}: {
    onClick: () => void;
    active: boolean; anyActive: boolean;
    title: string; icon: React.ReactNode; label: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-full transition-all shrink-0",
                active
                    ? "bg-black/25 hover:bg-black/35"
                    : anyActive
                        ? "bg-black/10 hover:bg-black/20"
                        : "bg-white/10 hover:bg-white/20"
            )}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
