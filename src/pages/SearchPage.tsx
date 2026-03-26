import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { MapComponent, Restaurant } from "@/components/map/MapComponent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Map as MapIcon, List, Search as SearchIcon, Star, UtensilsCrossed, ShoppingBag, Wrench, Smartphone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/use-location";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: 'restaurants', name: 'Restaurants', icon: UtensilsCrossed },
  { id: 'markets', name: 'Markets', icon: ShoppingBag },
  { id: 'mechanics', name: 'Mechanics', icon: Wrench },
  { id: 'mobile-shops', name: 'Mobile Shops', icon: Smartphone },
  { id: 'candy-shop', name: 'Candy Shop', icon: Store }
];

interface SearchRestaurant extends Restaurant {
  category_name?: string;
}

const SearchPage = () => {
  const { userLocation, calculateDistance, requestLocation } = useLocation();
  const [restaurants, setRestaurants] = useState<SearchRestaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<SearchRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View State
  const [showMap, setShowMap] = useState(false); // Mobile toggle
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("restaurants")
        .select("*, categories(name)")
        .eq("is_visible", true);

      if (error) throw error;

      if (data) {
        // Fetch Ratings
        const { data: allReviews } = await (supabase as any).from("reviews").select("restaurant_id, rating");
        const reviewMap = new Map();
        if (allReviews) {
          allReviews.forEach((r: any) => {
            if (!reviewMap.has(r.restaurant_id)) reviewMap.set(r.restaurant_id, []);
            reviewMap.get(r.restaurant_id).push(r.rating);
          });
        }

        const enriched = data.map((restaurant: any) => {
          const ratings = reviewMap.get(restaurant.id) || [];
          const count = ratings.length;
          const avg = count > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / count : 0;
          return { ...restaurant, avg_rating: avg, review_count: count, category_name: restaurant.categories?.name };
        });
        setRestaurants(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
    requestLocation();
  }, [fetchRestaurants]);

  // Apply Filters
  useEffect(() => {
    let result = [...restaurants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.category_name && r.category_name.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      const activeName = CATEGORIES.find(c => c.id === selectedCategory)?.name?.toLowerCase().trim();
      
      result = result.filter(r => {
        if (!r.category_name) return false;
        // Highly robust case and space insensitive match
        return r.category_name.toLowerCase().trim() === activeName;
      });
    }

    if (minRating > 0) {
      result = result.filter(r => (r.avg_rating || 0) >= minRating);
    }

    // Calc distance if location available
    if (userLocation) {
      result = result.map(r => ({
        ...r,
        distance: r.latitude && r.longitude ? calculateDistance(userLocation.lat, userLocation.lon, r.latitude, r.longitude) : undefined
      })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    setFilteredRestaurants(result);
  }, [restaurants, searchQuery, selectedCategory, minRating, userLocation]);

  return (
    <Layout>
      {/* Account for 144px Header height when not scrolled */}
      <div className="flex flex-col h-[calc(100vh-140px)] mt-[140px] pt-4 bg-background">
        
        {/* Sticky Filter Bar */}
        <div className="w-full bg-background border-b border-border z-20 px-4 py-3 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search destinations..." 
              className="pl-10 rounded-full bg-secondary/50 border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide pb-1 md:pb-0">
            <Button
              variant="outline"
              className={cn("rounded-full border-white/10 gap-2 shrink-0 transition-opacity cursor-pointer pointer-events-auto", selectedCategory === null ? "bg-primary text-white border-primary opacity-100" : "opacity-80 hover:opacity-100")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedCategory(null);
              }}
            >
              All
            </Button>
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant="outline"
                className={cn("rounded-full border-white/10 gap-2 shrink-0 transition-opacity cursor-pointer pointer-events-auto", selectedCategory === cat.id ? "bg-primary text-white border-primary opacity-100" : "opacity-80 hover:opacity-100")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                }}
              >
                <cat.icon className="w-4 h-4" /> {cat.name}
              </Button>
            ))}
            <Button
              variant="outline"
              className={cn("rounded-full border-white/10 gap-2 shrink-0 transition-all", minRating === 4 && "bg-amber-500 text-white border-amber-500")}
              onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
            >
              <Star className="w-4 h-4" /> 4.0+ Rating
            </Button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* List View */}
          <div className={cn(
            "w-full lg:w-[60%] xl:w-[55%] h-full overflow-y-auto px-4 py-6 pb-24 lg:pb-6 transition-all",
            showMap ? "hidden lg:block" : "block"
          )}>
            <div className="mb-4">
              <h2 className="text-xl font-bold">{filteredRestaurants.length} places found</h2>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-secondary animate-pulse rounded-[1.5rem]" />)}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredRestaurants.map(r => (
                  <RestaurantCard
                    key={r.id}
                    {...r}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No exact matches found.</p>
                <Button variant="link" onClick={() => {setSearchQuery(""); setSelectedCategory(null); setMinRating(0);}}>Clear filters</Button>
              </div>
            )}
          </div>

          {/* Map View */}
          <div className={cn(
            "w-full lg:w-[40%] xl:w-[45%] h-full bg-secondary/20 relative transition-all",
            !showMap ? "hidden lg:block" : "block"
          )}>
            <div className="absolute inset-0">
               <MapComponent 
                 restaurants={filteredRestaurants} 
                 userLocation={userLocation} 
                 hoveredRestaurantId={hoveredId}
                 className="rounded-none border-none"
               />
            </div>
          </div>

        </div>

        {/* Mobile Map/List Toggle */}
        <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]">
          <Button 
            onClick={() => setShowMap(!showMap)}
            className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold px-6 shadow-xl gap-2 h-12 flex items-center"
          >
            {showMap ? <><List className="w-4 h-4" /> Show List</> : <><MapIcon className="w-4 h-4" /> Show Map</>}
          </Button>
        </div>

      </div>
    </Layout>
  );
};

export default SearchPage;
