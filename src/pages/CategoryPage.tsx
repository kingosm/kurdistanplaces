import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { CategoryCard } from "@/components/restaurants/CategoryCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Navigation, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/use-location";

// ... (keep interfaces)
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category_type?: 'standard' | 'province' | 'vertical' | 'district';
  parent_id?: string | null;
  restaurant_count?: number;
}

interface Restaurant {
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
}


const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, translateCategoryName } = useLanguage();
  const { userLocation, isLoadingLocation, locationError, requestLocation, calculateDistance } = useLocation();
  const [category, setCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);


  const fetchCategoryAndRestaurants = useCallback(async () => {
    setIsLoading(true);

    const { data: categoryData } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (categoryData) {
      const typedCategory = categoryData as Category;
      setCategory(typedCategory);

      // Fetch Sub-categories if Province, District or Vertical
      if (typedCategory.category_type === 'province' || typedCategory.category_type === 'district' || typedCategory.category_type === 'vertical') {
        const { data: subs } = await (supabase as any)
          .from("categories")
          .select("*")
          .eq("parent_id", typedCategory.id)
          .order("sort_order", { ascending: true })
          .order("name");

        if (subs) {
          const subsData = subs as any[];
          const subResults: Category[] = [];

          for (const sub of subsData) {
            const { count } = await (supabase as any)
              .from("restaurants")
              .select("*", { count: "exact", head: true })
              .eq("category_id", sub.id)
              .eq("is_visible", true);
            subResults.push({ ...sub, restaurant_count: count || 0 });
          }
          setSubCategories(subResults);
        }
      }

      // Fetch Parent for breadcrumbs (applies to Vertical and Kind)
      if (typedCategory.parent_id) {
        const { data: parentData } = await supabase
          .from("categories")
          .select("*")
          .eq("id", typedCategory.parent_id)
          .single();
        if (parentData) setParentCategory(parentData as Category);
      }

      // Fetch Restaurants for Leaf Categories (Standard) AND Vertical (Hybrid)
      if (typedCategory.category_type !== 'province' && typedCategory.category_type !== 'district') {
        const { data: restaurantsData } = await (supabase as any)
          .from("restaurants")
          .select("*")
          .eq("category_id", typedCategory.id)
          .eq("is_visible", true);

        if (restaurantsData) {
          const rawRestaurants = restaurantsData as any[];
          const results: Restaurant[] = [];

          for (const restaurant of rawRestaurants) {
            const { data: reviews } = await (supabase as any)
              .from("reviews")
              .select("rating")
              .eq("restaurant_id", restaurant.id);

            const reviewCount = reviews?.length || 0;
            const avgRating =
              reviewCount > 0
                ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
                : 0;

            results.push({ ...restaurant, avg_rating: avgRating, review_count: reviewCount });
          }
          setRestaurants(results);
        }
      } else {
        setRestaurants([]);
      }
    }

    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndRestaurants();
    }
  }, [slug, fetchCategoryAndRestaurants]);


  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!category) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-black mb-6 tracking-tight">{t('category.not_found')}</h1>
          <Button asChild className="hero-gradient px-8 h-14 rounded-2xl font-bold border-none shadow-2xl shadow-primary/30">
            <Link to="/">{t('category.go_home')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center pt-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s]"
          style={{
            backgroundImage: `url('${category.image_url || "/placeholder.svg"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background" />

        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center animate-reveal">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-fit mb-8 px-6 h-10 rounded-full bg-secondary/80 backdrop-blur-md border border-white/10 text-foreground hover:bg-primary hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Link to={parentCategory ? `/category/${parentCategory.slug}` : "/"}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('category.back')} {parentCategory ? `to ${translateCategoryName(parentCategory.name)}` : ""}
            </Link>
          </Button>

          <div className="place-badge mb-4">
            Discovery Mode
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-4 leading-[1.2] tracking-tighter pt-2 pb-2">
            {translateCategoryName(category.name)}
          </h1>
          {category.description && (
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Sub-categories Grid (Province or Vertical or District) */}
      {(category.category_type === 'province' || category.category_type === 'vertical' || category.category_type === 'district') && (
        <section className="py-24 bg-background overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />
          <div className="container mx-auto px-6">
            <div className="mb-16 animate-reveal">
              <span className="place-badge mb-4">
                {category.category_type === 'province' ? "Select a District" : category.category_type === 'district' ? "Select a Category" : "Select a Type"}
              </span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Explore {translateCategoryName(category.name)}</h2>
            </div>

            {subCategories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-12">
                {subCategories.map((sub, idx) => (
                  <div key={sub.id} className="animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CategoryCard
                      name={translateCategoryName(sub.name)}
                      slug={sub.slug}
                      description={sub.description || undefined}
                      imageUrl={sub.image_url || undefined}
                      restaurantCount={sub.restaurant_count}
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Restaurants Grid (Leaf/Standard/Vertical Categories) */}
      {category.category_type !== 'province' && category.category_type !== 'district' && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 border-b border-border/50 pb-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                  {restaurants.length}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">
                    {restaurants.length === 1 ? t('category.found_one') : t('category.found_many').replace('{{count}}', restaurants.length.toString())}
                  </h2>
                  {parentCategory && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">in</span>
                      <Link
                        to={`/category/${parentCategory.slug}`}
                        className="text-sm font-bold text-primary hover:underline"
                      >
                        {parentCategory.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* District Search Bar */}
            <div className="relative w-full md:w-96 group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative flex items-center bg-secondary/50 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
                <Search className="w-5 h-5 ml-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${t('category.search_in')} ${category.name}...`}
                  className="bg-transparent border-none outline-none flex-1 px-4 py-3 font-medium placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!userLocation && !isLoadingLocation && (
                <Button onClick={() => requestLocation()} variant="outline" className="pill-button h-12 border-primary/20 text-primary hover:bg-primary/5">
                  <Navigation className="w-4 h-4 mr-2" />
                  {t('nearby.enable')}
                </Button>
              )}
              {isLoadingLocation && (
                <div className="flex items-center gap-2 text-primary font-medium bg-primary/5 px-6 h-12 rounded-full">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">{t('nearby.finding')}</span>
                </div>
              )}
            </div>

            {filteredRestaurants.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredRestaurants
                  .map(r => ({
                    ...r,
                    distance: userLocation && r.latitude && r.longitude
                      ? calculateDistance(userLocation.lat, userLocation.lon, Number(r.latitude), Number(r.longitude))
                      : undefined
                  }))
                  .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
                  .map((restaurant, idx) => (
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
            )}
          </div>
        </section>
      )}
    </Layout>
  );
};


export default CategoryPage;
