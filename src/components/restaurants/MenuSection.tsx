import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChefHat, Flame, Utensils, Coffee } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  image_url?: string | null;
  is_visible: boolean;
}

interface MenuSectionProps {
  items: MenuItem[];
}

export function MenuSection({ items }: MenuSectionProps) {
  // Filter only visible items (redundant but safe)
  const visibleItems = items.filter(i => i.is_visible !== false);

  // Group items by category
  const groupedItems = visibleItems.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(groupedItems).sort((a, b) => {
    // Map categories to priority groups
    const getPriority = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower === 'foods' || lower === 'main course') return 0;
      if (lower === 'salads' || lower === 'starters') return 1;
      if (lower === 'sweets' || lower === 'dessert' || lower === 'desserts') return 2;
      if (lower === 'drinks' || lower === 'beverages') return 3;
      return 999;
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.localeCompare(b);
  });

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower === 'foods' || lower === 'main course') return <ChefHat className="w-6 h-6" />;
    if (lower === 'salads' || lower === 'starters') return <Utensils className="w-6 h-6" />;
    if (lower === 'sweets' || lower === 'dessert') return <Flame className="w-6 h-6" />;
    if (lower === 'drinks') return <Coffee className="w-6 h-6" />;
    return <Utensils className="w-6 h-6" />;
  };

  const formatPrice = (price: number | null | undefined) => {
    try {
      return new Intl.NumberFormat('en-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(price || 0);
    } catch (e) {
      return `IQD ${price || 0}`;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground italic font-serif">
        <p>No menu items available securely.</p>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {categories.map((category) => (
        <div key={category} className="space-y-10">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-primary/5 rounded-full text-primary">
              {getCategoryIcon(category)}
            </div>
            <h4 className="text-3xl md:text-4xl font-serif font-medium text-center relative">
              <span className="relative z-10 px-6 bg-background">{category}</span>
              <div className="absolute top-1/2 left-0 w-full h-px bg-border -z-0" />
            </h4>
          </div>

          <div className="grid gap-x-12 gap-y-8 md:gap-y-12">
            {groupedItems[category].map((item) => (
              <div
                key={item.id}
                className="group relative flex gap-4 md:gap-6 p-4 rounded-xl hover:bg-muted/30 transition-all duration-300 border border-transparent hover:border-border/40"
              >
                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <h5 className="font-display text-xl font-medium tracking-wide text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </h5>

                    {/* Dotted Leader */}
                    <div className="flex-1 h-px border-b border-dotted border-muted-foreground/30 mx-2" />

                    <span className="font-semibold text-lg text-primary whitespace-nowrap tabular-nums">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed font-light italic opacity-90 max-w-[90%]">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Image - Visible on all screens */}
                {item.image_url && (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
