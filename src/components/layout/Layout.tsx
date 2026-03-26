import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className={cn(
      "min-h-screen flex flex-col selection:bg-primary/30",
      isHome ? "bg-transparent" : "bg-background"
    )}>
      <Header />
      <main className="flex-1 transition-all duration-500 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

