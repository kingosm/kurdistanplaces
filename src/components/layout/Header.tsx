import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, User, Menu, X, LogOut, Heart, Settings } from "lucide-react";
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
import { useUser } from "@/contexts/UserContext"; // Import useUser
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useLanguage();

  const { user, profile, isAdmin, loading } = useUser(); // Use UserContext
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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out",
      isScrolled
        ? "py-3 bg-background/60 backdrop-blur-3xl border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        : "py-8 bg-transparent"
    )}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 md:gap-4 group">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-primary flex items-center justify-center rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 transition-all duration-500 group-hover:scale-105">
              <MapPin className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-3xl font-black tracking-tighter text-foreground transition-colors group-hover:text-primary leading-none whitespace-nowrap">
                KURDISTAN<span className="text-primary">PLACES</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 md:gap-8 lg:gap-12">
            <Link
              to="/"
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground hover:text-primary transition-all whitespace-nowrap"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/categories"
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground hover:text-primary transition-all whitespace-nowrap"
            >
              {t('nav.categories')}
            </Link>
            <Link
              to="/nearby"
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-muted-foreground hover:text-primary transition-all whitespace-nowrap"
            >
              {t('nav.nearby')}
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <LanguageSwitcher />

            {/* Show loader while initializing session */}
            {loading ? (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user ? (
              <DropdownMenu>
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
                  {isAdmin && (
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
              <Button asChild className="hidden lg:flex pill-button hero-gradient px-8 text-background">
                <Link to="/auth">{t('nav.signin')}</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl md:rounded-2xl w-8 h-8 md:w-10 md:h-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-10 px-6 gourmet-border bg-secondary/95 backdrop-blur-3xl mt-4 animate-reveal shadow-3xl overflow-hidden">
            <nav className="flex flex-col gap-6">
              <Link
                to="/"
                className="text-lg font-bold px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/categories"
                className="text-lg font-bold px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.categories')}
              </Link>
              <Link
                to="/nearby"
                className="text-lg font-bold px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.nearby')}
              </Link>
              {!user && (
                <div className="px-4 pt-6 border-t border-white/5">
                  <Button asChild className="w-full pill-button hero-gradient text-background">
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

