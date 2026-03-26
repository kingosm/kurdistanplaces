import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EditableText } from "@/components/cms/EditableText";
import { EditableImage } from "@/components/cms/EditableImage";
import { EditableBlock } from "@/components/cms/EditableBlock";
import { SortablePage } from "@/components/cms/SortablePage";
import { SortableSection } from "@/components/cms/SortableSection";
import { useEditMode } from "@/contexts/EditModeContext";
import { AdSlider, Ad } from "@/components/ads/AdSlider";

const DEFAULT_ORDER = ["hero", "cta"];

const mockAds: Ad[] = [
  {
    id: "ad-1",
    type: "image",
    url: "https://images.unsplash.com/photo-1590490359854-dfba19688d70?auto=format&fit=crop&w=1600&q=80",
    alt: "Authentic Kurdish Cuisine"
  },
  {
    id: "ad-2",
    type: "image",
    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80",
    alt: "Breathtaking Nature"
  },
  {
    id: "ad-3",
    type: "image",
    url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1600&q=80",
    alt: "Modern Erbil Infrastructure"
  }
];

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { sectionOrders } = useEditMode();

  const [stats, setStats] = useState({ places: 0, community: 0 });
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: placesCount } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        const { count: communityCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          places: placesCount || 0,
          community: communityCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const formatCount = (count: number) => {
    if (count === 0) return "0";
    if (count < 50) return (Math.ceil(count / 5) * 5).toString();
    const rounded = Math.ceil(count / 50) * 50;
    if (rounded >= 1000) return (rounded / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return rounded.toString();
  };

  const order = sectionOrders["index"] ?? DEFAULT_ORDER;

  const sections: Record<string, JSX.Element> = {
    hero: (
      <SortableSection key="hero" id="hero">
        <section className="relative min-h-[70vh] md:h-[85vh] flex flex-col items-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-black">
            <EditableImage
              contentKey="hero.image"
              fallback="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80"
              alt="Hero background"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-black/40" />
          </div>

          <div className="w-full max-w-6xl mt-4 md:mt-20 px-0 md:px-6 relative z-10 transition-all duration-700">
            <AdSlider ads={mockAds} />
          </div>

          <div className="flex-1 container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
            <div className="max-w-4xl mx-auto">
              <EditableBlock id="hero_title" page="index">
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-10 leading-[0.95] text-white drop-shadow-2xl hyphens-none">
                  Discover the Best <br className="hidden md:block" /> Restaurants & Markets
                </h1>
              </EditableBlock>
              
              <EditableBlock id="hero_btn" page="index">
                <Button size="lg" asChild className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-10 py-7 text-lg shadow-xl shadow-primary/30 transition-all hover:scale-105 mt-4">
                  <Link to="/categories">Explore Now</Link>
                </Button>
              </EditableBlock>
            </div>
          </div>
        </section>
      </SortableSection>
    ),
    cta: (
      <SortableSection key="cta" id="cta">
        <section className="py-28 relative overflow-hidden bg-secondary/20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none rtl:leading-[1.4]">
                <EditableText contentKey="index.cta.title.premium" fallback={t('index.cta.title.premium')} as="span" />
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
                <EditableText contentKey="index.cta.desc.premium" fallback={t('index.cta.desc.premium')} as="span" />
              </p>
              <div className="pt-8 flex flex-wrap justify-center gap-6">
                <Button size="lg" asChild className="pill-button hero-gradient min-h-[4rem] h-auto py-4 px-10 text-lg text-white transition-all">
                  <Link to="/categories">Start Exploring Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </SortableSection>
    ),
  };

  return (
    <Layout>
      <SortablePage page="index" defaultOrder={DEFAULT_ORDER}>
        {order.map((id) => sections[id]).filter(Boolean)}
      </SortablePage>
    </Layout>
  );
};

export default Index;
