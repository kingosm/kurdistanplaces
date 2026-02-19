import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { GripVertical } from "lucide-react";
import { EditableText } from "@/components/cms/EditableText";
import { useLayoutEditor } from "@/contexts/LayoutEditorContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ── Nav item definitions ──────────────────────────────────────────────────────

interface NavItem {
    id: string;
    to: string;
    contentKey: string;
}

const DEFAULT_ITEMS: NavItem[] = [
    { id: "home", to: "/", contentKey: "nav.home" },
    { id: "categories", to: "/categories", contentKey: "nav.categories" },
    { id: "nearby", to: "/nearby", contentKey: "nav.nearby" },
];

// ── Order persistence ─────────────────────────────────────────────────────────

const STORAGE_KEY = "cms_nav_order";

const loadItems = (): NavItem[] => {
    try {
        const saved: string[] | null = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!saved) return DEFAULT_ITEMS;
        const ordered = saved
            .map(id => DEFAULT_ITEMS.find(item => item.id === id))
            .filter(Boolean) as NavItem[];
        // Append any new items not in saved order
        const extras = DEFAULT_ITEMS.filter(item => !saved.includes(item.id));
        return [...ordered, ...extras];
    } catch {
        return DEFAULT_ITEMS;
    }
};

const saveItems = (items: NavItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(i => i.id)));
};

// ── Component ─────────────────────────────────────────────────────────────────

const LINK_CLS =
    "text-[10px] md:text-xs font-sans font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground hover:text-primary transition-all whitespace-nowrap leading-normal";

export function SortableNavLinks() {
    const { isLayoutEditMode } = useLayoutEditor();
    const { t } = useLanguage();
    const [items, setItems] = useState<NavItem[]>(loadItems);
    const [dragging, setDragging] = useState<string | null>(null);
    const dragIndexRef = useRef<number>(-1);

    // ── Normal mode — zero overhead ───────────────────────────────────────────

    if (!isLayoutEditMode) {
        return (
            <>
                {items.map(item => (
                    <Link key={item.id} to={item.to} className={LINK_CLS}>
                        <EditableText contentKey={item.contentKey} fallback={t(item.contentKey)} />
                    </Link>
                ))}
            </>
        );
    }

    // ── Edit mode — drag-to-reorder ───────────────────────────────────────────

    const handleDragStart = (e: React.DragEvent, index: number, id: string) => {
        dragIndexRef.current = index;
        setDragging(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, overIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const fromIndex = dragIndexRef.current;
        if (fromIndex === overIndex) return;

        // Swap
        const next = [...items];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(overIndex, 0, moved);
        dragIndexRef.current = overIndex;
        setItems(next);
        saveItems(next);
    };

    const handleDragEnd = () => {
        setDragging(null);
        dragIndexRef.current = -1;
    };

    return (
        <>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, item.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        "relative flex items-center gap-1.5 group",
                        "cursor-grab active:cursor-grabbing select-none",
                        dragging === item.id && "opacity-30 scale-95 transition-all"
                    )}
                >
                    {/* Amber drag handle — appears on hover */}
                    <span
                        className={cn(
                            "opacity-0 group-hover:opacity-100 transition-opacity",
                            "text-amber-400"
                        )}
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-3 h-3" />
                    </span>

                    {/* Drop zone indicator (left border when another item drags over) */}
                    <Link
                        to={item.to}
                        className={cn(LINK_CLS, "ring-amber-400 group-hover:ring-1 rounded px-1 py-0.5")}
                        onClick={(e) => e.preventDefault()} // prevent nav while editing
                    >
                        <EditableText contentKey={item.contentKey} fallback={t(item.contentKey)} />
                    </Link>
                </div>
            ))}
        </>
    );
}
