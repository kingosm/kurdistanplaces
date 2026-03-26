
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 max-w-5xl mx-auto">
          {/* Brand Column */}
          <EditableBlock id="footer_brand" page="__global__">
            <div className="space-y-6">
              <Link to="/" className="inline-block group">
                <div className="flex items-center gap-3 mb-2">
                  <Link to="/" className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center transition-all duration-500 hover:scale-105 shrink-0">
                    <img src={logoUrl} alt="KurdTrip Logo" className="w-full h-full object-contain drop-shadow-md" />
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-5xl md:text-6xl font-black tracking-tighter flex items-center leading-tight uppercase">
                      <span className="text-foreground">Kurd</span><span className="text-primary italic">Trip</span>
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
                {[
                  { Icon: Instagram, href: "#" },
                  { 
                    Icon: () => (
                      <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path>
                      </svg>
                    ), 
                    href: "#" 
                  },
                  { Icon: Facebook, href: "#" }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <social.Icon />
                  </a>
                ))}
              </div>
            </div>
          </EditableBlock>



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
