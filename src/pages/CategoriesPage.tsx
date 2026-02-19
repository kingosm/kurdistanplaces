import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { CategoryCard } from "@/components/restaurants/CategoryCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditableText } from "@/components/cms/EditableText";
import { SortablePage } from "@/components/cms/SortablePage";
import { SortableSection } from "@/components/cms/SortableSection";
import { useEditMode } from "@/contexts/EditModeContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  restaurant_count?: number;
}

const DEFAULT_ORDER = ["header", "grid"];

const CategoriesPage = () => {
  const { t, translateCategoryName } = useLanguage();
  const { sectionOrders } = useEditMode();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await (supabase as any)
        .from("categories")
        .select("*")
        .eq("category_type", "province")
        .order("sort_order", { ascending: true })
        .order("name");

      if (error) throw error;

      if (categoriesData && categoriesData.length > 0) {
        // Fetch all visible restaurants (just IDs and category_ids) to count them
        const { data: allRestaurants, error: restError } = await (supabase as any)
          .from("restaurants")
          .select("id, category_id")
          .eq("is_visible", true);

        if (restError) throw restError;

        // Count restaurants per category
        const counts: Record<string, number> = {};
        if (allRestaurants) {
          allRestaurants.forEach((r: any) => {
            if (r.category_id) {
              counts[r.category_id] = (counts[r.category_id] || 0) + 1;
            }
          });
        }

        const results = categoriesData.map((category: any) => ({
          ...category,
          restaurant_count: counts[category.id] || 0
        }));

        setCategories(results);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error in fetchCategories:", err);
      // Fallback to empty if critical error
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const order = sectionOrders["categories"] ?? DEFAULT_ORDER;

  const sections: Record<string, JSX.Element> = {
    header: (
      <SortableSection key="header" id="header">
        <div className="mb-20 animate-reveal">
          <div className="place-badge mb-6">
            <EditableText contentKey="categories.badge.premium" fallback={t('categories.badge.premium')} />
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-6 tracking-tighter leading-none">
            <EditableText contentKey="categories.explore_provinces" fallback={t('categories.explore_provinces')} as="span" />
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
            <EditableText contentKey="categories.select_province" fallback={t('categories.select_province')} as="span" />
          </p>
        </div>
      </SortableSection>
    ),
    grid: (
      <SortableSection key="grid" id="grid">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[16/9] rounded-[3rem] bg-secondary/50 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {categories.map((category, idx) => (
              <div key={category.id} className="animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CategoryCard
                  name={translateCategoryName(category.name)}
                  slug={category.slug}
                  description={category.description || undefined}
                  imageUrl={category.image_url || undefined}
                  restaurantCount={category.restaurant_count}
                  className="h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 glass-card rounded-[4rem] border-white/5 max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-black mb-2">{t('categories.no_provinces')}</h3>
            <p className="text-muted-foreground mb-8">{t('categories.no_provinces_desc')}</p>
            <Button asChild>
              <Link to="/admin">{t('categories.go_admin')}</Link>
            </Button>
          </div>
        )}
      </SortableSection>
    ),
  };

  return (
    <Layout>
      <section className="pt-40 pb-24 bg-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="container mx-auto px-6 relative z-10">
          <SortablePage page="categories" defaultOrder={DEFAULT_ORDER}>
            {order.map((id) => sections[id]).filter(Boolean)}
          </SortablePage>
        </div>
      </section>
    </Layout>
  );
};


export default CategoriesPage;
