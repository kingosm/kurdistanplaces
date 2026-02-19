import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

type Language = "en" | "ku" | "ar";

interface EditModeContextType {
    // Text editing
    isEditMode: boolean;
    toggleEditMode: () => void;
    pendingEdits: Record<string, string>;
    dbOverrides: Record<string, string>;
    setEdit: (key: string, language: Language, value: string) => void;
    saveAll: () => Promise<void>;
    cancelAll: () => void;
    getContent: (key: string, language: Language, fallback: string) => string;
    isSaving: boolean;
    hasPendingEdits: boolean;
    // Section ordering
    sectionOrders: Record<string, string[]>;         // page → ordered section keys
    pendingLayouts: Record<string, string[]>;         // page → pending new order
    setSectionOrder: (page: string, order: string[]) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

// Composite key: "key|language"
const makeCompositeKey = (key: string, language: Language) => `${key}|${language}`;

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
    const { isAdmin } = useUser();
    const { toast } = useToast();

    const [isEditMode, setIsEditMode] = useState(false);
    const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
    const [dbOverrides, setDbOverrides] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Layout state
    const [sectionOrders, setSectionOrders] = useState<Record<string, string[]>>({});
    const [pendingLayouts, setPendingLayouts] = useState<Record<string, string[]>>({});

    // ── Load all DB content + layout on mount ──────────────────────────────
    const loadContent = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("site_content")
                .select("key, language, value");

            if (!error && data) {
                const overrides: Record<string, string> = {};
                for (const row of data) {
                    overrides[makeCompositeKey(row.key, row.language)] = row.value;
                }
                setDbOverrides(overrides);
            }
        } catch (e) {
            console.error("Failed to load site content:", e);
        }
    }, []);

    const loadLayout = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("site_layout")
                .select("page, section_key, sort_order")
                .order("sort_order", { ascending: true });

            if (!error && data) {
                const orders: Record<string, string[]> = {};
                for (const row of data) {
                    if (!orders[row.page]) orders[row.page] = [];
                    orders[row.page].push(row.section_key);
                }
                setSectionOrders(orders);
            }
        } catch (e) {
            console.error("Failed to load site layout:", e);
        }
    }, []);

    useEffect(() => {
        loadContent();
        loadLayout();
    }, [loadContent, loadLayout]);

    // ── Edit mode toggle ───────────────────────────────────────────────────
    const toggleEditMode = () => {
        if (!isAdmin) return;
        setIsEditMode((prev) => {
            if (prev) {
                setPendingEdits({});
                setPendingLayouts({});
            }
            return !prev;
        });
    };

    // ── Stage a text change ────────────────────────────────────────────────
    const setEdit = (key: string, language: Language, value: string) => {
        if (!isAdmin || !isEditMode) return;
        setPendingEdits((prev) => ({ ...prev, [makeCompositeKey(key, language)]: value }));
    };

    // ── Stage a layout change ──────────────────────────────────────────────
    const setSectionOrder = (page: string, order: string[]) => {
        if (!isAdmin || !isEditMode) return;
        setPendingLayouts((prev) => ({ ...prev, [page]: order }));
        // Optimistically update visible order
        setSectionOrders((prev) => ({ ...prev, [page]: order }));
    };

    // ── Save everything to Supabase ────────────────────────────────────────
    const saveAll = async () => {
        const hasTextEdits = Object.keys(pendingEdits).length > 0;
        const hasLayoutEdits = Object.keys(pendingLayouts).length > 0;
        if (!isAdmin || (!hasTextEdits && !hasLayoutEdits)) return;

        setIsSaving(true);
        try {
            // Save text content
            if (hasTextEdits) {
                const upserts = Object.entries(pendingEdits).map(([compositeKey, value]) => {
                    const [key, language] = compositeKey.split("|");
                    return { key, language, value, updated_at: new Date().toISOString() };
                });
                const { error } = await (supabase as any)
                    .from("site_content")
                    .upsert(upserts, { onConflict: "key,language" });
                if (error) throw error;
                setDbOverrides((prev) => ({ ...prev, ...pendingEdits }));
                setPendingEdits({});
            }

            // Save layout order
            if (hasLayoutEdits) {
                const layoutRows = Object.entries(pendingLayouts).flatMap(([page, order]) =>
                    order.map((section_key, index) => ({
                        page,
                        section_key,
                        sort_order: index,
                        updated_at: new Date().toISOString(),
                    }))
                );
                const { error } = await (supabase as any)
                    .from("site_layout")
                    .upsert(layoutRows, { onConflict: "page,section_key" });
                if (error) throw error;
                setPendingLayouts({});
            }

            const total = Object.keys(pendingEdits).length + Object.keys(pendingLayouts).length;
            toast({
                title: "✅ Changes saved",
                description: `Content and layout updated successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Error saving",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // ── Cancel all pending changes ─────────────────────────────────────────
    const cancelAll = () => {
        setPendingEdits({});
        // Revert optimistic layout updates
        setPendingLayouts((pending) => {
            // Reload from DB state by removing optimistic overrides
            setSectionOrders((current) => {
                const reverted = { ...current };
                for (const page of Object.keys(pending)) {
                    delete reverted[page];
                }
                return reverted;
            });
            return {};
        });
        setIsEditMode(false);
        // Re-load layout from DB
        loadLayout();
    };

    // ── Get content (pending → DB → fallback) ─────────────────────────────
    const getContent = (key: string, language: Language, fallback: string): string => {
        const compositeKey = makeCompositeKey(key, language);
        if (pendingEdits[compositeKey] !== undefined) return pendingEdits[compositeKey];
        if (dbOverrides[compositeKey] !== undefined) return dbOverrides[compositeKey];
        return fallback;
    };

    const hasPendingEdits =
        Object.keys(pendingEdits).length > 0 || Object.keys(pendingLayouts).length > 0;

    return (
        <EditModeContext.Provider
            value={{
                isEditMode,
                toggleEditMode,
                pendingEdits,
                dbOverrides,
                setEdit,
                saveAll,
                cancelAll,
                getContent,
                isSaving,
                hasPendingEdits,
                sectionOrders,
                pendingLayouts,
                setSectionOrder,
            }}
        >
            {children}
        </EditModeContext.Provider>
    );
};

export const useEditMode = () => {
    const context = useContext(EditModeContext);
    if (!context) {
        throw new Error("useEditMode must be used within EditModeProvider");
    }
    return context;
};
