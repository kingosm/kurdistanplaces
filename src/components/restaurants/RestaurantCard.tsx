import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditMode } from "@/contexts/EditModeContext";

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
}

export function RestaurantCard({
  name,
  slug,
  imageUrl,
  address,
  rating = 0,
  reviewCount = 0,
  distance,
}: RestaurantCardProps) {
  const { isEditMode } = useEditMode();
  return (
    <Link
      to={`/restaurant/${slug}`}
      className="group relative block h-[28rem] rounded-[2.5rem] overflow-hidden"
    >
      {/* Background Image with Zoom Effect */}
      <div className="absolute inset-0 bg-secondary">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
      </div>

      {/* Floating Badges */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        {distance !== undefined && (
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
            <Navigation className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {distance.toFixed(1)} km
            </span>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-black tracking-tight text-white">
            {rating > 0 ? rating.toFixed(1) : "NEW"}
          </span>
        </div>

        {/* Edit in Admin badge — only visible in edit mode */}
        {isEditMode && (
          <Link
            to="/admin"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg hover:bg-amber-400 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit in Admin
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="space-y-3">
          <h3 className="text-3xl font-black tracking-tighter text-white leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>

          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold truncate tracking-wide uppercase">{address || "Hidden Gem"}</span>
          </div>

          <div className="w-full h-px bg-white/10 my-4" />

          <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {reviewCount} Reviews
            </span>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Explore <Navigation className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
