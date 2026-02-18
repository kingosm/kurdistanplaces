import { StarRating } from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReviewCardProps {
  reviewId: string;
  userId: string;
  currentUserId?: string;
  userName?: string;
  userAvatar?: string | null;
  rating: number;
  comment?: string;
  createdAt: string;
  photos?: string[];
  onDelete?: () => void;
}

export function ReviewCard({
  reviewId,
  userId,
  currentUserId,
  userName,
  userAvatar,
  rating,
  comment,
  createdAt,
  photos = [],
  onDelete
}: ReviewCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const isOwner = currentUserId === userId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed.",
      });

      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-soft group relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-primary">
                {userName?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{userName || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={rating} size="sm" />
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title={t ? t('review.delete') : "Delete review"}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
      {comment && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {comment}
        </p>
      )}

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {photos.map((photo, index) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer border border-border hover:opacity-90 transition-opacity">
                  <img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}
