import { useRef, useCallback, useEffect, KeyboardEvent, ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { useEditableLayout } from "@/hooks/useEditableLayout";
import { cn } from "@/lib/utils";

interface EditableBlockProps {
    /** Unique ID for this element — used as the DB key */
    id: string;
    /** Page slug — used to scope layouts per page */
    page: string;
    children: ReactNode;
    className?: string;
}

/**
 * EditableBlock — drag-handle-based layout editor wrapper.
 *
 * Normal mode: zero-overhead passthrough <div>.
 * Layout-edit mode:
 *   - Amber outline on hover / selected
 *   - GripVertical drag handle (top-center, visible on hover or when selected)
 *   - CSS transform: translate(x, y) — does NOT break document flow
 *   - Position badge (X / Y) while dragging
 *   - Arrow key fine-tune (1px, Shift = 10px)
 *   - Works with both mouse and touch (pointer events)
 */
export function EditableBlock({ id, page, children, className }: EditableBlockProps) {
    const { layout, isSelected, select, deselect, update, isLayoutEditMode } =
        useEditableLayout(id, page);

    const isDragging = useRef(false);
    const startPointer = useRef({ x: 0, y: 0 });
    const startLayout = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);

    // ── Drag handlers ──────────────────────────────────────────────────────────

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            select();
            isDragging.current = true;
            startPointer.current = { x: e.clientX, y: e.clientY };
            startLayout.current = { x: layout.x, y: layout.y };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        },
        [select, layout.x, layout.y]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!isDragging.current) return;
            const dx = e.clientX - startPointer.current.x;
            const dy = e.clientY - startPointer.current.y;

            // Snap to 8px grid
            const snappedX = Math.round((startLayout.current.x + dx) / 8) * 8;
            const snappedY = Math.round((startLayout.current.y + dy) / 8) * 8;
            update({ x: snappedX, y: snappedY });
        },
        [update]
    );

    const handlePointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    // ── Keyboard fine-tune ─────────────────────────────────────────────────────

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (!isSelected) return;
            const step = e.shiftKey ? 10 : 1;
            if (e.key === "ArrowLeft") { e.preventDefault(); update({ x: layout.x - step }); }
            if (e.key === "ArrowRight") { e.preventDefault(); update({ x: layout.x + step }); }
            if (e.key === "ArrowUp") { e.preventDefault(); update({ y: layout.y - step }); }
            if (e.key === "ArrowDown") { e.preventDefault(); update({ y: layout.y + step }); }
            if (e.key === "Escape") { e.preventDefault(); deselect(); }
        },
        [isSelected, layout.x, layout.y, update, deselect]
    );

    // Auto-focus for keyboard control when selected
    useEffect(() => {
        if (isSelected && wrapperRef.current) {
            wrapperRef.current.focus({ preventScroll: true });
        }
    }, [isSelected]);

    // Click-outside deselect
    useEffect(() => {
        if (!isSelected) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                deselect();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isSelected, deselect]);

    // ── Normal mode — zero overhead passthrough ────────────────────────────────

    if (!isLayoutEditMode) {
        return <div className={className}>{children}</div>;
    }

    // ── Layout edit mode ───────────────────────────────────────────────────────

    const tx = layout.x;
    const ty = layout.y;
    const hasMoved = Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5;

    return (
        <div
            ref={wrapperRef}
            className={cn(
                "relative group outline-none",
                className,
                isSelected && "z-40"
            )}
            style={{
                transform: `translate(${tx}px, ${ty}px)`,
                willChange: "transform",
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={(e) => { e.stopPropagation(); select(); }}
        >
            {/* Outline ring — dashed on hover, solid amber when selected */}
            <div
                className={cn(
                    "absolute inset-0 pointer-events-none rounded transition-all duration-150",
                    isSelected
                        ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent"
                        : "group-hover:ring-2 group-hover:ring-amber-400/50 group-hover:ring-dashed"
                )}
            />

            {/* Drag handle — GripVertical, centered above element, appears on hover/select */}
            <div
                className={cn(
                    "absolute -top-5 left-1/2 -translate-x-1/2 z-50",
                    "w-9 h-9 rounded-full",
                    "bg-amber-500 hover:bg-amber-400 text-black shadow-xl",
                    "flex items-center justify-center",
                    "cursor-grab active:cursor-grabbing touch-none select-none",
                    "transition-all duration-150",
                    "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
                    isSelected && "opacity-100 scale-100",
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                title="Drag to reposition"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Position readout badge — shown when element has been moved */}
            {isSelected && hasMoved && (
                <div className="absolute -top-5 right-0 z-50 bg-zinc-900/90 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/40 pointer-events-none whitespace-nowrap backdrop-blur-sm">
                    X: {Math.round(tx)}  Y: {Math.round(ty)}
                </div>
            )}

            {/* Reset button — only when moved */}
            {isSelected && hasMoved && (
                <button
                    className="absolute -top-5 -right-2 z-50 w-4 h-4 rounded-full bg-zinc-700 hover:bg-rose-500 text-white text-[8px] flex items-center justify-center leading-none transition-colors pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); update({ x: 0, y: 0 }); }}
                    title="Reset position"
                >
                    ✕
                </button>
            )}

            {children}
        </div>
    );
}
