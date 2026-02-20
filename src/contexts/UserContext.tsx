import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
}

interface UserContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isPreviewMode: boolean;
    setPreviewMode: (val: boolean) => void;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    // Safely hydrate from local storage
    const safeParse = (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage`, e);
            localStorage.removeItem(key); // Clear corrupt data
            return null;
        }
    };

    const [user, setUser] = useState<User | null>(() => safeParse('kp_user_object'));
    const [profile, setProfile] = useState<Profile | null>(() => safeParse('kp_user_profile'));
    const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('kp_user_is_admin') === 'true');
    const [isPreviewMode, setPreviewModeState] = useState(() => localStorage.getItem('kp_user_preview_mode') === 'true');
    const [loading, setLoading] = useState(true);

    const setPreviewMode = (val: boolean) => {
        setPreviewModeState(val);
        localStorage.setItem('kp_user_preview_mode', String(val));
    };

    // Helper to update user and cache
    const setUserWithCache = (newUser: User | null) => {
        setUser(newUser);
        if (newUser) {
            localStorage.setItem('kp_user_object', JSON.stringify(newUser));
        } else {
            localStorage.removeItem('kp_user_object');
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (error) throw error;

            setProfile(data);
            if (data) {
                localStorage.setItem('kp_user_profile', JSON.stringify(data));
            }
        } catch (error) {
            console.error("Error fetching profile", error);
            // Don't clear profile on error immediately (could be network), 
            // but if data is null, we might want to.
        }
    };

    const checkAdminRole = async (userId: string) => {
        try {
            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "super_admin")
                .single();
            const isSuperAdmin = !!data;
            setIsAdmin(isSuperAdmin);
            localStorage.setItem('kp_user_is_admin', String(isSuperAdmin));
        } catch (error) {
            console.error("Error checking admin role", error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeUser = async () => {
            try {
                // 1. Verify session with server
                const { data: { user: serverUser }, error } = await supabase.auth.getUser();

                if (mounted) {
                    if (error || !serverUser) {
                        // User invalid or deleted
                        console.log("No valid server session found. Clearing state.");
                        setUserWithCache(null);
                        setProfile(null);
                        setIsAdmin(false);
                        localStorage.clear();
                    } else {
                        // User valid
                        setUserWithCache(serverUser);

                        // Fetch extras
                        await Promise.all([
                            fetchProfile(serverUser.id),
                            checkAdminRole(serverUser.id)
                        ]);
                    }
                }
            } catch (error) {
                console.error("Critical Auth Error:", error);
                if (mounted) {
                    // Fallback to safe state
                    setUserWithCache(null);
                    localStorage.clear();
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeUser();

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    setUserWithCache(null);
                    setProfile(null);
                    setIsAdmin(false);
                    localStorage.clear();
                    setLoading(false);
                    return;
                }

                // For other events (SIGNED_IN, TOKEN_REFRESHED)
                const currentUser = session?.user ?? null;
                setUserWithCache(currentUser);
                setLoading(false);

                if (currentUser) {
                    fetchProfile(currentUser.id);
                    checkAdminRole(currentUser.id);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <UserContext.Provider value={{
            user, profile, loading, isAdmin,
            isPreviewMode, setPreviewMode,
            refreshProfile
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
