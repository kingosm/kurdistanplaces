import { Link, useLocation } from "react-router-dom";
import { Home, Compass, MapPin, Heart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";

export function BottomNav() {
  const { t } = useLanguage();
  const { user } = useUser();
  const location = useLocation();

  const NAV_ITEMS = [
    { icon: Home, label: t('nav.home'), path: "/" },
    { icon: Compass, label: t('nav.categories'), path: "/categories" },
    { icon: MapPin, label: "Map", path: "/nearby" },
    { icon: Heart, label: t('nav.favorites'), path: "/favorites", requiresAuth: true },
    { icon: User, label: t('nav.profile'), path: user ? "/profile" : "/auth" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border px-6 py-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:bg-card/90">
      <nav className="flex items-center justify-between">
        {NAV_ITEMS.map((item, idx) => {
          if (item.requiresAuth && !user) return null;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 p-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? "fill-primary/20 scale-110" : "scale-100"}`} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-70"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
