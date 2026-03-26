import { Link } from "react-router-dom";
import { Star, Heart, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditMode } from "@/contexts/EditModeContext";
import { useState } from "react";

interface RestaurantCardProps {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isActive?: boolean;
  image_url?: string;
  avg_rating?: number;
  review_count?: number;
}

export function RestaurantCard({
  name,
  slug,
  imageUrl,
  image_url,
  address,
  rating = 0,
  avg_rating = 0,
  reviewCount = 0,
  review_count = 0,
  distance,
  onMouseEnter,
  onMouseLeave,
  isActive
}: RestaurantCardProps) {
  const { isEditMode } = useEditMode();
  const [isFavorite, setIsFavorite] = useState(false);

  // Fallback to database snake_case columns if camelCase props aren't provided
  const finalImage = imageUrl || image_url;
  const finalRating = rating > 0 ? rating : (avg_rating > 0 ? avg_rating : 0);
  const finalReviews = reviewCount > 0 ? reviewCount : (review_count > 0 ? review_count : 0);

  return (
    <Link
      to={`/restaurant/${slug}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group flex flex-col gap-3 cursor-pointer transition-all duration-300",
        isActive && "scale-[1.02]"
      )}
    >
      <div className={cn(
        "relative w-full aspect-[1/1] overflow-hidden rounded-[1.5rem] bg-secondary",
        isActive && "shadow-[0_0_0_2px_hsl(var(--primary))]"
      )}>
        <img
          src={finalImage || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
          className="absolute top-4 right-4 z-10 transition-transform active:scale-90"
        >
          <Heart className={cn(
            "w-7 h-7 drop-shadow-md transition-colors",
            isFavorite ? "fill-[#ff385c] text-[#ff385c]" : "fill-black/30 text-white hover:fill-black/50"
          )} />
        </button>

        {isEditMode && (
          <div className="absolute top-4 left-4 z-10">
            <span className="flex items-center gap-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
              <Pencil className="w-3 h-3" />
              Edit
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base font-semibold truncate text-foreground">{name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
            <span className="text-sm font-medium">{finalRating > 0 ? finalRating.toFixed(2) : "New"}</span>
          </div>
        </div>
        
        <span className="text-sm text-muted-foreground truncate">{address || "Surprise location"}</span>
        
        {distance !== undefined && (
          <span className="text-sm text-muted-foreground">{distance.toFixed(1)} km away</span>
        )}
        
        <div className="mt-1 flex items-center">
          <span className="text-sm font-semibold text-foreground underline decoration-1 underline-offset-4">View Details</span>
          <span className="text-sm text-muted-foreground ml-1">· {finalReviews} reviews</span>
        </div>
      </div>
    </Link>
  );
}
