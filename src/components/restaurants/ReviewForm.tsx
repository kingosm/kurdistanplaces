import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReviewFormProps {
  restaurantId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ restaurantId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images') // Using the existing 'images' bucket
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setPhotos((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: t('review.upload_error'),
        description: t('review.upload_error_desc'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setPhotos((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: t('review.rating_required'),
        description: t('review.rating_required_desc'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: t('review.signin_required'),
          description: t('review.signin_required_desc'),
          variant: "destructive",
        });
        return;
      }

      // 1. Insert Review
      const { data: reviewData, error: reviewError } = await (supabase as any)
        .from("reviews")
        .insert({
          restaurant_id: restaurantId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        })
        .select()
        .single();

      if (reviewError) {
        // Self-healing: If profile is missing (FK violation), create it and retry
        if (reviewError.code === '23503') {
          console.warn("Profile missing for user, attempting to create...", user.id);

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              user_id: user.id,
              full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Foodie',
              avatar_url: user.user_metadata.avatar_url
            });

          if (profileError) {
            console.error("Failed to auto-create profile:", profileError);
            throw reviewError; // Throw original error if fix fails
          }

          // Retry Review Insert
          const { data: retryData, error: retryError } = await (supabase as any)
            .from("reviews")
            .insert({
              restaurant_id: restaurantId,
              user_id: user.id,
              rating,
              comment: comment.trim() || null,
            })
            .select()
            .single();

          if (retryError) throw retryError;

          // If successful, proceed with photos using retryData
          if (photos.length > 0 && retryData) {
            const photoInserts = photos.map(url => ({
              review_id: retryData.id,
              photo_url: url
            }));

            const { error: photoError } = await (supabase as any)
              .from("review_photos")
              .insert(photoInserts);

            if (photoError) console.error("Error linking photos:", photoError);
          }

          toast({
            title: t('review.submitted'),
            description: t('review.thank_you'),
          });

          setRating(0);
          setComment("");
          setPhotos([]);
          onReviewSubmitted();
          return; // Exit success path
        }

        throw reviewError;
      }

      // 2. Insert Photos (if any) - Normal Path
      if (photos.length > 0 && reviewData) {
        const photoInserts = photos.map(url => ({
          review_id: reviewData.id,
          photo_url: url
        }));

        const { error: photoError } = await (supabase as any)
          .from("review_photos")
          .insert(photoInserts);

        if (photoError) {
          console.error("Error linking photos:", photoError);
          // Non-blocking error, but warn user
          toast({
            title: t('review.warning'),
            description: t('review.photo_warning'),
            variant: "destructive"
          });
        }
      }

      toast({
        title: t('review.submitted'),
        description: t('review.thank_you'),
      });

      setRating(0);
      setComment("");
      setPhotos([]);
      onReviewSubmitted();
    } catch (error) {
      console.error("Review submission error:", error);
      const errorMessage = error instanceof Error ? error.message : t('review.error_desc');
      toast({
        title: t('review.error'),
        description: errorMessage + " (Check console for details)",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-6">
      <h4 className="font-display text-lg font-semibold">{t('review.write')}</h4>

      <div>
        <label className="block text-sm font-medium mb-2">{t('review.your_rating')}</label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          {t('review.your_review')}
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('review.placeholder')}
          rows={4}
          className="resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('review.add_photos')}</label>
        <MultiImageUpload
          value={photos}
          onUpload={handleUpload}
          onRemove={handleRemovePhoto}
          isUploading={isUploading}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
        {isSubmitting ? t('review.submitting') : t('review.submit')}
      </Button>
    </form>
  );
}
