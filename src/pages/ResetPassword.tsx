import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Lock } from "lucide-react";

const ResetPassword = () => {
    const { t } = useLanguage();
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase handles the recovery session automatically when the URL contains the recovery token
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, it might be an invalid or expired link
                // But the user might just be arriving at the page.
                // Supabase will handle the actual update check.
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({
                title: t('auth.error'),
                description: t('auth.val.password'),
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast({
                title: t('auth.reset_password'),
                description: t('auth.password_updated'),
            });
            navigate("/auth");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('auth.generic_error');
            toast({
                title: t('auth.error'),
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center py-24 px-6 relative overflow-hidden bg-background">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -ml-64 -mb-64" />

                <div className="w-full max-w-xl relative z-10 animate-reveal">
                    <div className="text-center mb-12">
                        <Link to="/" className="inline-flex items-center gap-4 group mb-6">
                            <div className="w-20 h-20 bg-primary flex items-center justify-center rounded-3xl shadow-2xl shadow-primary/30 transition-all duration-500">
                                <MapPin className="w-10 h-10 text-white" />
                            </div>
                        </Link>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">{t('auth.reset_password')}</h1>
                        <p className="text-muted-foreground">{t('auth.new_password')}</p>
                    </div>

                    <div className="modern-card p-12 shadow-primary/5">
                        <form onSubmit={handleUpdatePassword} className="space-y-8">
                            <div className="space-y-4">
                                <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t('auth.password')}</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                                        <Lock className="w-5 h-5 opacity-40" />
                                    </div>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-16 pl-14 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full pill-button bg-blue-600 hover:bg-blue-700 transition-colors font-bold h-16 text-lg text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? t('auth.btn.signing_in') : t('auth.update_password')}
                            </Button>

                            <Link to="/auth" className="block text-center text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">
                                {t('auth.back_to_signin')}
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ResetPassword;
