import { useRef, useEffect, ElementType } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { useContent } from "@/hooks/useContent";
import { cn } from "@/lib/utils";

interface EditableTextProps {
    contentKey: string;
    fallback?: string;
    className?: string;
    as?: ElementType;
}

/**
 * EditableText — renders text normally for visitors.
 * For admins in edit mode, it becomes a contenteditable element
 * with an amber dashed outline. Changes are staged on blur.
 */
export function EditableText({
    contentKey,
    fallback = "",
    className,
    as: Tag = "span",
}: EditableTextProps) {
    const { language, isRTL } = useLanguage();
    const { isEditMode, setEdit } = useEditMode();
    const c = useContent();
    const ref = useRef<HTMLElement>(null);

    const currentValue = c(contentKey) || fallback;

    // Sync content into the DOM when value changes externally (e.g. language switch)
    useEffect(() => {
        if (ref.current && isEditMode) {
            // Only update if not currently focused (don't interrupt typing)
            if (document.activeElement !== ref.current) {
                ref.current.textContent = currentValue;
            }
        }
    }, [currentValue, isEditMode]);

    if (!isEditMode) {
        return (
            <Tag className={className} dir={isRTL ? "rtl" : "ltr"}>
                {currentValue}
            </Tag>
        );
    }

    return (
        <Tag
            ref={ref as any}
            contentEditable
            suppressContentEditableWarning
            dir={isRTL ? "rtl" : "ltr"}
            className={cn(
                className,
                "outline-none cursor-text",
                "ring-2 ring-amber-400 ring-offset-1 rounded-sm",
                "hover:ring-amber-500 focus:ring-amber-500",
                "transition-all duration-150",
                "min-w-[1em] inline-block",
                "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-amber-400/60 [&:empty]:before:italic"
            )}
            data-placeholder={fallback || contentKey}
            onBlur={(e) => {
                const newValue = e.currentTarget.textContent?.trim() ?? "";
                if (newValue && newValue !== currentValue) {
                    setEdit(contentKey, language as "en" | "ku" | "ar", newValue);
                }
            }}
            onKeyDown={(e) => {
                // Prevent Enter from creating <div> blocks
                if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).blur();
                }
            }}
        >
            {currentValue}
        </Tag>
    );
}
