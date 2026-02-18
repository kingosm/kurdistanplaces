import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Loader2, Plus, Utensils, Eye, EyeOff, RefreshCw, Users as UsersIcon, X, Check, ChevronDown, ChevronRight, MapPin } from "lucide-react";


import { CreateCategoryDialog } from "@/components/admin/CreateCategoryDialog";
import { MenuManagementDialog } from "@/components/admin/MenuManagementDialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { cn } from "@/lib/utils";

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    address: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    category_id: string | null;
    is_visible: boolean;
    opening_hours: string | null;
    tiktok_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    category_type?: 'standard' | 'province' | 'district' | 'vertical';
    parent_id?: string | null;
}

interface MenuItem {
    id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    price: number | null;
    image_url: string | null;
    category: string | null;
    is_visible: boolean;
}

interface Review {
    id: string;
    restaurant_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    restaurants?: {
        name: string;
    } | null;
    profiles?: {
        full_name: string | null;
    } | null;
}

interface User {
    id: string;
    email: string;
    created_at: string;
    profile?: {
        full_name: string | null;
        username_changed_at: string | null;
    } | null;
}

const AdminDashboard = () => {
    // SAFE INITIALIZATION
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    // STATE
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    // UI STATE
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Initializing...");
    const [errorDetail, setErrorDetail] = useState<string | null>(null);

    // FORM STATE
    const [isUploading, setIsUploading] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [newRestaurant, setNewRestaurant] = useState<Partial<Restaurant>>({
        is_visible: true,
        opening_hours: ""
    });

    // Category Dialog State
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryPath, setCategoryPath] = useState<Category[]>([]);
    const [newCategoryType, setNewCategoryType] = useState<Category['category_type']>('province');

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Menu Item States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedRestaurantForMenu, setSelectedRestaurantForMenu] = useState<Restaurant | null>(null);



    // ==========================================
    // DATA FETCHERS
    // ==========================================

    const fetchRestaurants = useCallback(async () => {
        const { data, error } = await (supabase as any)
            .from("restaurants")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching restaurants:", error);
            // Don't toast here to avoid spamming if multiple fail
        }
        if (data) {
            setRestaurants(data as unknown as Restaurant[]);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        const { data, error } = await (supabase as any)
            .from("categories")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("name");

        if (error) console.error("Error fetching categories:", error);
        if (data) setCategories(data);
    }, []);

    const fetchReviews = useCallback(async () => {
        const { data: reviewsData, error } = await (supabase as any)
            .from("reviews")
            .select(`
                *,
                restaurants(name)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reviews:", error);
        } else if (reviewsData) {
            const reviewsWithProfiles = await Promise.all(
                reviewsData.map(async (review: any) => {
                    try {
                        const { data: profile } = await (supabase as any)
                            .from("profiles")
                            .select("full_name")
                            .eq("user_id", review.user_id)
                            .maybeSingle(); // Changed to maybeSingle
                        return { ...review, profiles: profile };
                    } catch (e) {
                        return { ...review, profiles: null };
                    }
                })
            );
            setReviews(reviewsWithProfiles);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        // RPC function 'get_users_for_admin' does not exist yet. 
        // Commenting out to prevent errors.
        console.log("Skipping user fetch - RPC missing");
        setUsers([]);
    }, []);

    const fetchMenuItems = useCallback(async (restaurantId: string) => {
        const { data, error } = await (supabase as any)
            .from("menu_items")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching menu items:", error);
        } else if (data) {
            setMenuItems(data as unknown as MenuItem[]);
        }
    }, []);


    // ==========================================
    // AUTH CHECKER (ROBUST VERSION)
    // ==========================================

    const checkAdmin = useCallback(async () => {
        setStatusMessage("Checking User Session...");
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            if (!session) {
                setStatusMessage("No session found. Redirecting...");
                // Force redirect if no session at all
                setTimeout(() => navigate("/auth"), 1000);
                return;
            }

            setStatusMessage("Verifying Admin Privileges...");
            console.log("Checking admin for user:", session.user.id);

            // Use maybeSingle to handle 'no rows' gracefully without error
            const { data, error } = await (supabase as any)
                .from("user_roles")
                .select("role")
                .eq("user_id", session.user.id)
                .eq("role", "super_admin")
                .maybeSingle();

            if (error) {
                console.error("Error querying user_roles:", error);
                throw error;
            }

            if (!data) {
                const msg = `User (${session.user.email}) is not a super_admin.`;
                console.error(msg);
                setStatusMessage("Access Denied.");
                setErrorDetail(msg);

                toast({
                    title: "Access Denied",
                    description: "You do not have permission to view this page.",
                    variant: "destructive",
                });
                // STOP RENDERING LOADING, SHOW ERROR
                setIsLoading(false);
                return;
            }

            setStatusMessage("Fetching Dashboard Data...");

            // SERIAL FETCHING
            await fetchRestaurants();
            await fetchCategories();
            await fetchReviews();
            await fetchUsers();

            setIsLoading(false); // Success!

        } catch (error: any) {
            console.error("Admin check failed:", error);
            setIsLoading(false);

            let msg = error.message || "Unknown error";
            if (error?.code === '42P01' || msg.includes('does not exist')) {
                msg = "CRITICAL: 'user_roles' table is missing. Run 'fix_admin_table.sql'!";
            }

            setErrorDetail(msg);

            toast({
                title: "Admin Check Failed",
                description: msg,
                variant: "destructive",
            });
        }
    }, [navigate, toast, fetchRestaurants, fetchCategories, fetchReviews, fetchUsers]);


    // ==========================================
    // EFFECT
    // ==========================================

    useEffect(() => {
        checkAdmin();
        // Only run checkAdmin on mount. It handles the rest.
    }, [checkAdmin]);


    // ==========================================
    // EVENT HANDLERS (Simplified for Rewrite)
    // ==========================================
    // ... I'll include the handlers, but simplify them to valid code ...
    // Note: I'm pasting the handlers from the viewed file, assuming they were roughly correct,
    // but just in case, I will include standard implementations.
    // Actually, to avoid losing logic, I'm just going to include the Toggle, Create, Update, Delete skeletons
    // which use the same pattern as before, but clean.

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const slug = newRestaurant.name?.toLowerCase().replace(/ /g, "-") || "";
            const { error } = await (supabase as any)
                .from("restaurants")
                .insert([{ ...newRestaurant, slug }]);

            if (error) throw error;
            toast({ title: "Success", description: "Restaurant created." });
            setIsCreateOpen(false);
            fetchRestaurants();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRestaurant) return;
        try {
            const { error } = await (supabase as any)
                .from("restaurants")
                .update(editingRestaurant)
                .eq("id", editingRestaurant.id);

            if (error) throw error;
            toast({ title: "Success", description: "Restaurant updated." });
            setIsEditOpen(false);
            fetchRestaurants();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete ${name}?`)) return;
        try {
            const { error } = await (supabase as any).from("restaurants").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Success", description: "Restaurant deleted." });
            fetchRestaurants();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const toggleRestaurantVisibility = async (restaurant: Restaurant) => {
        try {
            const { error } = await (supabase as any)
                .from("restaurants")
                .update({ is_visible: !restaurant.is_visible } as any)
                .eq("id", restaurant.id);
            if (error) throw error;
            toast({ title: "Success", description: "Visibility toggled." });
            fetchRestaurants();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete category?")) return;
        try {
            const { error } = await (supabase as any).from("categories").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Success", description: "Category deleted." });
            fetchCategories();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteReview = async (id: string) => {
        if (!confirm("Delete review?")) return;
        try {
            const { error } = await (supabase as any).from("reviews").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Success", description: "Review deleted." });
            fetchReviews();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    if (isLoading || errorDetail) {
        return (
            <Layout>
                <div className="flex flex-col h-screen items-center justify-center space-y-6">
                    {!errorDetail && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">{errorDetail ? "Connection Failed" : "Loading Admin Panel"}</h2>
                        <p className="text-muted-foreground">{errorDetail || statusMessage}</p>
                    </div>
                    {errorDetail && (
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Retry
                        </Button>
                    )}
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-black mb-8 tracking-tighter">KURDISTAN<span className="text-primary italic">PLACES</span> ADMIN</h1>

                    <Tabs defaultValue="categories" className="w-full">
                        <TabsList className="mb-8">
                            <TabsTrigger value="categories">Places</TabsTrigger>
                            <TabsTrigger value="verticals">Verticals (Global)</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                        </TabsList>

                        <TabsContent value="categories">

                            <div className="space-y-4">
                                {/* BREADCRUMBS */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded-md">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 px-2"
                                        onClick={() => setCategoryPath([])}
                                    >
                                        All
                                    </Button>
                                    {categoryPath.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-1">
                                            <ChevronRight className="w-4 h-4" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "h-auto p-1 px-2",
                                                    index === categoryPath.length - 1 && "font-bold text-foreground"
                                                )}
                                                onClick={() => setCategoryPath(prev => prev.slice(0, index + 1))}
                                            >
                                                {item.name}
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* ACTION BAR */}
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">
                                        {categoryPath.length === 0 ? "Provinces" :
                                            categoryPath.length === 1 ? "Districts" :
                                                categoryPath.length === 2 ? "Verticals" :
                                                    "Places"}
                                    </h3>
                                    <Button onClick={() => {
                                        if (categoryPath.length === 3) {
                                            // Add Restaurant/Place
                                            const vertical = categoryPath[2];
                                            setNewRestaurant(prev => ({ ...prev, category_id: vertical.id }));
                                            setIsCreateOpen(true);
                                        } else {
                                            // Add Category
                                            setSelectedCategory(null);
                                            setNewCategoryType(
                                                categoryPath.length === 0 ? 'province' :
                                                    categoryPath.length === 1 ? 'district' :
                                                        categoryPath.length === 2 ? 'vertical' : 'standard'
                                            );
                                            setIsCategoryDialogOpen(true);
                                        }
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add {categoryPath.length === 0 ? "Province" :
                                            categoryPath.length === 1 ? "District" :
                                                categoryPath.length === 2 ? "Vertical" :
                                                    "Place"}
                                    </Button>
                                </div>

                                {/* LIST */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type/Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                // LOGIC FOR DISPLAYING ITEMS
                                                let items: Category[] = [];
                                                let typeLabel = "Category";

                                                if (categoryPath.length === 0) {
                                                    items = categories.filter(c => c.category_type === 'province');
                                                    typeLabel = "Province";
                                                } else {
                                                    const parent = categoryPath[categoryPath.length - 1];
                                                    // If currently at Province -> Show Districts
                                                    if (parent.category_type === 'province') {
                                                        items = categories.filter(c => c.parent_id === parent.id);
                                                        typeLabel = "District";
                                                    }
                                                    // If currently at District -> Show Verticals
                                                    else if (parent.category_type === 'district') {
                                                        items = categories.filter(c => c.parent_id === parent.id);
                                                        typeLabel = "Vertical";
                                                    }
                                                    // If Vertical -> Show Places (Restaurants) - HANDLED SEPARATELY BELOW?
                                                    // Actually, let's keep it simple. If we are at Vertical level, we show nothing here?
                                                    // Or we show restaurants?
                                                    // User wants to see "Places". 
                                                    // Places are in 'restaurants' array.
                                                }

                                                if (categoryPath.length === 3) {
                                                    // We are deep in a vertical. Show restaurants.
                                                    const parent = categoryPath[2];
                                                    const verticalRestaurants = restaurants.filter(r => r.category_id === parent.id);

                                                    if (verticalRestaurants.length === 0) {
                                                        return (
                                                            <TableRow>
                                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                                    No places found in this vertical.
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    }

                                                    return verticalRestaurants.map(restaurant => (
                                                        <TableRow key={restaurant.id} className="cursor-default">
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {restaurant.image_url && (
                                                                        <img src={restaurant.image_url} alt={restaurant.name} className="w-8 h-8 rounded-full object-cover" />
                                                                    )}
                                                                    {restaurant.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                                    PLACE
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setSelectedRestaurantForMenu(restaurant);
                                                                        setIsMenuOpen(true);
                                                                    }}
                                                                >
                                                                    <Utensils className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => toggleRestaurantVisibility(restaurant)}
                                                                >
                                                                    {restaurant.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    onClick={() => {
                                                                        setEditingRestaurant(restaurant);
                                                                        setIsEditOpen(true);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon" className="text-destructive"
                                                                    onClick={() => handleDelete(restaurant.id, restaurant.name)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ));
                                                }

                                                if (items.length === 0) {
                                                    return (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                                No {typeLabel.toLowerCase()}s found.
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                return items.map((category) => (
                                                    <TableRow
                                                        key={category.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => {
                                                            // Only drill down if it's not a vertical (since we handled vertical content above differently, 
                                                            // actually we want to click vertical to SEE places, so yes drill down)
                                                            // But max depth is 3 (Province->District->Vertical)
                                                            if (categoryPath.length < 3) {
                                                                setCategoryPath([...categoryPath, category]);
                                                            }
                                                        }}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                {category.image_url && (
                                                                    <img src={category.image_url} alt={category.name} className="w-8 h-8 rounded-full object-cover" />
                                                                )}
                                                                {category.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={cn(
                                                                "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                                                category.category_type === 'province' ? "bg-blue-100 text-blue-700" :
                                                                    category.category_type === 'district' ? "bg-purple-100 text-purple-700" :
                                                                        category.category_type === 'vertical' ? "bg-green-100 text-green-700" :
                                                                            "bg-gray-100 text-gray-700"
                                                            )}>
                                                                {category.category_type || 'STANDARD'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCategory(category);
                                                                    setIsCategoryDialogOpen(true);
                                                                }}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteCategory(category.id);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ));
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>


                            {/* EDIT RESTAURANT DIALOG */}
                            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Edit Restaurant</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Name *</Label>
                                                <Input
                                                    value={editingRestaurant?.name || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Slug</Label>
                                                <Input
                                                    value={editingRestaurant?.slug || ""}
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    value={editingRestaurant?.description || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Input
                                                    value={editingRestaurant?.address || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, address: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input
                                                    value={editingRestaurant?.phone || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Location</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Latitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={editingRestaurant?.latitude ?? ""}
                                                            onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null } : null)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Longitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={editingRestaurant?.longitude ?? ""}
                                                            onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null } : null)}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full mt-2 gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                    onClick={() => {
                                                        if (!navigator.geolocation) {
                                                            toast({ title: "Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
                                                            return;
                                                        }
                                                        setIsLoading(true); // Using global loading state for simplicity or add local state
                                                        navigator.geolocation.getCurrentPosition(
                                                            (position) => {
                                                                setEditingRestaurant(prev => prev ? {
                                                                    ...prev,
                                                                    latitude: position.coords.latitude,
                                                                    longitude: position.coords.longitude
                                                                } : null);
                                                                setIsLoading(false);
                                                                toast({ title: "Success", description: "Location updated!" });
                                                            },
                                                            (error) => {
                                                                console.error("Geolocation error:", error);
                                                                toast({ title: "Error", description: "Unable to retrieve your location. Please check permissions.", variant: "destructive" });
                                                                setIsLoading(false);
                                                            }
                                                        );
                                                    }}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    Use My Current Location
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={editingRestaurant?.category_id || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, category_id: e.target.value } : null)}
                                                >
                                                    <option value="">Select a category</option>
                                                    {categories
                                                        .filter(c => c.category_type === 'province')
                                                        .map((province) => {
                                                            const childCategories = categories.filter(c => c.parent_id === province.id);
                                                            if (childCategories.length === 0) return null;
                                                            return (
                                                                <optgroup key={province.id} label={province.name}>
                                                                    {childCategories.map((child) => (
                                                                        <option key={child.id} value={child.id}>
                                                                            {child.name}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            );
                                                        })
                                                    }
                                                    <optgroup label="Other">
                                                        {categories
                                                            .filter(c => c.category_type === 'standard' && !c.parent_id)
                                                            .map((category) => (
                                                                <option key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </option>
                                                            ))
                                                        }
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <div className="space-y-2">
                                                    <ImageUpload
                                                        value={editingRestaurant?.image_url || null}
                                                        onUpload={async (file) => {
                                                            setIsUploading(true);
                                                            try {
                                                                const fileExt = file.name.split('.').pop();
                                                                const fileName = `restaurants/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                                                                const { error } = await supabase.storage.from('images').upload(fileName, file);
                                                                if (error) throw error;
                                                                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                                                                setEditingRestaurant(prev => prev ? { ...prev, image_url: publicUrl } : null);
                                                            } catch (error: any) {
                                                                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
                                                            } finally {
                                                                setIsUploading(false);
                                                            }
                                                        }}
                                                        onRemove={() => setEditingRestaurant(prev => prev ? { ...prev, image_url: null } : null)}
                                                        isUploading={isUploading}
                                                    />
                                                    <Input
                                                        placeholder="Or enter image URL manually"
                                                        value={editingRestaurant?.image_url || ""}
                                                        onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Opening Hours</Label>
                                                <Input
                                                    value={editingRestaurant?.opening_hours || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, opening_hours: e.target.value } : null)}
                                                    placeholder="e.g. 9:00 AM - 11:00 PM"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>TikTok URL</Label>
                                                <Input
                                                    value={editingRestaurant?.tiktok_url || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, tiktok_url: e.target.value } : null)}
                                                    placeholder="https://tiktok.com/@..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Facebook URL</Label>
                                                <Input
                                                    value={editingRestaurant?.facebook_url || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, facebook_url: e.target.value } : null)}
                                                    placeholder="https://facebook.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Instagram URL</Label>
                                                <Input
                                                    value={editingRestaurant?.instagram_url || ""}
                                                    onChange={(e) => setEditingRestaurant(prev => prev ? { ...prev, instagram_url: e.target.value } : null)}
                                                    placeholder="https://instagram.com/..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                            <Button type="submit">Update Restaurant</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* CREATE RESTAURANT DIALOG */}
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add New Restaurant</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Name *</Label>
                                                <Input
                                                    value={newRestaurant.name || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, name: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Slug</Label>
                                                <Input
                                                    value={newRestaurant.name?.toLowerCase().replace(/ /g, "-") || ""}
                                                    disabled
                                                    placeholder="Auto-generated"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    value={newRestaurant.description || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, description: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Input
                                                    value={newRestaurant.address || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, address: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input
                                                    value={newRestaurant.phone || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, phone: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Location</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Latitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={newRestaurant.latitude ?? ""}
                                                            onChange={(e) => setNewRestaurant(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-muted-foreground">Longitude</Label>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={newRestaurant.longitude ?? ""}
                                                            onChange={(e) => setNewRestaurant(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full mt-2 gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary"
                                                    onClick={() => {
                                                        if (!navigator.geolocation) {
                                                            toast({ title: "Error", description: "Geolocation is not supported by your browser.", variant: "destructive" });
                                                            return;
                                                        }
                                                        setIsLoading(true);
                                                        navigator.geolocation.getCurrentPosition(
                                                            (position) => {
                                                                setNewRestaurant(prev => ({
                                                                    ...prev,
                                                                    latitude: position.coords.latitude,
                                                                    longitude: position.coords.longitude
                                                                }));
                                                                setIsLoading(false);
                                                                toast({ title: "Success", description: "Location captured!" });
                                                            },
                                                            (error) => {
                                                                console.error("Geolocation error:", error);
                                                                toast({ title: "Error", description: "Unable to retrieve your location.", variant: "destructive" });
                                                                setIsLoading(false);
                                                            }
                                                        );
                                                    }}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    Use My Current Location
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={newRestaurant.category_id || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, category_id: e.target.value }))}
                                                >
                                                    <option value="">Select a category</option>
                                                    {categories
                                                        .filter(c => c.category_type === 'province')
                                                        .map((province) => {
                                                            const childCategories = categories.filter(c => c.parent_id === province.id);
                                                            if (childCategories.length === 0) return null;
                                                            return (
                                                                <optgroup key={province.id} label={province.name}>
                                                                    {childCategories.map((child) => (
                                                                        <option key={child.id} value={child.id}>
                                                                            {child.name}
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            );
                                                        })
                                                    }
                                                    <optgroup label="Other">
                                                        {categories
                                                            .filter(c => c.category_type === 'standard' && !c.parent_id)
                                                            .map((category) => (
                                                                <option key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </option>
                                                            ))
                                                        }
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <div className="space-y-2">
                                                    <ImageUpload
                                                        value={newRestaurant.image_url || null}
                                                        onUpload={async (file) => {
                                                            setIsUploading(true);
                                                            try {
                                                                const fileExt = file.name.split('.').pop();
                                                                const fileName = `restaurants/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                                                                const { error } = await supabase.storage.from('images').upload(fileName, file);
                                                                if (error) throw error;
                                                                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                                                                setNewRestaurant(prev => ({ ...prev, image_url: publicUrl }));
                                                            } catch (error: any) {
                                                                toast({ title: "Upload Error", description: error.message, variant: "destructive" });
                                                            } finally {
                                                                setIsUploading(false);
                                                            }
                                                        }}
                                                        onRemove={() => setNewRestaurant(prev => ({ ...prev, image_url: null }))}
                                                        isUploading={isUploading}
                                                    />
                                                    <Input
                                                        placeholder="Or enter image URL manually"
                                                        value={newRestaurant.image_url || ""}
                                                        onChange={(e) => setNewRestaurant(prev => ({ ...prev, image_url: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Opening Hours</Label>
                                                <Input
                                                    value={newRestaurant.opening_hours || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, opening_hours: e.target.value }))}
                                                    placeholder="e.g. 9:00 AM - 11:00 PM"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>TikTok URL</Label>
                                                <Input
                                                    value={newRestaurant.tiktok_url || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, tiktok_url: e.target.value }))}
                                                    placeholder="https://tiktok.com/@..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Facebook URL</Label>
                                                <Input
                                                    value={newRestaurant.facebook_url || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, facebook_url: e.target.value }))}
                                                    placeholder="https://facebook.com/..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Instagram URL</Label>
                                                <Input
                                                    value={newRestaurant.instagram_url || ""}
                                                    onChange={(e) => setNewRestaurant(prev => ({ ...prev, instagram_url: e.target.value }))}
                                                    placeholder="https://instagram.com/..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                            <Button type="submit">Create Restaurant</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <CreateCategoryDialog
                                open={isCategoryDialogOpen}
                                onOpenChange={setIsCategoryDialogOpen}
                                categories={categories}
                                existingCategory={selectedCategory}
                                onSuccess={fetchCategories}
                                defaultParentId={categoryPath.length > 0 ? categoryPath[categoryPath.length - 1].id : null}
                                defaultType={newCategoryType}
                            />
                        </TabsContent>

                        <TabsContent value="reviews">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Restaurant</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Rating</TableHead>
                                            <TableHead>Comment</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reviews.map((review) => (
                                            <TableRow key={review.id}>
                                                <TableCell className="font-medium">{review.restaurants?.name || 'Unknown'}</TableCell>
                                                <TableCell>{review.profiles?.full_name || 'Anonymous'}</TableCell>
                                                <TableCell>{review.rating} / 5</TableCell>
                                                <TableCell className="max-w-xs truncate" title={review.comment || ''}>
                                                    {review.comment || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteReview(review.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="verticals">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Global Verticals</h3>
                                    <Button onClick={() => {
                                        setSelectedCategory(null);
                                        setNewCategoryType('vertical');
                                        setIsCategoryDialogOpen(true);
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Vertical
                                    </Button>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Slug</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categories
                                                .filter(c => c.category_type === 'vertical' && !c.parent_id)
                                                .length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                        No global verticals found. Add one to get started.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                categories
                                                    .filter(c => c.category_type === 'vertical' && !c.parent_id)
                                                    .map((category) => (
                                                        <TableRow key={category.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {category.image_url && (
                                                                        <img src={category.image_url} alt={category.name} className="w-8 h-8 rounded-full object-cover" />
                                                                    )}
                                                                    {category.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{category.slug}</TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setSelectedCategory(category);
                                                                        setIsCategoryDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive"
                                                                    onClick={() => handleDeleteCategory(category.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="users">
                            <div className="text-center py-12 text-muted-foreground">
                                <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium">User Management</h3>
                                <p>User management features are coming soon.</p>
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
            </section >
            <MenuManagementDialog
                restaurant={selectedRestaurantForMenu}
                isOpen={isMenuOpen}
                onClose={() => {
                    setIsMenuOpen(false);
                    setSelectedRestaurantForMenu(null);
                }}
            />
        </Layout >
    );
};

export default AdminDashboard;
