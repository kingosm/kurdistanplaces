import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Breakpoint = "mobile" | "desktop";

export interface ElementLayout {
    x: number;
    y: number;
    width?: number | null;
    height?: number | null;
}

interface LayoutEditorContextType {
    isLayoutEditMode: boolean;
    toggleLayoutEditMode: () => void;
    activeBreakpoint: Breakpoint;
    selectedId: string | null;
    selectElement: (id: string | null) => void;
    getLayout: (id: string, page: string) => ElementLayout;
    setElementLayout: (id: string, page: string, layout: ElementLayout) => void;
    saveLayouts: (page: string) => Promise<void>;
    isSavingLayout: boolean;
    hasPendingLayoutEdits: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LayoutEditorContext = createContext<LayoutEditorContextType | undefined>(undefined);

const DEFAULT_LAYOUT: ElementLayout = { x: 0, y: 0 };

/** Detect viewport breakpoint */
const getBreakpoint = (): Breakpoint =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";

/** Composite cache key: page|bp|elementId */
const makeKey = (page: string, bp: Breakpoint, id: string) =>
    `${page}|${bp}|${id}`;

// ── Provider ──────────────────────────────────────────────────────────────────

export const LayoutEditorProvider = ({ children }: { children: ReactNode }) => {
    const { isAdmin } = useUser();
    const { language } = useLanguage();
    const { toast } = useToast();

    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>(getBreakpoint);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // savedLayouts = what's in DB, pendingLayouts = staged changes not yet saved
    const [savedLayouts, setSavedLayouts] = useState<Record<string, ElementLayout>>({});
    const [pendingLayouts, setPendingLayouts] = useState<Record<string, ElementLayout>>({});
    const [isSavingLayout, setIsSavingLayout] = useState(false);

    // Track viewport resize to update active breakpoint
    useEffect(() => {
        const handler = () => setActiveBreakpoint(getBreakpoint());
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // Load all layouts for current language from Supabase on mount / language change
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
            }
        } catch (e) {
            console.error("Failed to load layout_settings:", e);
        }
    }, [language]);

    useEffect(() => {
        loadLayouts();
    }, [loadLayouts]);

    // ── API ──────────────────────────────────────────────────────────────────────

    const toggleLayoutEditMode = () => {
        if (!isAdmin) return;
        setIsLayoutEditMode((prev) => {
            if (prev) {
                setPendingLayouts({});
                setSelectedId(null);
            }
            return !prev;
        });
    };

    const getLayout = (id: string, page: string): ElementLayout => {
        const key = makeKey(page, activeBreakpoint, id);
        return pendingLayouts[key] ?? savedLayouts[key] ?? DEFAULT_LAYOUT;
    };

    const setElementLayout = (id: string, page: string, layout: ElementLayout) => {
        if (!isAdmin || !isLayoutEditMode) return;
        const key = makeKey(page, activeBreakpoint, id);
        setPendingLayouts((prev) => ({ ...prev, [key]: layout }));
        // Optimistic update so the element moves immediately
        setSavedLayouts((prev) => ({ ...prev, [key]: layout }));
    };

    const saveLayouts = async (page: string) => {
        const relevantPending = Object.entries(pendingLayouts).filter(([key]) =>
            key.startsWith(`${page}|`)
        );
        if (!isAdmin || relevantPending.length === 0) return;

        setIsSavingLayout(true);
        try {
            const upserts = relevantPending.map(([key, layout]) => {
                const parts = key.split("|");
                const pg = parts[0];
                const bp = parts[1];
                const element_id = parts.slice(2).join("|");
                return {
                    page_slug: pg,
                    language,
                    breakpoint: bp,
                    element_id,
                    x: layout.x,
                    y: layout.y,
                    width: layout.width ?? null,
                    height: layout.height ?? null,
                    updated_at: new Date().toISOString(),
                };
            });

            const { error } = await (supabase as any)
                .from("layout_settings")
                .upsert(upserts, { onConflict: "page_slug,language,breakpoint,element_id" });

            if (error) throw error;

            // Clear pending for this page
            setPendingLayouts((prev) => {
                const next = { ...prev };
                for (const key of Object.keys(next)) {
                    if (key.startsWith(`${page}|`)) delete next[key];
                }
                return next;
            });

            toast({
                title: "✅ Layout saved",
                description: `${upserts.length} element position${upserts.length !== 1 ? "s" : ""} saved for ${activeBreakpoint}.`,
            });
        } catch (err: any) {
            toast({ title: "Error saving layout", description: err.message, variant: "destructive" });
        } finally {
            setIsSavingLayout(false);
        }
    };

    const hasPendingLayoutEdits = Object.keys(pendingLayouts).length > 0;

    return (
        <LayoutEditorContext.Provider
            value={{
                isLayoutEditMode,
                toggleLayoutEditMode,
                activeBreakpoint,
                selectedId,
                selectElement: setSelectedId,
                getLayout,
                setElementLayout,
                saveLayouts,
                isSavingLayout,
                hasPendingLayoutEdits,
            }}
        >
            {children}
        </LayoutEditorContext.Provider>
    );
};

export const useLayoutEditor = () => {
    const ctx = useContext(LayoutEditorContext);
    if (!ctx) throw new Error("useLayoutEditor must be used within LayoutEditorProvider");
    return ctx;
};
