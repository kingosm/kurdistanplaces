import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

type Language = "en" | "ku" | "ar";

interface EditModeContextType {
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

    // Load all DB overrides on mount
    const loadContent = useCallback(async () => {
        try {
            const { data, error } = await (supabase as any)
                .from("site_content")
                .select("key, language, value");

            if (error) {
                console.error("Error loading site content:", error);
                return;
            }

            if (data) {
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

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Only allow edit mode for admins
    const toggleEditMode = () => {
        if (!isAdmin) return;
        setIsEditMode((prev) => {
            if (prev) {
                // Turning off — discard pending
                setPendingEdits({});
            }
            return !prev;
        });
    };

    // Stage a change
    const setEdit = (key: string, language: Language, value: string) => {
        if (!isAdmin || !isEditMode) return;
        const compositeKey = makeCompositeKey(key, language);
        setPendingEdits((prev) => ({ ...prev, [compositeKey]: value }));
    };

    // Save all pending edits to Supabase
    const saveAll = async () => {
        if (!isAdmin || Object.keys(pendingEdits).length === 0) return;
        setIsSaving(true);

        try {
            const upserts = Object.entries(pendingEdits).map(([compositeKey, value]) => {
                const [key, language] = compositeKey.split("|");
                return { key, language, value, updated_at: new Date().toISOString() };
            });

            const { error } = await (supabase as any)
                .from("site_content")
                .upsert(upserts, { onConflict: "key,language" });

            if (error) throw error;

            // Merge pending into dbOverrides
            setDbOverrides((prev) => ({ ...prev, ...pendingEdits }));
            setPendingEdits({});

            toast({
                title: "✅ Content saved",
                description: `${upserts.length} change${upserts.length !== 1 ? "s" : ""} saved successfully.`,
            });
        } catch (error: any) {
            toast({
                title: "Error saving content",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Discard all pending edits
    const cancelAll = () => {
        setPendingEdits({});
        setIsEditMode(false);
    };

    // Get content: pending → DB override → fallback (hardcoded translation)
    const getContent = (key: string, language: Language, fallback: string): string => {
        const compositeKey = makeCompositeKey(key, language);
        if (pendingEdits[compositeKey] !== undefined) return pendingEdits[compositeKey];
        if (dbOverrides[compositeKey] !== undefined) return dbOverrides[compositeKey];
        return fallback;
    };

    const hasPendingEdits = Object.keys(pendingEdits).length > 0;

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
