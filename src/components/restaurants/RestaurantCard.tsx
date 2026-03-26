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
        "group flex flex-row items-center gap-3 p-2 cursor-pointer transition-all duration-300 border-b border-white/[0.03] hover:bg-white/[0.02]",
        isActive && "bg-white/[0.05]"
      )}
    >
      <div className={cn(
        "relative w-20 h-20 overflow-hidden rounded-xl bg-secondary shrink-0",
        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}>
        <img
          src={finalImage || "/placeholder.svg"}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Rating Floating HUD on Image - Scaled down for Micro-Row */}
        <div className="absolute bottom-1 right-1 z-10 flex items-center bg-black/60 backdrop-blur-sm px-1 rounded-md">
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-black text-white ml-0.5">{finalRating > 0 ? finalRating.toFixed(1) : "N"}</span>
        </div>

        {isEditMode && (
          <div className="absolute top-4 left-4 z-10">
            <span className="flex items-center gap-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
              <Pencil className="w-3 h-3" />
              Edit
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
        <h3 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{name}</h3>
        
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground truncate opacity-70 mb-0.5">{address || "Surprise location"}</span>
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
             <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">Restaurant</span>
             {distance !== undefined && (
               <span>{distance.toFixed(1)} km · </span>
             )}
             <span>{finalReviews} reviews</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center pr-2">
         <button 
           onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
           className="transition-transform active:scale-90"
         >
           <Heart className={cn(
             "w-5 h-5 transition-colors",
             isFavorite ? "fill-[#ff385c] text-[#ff385c]" : "text-muted-foreground/30 hover:text-muted-foreground"
           )} />
         </button>
      </div>
    </Link>
  );
}
