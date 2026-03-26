import React, { useRef } from "react";
import { Button } from "./button";
import { Image, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string | null;
    onUpload: (file: File) => Promise<void>;
    onRemove: () => void;
    isUploading: boolean;
    className?: string;
}

export function ImageUpload({
    value,
    onUpload,
    onRemove,
    isUploading,
    className,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onUpload(file);
        }
        // Reset input value to allow same file re-upload if needed
        e.target.value = "";
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            <div
                onClick={!value && !isUploading ? handleClick : undefined}
                className={cn(
                    "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all duration-300 min-h-[150px] overflow-hidden bg-muted/30",
                    !value && !isUploading && "cursor-pointer hover:border-primary hover:bg-muted/50 border-muted-foreground/25",
                    value && "border-solid border-muted",
                    isUploading && "opacity-60 cursor-not-allowed"
                )}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground font-display">Uploading image...</p>
                    </div>
                ) : value ? (
                    <div className="relative group w-full h-full">
                        <img
                            src={value}
                            alt="Uploaded"
                            className="w-full h-[200px] object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleClick}
                                className="shadow-md"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Change
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="shadow-md"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <Upload className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="font-display font-semibold text-lg">Click to upload image</p>
                            <p className="text-sm text-muted-foreground mt-1">PNG, JPG or WEBP (Max. 5MB)</p>
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </div>
        </div>
    );
}
