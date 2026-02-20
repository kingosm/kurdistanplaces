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
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/cms/EditableText";
import { EditableBlock } from "@/components/cms/EditableBlock";
import { SortableNavLinks } from "@/components/cms/SortableNavLinks";

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
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out",
      isScrolled
        ? "py-3 bg-background/60 backdrop-blur-3xl border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
        : "py-8 bg-transparent"
    )}>
      {/* Force LTR container to keep logo left and buttons right regardless of language */}
      <div className="container mx-auto px-4 md:px-8" dir="ltr">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Icon - Far Left */}
          <EditableBlock id="header_logo" page="__global__">
            <div className="flex items-center">
              <Link
                to="/"
                className="w-11 h-11 md:w-14 md:h-14 bg-primary flex items-center justify-center rounded-xl md:rounded-2xl shadow-lg shadow-primary/20 transition-all duration-500 hover:scale-105 shrink-0"
              >
                <MapPin className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </Link>
            </div>
          </EditableBlock>

          {/* Centered Word & Desktop Nav */}
          {/* Centered Word & Desktop Nav */}
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-12 py-1">
            <EditableBlock id="header_nav" page="__global__">
              <Link to="/" className="group shrink-0">
                <h1 className="text-xl md:text-3xl font-display font-black tracking-tighter text-foreground transition-colors group-hover:text-primary flex items-center leading-tight">
                  <EditableText contentKey="header.logo.main" fallback="KURDISTAN" className="inline" /><span className="text-primary"><EditableText contentKey="header.logo.accent" fallback="PLACES" className="inline" /></span>
                </h1>
              </Link>
            </EditableBlock>

            {/* Desktop Navigation — drag to reorder in Layout Edit mode */}
            <EditableBlock id="header_links" page="__global__">
              <nav className="hidden lg:flex items-center gap-4 md:gap-8 lg:gap-12">
                <SortableNavLinks />
              </nav>
            </EditableBlock>
          </div>

          {/* User Actions - Far Right */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
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
              <Button asChild className="hidden lg:flex pill-button hero-gradient px-8 min-h-[2.75rem] h-auto py-2.5 text-background leading-normal">
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

