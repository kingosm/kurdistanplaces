import { useRef, useCallback, useEffect, KeyboardEvent, ReactNode } from "react";
import { GripVertical, Lock, Unlock, AlignLeft, AlignCenter, AlignRight, RotateCcw, Move } from "lucide-react";
import { useEditableLayout } from "@/hooks/useEditableLayout";
import { useLayoutEditor } from "@/contexts/LayoutEditorContext";
import { VisibilityToggles } from "@/components/cms/LayoutPresets";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

interface EditableBlockProps {
    id: string;
    page: string;
    children: ReactNode;
    className?: string;
}

// ── Handle config ─────────────────────────────────────────────────────────────

const CURSORS: Record<ResizeHandle, string> = {
    n: "cursor-n-resize", ne: "cursor-ne-resize", e: "cursor-e-resize",
    se: "cursor-se-resize", s: "cursor-s-resize", sw: "cursor-sw-resize",
    w: "cursor-w-resize", nw: "cursor-nw-resize",
};

const POSITIONS: Record<ResizeHandle, string> = {
    nw: "-top-1.5 -left-1.5",
    n: "-top-1.5 left-1/2 -translate-x-1/2",
    ne: "-top-1.5 -right-1.5",
    e: "top-1/2 -translate-y-1/2 -right-1.5",
    se: "-bottom-1.5 -right-1.5",
    s: "-bottom-1.5 left-1/2 -translate-x-1/2",
    sw: "-bottom-1.5 -left-1.5",
    w: "top-1/2 -translate-y-1/2 -left-1.5",
};

const ALL_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * EditableBlock — production-ready drag + resize + lock + align wrapper.
 * Updated:
 * - NO transparent capture overlay (to allow nested interactions like sortable navs).
 * - Explicit DRAG HANDLE in toolbar for moving the block.
 * - Corner resize handles.
 */
export function EditableBlock({ id, page, children, className }: EditableBlockProps) {
    const { layout, isSelected, select, deselect, update, isLayoutEditMode } =
        useEditableLayout(id, page);
    const { isLocked, toggleLock, isHiddenForUser } = useLayoutEditor();
    const locked = isLocked(id, page);
    const hiddenForUser = isHiddenForUser(id, page);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const isResizing = useRef<ResizeHandle | null>(null);
    const startPointer = useRef({ x: 0, y: 0 });
    const startLayout = useRef({ x: 0, y: 0 });
    const startSize = useRef({ w: 0, h: 0 });
    const startFontSize = useRef<number>(16);

    // ── Keyboard control ─────────────────────────────────────────────────────

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        if (!isSelected || locked) return;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") { e.preventDefault(); update({ x: layout.x - step }); }
        if (e.key === "ArrowRight") { e.preventDefault(); update({ x: layout.x + step }); }
        if (e.key === "ArrowUp") { e.preventDefault(); update({ y: layout.y - step }); }
        if (e.key === "ArrowDown") { e.preventDefault(); update({ y: layout.y + step }); }
        if (e.key === "Escape") { e.preventDefault(); deselect(); }
    }, [isSelected, locked, layout.x, layout.y, update, deselect]);

    // ── Drag — triggered by specific handle or toolbar button ────────────────

    const handleDragStart = useCallback((e: React.PointerEvent) => {
        if (locked || e.button !== 0) return; // Only left click
        e.preventDefault();
        e.stopPropagation();
        select();
        isDragging.current = true;
        startPointer.current = { x: e.clientX, y: e.clientY };
        startLayout.current = { x: layout.x, y: layout.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [locked, select, layout.x, layout.y]);

    // ── Resize handles ───────────────────────────────────────────────────────

    const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
        if (locked || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        select();
        isResizing.current = handle;
        startPointer.current = { x: e.clientX, y: e.clientY };
        startLayout.current = { x: layout.x, y: layout.y };
        if (wrapperRef.current) {
            const r = wrapperRef.current.getBoundingClientRect();
            startSize.current = { w: r.width, h: r.height };
            const computed = parseFloat(getComputedStyle(wrapperRef.current).fontSize) || 16;
            startFontSize.current = layout.fontSize ?? computed;
        }
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [locked, select, layout.x, layout.y, layout.fontSize]);

    // ── Combined pointer move ────────────────────────────────────────────────

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        // Safety: detection if button was released outside window
        if ((isDragging.current || isResizing.current) && (e.buttons & 1) === 0) {
            isDragging.current = false;
            isResizing.current = null;
            return;
        }

        const snap = (v: number) => Math.round(v / 8) * 8;
        const dx = e.clientX - startPointer.current.x;
        const dy = e.clientY - startPointer.current.y;

        if (isDragging.current) {
            update({ x: snap(startLayout.current.x + dx), y: snap(startLayout.current.y + dy) });
            return;
        }

        const handle = isResizing.current;
        if (!handle) return;

        let nx = startLayout.current.x;
        let ny = startLayout.current.y;
        let nw = startSize.current.w;
        let nh = startSize.current.h;

        if (handle.includes("e")) nw = snap(Math.max(80, startSize.current.w + dx));
        if (handle.includes("w")) { nw = snap(Math.max(80, startSize.current.w - dx)); nx = startLayout.current.x + dx; }
        if (handle.includes("s")) nh = snap(Math.max(40, startSize.current.h + dy));
        if (handle.includes("n")) { nh = snap(Math.max(40, startSize.current.h - dy)); ny = startLayout.current.y + dy; }

        const widthRatio = nw / startSize.current.w;
        const newFontSize = Math.round(Math.min(200, Math.max(8, startFontSize.current * widthRatio)));

        update({ x: nx, y: ny, width: nw, height: nh, fontSize: newFontSize });
    }, [update]);

    const handlePointerUp = useCallback(() => {
        isDragging.current = false;
        isResizing.current = null;
    }, []);

    // ── Alignment ────────────────────────────────────────────────────────────

    const alignElement = useCallback((dir: "left" | "center" | "right") => {
        if (!wrapperRef.current) return;
        const el = wrapperRef.current;
        const parent = el.parentElement;
        if (!parent) return;
        el.style.transform = "none";
        const elRect = el.getBoundingClientRect();
        const prRect = parent.getBoundingClientRect();
        el.style.transform = `translate(${layout.x}px, ${layout.y}px)`;
        if (dir === "left") update({ x: prRect.left - elRect.left });
        if (dir === "center") update({ x: (prRect.left + prRect.width / 2) - (elRect.left + elRect.width / 2) });
        if (dir === "right") update({ x: prRect.right - elRect.right });
    }, [layout.x, layout.y, update]);

    // ── Click-outside deselect ───────────────────────────────────────────────

    useEffect(() => {
        if (!isSelected) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) deselect();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isSelected, deselect]);

    // ── Normal mode — zero overhead ──────────────────────────────────────────

    if (!isLayoutEditMode) {
        if (hiddenForUser) return null;
        const tx = layout.x;
        const ty = layout.y;
        return (
            <div
                className={className}
                style={{
                    transform: (tx || ty) ? `translate(${tx}px, ${ty}px)` : undefined,
                    width: layout.width ? `${layout.width}px` : undefined,
                    height: layout.height ? `${layout.height}px` : undefined,
                    fontSize: layout.fontSize ? `${layout.fontSize}px` : undefined,
                }}
            >
                {children}
            </div>
        );
    }

    // ── Derived render values ─────────────────────────────────────────────────

    const tx = layout.x;
    const ty = layout.y;
    const hasMoved = Math.abs(tx) > 0.5 || Math.abs(ty) > 0.5;
    const hasSize = layout.width != null || layout.height != null;

    return (
        <div
            ref={wrapperRef}
            className={cn("relative group outline-none", className, isSelected && "z-40")}
            style={{
                transform: `translate(${tx}px, ${ty}px)`,
                willChange: "transform",
                width: layout.width ? `${layout.width}px` : undefined,
                height: layout.height ? `${layout.height}px` : undefined,
                fontSize: layout.fontSize ? `${layout.fontSize}px` : undefined,
                opacity: hiddenForUser ? 0.45 : undefined,
                outline: hiddenForUser ? "2px dashed #f43f5e" : undefined,
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClickCapture={(e) => { if (isLayoutEditMode) e.preventDefault(); }}
            onClick={(e) => { e.stopPropagation(); select(); }}
        >
            {/* actual content */}
            {children}

            {/* ── Outline ring ─────────────────────────────────────────────── */}
            <div className={cn(
                "absolute inset-0 pointer-events-none rounded transition-all duration-150",
                locked
                    ? "ring-2 ring-rose-500/60 ring-dashed"
                    : isSelected
                        ? "ring-2 ring-amber-400 ring-offset-1"
                        : "group-hover:ring-2 group-hover:ring-amber-400/50 group-hover:ring-dashed"
            )} />

            {/* ── Hover Drag Handle -- Visible when not selected (like tabs) ── */}
            {!isSelected && !locked && (
                <button
                    className="absolute top-0 left-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-50 text-white bg-amber-500 rounded-br shadow-sm"
                    onPointerDown={handleDragStart}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    title="Drag to move"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </button>
            )}

            {/* ── 8 Resize handles ─────────────────────────────────────────── */}
            {isSelected && !locked && ALL_HANDLES.map(handle => (
                <div
                    key={handle}
                    className={cn(
                        "absolute z-50 w-3 h-3 bg-white border-2 border-amber-500 rounded-sm shadow-md",
                        POSITIONS[handle],
                        CURSORS[handle],
                    )}
                    onPointerDown={(e) => handleResizeStart(e, handle)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    title={`Resize ${handle}`}
                />
            ))}

            {/* ── Position badge ────────────────────────────────────────────── */}
            {isSelected && hasMoved && (
                <div className="absolute top-1 left-1 z-50 bg-zinc-900/90 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/40 pointer-events-none whitespace-nowrap backdrop-blur-sm">
                    X:{Math.round(tx)} Y:{Math.round(ty)}
                </div>
            )}

            {/* ── Size + font badge ─────────────────────────────────────────── */}
            {isSelected && hasSize && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 text-sky-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-sky-400/40 pointer-events-none whitespace-nowrap backdrop-blur-sm">
                    {layout.width ? `W:${Math.round(layout.width)}` : ""}
                    {layout.width && layout.height ? " " : ""}
                    {layout.height ? `H:${Math.round(layout.height)}` : ""}
                    {layout.fontSize ? ` F:${Math.round(layout.fontSize)}px` : ""}
                </div>
            )}

            {/* ── Lock badge ────────────────────────────────────────────────── */}
            {locked && (
                <div className="absolute top-1 left-1 z-50 bg-rose-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> LOCKED
                </div>
            )}

            {/* ── Selected toolbar — appears BELOW element ──────────────────── */}
            {isSelected && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-0.5 bg-zinc-900/95 border border-zinc-700 rounded-full px-2 py-1 shadow-xl backdrop-blur-sm whitespace-nowrap">

                    {/* Explicit Drag Handle */}
                    {!locked && (
                        <>
                            <button
                                onPointerDown={handleDragStart}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                title="Drag to move block"
                                className="p-1 rounded bg-amber-500 hover:bg-amber-400 text-black shadow-sm mr-1 cursor-grab active:cursor-grabbing"
                            >
                                <Move className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-px h-3 bg-zinc-600 mx-0.5" />
                        </>
                    )}

                    <button onClick={() => alignElement("left")} title="Align left" className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"><AlignLeft className="w-3 h-3" /></button>
                    <button onClick={() => alignElement("center")} title="Align center" className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"><AlignCenter className="w-3 h-3" /></button>
                    <button onClick={() => alignElement("right")} title="Align right" className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"><AlignRight className="w-3 h-3" /></button>

                    <div className="w-px h-3 bg-zinc-600 mx-0.5" />

                    {(hasMoved || hasSize) && (
                        <button onClick={() => update({ x: 0, y: 0, width: null, height: null, fontSize: null })} title="Reset all" className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-amber-400 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}

                    <div className="w-px h-3 bg-zinc-600 mx-0.5" />

                    <button
                        onClick={() => toggleLock(id, page)}
                        title={locked ? "Unlock" : "Lock"}
                        className={cn("p-1 rounded transition-colors", locked ? "text-rose-400 hover:text-rose-300" : "text-zinc-300 hover:text-rose-400")}
                    >
                        {locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    </button>

                    <div className="w-px h-3 bg-zinc-600 mx-0.5" />

                    <VisibilityToggles id={id} page={page} />
                </div>
            )}
        </div>
    );
}
