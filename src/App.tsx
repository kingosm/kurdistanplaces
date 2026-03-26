import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { UserProvider } from "./contexts/UserContext";
import { EditModeProvider } from "./contexts/EditModeContext";
import { LayoutEditorProvider } from "./contexts/LayoutEditorContext";
import { AdminToolbar } from "./components/cms/AdminToolbar";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./components/ThemeProvider";

// Lazy load pages for performance
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const RestaurantPage = lazy(() => import("./pages/RestaurantPage"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      retry: 1, // Only retry once to fail fast on slow network
      refetchOnWindowFocus: false, // Don't refetch just because user clicked window
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="kurdtrip-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <LanguageProvider>
        <UserProvider>
          <EditModeProvider>
            <LayoutEditorProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <AdminToolbar />
                <ScrollToTop />
                <Suspense fallback={<div className="min-h-screen bg-background" />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/restaurant/:slug" element={<RestaurantPage />} />
                    <Route path="/nearby" element={<NearbyPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </LayoutEditorProvider>
          </EditModeProvider>
        </UserProvider>
      </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
