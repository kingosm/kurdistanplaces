import { ReactNode, useCallback } from "react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { useEditMode } from "@/contexts/EditModeContext";

interface SortablePageProps {
    page: string;
    defaultOrder: string[];
    children: ReactNode;
}

/**
 * SortablePage — wraps a page's sections in DndContext + SortableContext.
 * Reads section order from EditModeContext (DB override or default).
 * On drag end, stages the new order as a pending change.
 */
export function SortablePage({ page, defaultOrder, children }: SortablePageProps) {
    const { sectionOrders, setSectionOrder } = useEditMode();

    const order = sectionOrders[page] ?? defaultOrder;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // Require 8px of movement before activating drag (prevents accidental drags)
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = order.indexOf(String(active.id));
            const newIndex = order.indexOf(String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;

            const newOrder = arrayMove(order, oldIndex, newIndex);
            setSectionOrder(page, newOrder);
        },
        [order, page, setSectionOrder]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
}
