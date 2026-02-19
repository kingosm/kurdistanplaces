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

const DEFAULT_ORDER = ["hero", "cta"];

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { sectionOrders } = useEditMode();

  const [stats, setStats] = useState({ places: 0, community: 0 });

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
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
            <EditableImage
              contentKey="hero.image"
              fallback="https://images.unsplash.com/photo-1623864190822-487053e1673b?w=1280"
              alt="Hero background"
              className="w-full h-full opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="mb-12">
                <EditableBlock id="hero_badge" page="index">
                  <span className="place-badge mx-auto block mb-6">
                    <EditableText contentKey="hero.badge" fallback={t('hero.badge')} />
                  </span>
                </EditableBlock>
                <EditableBlock id="hero_title" page="index">
                  <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[1.1] md:leading-[1.1] pt-4 pb-4">
                    <EditableText contentKey="hero.title" fallback={t('hero.title')} as="span" />
                  </h1>
                </EditableBlock>
                <EditableBlock id="hero_desc" page="index">
                  <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed pt-2">
                    <EditableText contentKey="hero.desc.premium" fallback={t('hero.desc.premium')} as="span" />
                  </p>
                </EditableBlock>
              </div>

              <EditableBlock id="hero_stats" page="index">
                <div className="pt-8 flex justify-center gap-12 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-foreground text-3xl font-black">{formatCount(stats.places)}+</span>
                    <span><EditableText contentKey="hero.collections" fallback={t('hero.collections')} /></span>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-foreground text-3xl font-black">{formatCount(stats.community)}+</span>
                    <span><EditableText contentKey="hero.stats.diners" fallback={t('hero.stats.diners')} /></span>
                  </div>
                </div>
              </EditableBlock>
            </div>
          </div>
        </section>
      </SortableSection>
    ),

    cta: (
      <SortableSection key="cta" id="cta">
        <section className="py-24 relative overflow-hidden bg-secondary/20">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
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
