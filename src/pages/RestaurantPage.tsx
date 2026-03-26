import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { MenuSection } from "@/components/restaurants/MenuSection";
import { ReviewCard } from "@/components/restaurants/ReviewCard";
import { ReviewForm } from "@/components/restaurants/ReviewForm";
import { StarRating } from "@/components/restaurants/StarRating";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Phone,
  MapPin,
  Navigation,
  Heart,
  Clock,
  ExternalLink,
  Facebook,
  Instagram,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapComponent } from "@/components/map/MapComponent";
import { useLocation } from "@/hooks/use-location";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  category_id: string | null;
  opening_hours: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  image_url: string | null;
  is_visible: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
  review_photos?: {
    photo_url: string;
  }[];
}

const RestaurantPage = () => {
  const { t } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const { userLocation, requestLocation } = useLocation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Request location on mount
    requestLocation();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchReviews = useCallback(async (restaurantId: string) => {
    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select(`
        *,
        review_photos (
            photo_url
        )
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      // Optional: Toast error only if you want user to see it immediately
      // toast({ title: "Could not load reviews", description: error.message, variant: "destructive" });
    }

    if (reviewsData) {
      console.log("Reviews fetched from DB:", reviewsData.length);
      const reviewsWithProfiles = await Promise.all(
        reviewsData.map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", review.user_id)
            .single();
          return { ...review, profiles: profile } as unknown as Review;
        })
      );
      setReviews(reviewsWithProfiles);
    }
  }, []);

  const fetchRestaurantData = useCallback(async () => {
    setIsLoading(true);

    const { data: restaurantData } = await (supabase as any)
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (restaurantData) {
      console.log('Restaurant Data Loaded:', restaurantData);
      setRestaurant(restaurantData);

      const { data: menuData } = await (supabase as any)
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_visible", true);

      setMenuItems((menuData as any) || []);
      await fetchReviews(restaurantData.id);
    }

    setIsLoading(false);
  }, [slug, fetchReviews]);

  const checkFavorite = useCallback(async () => {
    if (!user || !restaurant) return;

    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurant.id)
      .single();

    setIsFavorite(!!data);
  }, [user, restaurant]);

  useEffect(() => {
    if (slug) {
      fetchRestaurantData();
    }
  }, [slug, fetchRestaurantData]);

  useEffect(() => {
    if (user && restaurant) {
      checkFavorite();
    }
  }, [user, restaurant, checkFavorite]);

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: t('restaurant.signin_required'),
        description: t('restaurant.signin_favorites'),
        variant: "destructive",
      });
      return;
    }

    if (!restaurant) return;

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurant.id);
      setFavorite(false);
      toast({ title: t('restaurant.removed_favorites') });
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        restaurant_id: restaurant.id,
      });
      setFavorite(true);
      toast({ title: t('restaurant.added_favorites') });
    }
  };

  const setFavorite = (fav: boolean) => {
    setIsFavorite(fav);
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const openDirections = () => {
    if (restaurant?.latitude && restaurant?.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`,
        "_blank"
      );
    } else if (restaurant?.address) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`,
        "_blank"
      );
    }
  };

  const handleDirectionsClick = () => {
    console.log("Directions clicked", restaurant);
    if (restaurant?.latitude && restaurant?.longitude) {
      console.log("Opening internal map", restaurant.latitude, restaurant.longitude);
      setShowMap(true);
    } else {
      console.log("Opening external maps");
      openDirections();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-black mb-6 tracking-tight">{t('restaurant.not_found')}</h1>
          <Button asChild className="hero-gradient px-8 h-14 rounded-2xl font-bold border-none shadow-2xl shadow-primary/30">
            <Link to="/">{t('category.go_home')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Cinematic Discovery Hero */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0 select-none">
          <img
            src={restaurant.image_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover md:fixed absolute top-0 left-0 -z-10" // Simple parallax via fixed positioning on desktop, absolute on mobile
            style={{ height: '100vh' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-6 relative z-10 pb-24">
          <div className="max-w-4xl animate-reveal">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-fit px-6 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] mb-8 group"
            >
              <Link to="/">
                <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {t('restaurant.back')}
              </Link>
            </Button>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="place-badge bg-primary text-white border-primary">{t('restaurant.featured.badge')}</span>
                {restaurant.address && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold tracking-wide">
                    <MapPin className="w-3.5 h-3.5" />
                    {restaurant.address}
                  </div>
                )}
              </div>

              {/* Mobile Optimized Hero Title */}
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-display font-medium tracking-tight leading-[0.9] text-white drop-shadow-2xl">
                {restaurant.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="lg" />
                  <span className="text-xl font-bold text-white ml-2">{avgRating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm font-medium">({reviews.length})</span>
                </div>
                <div className="hidden md:block w-px h-8 bg-white/20" />
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold tracking-tight">{restaurant.opening_hours || t('restaurant.default_hours')}</span>
                </div>


              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Navigation & Actions */}
      <div className="sticky top-0 z-40 bg-background backdrop-blur-xl border-b border-white/5 transition-all duration-500">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-12 w-full md:w-auto justify-start md:justify-center gap-2 p-1 bg-secondary/30 rounded-full border border-white/5">
              {["menu", "about", "reviews"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full px-5 h-10 text-[10px] md:text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all hover:bg-white/5 flex-shrink-0"
                >
                  {t(`restaurant.tab.${tab}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="hidden md:flex items-center gap-4">
            <Button
              size="icon"
              onClick={toggleFavorite}
              variant="outline"
              className={cn(
                "rounded-full w-12 h-12 border-white/10 transition-all",
                isFavorite ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30" : "bg-secondary/40 hover:bg-secondary/60"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </Button>

            <Button
              size="lg"
              onClick={handleDirectionsClick}
              className="pill-button hero-gradient h-12 px-8 text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {t('restaurant.directions')}
            </Button>

            <Dialog open={showMap} onOpenChange={setShowMap}>
              <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 pb-2 absolute top-0 left-0 z-50 w-full bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                  <DialogTitle className="text-white drop-shadow-md text-xl font-bold flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    {t('restaurant.location.title', { name: restaurant.name })}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 w-full h-full relative">
                  {(restaurant.latitude && restaurant.longitude) ? (
                    <MapComponent
                      restaurants={[restaurant]}
                      userLocation={userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : null}
                      centerOn={[restaurant.latitude, restaurant.longitude]}
                      defaultZoom={15}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      <p className="text-muted-foreground">{t('restaurant.location.unavailable')}</p>
                    </div>
                  )}

                  {/* Google Maps Button Overlay */}
                  <div className="absolute bottom-6 right-6 z-[400]">
                    <Button
                      onClick={openDirections}
                      className="shadow-xl shadow-black/20 font-bold bg-white text-black hover:bg-gray-100 border border-gray-200"
                    >
                      {t('restaurant.gmaps')}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <section className="py-12 md:py-24 bg-background relative pb-32 md:pb-24 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            <div className="lg:col-span-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="menu" className="mt-0 animate-reveal">
                  <div className="space-y-8 md:space-y-12">
                    <div className="space-y-4 text-center md:text-left">
                      <h3 className="text-3xl md:text-4xl font-display font-medium text-foreground">{t('restaurant.tab.menu')}</h3>
                      <p className="text-muted-foreground font-light text-base md:text-lg leading-relaxed italic">
                        Curated culinary experiences prepared with passion.
                      </p>
                    </div>
                    {/* Menu Section */}
                    <div className="flex flex-col space-y-8">
                      <MenuSection items={menuItems} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="about" className="mt-0 animate-reveal">
                  <div className="space-y-8 md:space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-3xl md:text-4xl font-display font-medium">
                        {t('restaurant.about.title')}
                      </h3>
                      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                        {restaurant.description || t('restaurant.about.no_desc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                      <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-secondary/20 p-6 md:p-10 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 flex items-center justify-center text-primary rounded-2xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                          <MapPin className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg md:text-xl font-display font-medium">{t('restaurant.location')}</h4>
                          <p className="text-muted-foreground font-light leading-relaxed text-sm md:text-base">
                            {restaurant.address || t('restaurant.no_address')}
                          </p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-secondary/20 p-6 md:p-10 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 flex items-center justify-center text-indigo-400 rounded-2xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                          <Phone className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg md:text-xl font-display font-medium">{t('restaurant.contact')}</h4>
                          <p className="text-muted-foreground font-light leading-relaxed text-sm md:text-base">
                            {restaurant.phone || t('restaurant.no_phone')}
                          </p>

                          {/* Social Media Links in Contact Card */}
                          {(restaurant.tiktok_url || restaurant.facebook_url || restaurant.instagram_url) && (
                            <div className="flex items-center gap-3 pt-4 border-t border-white/5 mt-4">
                              {restaurant.tiktok_url && (
                                <a
                                  href={restaurant.tiktok_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-black hover:bg-black/80 text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
                                  aria-label="TikTok"
                                >
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                  </svg>
                                </a>
                              )}
                              {restaurant.facebook_url && (
                                <a
                                  href={restaurant.facebook_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
                                  aria-label="Facebook"
                                >
                                  <Facebook className="w-5 h-5 fill-current" />
                                </a>
                              )}
                              {restaurant.instagram_url && (
                                <a
                                  href={restaurant.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
                                  aria-label="Instagram"
                                >
                                  <Instagram className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-0 animate-reveal">
                  <div className="space-y-8 md:space-y-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <h3 className="text-3xl md:text-4xl font-display font-medium">{t('restaurant.tab.reviews')}</h3>
                      <div className="flex items-center gap-3 font-bold text-primary bg-primary/5 px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-primary/10 w-full md:w-auto justify-between md:justify-start">
                        <span className="text-3xl md:text-4xl font-display">{avgRating.toFixed(1)}</span>
                        <div className="flex flex-col">
                          <div className="flex"><StarRating rating={5} size="sm" /></div>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{reviews.length} {t('restaurant.verified_reviews')}</span>
                        </div>
                      </div>
                    </div>

                    {user ? (
                      <div className="rounded-3xl p-8 md:p-12 border border-white/5 bg-secondary/20 backdrop-blur-sm shadow-xl">
                        <ReviewForm
                          restaurantId={restaurant.id}
                          onReviewSubmitted={() => fetchReviews(restaurant.id)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-3xl p-12 text-center flex flex-col items-center bg-secondary/20 border border-white/5 backdrop-blur-sm">
                        <p className="text-lg font-medium text-muted-foreground mb-8 max-w-sm">
                          {t('restaurant.signin_review')}
                        </p>
                        <Button asChild className="pill-button bg-blue-600 hover:bg-blue-700 transition-colors px-10 h-14 font-bold text-white hover:scale-105">
                          <Link to="/auth">{t('nav.signin')}</Link>
                        </Button>
                      </div>
                    )}

                    <div className="space-y-8">
                      {reviews.length > 0 ? (
                        reviews.map((review, idx) => (
                          <div key={review.id} className="animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <ReviewCard
                              reviewId={review.id}
                              userId={review.user_id}
                              currentUserId={user?.id}
                              userName={review.profiles?.full_name || "Food Explorer"}
                              userAvatar={review.profiles && 'avatar_url' in review.profiles ? (review.profiles as any).avatar_url : null}
                              rating={review.rating}
                              comment={review.comment || undefined}
                              createdAt={review.created_at}
                              photos={review.review_photos?.map(p => p.photo_url)}
                              onDelete={() => fetchReviews(restaurant.id)}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-24 rounded-3xl bg-secondary/10 border-dashed border-white/10">
                          <Clock className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-6" />
                          <p className="text-xl font-medium text-muted-foreground tracking-tight">{t('restaurant.no_reviews')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-4 block">
              <div className="sticky top-32 space-y-8">
                <div className="rounded-3xl p-8 bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <h4 className="text-2xl font-display font-medium mb-8">
                    {t('restaurant.info_hours')}
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-all group-hover:scale-110">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block">{t('restaurant.opening_hours_label')}</span>
                        <span className="font-bold tracking-tight text-lg">{restaurant.opening_hours || t('restaurant.default_hours')}</span>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/5" />
                    <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 transition-all group-hover:scale-110">
                        <Navigation className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block">{t('restaurant.status')}</span>
                        <span className="font-bold tracking-tight text-emerald-500 flex items-center gap-2">
                          {t('restaurant.open_now')} <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-white/10 p-4 pb-6 safe-area-bottom">
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={toggleFavorite}
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-white/10 shrink-0",
              isFavorite ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30" : "bg-black/40 text-white hover:bg-white/10"
            )}
          >
            <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
          </Button>
          <Button
            size="lg"
            onClick={handleDirectionsClick}
            className="flex-1 rounded-full h-14 font-black uppercase tracking-widest text-xs pill-button hero-gradient shadow-lg shadow-primary/20 text-white"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t('restaurant.directions')}
          </Button>

        </div>
      </div>
    </Layout>
  );
};

export default RestaurantPage;
