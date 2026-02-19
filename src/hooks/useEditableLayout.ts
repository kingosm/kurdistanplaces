import { useLayoutEditor, ElementLayout } from "@/contexts/LayoutEditorContext";

/**
 * useEditableLayout — thin wrapper around LayoutEditorContext for a specific element.
 * Returns the current layout (x, y, width, height, fontSize) for this element ID + page,
 * respecting the active breakpoint automatically.
 */
export function useEditableLayout(id: string, page: string) {
    const {
        getLayout,
        setElementLayout,
        selectedId,
        selectElement,
        isLayoutEditMode,
        activeBreakpoint,
    } = useLayoutEditor();

    const layout = getLayout(id, page);
    const isSelected = selectedId === id;

    const update = (partial: Partial<ElementLayout>) => {
        setElementLayout(id, page, { ...layout, ...partial });
    };

    const select = () => selectElement(id);
    const deselect = () => selectElement(null);

    return { layout, isSelected, select, deselect, update, isLayoutEditMode, activeBreakpoint };
}
