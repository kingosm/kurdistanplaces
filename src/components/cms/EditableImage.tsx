import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEditMode } from "@/contexts/EditModeContext";
import { useContent } from "@/hooks/useContent";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Camera, Loader2 } from "lucide-react";
import { useState } from "react";

interface EditableImageProps {
    contentKey: string;
    fallback: string;
    alt: string;
    className?: string;
}

/**
 * EditableImage — renders an image normally for visitors.
 * For admins in edit mode, shows a camera overlay to replace the image.
 * Uploads to Supabase Storage and stages the new URL.
 */
export function EditableImage({
    contentKey,
    fallback,
    alt,
    className,
}: EditableImageProps) {
    const { language } = useLanguage();
    const { isEditMode, setEdit } = useEditMode();
    const { toast } = useToast();
    const c = useContent();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const currentSrc = c(contentKey) || fallback;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith("image/")) {
            toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max image size is 5MB.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `cms/${contentKey.replace(/\./g, "_")}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
            const publicUrl = urlData.publicUrl;

            setEdit(contentKey, language as "en" | "ku" | "ar", publicUrl);
            toast({ title: "Image ready", description: "Click Save to apply the change." });
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
            // Reset input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (!isEditMode) {
        return (
            <img
                src={currentSrc}
                alt={alt}
                className={cn("object-cover", className)}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
        );
    }

    return (
        <div className={cn("relative group", className)}>
            <img
                src={currentSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
            />

            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center ring-2 ring-amber-400 ring-inset">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-full text-sm transition-all shadow-lg"
                >
                    {isUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    ) : (
                        <><Camera className="w-4 h-4" /> Change Image</>
                    )}
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
