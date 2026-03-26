import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, User, Menu, X, LogOut, Heart, Settings, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "../LanguageSwitcher";

import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/cms/EditableText";
import { EditableBlock } from "@/components/cms/EditableBlock";
import { SortableNavLinks } from "@/components/cms/SortableNavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoUrl from "@/assets/logo.png";

export function Header() {
  const { t, isRTL } = useLanguage();

  const { user, profile, isAdmin, loading, isPreviewMode } = useUser(); // Use UserContext
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      // Force clear EVERYTHING to ensure no stale data survives
      localStorage.clear();
      // Hard reload to reset memory state
      window.location.href = "/";
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out pt-[env(safe-area-inset-top,0.5rem)]",
      isScrolled
        ? "py-2 bg-background/60 backdrop-blur-3xl border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        : "py-3 md:py-6 bg-transparent"
    )}>
      {/* Force LTR container to keep logo left and buttons right regardless of language */}
      <div className="container mx-auto px-4 md:px-8" dir="ltr">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand Name - Left */}
          <div className="flex items-center gap-2 md:gap-4 h-12 md:h-16">
            <Link
              to="/"
              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-500 hover:scale-105 shrink-0"
            >
              <img src={logoUrl} alt="KurdTrip Logo" className="w-full h-full object-contain drop-shadow-md scale-150" />
            </Link>
            <Link to="/" className="flex shrink-0 translate-y-[2px] md:translate-y-0">
              <h1 className="text-lg md:text-3xl font-display font-black tracking-tight transition-colors flex items-center leading-tight">
                <span className="text-foreground">Kurd</span>{' '}<span className="text-primary italic">Trip</span>
              </h1>
            </Link>
          </div>

          {/* Centered Search Bar (Airbnb Style) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-auto items-center px-4">
            <div 
              onClick={() => navigate('/search')}
              className="flex items-center w-full bg-background border border-border rounded-full pl-6 pr-2 py-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer dark:bg-card"
            >
              <span className="text-sm font-medium text-muted-foreground flex-1 truncate">
                Search restaurants & markets
              </span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground ml-2">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* User Actions - Far Right */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0 h-10 md:h-12">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Show loader while initializing session */}
            {loading ? (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user ? (
              <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl md:rounded-2xl hover:bg-primary/10 transition-colors relative overflow-hidden w-8 h-8 md:w-10 md:h-10">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-xl md:rounded-2xl"
                      />
                    ) : (
                      <User className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card mt-2">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center gap-3 p-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/favorites" className="flex items-center gap-3 p-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="font-medium">{t('nav.favorites')}</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && !isPreviewMode && (
                    <>
                      <DropdownMenuSeparator className="opacity-10" />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/admin" className="flex items-center gap-3 p-2">
                          <Settings className="w-4 h-4 text-amber-500" />
                          <span className="font-medium">{t('nav.admin')}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="opacity-10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer p-2">
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="font-medium">{t('nav.signout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="hidden lg:flex pill-button bg-blue-600 hover:bg-blue-700 px-8 min-h-[2.75rem] h-auto py-2.5 text-white font-bold leading-normal transition-colors">
                <Link to="/auth">{t('nav.signin')}</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl md:rounded-2xl w-8 h-8 md:w-10 md:h-10 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-10 px-6 gourmet-border bg-secondary/95 backdrop-blur-3xl mt-4 animate-reveal shadow-3xl overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
            <nav className="flex flex-col gap-6">
              {[
                { to: '/', key: 'nav.home' },
                { to: '/categories', key: 'nav.categories' },
                { to: '/nearby', key: 'nav.nearby' },
              ].map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="text-lg font-sans font-bold px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <EditableText contentKey={link.key} fallback={t(link.key)} />
                </Link>
              ))}
              {!user && (
                <div className="px-4 pt-6 border-t border-white/5">
                  <Button asChild className="w-full pill-button bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      {t('nav.signin')}
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

