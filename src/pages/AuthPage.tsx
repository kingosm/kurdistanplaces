import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { EditableText } from "@/components/cms/EditableText";

const AuthPage = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const emailSchema = z.string().email(t('auth.val.email'));
  const passwordSchema = z.string().min(6, t('auth.val.password'));

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: t('auth.invalid_input'),
        description: t('auth.check_input'),
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    console.log("Starting sign in...");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in result:", { error });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: t('auth.signin_failed'),
            description: t('auth.invalid_credentials'),
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: t('auth.email_not_confirmed'),
            description: t('auth.check_email_confirm'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      console.log("Sign in successful, navigating...");
      navigate("/");
    } catch (error) {
      console.error("Sign in error:", error);
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


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: t('auth.account_exists'),
            description: t('auth.email_exists'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user && !data.session) {
        toast({
          title: t('auth.account_created'),
          description: t('auth.check_email_confirm'),
        });
      } else {
        toast({
          title: t('auth.account_created'),
          description: t('auth.welcome_new'),
        });
        navigate("/");
      }
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const GoogleButton = ({ text }: { text: string }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full pill-button min-h-[4rem] h-auto py-4 text-lg border-white/10 hover:bg-white/5 bg-secondary/30 gap-3 leading-normal"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {text}
    </Button>
  );

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-24 px-6 relative overflow-hidden bg-background">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -ml-64 -mb-64" />

        <div className="w-full max-w-xl relative z-10 animate-reveal">
          {/* Logo & Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-4 group mb-6">
              <div className="w-20 h-20 bg-primary flex items-center justify-center rounded-3xl shadow-2xl shadow-primary/30 transition-all duration-500">
                <MapPin className="w-10 h-10 text-white" />
              </div>
            </Link>
            <div className="flex flex-col items-center gap-3 mb-6">
              <span className="text-primary text-sm font-black uppercase tracking-[0.4em]">
                <EditableText contentKey="auth.get_started" fallback={t('auth.get_started')} />
              </span>
              <h1 className="text-5xl font-black tracking-tighter leading-normal pt-2 pb-2">
                KURDISTAN<span className="text-primary">PLACES</span>
              </h1>
              <div className="w-12 h-1.5 bg-primary/20 rounded-full mt-4" />
            </div>
          </div>

          {/* Auth Card */}
          <div className="modern-card p-8 md:p-12 shadow-primary/5">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 h-14 p-1 bg-secondary/50 border border-white/5 rounded-2xl">
                <TabsTrigger value="signin" className="font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                  <EditableText contentKey="auth.tab.signin" fallback={t('auth.tab.signin')} />
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                  <EditableText contentKey="auth.tab.signup" fallback={t('auth.tab.signup')} />
                </TabsTrigger>
              </TabsList>

              <div className="mb-4 text-center">
              </div>

              <TabsContent value="signin" className="animate-reveal">
                <form onSubmit={handleSignIn} className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="signin-email" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">
                      <EditableText contentKey="auth.email" fallback={t('auth.email')} />
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5 opacity-40" />
                      </div>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 pl-14 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-rose-500 font-bold ml-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <Label htmlFor="signin-password" className="text-xs font-black uppercase tracking-widest opacity-60">
                        <EditableText contentKey="auth.password" fallback={t('auth.password')} />
                      </Label>
                      <Link
                        to="/forgot-password"
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                      >
                        {t('auth.forgot_password')}
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5 opacity-40" />
                      </div>
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-16 pl-14 pr-12 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 opacity-50" /> : <Eye className="w-5 h-5 opacity-50" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-rose-500 font-bold ml-1">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full pill-button hero-gradient min-h-[4rem] h-auto py-4 text-lg text-white leading-normal"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.btn.signing_in') : t('auth.btn.signin')}
                  </Button>

                  <div className="relative flex items-center justify-center my-8">
                    <div className="absolute inset-x-0 h-px bg-white/10" />
                    <span className="relative bg-[#1A1F2C] px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {t('auth.or_continue')}
                    </span>
                  </div>

                  <GoogleButton text={t('auth.google_signin')} />
                </form>
              </TabsContent>

              <TabsContent value="signup" className="animate-reveal">
                <form onSubmit={handleSignUp} className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="signup-name" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t('auth.fullname')}</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <User className="w-5 h-5 opacity-40" />
                      </div>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-16 pl-14 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="signup-email" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t('auth.email')}</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <Mail className="w-5 h-5 opacity-40" />
                      </div>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16 pl-14 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-rose-500 font-bold ml-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="signup-password" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">{t('auth.password')}</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5 opacity-40" />
                      </div>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-16 pl-14 rounded-2xl bg-secondary/50 border-white/5 focus-visible:ring-primary focus-visible:ring-offset-0 text-lg font-medium"
                        required
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-rose-500 font-bold ml-1">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full pill-button hero-gradient min-h-[4rem] h-auto py-4 text-lg text-white leading-normal"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.btn.creating') : t('auth.btn.create')}
                  </Button>

                  <div className="relative flex items-center justify-center my-8">
                    <div className="absolute inset-x-0 h-px bg-white/10" />
                    <span className="relative bg-[#1A1F2C] px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {t('auth.or_continue')}
                    </span>
                  </div>

                  <GoogleButton text={t('auth.google_signup')} />
                </form>
              </TabsContent>
            </Tabs>


          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
