import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { User, Loader2, Mail, Calendar, Star, Heart, Award, TrendingUp, Camera, X, Upload, Edit2, Check, AlertCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { processImage } from "@/lib/moderation";

const Profile = () => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { user, profile, loading, refreshProfile } = useUser();
    const [isUploading, setIsUploading] = useState(false);
    const [stats, setStats] = useState({ reviews: 0, favorites: 0 });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Username editing state
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editedUsername, setEditedUsername] = useState("");
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [canEditUsername, setCanEditUsername] = useState(true);

    // Local state
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setEditedUsername(profile.full_name || "");
            setAvatarUrl(profile.avatar_url);
            // Check if username has been changed before
            setCanEditUsername(!(profile as any).username_changed_at);
        }
    }, [profile]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            const [reviewsData, favoritesData, recentReviews] = await Promise.all([
                supabase.from("reviews").select("id", { count: "exact" }).eq("user_id", user.id),
                supabase.from("favorites").select("id", { count: "exact" }).eq("user_id", user.id),
                supabase.from("reviews")
                    .select("id, rating, created_at, restaurant_id, restaurants(name)")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(3),
            ]);

            setStats({
                reviews: reviewsData.count || 0,
                favorites: favoritesData.count || 0,
            });

            setRecentActivity(recentReviews.data || []);
        };

        fetchStats();
    }, [user]);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({
                title: t('profile.invalid_file_type'),
                description: t('profile.select_image_file'),
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: t('profile.file_too_large'),
                description: t('profile.max_file_size'),
                variant: "destructive",
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
            setShowAvatarDialog(true);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleUploadConfirm = async () => {
        if (!fileInputRef.current?.files?.[0] || !profile) return;

        const file = fileInputRef.current.files[0];
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const { safe, file: processedFile, reason } = await processImage(file);

            if (!safe) {
                clearInterval(progressInterval);
                toast({
                    title: "Upload Rejected",
                    description: reason || "Unsafe content detected",
                    variant: "destructive",
                });
                return;
            }

            const fileExt = processedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, processedFile);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // Save immediately
            const { error } = await supabase
                .from("profiles")
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            setAvatarUrl(publicUrl);
            setShowAvatarDialog(false);
            setPreviewUrl(null);

            await refreshProfile();

            toast({
                title: t('profile.photo_updated'),
                description: t('profile.photo_changed_desc'),
            });
        } catch (error) {
            console.error("Upload error details:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast({
                title: t('profile.upload_failed'),
                description: `Error: ${errorMessage}`,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!profile) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    avatar_url: null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            setAvatarUrl(null);
            setShowAvatarDialog(false);
            setPreviewUrl(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            await refreshProfile();

            toast({
                title: t('profile.photo_removed'),
                description: t('profile.photo_removed_desc'),
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove photo",
                variant: "destructive",
            });
        }
    };

    const handleUsernameEdit = () => {
        if (!canEditUsername) {
            toast({
                title: t('profile.username_already_changed'),
                description: t('profile.username_change_limit'),
                variant: "destructive",
            });
            return;
        }
        setIsEditingUsername(true);
    };

    const handleUsernameSave = async () => {
        if (!profile || !editedUsername.trim()) {
            toast({
                title: t('profile.invalid_username'),
                description: t('profile.username_empty'),
                variant: "destructive",
            });
            return;
        }

        setIsSavingUsername(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: editedUsername.trim(),
                    username_changed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (error) throw error;

            await refreshProfile();
            setIsEditingUsername(false);
            setCanEditUsername(false);

            toast({
                title: t('profile.username_updated'),
                description: t('profile.username_updated_desc'),
            });
        } catch (error) {
            console.error("Error saving username:", error);
            toast({
                title: "Error",
                description: "Failed to save username",
                variant: "destructive",
            });
        } finally {
            setIsSavingUsername(false);
        }
    };

    const handleUsernameCancel = () => {
        setEditedUsername(profile?.full_name || "");
        setIsEditingUsername(false);
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-background">
                    <div className="relative h-72 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-white/5 animate-pulse" />
                    <div className="container mx-auto px-6 -mt-40 pb-20">
                        <div className="max-w-6xl mx-auto">
                            <div className="modern-card p-8 md:p-12 mb-8">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-44 h-44 rounded-3xl bg-secondary/20 animate-pulse" />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-3">
                                            <div className="h-12 w-64 bg-secondary/20 rounded-xl animate-pulse" />
                                            <div className="h-6 w-48 bg-secondary/20 rounded-lg animate-pulse" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-32 bg-secondary/20 rounded-2xl animate-pulse" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
    const avgRating = stats.reviews > 0 ? (recentActivity.reduce((sum, r) => sum + (r.rating || 0), 0) / Math.min(recentActivity.length, 3)).toFixed(1) : '0.0';

    return (
        <Layout>
            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <div className="relative h-72 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-b border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.15),transparent_50%)] animate-pulse" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.15),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
                </div>

                <div className="container mx-auto px-6 -mt-40 pb-20">
                    <div className="max-w-6xl mx-auto">
                        {/* Profile Card */}
                        <div className="modern-card p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transition-all group-hover:bg-primary/10" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />

                            <div className="relative flex flex-col lg:flex-row gap-8 items-start">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-6 lg:items-start">
                                    <div className="relative group/avatar">
                                        <button
                                            onClick={() => {
                                                if (avatarUrl) {
                                                    setPreviewUrl(avatarUrl);
                                                    setShowAvatarDialog(true);
                                                } else {
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            className="w-44 h-44 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/20 flex items-center justify-center border-4 border-white/10 shadow-2xl transition-all hover:shadow-primary/20 hover:border-primary/30 cursor-pointer relative"
                                        >
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-24 h-24 text-muted-foreground opacity-30" />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                <Camera className="w-12 h-12 text-white" />
                                                <span className="text-xs font-bold text-white uppercase tracking-wider">{t('profile.change_photo')}</span>
                                            </div>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                        />
                                        <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 transition-all group-hover/avatar:scale-110">
                                            <Star className="w-7 h-7 text-white fill-white" />
                                        </div>
                                        {stats.reviews >= 5 && (
                                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 animate-bounce">
                                                <Award className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center lg:text-left">
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {t('profile.click_change_photo')}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 font-medium">
                                            {t('profile.photo_limits')}
                                        </p>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 space-y-6 w-full">
                                    <div className="space-y-3">
                                        {/* Editable Username */}
                                        <div className="flex items-center gap-3">
                                            {isEditingUsername ? (
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Input
                                                        value={editedUsername}
                                                        onChange={(e) => setEditedUsername(e.target.value)}
                                                        className="h-14 px-6 rounded-2xl bg-white/[0.03] border-primary/30 focus:border-primary/50 transition-all font-bold text-2xl"
                                                        placeholder={t('profile.enter_name_placeholder')}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUsernameSave();
                                                            if (e.key === 'Escape') handleUsernameCancel();
                                                        }}
                                                    />
                                                    <Button
                                                        onClick={handleUsernameSave}
                                                        disabled={isSavingUsername}
                                                        className="h-14 px-6 rounded-2xl hero-gradient text-background font-bold"
                                                    >
                                                        {isSavingUsername ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Check className="w-5 h-5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={handleUsernameCancel}
                                                        variant="outline"
                                                        className="h-14 px-6 rounded-2xl"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                                        {editedUsername || "Food Explorer"}
                                                    </h1>
                                                    {canEditUsername && (
                                                        <button
                                                            onClick={handleUsernameEdit}
                                                            className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center justify-center transition-all group/edit"
                                                            title="Edit username (one-time only)"
                                                        >
                                                            <Edit2 className="w-5 h-5 text-primary group-hover/edit:scale-110 transition-all" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {!canEditUsername && !isEditingUsername && (
                                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" />
                                                {t('profile.username_set_warning')}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-full border border-white/5">
                                                <Mail className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium">{user?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-full border border-white/5">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium">{t('profile.joined', { date: joinedDate })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer group/stat">
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center transition-all group-hover/stat:scale-110">
                                                    <Star className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-4xl font-black">{stats.reviews}</p>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('profile.stats.reviews')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 rounded-2xl p-6 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer group/stat">
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center transition-all group-hover/stat:scale-110">
                                                    <Heart className="w-6 h-6 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-4xl font-black">{stats.favorites}</p>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('profile.stats.favorites')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group/stat">
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center transition-all group-hover/stat:scale-110">
                                                    <TrendingUp className="w-6 h-6 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-4xl font-black">{avgRating}</p>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('profile.stats.rating')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    {recentActivity.length > 0 && (
                                        <div className="bg-secondary/20 rounded-2xl p-6 border border-white/5">
                                            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" />
                                                {t('profile.recent_activity')}
                                            </h3>
                                            <div className="space-y-3">
                                                {recentActivity.map((activity, idx) => (
                                                    <div key={activity.id} className="flex items-center gap-3 text-sm animate-reveal hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer" style={{ animationDelay: `${idx * 0.1}s` }}>
                                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                            <Star className="w-4 h-4 text-primary fill-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold truncate">{activity.restaurants?.name || 'Restaurant'}</p>
                                                            <p className="text-xs text-muted-foreground">{t('profile.stars', { count: activity.rating })} • {new Date(activity.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Dialog */}
            <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{t('profile.dialog.title')}</DialogTitle>
                        <DialogDescription>
                            {t('profile.dialog.desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div
                            className={cn(
                                "relative flex justify-center transition-all",
                                isDragging && "scale-105"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className={cn(
                                "w-64 h-64 rounded-3xl overflow-hidden bg-secondary/20 flex items-center justify-center border-4 transition-all",
                                isDragging ? "border-primary border-dashed" : "border-white/10"
                            )}>
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <Upload className="w-16 h-16 text-muted-foreground opacity-30 mx-auto" />
                                        <p className="text-sm text-muted-foreground font-medium">
                                            {t('profile.upload_text')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{t('profile.uploading')}</span>
                                    <span className="font-bold text-primary">{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl hover:bg-primary/10 hover:border-primary/30 transition-all"
                                disabled={isUploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {t('profile.choose_photo')}
                            </Button>
                            {(avatarUrl || previewUrl) && (
                                <Button
                                    onClick={handleRemoveAvatar}
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    {t('profile.remove_photo')}
                                </Button>
                            )}
                        </div>
                        {previewUrl && previewUrl !== avatarUrl && (
                            <Button
                                onClick={handleUploadConfirm}
                                disabled={isUploading}
                                className="w-full h-12 rounded-xl hero-gradient text-background font-bold shadow-xl shadow-primary/20 transition-all"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        {t('profile.uploading')}
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-5 h-5 mr-2" />
                                        {t('profile.set_photo')}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default Profile;
