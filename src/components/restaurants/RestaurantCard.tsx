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
        "relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-secondary shadow-sm",
        isActive && "shadow-[0_0_0_2px_hsl(var(--primary))]"
      )}>
        <img
          src={finalImage || "/placeholder.svg"}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Rating Floating Chip */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold text-white">{finalRating > 0 ? finalRating.toFixed(1) : "New"}</span>
        </div>

        {/* Favorite Button */}
        <button 
          onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
          className="absolute top-3 right-3 z-10 transition-transform active:scale-90"
        >
          <Heart className={cn(
            "w-6 h-6 drop-shadow-md transition-colors",
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

      <div className="flex flex-col gap-1 px-1 py-1">
        <div className="flex justify-between items-start gap-1">
          <h3 className="text-sm font-bold truncate text-foreground leading-tight">{name}</h3>
        </div>
        
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-muted-foreground truncate opacity-80">{address || "Surprise location"}</span>
          
          <div className="flex items-center text-[12px] text-muted-foreground font-medium">
             {distance !== undefined && (
               <span className="mr-1">{distance.toFixed(1)} km · </span>
             )}
             <span>{finalReviews} reviews</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
