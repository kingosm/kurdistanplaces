import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Move } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { cn } from "@/lib/utils";

interface SortableSectionProps {
    id: string;
    children: ReactNode;
    className?: string;
}

/**
 * SortableSection — wraps a page section to make it draggable in edit mode.
 * Shows a four-directional Move icon as the drag handle (top-left corner).
 * Invisible and zero-overhead for non-admins.
 */
export function SortableSection({ id, children, className }: SortableSectionProps) {
    const { isEditMode } = useEditMode();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative",
                isDragging && "z-50 opacity-80 scale-[0.99]",
                isEditMode && "ring-1 ring-amber-400/30 ring-offset-0",
                className
            )}
        >
            {/* Drag Handle — only visible in edit mode */}
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className={cn(
                        "absolute top-3 left-1/2 -translate-x-1/2 z-50",
                        "flex items-center justify-center",
                        "w-10 h-10 rounded-full",
                        "bg-amber-500 hover:bg-amber-400 text-black shadow-lg",
                        "cursor-grab active:cursor-grabbing",
                        "transition-all duration-150 hover:scale-110",
                        isDragging && "cursor-grabbing scale-110"
                    )}
                    title="Drag to reorder section"
                >
                    <Move className="w-5 h-5" />
                </div>
            )}

            {/* Section content — REMOVED pt-12 to satisfy zero-gap requirement */}
            <div>
                {children}
            </div>
        </div>
    );
}
