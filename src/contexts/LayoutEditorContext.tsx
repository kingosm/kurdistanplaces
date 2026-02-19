import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface ElementLayout {
    x: number;
    y: number;
    width?: number | null;
    height?: number | null;
}

interface LayoutEditorContextType {
    isLayoutEditMode: boolean;
    toggleLayoutEditMode: () => void;
    activeBreakpoint: Breakpoint;   // what the admin is currently EDITING
    autoBreakpoint: Breakpoint;     // actual device size (used for rendering)
    setBreakpoint: (bp: Breakpoint) => void;
    selectedId: string | null;
    selectElement: (id: string | null) => void;
    getLayout: (id: string, page: string) => ElementLayout;
    setElementLayout: (id: string, page: string, layout: ElementLayout) => void;
    saveLayouts: (page: string) => Promise<void>;
    isSavingLayout: boolean;
    hasPendingLayoutEdits: boolean;
    // Locking
    isLocked: (id: string, page: string) => boolean;
    toggleLock: (id: string, page: string) => void;
    // Undo / Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LayoutEditorContext = createContext<LayoutEditorContextType | undefined>(undefined);

const DEFAULT_LAYOUT: ElementLayout = { x: 0, y: 0 };
const LOCK_STORAGE_KEY = "cms_locked_elements";

/** Auto-detect viewport breakpoint */
const detectBreakpoint = (): Breakpoint => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w <= 1024) return "tablet";
    return "desktop";
};

const makeKey = (page: string, bp: Breakpoint, id: string) => `${page}|${bp}|${id}`;

const loadLockedFromStorage = (): Record<string, boolean> => {
    try { return JSON.parse(localStorage.getItem(LOCK_STORAGE_KEY) || "{}"); }
    catch { return {}; }
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const LayoutEditorProvider = ({ children }: { children: ReactNode }) => {
    const { isAdmin } = useUser();
    const { language } = useLanguage();
    const { toast } = useToast();

    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [autoBreakpoint, setAutoBreakpoint] = useState<Breakpoint>(detectBreakpoint);
    const [forcedBreakpoint, setForcedBreakpoint] = useState<Breakpoint | null>(null);
    const activeBreakpoint: Breakpoint = forcedBreakpoint ?? autoBreakpoint;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [savedLayouts, setSavedLayouts] = useState<Record<string, ElementLayout>>({});
    const [pendingLayouts, setPendingLayouts] = useState<Record<string, ElementLayout>>({});
    const [isSavingLayout, setIsSavingLayout] = useState(false);
    const [lockedElements, setLockedElements] = useState<Record<string, boolean>>(loadLockedFromStorage);

    // History stacks (refs = no re-render on push/pop)
    const undoStack = useRef<Record<string, ElementLayout>[]>([]);
    const redoStack = useRef<Record<string, ElementLayout>[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // ── Breakpoint tracking ───────────────────────────────────────────────────

    useEffect(() => {
        const handler = () => setAutoBreakpoint(detectBreakpoint());
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // ── Load layouts from Supabase ────────────────────────────────────────────

    const loadLayouts = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("layout_settings")
                .select("page_slug, breakpoint, element_id, x, y, width, height")
                .eq("language", language);
            if (!error && data) {
                const loaded: Record<string, ElementLayout> = {};
                for (const row of data) {
                    const key = makeKey(row.page_slug, row.breakpoint as Breakpoint, row.element_id);
                    loaded[key] = { x: row.x, y: row.y, width: row.width ?? null, height: row.height ?? null };
                }
                setSavedLayouts(loaded);
                // Reset history on full reload
                undoStack.current = [];
                redoStack.current = [];
                setCanUndo(false);
                setCanRedo(false);
            }
        } catch (e) {
            console.error("Failed to load layout_settings:", e);
        }
    }, [language]);

    useEffect(() => { loadLayouts(); }, [loadLayouts]);

    // ── Global keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) ────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!isLayoutEditMode) return;
            const mod = e.ctrlKey || e.metaKey;
            if (mod && !e.shiftKey && e.key === "z") { e.preventDefault(); undo(); }
            if (mod && e.shiftKey && e.key === "z") { e.preventDefault(); redo(); }
            if (mod && e.key === "y") { e.preventDefault(); redo(); }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLayoutEditMode]);

    // ── API ───────────────────────────────────────────────────────────────────

    const toggleLayoutEditMode = () => {
        if (!isAdmin) return;
        if (isLayoutEditMode) {
            // Exiting — reset everything
            setPendingLayouts({});
            setSelectedId(null);
            setForcedBreakpoint(null);
            setIsLayoutEditMode(false);
        } else {
            setIsLayoutEditMode(true);
        }
    };

    const setBreakpoint = (bp: Breakpoint) => {
        if (!isAdmin) return;
        setForcedBreakpoint(bp);
        setSelectedId(null);
    };

    // KEY FIX: Reading layout uses ACTUAL device breakpoint (autoBreakpoint)
    // so mobile edits NEVER affect desktop rendering and vice versa.
    const getLayout = (id: string, page: string): ElementLayout => {
        const readKey = makeKey(page, autoBreakpoint, id);
        // In edit mode, also check if there's a pending edit for the current
        // EDITING breakpoint (activeBreakpoint) so edits are visible immediately
        const editKey = makeKey(page, activeBreakpoint, id);
        const pendingForEdit = pendingLayouts[editKey];
        if (isLayoutEditMode && pendingForEdit) return pendingForEdit;
        return savedLayouts[readKey] ?? DEFAULT_LAYOUT;
    };

    const setElementLayout = (id: string, page: string, layout: ElementLayout) => {
        if (!isAdmin || !isLayoutEditMode) return;
        const key = makeKey(page, activeBreakpoint, id);

        setSavedLayouts(prev => {
            // Push current full snapshot to undo stack
            undoStack.current = [...undoStack.current.slice(-49), { ...prev }];
            redoStack.current = []; // clear redo on new action
            setCanUndo(true);
            setCanRedo(false);
            return { ...prev, [key]: layout };
        });
        setPendingLayouts(prev => ({ ...prev, [key]: layout }));
    };

    const undo = useCallback(() => {
        if (undoStack.current.length === 0) return;
        const prevState = undoStack.current[undoStack.current.length - 1];
        undoStack.current = undoStack.current.slice(0, -1);
        setSavedLayouts(current => {
            redoStack.current = [...redoStack.current.slice(-49), { ...current }];
            setCanRedo(true);
            return prevState;
        });
        setPendingLayouts({});
        setCanUndo(undoStack.current.length > 0);
    }, []);

    const redo = useCallback(() => {
        if (redoStack.current.length === 0) return;
        const nextState = redoStack.current[redoStack.current.length - 1];
        redoStack.current = redoStack.current.slice(0, -1);
        setSavedLayouts(current => {
            undoStack.current = [...undoStack.current.slice(-49), { ...current }];
            setCanUndo(true);
            return nextState;
        });
        setPendingLayouts({});
        setCanRedo(redoStack.current.length > 0);
    }, []);

    const saveLayouts = async (page: string) => {
        const relevant = Object.entries(pendingLayouts).filter(([k]) => k.startsWith(`${page}|`));
        if (!isAdmin || relevant.length === 0) return;
        setIsSavingLayout(true);
        try {
            const upserts = relevant.map(([key, layout]) => {
                const [pg, bp, ...idParts] = key.split("|");
                return {
                    page_slug: pg, language, breakpoint: bp, element_id: idParts.join("|"),
                    x: layout.x, y: layout.y,
                    width: layout.width ?? null, height: layout.height ?? null,
                    updated_at: new Date().toISOString(),
                };
            });
            const { error } = await (supabase as any)
                .from("layout_settings")
                .upsert(upserts, { onConflict: "page_slug,language,breakpoint,element_id" });
            if (error) throw error;
            setPendingLayouts(prev => {
                const next = { ...prev };
                for (const key of Object.keys(next)) if (key.startsWith(`${page}|`)) delete next[key];
                return next;
            });
            toast({ title: "✅ Layout saved", description: `${upserts.length} positions saved for ${activeBreakpoint}.` });
        } catch (err: any) {
            toast({ title: "Error saving layout", description: err.message, variant: "destructive" });
        } finally {
            setIsSavingLayout(false);
        }
    };

    // ── Locking ───────────────────────────────────────────────────────────────

    const isLocked = useCallback((id: string, page: string) => {
        return !!lockedElements[`${page}|${id}`];
    }, [lockedElements]);

    const toggleLock = useCallback((id: string, page: string) => {
        if (!isAdmin) return;
        const storageKey = `${page}|${id}`;
        setLockedElements(prev => {
            const next = { ...prev, [storageKey]: !prev[storageKey] };
            localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, [isAdmin]);

    const hasPendingLayoutEdits = Object.keys(pendingLayouts).length > 0;

    return (
        <LayoutEditorContext.Provider value={{
            isLayoutEditMode, toggleLayoutEditMode,
            activeBreakpoint, autoBreakpoint, setBreakpoint,
            selectedId, selectElement: setSelectedId,
            getLayout, setElementLayout,
            saveLayouts, isSavingLayout, hasPendingLayoutEdits,
            isLocked, toggleLock,
            undo, redo, canUndo, canRedo,
        }}>
            {children}
        </LayoutEditorContext.Provider>
    );
};

export const useLayoutEditor = () => {
    const ctx = useContext(LayoutEditorContext);
    if (!ctx) throw new Error("useLayoutEditor must be used within LayoutEditorProvider");
    return ctx;
};
