import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "@/hooks/use-location";
import { Utensils, ShoppingBag, Wrench, Smartphone } from "lucide-react";

// Redundant calculateDistance removed (now in useLocation hook)

// Redundant calculateDistance removed (now in useLocation hook)

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userLocation, isLoadingLocation, locationError, requestLocation, calculateDistance } = useLocation();

  const heroImages = [
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800", // Kurdish Stew
    "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800", // Dolma
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800", // Grilled Meat
  ];

  // Restaurant fetching and search results logic removed to enforce hierarchy

  return (
    <Layout>
      {/* Discovery Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1623864190822-487053e1673b?w=1920"
            alt=""
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto space-y-12 animate-reveal text-center">
            <div className="space-y-6">
              <span className="place-badge mx-auto">{t('hero.badge')}</span>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8">
                {t('hero.title.part1')} <br />
                <span className="text-primary">{t('hero.title.part2')}</span>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                {t('hero.desc.premium')}
              </p>
            </div>

            {/* Search Bar removed to enforce hierarchical selection via Provinces */}

            <div className="pt-8 flex justify-center gap-12 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex flex-col gap-1 items-center">
                <span className="text-foreground text-3xl font-black">500+</span>
                <span>{t('hero.collections')}</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col gap-1 items-center">
                <span className="text-foreground text-3xl font-black">20k+</span>
                <span>{t('hero.stats.diners')}</span>
              </div>
            </div>
            {/* Version Marker */}
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground opacity-50">v1.1</div>
          </div>
        </div>
      </section>



      {/* Modern CTA */}
      <section className="py-24 relative overflow-hidden bg-secondary/20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              {t('index.cta.title.premium')}
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
              {t('index.cta.desc.premium')}
            </p>
            <div className="pt-8 flex flex-wrap justify-center gap-6">
              <Button size="lg" asChild className="pill-button hero-gradient h-16 px-10 text-lg text-white transition-all">
                <Link to="/categories">Start Exploring Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout >
  );
};

export default Index;
