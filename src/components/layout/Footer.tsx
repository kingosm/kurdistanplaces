
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EditableText } from "@/components/cms/EditableText";
import { EditableBlock } from "@/components/cms/EditableBlock";
import logoUrl from "@/assets/logo.png";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-background border-t border-border/40 mt-auto overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-y-0 right-0 w-1/3 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
          {/* Brand Column */}
          <EditableBlock id="footer_brand" page="__global__">
            <div className="space-y-6">
              <Link to="/" className="inline-block group">
                <div className="flex items-center gap-3 mb-2">
                  <Link to="/" className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-500 hover:scale-105 shrink-0">
                    <img src={logoUrl} alt="KurdTrip Logo" className="w-full h-full object-contain drop-shadow-md" />
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tighter flex items-center leading-tight">
                      <span className="text-white">Kurd</span><span className="text-blue-500">Trip</span>
                    </span>
                  <span className="text-[10px] uppercase tracking-[0.4em] font-black text-primary opacity-70">
                    <EditableText contentKey="footer.global_discovery" fallback={t('footer.global_discovery')} />
                  </span>
                  </div>
                </div>
              </Link>
              <p className="text-muted-foreground leading-relaxed max-w-sm font-medium">
                <EditableText contentKey="footer.description" fallback={t('footer.description')} as="span" />
              </p>
              <div className="flex gap-4 pt-2">
                {[Instagram, Twitter, Facebook].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </EditableBlock>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-black mb-8 uppercase tracking-[0.3em] text-primary">
              <EditableText contentKey="footer.nav.title" fallback={t('footer.nav.title')} />
            </h4>
            <nav className="flex flex-col gap-6">
              {[
                { to: '/', key: 'footer.nav.home' },
                { to: '/categories', key: 'footer.nav.categories' },
                { to: '/nearby', key: 'footer.nav.nearby' },
                { to: '#', key: 'footer.nav.partner' },
              ].map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="text-lg font-bold text-muted-foreground hover:text-foreground transition-all hover:translate-x-2"
                >
                  <EditableText contentKey={link.key} fallback={t(link.key)} />
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <EditableBlock id="footer_contact" page="__global__">
            <div className="space-y-8">
              <h4 className="text-xs font-black mb-8 uppercase tracking-[0.3em] text-primary">
                <EditableText contentKey="footer.contact.title" fallback={t('footer.contact.title')} />
              </h4>
              <div className="space-y-6">
                <a href="mailto:hello@kurdtrip.com" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      <EditableText contentKey="footer.contact.email" fallback={t('footer.contact.email')} />
                    </span>
                    <span className="text-foreground font-bold group-hover:text-primary transition-colors">
                      <EditableText contentKey="footer.email_value" fallback="hello@kurdtrip.com" />
                    </span>
                  </div>
                </a>
                <a href="tel:+9647500000000" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      <EditableText contentKey="footer.contact.phone" fallback={t('footer.contact.phone')} />
                    </span>
                    <span className="text-foreground font-bold group-hover:text-primary transition-colors">
                      <EditableText contentKey="footer.phone_value" fallback="+964 750 000 0000" />
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </EditableBlock>

        </div>

        <div className="mt-20 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-8">
            {[t('footer.privacy'), t('footer.terms'), t('footer.safety')].map((item, i) => (
              <a key={i} href="#" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
