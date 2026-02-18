import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EditableText } from "@/components/cms/EditableText";
import { EditableImage } from "@/components/cms/EditableImage";

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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

    // Optional: Subscribe to changes for real-time updates (simplified for now to just fetch on mount which is efficient)
    // For true "live" updates we would use supabase.channel, but count queries on large tables via realtime can be heavy.
    // Fetching on mount ensures accurate numbers every visit.
  }, []);

  // Format count:
  // - < 50: Round up to nearest 5 (e.g. 3->5, 19->20)
  // - >= 50: Round up to nearest 50 (e.g. 49->50, 90->100)
  // - >= 1000: Use 'k' formatting (e.g. 1.2k)
  const formatCount = (count: number) => {
    if (count === 0) return "0";

    // Tier 1: Small numbers (< 50) -> Round up to nearest 5
    if (count < 50) {
      return (Math.ceil(count / 5) * 5).toString();
    }

    // Tier 2: Large numbers (>= 50) -> Round up to nearest 50
    const rounded = Math.ceil(count / 50) * 50;

    // Format thousands
    if (rounded >= 1000) {
      return (rounded / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }

    return rounded.toString();
  };



  return (
    <Layout>
      {/* Discovery Hero */}
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
              <span className="place-badge mx-auto block mb-6">
                <EditableText contentKey="hero.badge" fallback={t('hero.badge')} />
              </span>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[1.1] md:leading-[1.1] pt-4 pb-4">
                <EditableText contentKey="hero.title" fallback={t('hero.title')} as="span" />
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed pt-2">
                <EditableText contentKey="hero.desc.premium" fallback={t('hero.desc.premium')} as="span" />
              </p>
            </div>

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
          </div>
        </div>
      </section>



      {/* Modern CTA */}
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
    </Layout >
  );
};

export default Index;
