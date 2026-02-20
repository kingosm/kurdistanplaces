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
    fontSize?: number | null;  // px — scales text inside the block
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
    hideOnLanguages?: string[];
}

export interface VisibilityRule {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
    hideOnLanguages?: string[];
}

interface LayoutEditorContextType {
    isLayoutEditMode: boolean;
    toggleLayoutEditMode: () => void;
    activeBreakpoint: Breakpoint;
    autoBreakpoint: Breakpoint;
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
    // Visibility
    getVisibility: (id: string, page: string) => VisibilityRule;
    setVisibility: (id: string, page: string, rule: VisibilityRule) => void;
    isHiddenForUser: (id: string, page: string) => boolean;
    takeSnapshot: () => void;
    isPreviewMode: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LayoutEditorContext = createContext<LayoutEditorContextType | undefined>(undefined);

const DEFAULT_LAYOUT: ElementLayout = { x: 0, y: 0, fontSize: null };
const LOCK_STORAGE_KEY = "cms_locked_elements";
const VISIBILITY_STORAGE_KEY = "cms_element_visibility";
const LAYOUT_STORAGE_KEY = "cms_layout_data";

const detectBreakpoint = (): Breakpoint => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w <= 1024) return "tablet";
    return "desktop";
};

const makeKey = (page: string, bp: Breakpoint, id: string) => `${page}|${bp}|${id}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromStorage = (key: string, fallback: any) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; };
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const LayoutEditorProvider = ({ children, forcedBreakpoint: initialForcedBreakpoint }: { children: ReactNode, forcedBreakpoint?: Breakpoint }) => {
    const { isAdmin, isPreviewMode } = useUser();
    const { language } = useLanguage();
    const { toast } = useToast();

    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [autoBreakpoint, setAutoBreakpoint] = useState<Breakpoint>(detectBreakpoint);
    const [forcedBreakpoint, setForcedBreakpoint] = useState<Breakpoint | null>(initialForcedBreakpoint ?? null);
    const activeBreakpoint: Breakpoint = forcedBreakpoint ?? autoBreakpoint;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [savedLayouts, setSavedLayouts] = useState<Record<string, ElementLayout>>(
        () => fromStorage(LAYOUT_STORAGE_KEY, {})
    );
    const [pendingLayouts, setPendingLayouts] = useState<Record<string, ElementLayout>>({});
    const [isSavingLayout, setIsSavingLayout] = useState(false);

    const [lockedElements, setLockedElements] = useState<Record<string, boolean>>(
        () => fromStorage(LOCK_STORAGE_KEY, {})
    );
    const [visibilityRules, setVisibilityRules] = useState<Record<string, VisibilityRule>>(
        () => fromStorage(VISIBILITY_STORAGE_KEY, {})
    );

    // Undo / Redo history stacks
    const undoStack = useRef<Record<string, ElementLayout>[]>([]);
    const redoStack = useRef<Record<string, ElementLayout>[]>([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // ── Breakpoint auto-detect ────────────────────────────────────────────────

    useEffect(() => {
        const h = () => setAutoBreakpoint(detectBreakpoint());
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);

    // ── Load layouts from Supabase ────────────────────────────────────────────

    const loadLayouts = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("layout_settings")
                .select("page_slug, breakpoint, element_id, x, y, width, height, font_size, hide_on_mobile, hide_on_tablet, hide_on_desktop, hide_on_languages")
                .eq("language", language);
            if (!error && data) {
                const loaded: Record<string, ElementLayout> = {};
                for (const row of data) {
                    const key = makeKey(row.page_slug, row.breakpoint as Breakpoint, row.element_id);
                    loaded[key] = {
                        x: row.x, y: row.y,
                        width: row.width ?? null,
                        height: row.height ?? null,
                        fontSize: (row as any).font_size ?? null,
                        hideOnMobile: (row as any).hide_on_mobile ?? false,
                        hideOnTablet: (row as any).hide_on_tablet ?? false,
                        hideOnDesktop: (row as any).hide_on_desktop ?? false,
                        hideOnLanguages: (row as any).hide_on_languages ?? [],
                    };
                }
                setSavedLayouts(loaded);
                localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(loaded));
                undoStack.current = []; redoStack.current = [];
                setCanUndo(false); setCanRedo(false);
            }
        } catch (e) {
            console.error("layout_settings load failed:", e);
        }
    }, [language]);

    useEffect(() => { loadLayouts(); }, [loadLayouts]);

    // ── Global keyboard shortcuts ─────────────────────────────────────────────

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

    // ── Toggle / breakpoint ───────────────────────────────────────────────────

    const toggleLayoutEditMode = () => {
        if (!isAdmin) return;
        if (isLayoutEditMode) {
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

    // ── Layout get / set ──────────────────────────────────────────────────────

    // ── Layout get / set ──────────────────────────────────────────────────────

    // READ  → actual device breakpoint (never shows mobile edits on desktop)
    // WRITE → active editing breakpoint (can be forced by admin)
    const getLayout = (id: string, page: string): ElementLayout => {
        const editKey = makeKey(page, activeBreakpoint, id);
        const autoKey = makeKey(page, autoBreakpoint, id);
        const desktopKey = makeKey(page, "desktop", id);

        // 1. If we are editing, always show what's in the current "shuttle" (pendingLayouts)
        if (isLayoutEditMode && pendingLayouts[editKey]) {
            return pendingLayouts[editKey];
        }

        // 2. If we are editing and have something saved for the active breakpoint, show it
        if (isLayoutEditMode && savedLayouts[editKey]) {
            return savedLayouts[editKey];
        }

        // 3. Normal user view (or fallback for editing): show saved layout for current device
        if (savedLayouts[autoKey]) {
            return savedLayouts[autoKey];
        }

        // 4. Ultimate fallback: Use desktop layout as baseline if mobile/tablet is missing
        return savedLayouts[desktopKey] ?? DEFAULT_LAYOUT;
    };

    const takeSnapshot = useCallback(() => {
        setSavedLayouts(prev => {
            undoStack.current = [...undoStack.current.slice(-49), { ...prev }];
            redoStack.current = [];
            setCanUndo(true);
            setCanRedo(false);
            return prev;
        });
    }, []);

    const setElementLayout = (id: string, page: string, layout: ElementLayout) => {
        if (!isAdmin || !isLayoutEditMode) return;
        const key = makeKey(page, activeBreakpoint, id);
        setSavedLayouts(prev => ({ ...prev, [key]: layout }));
        setPendingLayouts(prev => ({ ...prev, [key]: layout }));
    };

    // ── Undo / Redo ────────────────────────────────────────────────────────────

    const undo = useCallback(() => {
        if (!undoStack.current.length) return;
        const prev = undoStack.current.at(-1)!;
        undoStack.current = undoStack.current.slice(0, -1);
        setSavedLayouts(cur => {
            redoStack.current = [...redoStack.current.slice(-49), { ...cur }];
            setCanRedo(true);
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(prev));
            return prev;
        });
        // Clear pending edits since we've reverted to a previous "saved" or "staged" point
        // In a more complex system we might want to keep them, but for now simple revert is safer
        setPendingLayouts({});
        setCanUndo(undoStack.current.length > 0);
    }, []);

    const redo = useCallback(() => {
        if (!redoStack.current.length) return;
        const next = redoStack.current.at(-1)!;
        redoStack.current = redoStack.current.slice(0, -1);
        setSavedLayouts(cur => {
            undoStack.current = [...undoStack.current.slice(-49), { ...cur }];
            setCanUndo(true);
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
        setPendingLayouts({});
        setCanRedo(redoStack.current.length > 0);
    }, []);

    // ── Save layouts to Supabase ──────────────────────────────────────────────

    const saveLayouts = async (page: string) => {
        // Save both the current page's layouts AND any global layouts (navbar/footer)
        const relevant = Object.entries(pendingLayouts).filter(([k]) =>
            k.startsWith(`${page}|`) || k.startsWith("__global__|")
        );
        if (!isAdmin || !relevant.length) return;
        setIsSavingLayout(true);
        try {
            const upserts = relevant.map(([key, l]) => {
                const [pg, bp, ...idParts] = key.split("|");
                return {
                    page_slug: pg, language, breakpoint: bp,
                    element_id: idParts.join("|"),
                    x: l.x, y: l.y,
                    width: l.width ?? null, height: l.height ?? null,
                    font_size: l.fontSize ?? null,
                    hide_on_mobile: l.hideOnMobile ?? false,
                    hide_on_tablet: l.hideOnTablet ?? false,
                    hide_on_desktop: l.hideOnDesktop ?? false,
                    hide_on_languages: l.hideOnLanguages ?? [],
                    updated_at: new Date().toISOString(),
                };
            });
            const { error } = await (supabase as any)
                .from("layout_settings")
                .upsert(upserts, { onConflict: "page_slug,language,breakpoint,element_id" });
            if (error) throw error;
            setPendingLayouts(prev => {
                const n = { ...prev };
                Object.keys(n).forEach(k => { if (k.startsWith(`${page}|`)) delete n[k]; });
                return n;
            });

            // Update local cache with newly saved values
            setSavedLayouts(prev => {
                const next = { ...prev };
                relevant.forEach(([key, l]) => { next[key] = l; });
                localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
                return next;
            });

            toast({ title: "✅ Layout saved", description: `${upserts.length} element(s) saved for ${activeBreakpoint}.` });
        } catch (err: any) {
            toast({ title: "Save failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSavingLayout(false);
        }
    };

    // ── Locking ───────────────────────────────────────────────────────────────

    const isLocked = useCallback((id: string, page: string) =>
        !!lockedElements[`${page}|${id}`], [lockedElements]);

    const toggleLock = useCallback((id: string, page: string) => {
        if (!isAdmin) return;
        setLockedElements(prev => {
            const k = `${page}|${id}`;
            const next = { ...prev, [k]: !prev[k] };
            localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, [isAdmin]);

    // ── Visibility ────────────────────────────────────────────────────────────

    // Now merged into layout state, so this is just a helper wrapper
    const getVisibility = useCallback((id: string, page: string): VisibilityRule => {
        const layout = getLayout(id, page);
        return {
            hideOnMobile: layout.hideOnMobile,
            hideOnTablet: layout.hideOnTablet,
            hideOnDesktop: layout.hideOnDesktop,
            hideOnLanguages: layout.hideOnLanguages,
        };
    }, [getLayout]); // Dependent on getLayout

    const setVisibility = useCallback((id: string, page: string, rule: VisibilityRule) => {
        const current = getLayout(id, page);
        setElementLayout(id, page, { ...current, ...rule });
    }, [getLayout, setElementLayout]);

    const isHiddenForUser = useCallback((id: string, page: string): boolean => {
        const layout = getLayout(id, page);
        // Use activeBreakpoint (which respects toolbar simulation) instead of autoBreakpoint
        if (layout.hideOnMobile && activeBreakpoint === "mobile") return true;
        if (layout.hideOnTablet && activeBreakpoint === "tablet") return true;
        if (layout.hideOnDesktop && activeBreakpoint === "desktop") return true;
        if (layout.hideOnLanguages?.includes(language)) return true;
        return false;
    }, [getLayout, activeBreakpoint, language]);

    // ─────────────────────────────────────────────────────────────────────────

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
            getVisibility, setVisibility, isHiddenForUser,
            takeSnapshot, isPreviewMode,
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
