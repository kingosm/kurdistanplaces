import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, UtensilsCrossed, ShoppingBag, Wrench, Smartphone, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/use-location";
import { cn } from "@/lib/utils";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avg_rating?: number;
  review_count?: number;
  distance?: number;
  category_id?: string;
  categories?: {
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: any;
}

const STATIC_CATEGORIES: Category[] = [
  { id: 'restaurants', name: 'Restaurants', slug: 'restaurants', icon: UtensilsCrossed },
  { id: 'markets', name: 'Markets', slug: 'markets', icon: ShoppingBag },
  { id: 'mechanics', name: 'Mechanics', slug: 'mechanics', icon: Wrench },
  { id: 'mobile-shops', name: 'Mobile Shops', slug: 'mobile-shops', icon: Smartphone },
  { id: 'candy-shop', name: 'Candy Shop', slug: 'candy-shop', icon: Store },
];

const NearbyPage = () => {
  const { t, translateCategoryName } = useLanguage();
  const { userLocation, isLoadingLocation, locationError, requestLocation, calculateDistance } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We rely on static categories now to ensure consistency
  const categories = STATIC_CATEGORIES;

  const fetchRestaurants = useCallback(async () => {
    try {
      // Join with categories to get name and slug
      const { data: restaurantsData, error } = await (supabase as any)
        .from("restaurants")
        .select("*, categories(name, slug)")
        .eq("is_visible", true);

      if (error) {
        console.error("Error fetching restaurants:", error);
        return;
      }

      if (restaurantsData && restaurantsData.length > 0) {
        const restaurantIds = restaurantsData.map((r: any) => r.id);

        const { data: allReviews } = await (supabase as any)
          .from("reviews")
          .select("restaurant_id, rating")
          .in("restaurant_id", restaurantIds);

        const reviewMap = new Map();
        if (allReviews) {
          allReviews.forEach((review: any) => {
            if (!reviewMap.has(review.restaurant_id)) {
              reviewMap.set(review.restaurant_id, []);
            }
            reviewMap.get(review.restaurant_id).push(review.rating);
          });
        }

        const restaurantsWithRatings = restaurantsData.map((restaurant: any) => {
          const ratings = reviewMap.get(restaurant.id) || [];
          const reviewCount = ratings.length;
          const avgRating = reviewCount > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / reviewCount
            : 0;
          return { ...restaurant, avg_rating: avgRating, review_count: reviewCount };
        });

        setRestaurants(restaurantsWithRatings);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
    requestLocation();

    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [fetchRestaurants]);

  // Find the selected category NAME based on the selected slug
  const selectedCategoryName = selectedCategorySlug
    ? STATIC_CATEGORIES.find(c => c.slug === selectedCategorySlug)?.name
    : null;

  const sortedRestaurants = userLocation
    ? [...restaurants]
      .map((restaurant) => ({
        ...restaurant,
        distance:
          restaurant.latitude && restaurant.longitude
            ? calculateDistance(
              userLocation.lat,
              userLocation.lon,
              Number(restaurant.latitude),
              Number(restaurant.longitude)
            )
            : undefined,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .filter((r) => (r.distance ?? Infinity) <= 5) // Max 5km distance
      // Filter by comparing Names (e.g. "Restaurants" === "Restaurants") instead of slugs
      .filter((r) => selectedCategoryName ? r.categories?.name === selectedCategoryName : true)
    : restaurants.filter((r) => selectedCategoryName ? r.categories?.name === selectedCategoryName : true);

  return (
    <Layout>
      <section className="pt-32 pb-24 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-4">
              <div className="place-badge">
                {t('nearby.badge.premium')}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                {t('nearby.title')}
              </h1>
              <p className="text-lg text-muted-foreground font-medium max-w-xl">
                {userLocation
                  ? t('nearby.subtitle.location')
                  : t('nearby.subtitle.no_location')}
              </p>
            </div>

            <Button
              onClick={() => requestLocation()}
              disabled={isLoadingLocation}
              size="lg"
              className={cn(
                "rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-xl h-14 px-8",
                userLocation
                  ? "bg-secondary text-foreground border border-white/5"
                  : "hero-gradient text-background border-none hover:scale-105"
              )}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('nearby.finding')}
                </>
              ) : userLocation ? (
                <>
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  {t('nearby.detected')}
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  {t('nearby.enable')}
                </>
              )}
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategorySlug(null)}
              className={cn(
                "flex-shrink-0 rounded-full h-10 px-6 font-bold text-xs uppercase tracking-wider whitespace-nowrap border transition-all",
                selectedCategorySlug === null
                  ? "bg-primary text-white border-primary"
                  : "bg-secondary/50 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground"
              )}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                onClick={() => setSelectedCategorySlug(category.slug === selectedCategorySlug ? null : category.slug)}
                className={cn(
                  "flex-shrink-0 rounded-full h-10 px-6 font-bold text-xs uppercase tracking-wider whitespace-nowrap border transition-all",
                  selectedCategorySlug === category.slug
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                    : "bg-secondary/50 text-muted-foreground border-white/5 hover:bg-secondary hover:text-foreground"
                )}
              >
                {category.icon && <category.icon className="w-4 h-4 mr-2" />}
                {translateCategoryName(category.name)}
              </Button>
            ))}
          </div>

          {locationError && (
            <div className="mb-8 p-4 glass-card border-rose-500/20 bg-rose-500/5 rounded-2xl text-rose-500 font-bold flex items-center gap-3">
              <Navigation className="w-5 h-5" />
              {locationError}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-[2.5rem] bg-secondary/50 animate-pulse border border-border/50"
                />
              ))}
            </div>
          ) : sortedRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {sortedRestaurants.map((restaurant, idx) => (
                <div key={restaurant.id} className="animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <RestaurantCard
                    id={restaurant.id}
                    name={restaurant.name}
                    slug={restaurant.slug}
                    description={restaurant.description || undefined}
                    imageUrl={restaurant.image_url || undefined}
                    address={restaurant.address || undefined}
                    rating={restaurant.avg_rating}
                    reviewCount={restaurant.review_count}
                    distance={restaurant.distance}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass-card rounded-[3rem] border-white/5 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Navigation className="w-10 h-10 text-primary opacity-50" />
              </div>
              <p className="text-2xl font-black text-muted-foreground tracking-tight">{t('index.no_results')}</p>
              {selectedCategorySlug && (
                <Button
                  variant="link"
                  onClick={() => setSelectedCategorySlug(null)}
                  className="mt-4 text-primary"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default NearbyPage;
