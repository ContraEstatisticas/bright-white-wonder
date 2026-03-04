import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

const SignupFromEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const langParam = searchParams.get("lang");

  const [fullName, setFullName] = useState("");
  const [email] = useState(emailParam);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [hasPurchase, setHasPurchase] = useState<boolean | null>(null);

  // Set language from URL param
  useEffect(() => {
    if (langParam) {
      const normalizedLang = langParam.toLowerCase().split("-")[0];
      if (["pt", "en", "es", "fr", "de", "it", "ru"].includes(normalizedLang)) {
        i18n.changeLanguage(normalizedLang);
      }
    }
  }, [langParam]);

  // Check if user already has an account and if purchase exists
  useEffect(() => {
    const checkStatus = async () => {
      if (!emailParam) {
        setCheckingAccount(false);
        return;
      }

      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }

      // Check purchase exists
      try {
        const { data: purchaseExists } = await supabase.rpc("check_purchase_exists" as any, { p_email: emailParam });
        setHasPurchase(Boolean(purchaseExists) ?? false);
      } catch {
        setHasPurchase(null);
      }

      // Try to sign in with OTP (shouldCreateUser: false) to check if account exists
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: emailParam,
          options: { shouldCreateUser: false },
        });
        // If no error, user exists
        if (!error) {
          setHasAccount(true);
        }
        // If error contains "Signups not allowed" or similar, user doesn't exist
      } catch {
        // User doesn't exist
      }

      setCheckingAccount(false);
    };

    checkStatus();
  }, [emailParam, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ title: t("auth.signupError"), description: t("auth.nameRequired"), variant: "destructive" });
      return;
    }

    if (email !== confirmEmail) {
      toast({ title: t("auth.signupError"), description: t("auth.emailMismatch", "Os e-mails não coincidem."), variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t("auth.loginError"), description: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: t("auth.loginError"), description: t("auth.passwordTooShort"), variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setIsLoading(false);
      if (error.message === "User already registered") {
        setHasAccount(true);
        return;
      }
      toast({ title: t("auth.signupError"), description: error.message, variant: "destructive" });
      return;
    }

    if (data.user) {
      const currentLanguage = langParam || navigator.language || i18n.language || "en";

      try {
        await supabase.from("profiles").update({ preferred_language: currentLanguage }).eq("id", data.user.id);
      } catch {}

      // Reconcile billing events
      try {
        await supabase.rpc("process_pending_billing_events", { p_user_id: data.user.id, p_email: email });
      } catch {}

      // NO welcome email sent here - already sent on purchase

      setIsLoading(false);
      toast({ title: t("auth.signupSuccess"), description: t("common.loading") });
      navigate("/dashboard", { replace: true });
      return;
    }

    setIsLoading(false);
    toast({ title: t("auth.signupSuccess"), description: t("common.loading") });
    navigate("/dashboard", { replace: true });
  };

  if (checkingAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  // No email in URL
  if (!emailParam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t("signupFromEmail.invalidLink", "Link inválido")}</h2>
          <p className="text-muted-foreground">{t("signupFromEmail.useEmailLink", "Use o link enviado no seu email de compra.")}</p>
          <Button onClick={() => navigate("/auth")} className="w-full">{t("auth.loginTab")}</Button>
        </Card>
      </div>
    );
  }

  // User already has account
  if (hasAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="absolute top-4 right-4 z-50"><LanguageSelector /></div>
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("signupFromEmail.alreadyHaveAccount", "Você já tem uma conta!")}</h2>
          <p className="text-muted-foreground">{t("signupFromEmail.loginInstead", "Entre com seu email e senha para acessar a plataforma.")}</p>
          <p className="text-sm font-medium text-primary">{emailParam}</p>
          <Button onClick={() => navigate("/auth")} className="w-full" size="lg">
            {t("signupFromEmail.goToLogin", "Acessar minha conta")}
          </Button>
        </Card>
      </div>
    );
  }

  // Purchase not found
  if (hasPurchase === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="absolute top-4 right-4 z-50"><LanguageSelector /></div>
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-xl font-bold text-foreground">{t("signupFromEmail.purchaseNotFound", "Compra não localizada")}</h2>
          <p className="text-muted-foreground">{t("signupFromEmail.purchaseNotFoundDesc", "Não localizamos uma compra vinculada a este email. Verifique se usou o email correto.")}</p>
          <p className="text-sm font-medium text-primary">{emailParam}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.href = "mailto:contact@educly.app"} variant="outline" className="w-full">
              {t("signupFromEmail.contactSupport", "Contatar suporte")}
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
              {t("common.back")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Signup form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background safe-area-inset">
      <div className="absolute top-4 right-4 z-50"><LanguageSelector /></div>

      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Educly</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("signupFromEmail.title", "Crie sua conta")}
          </h1>
          <p className="text-muted-foreground">
            {t("signupFromEmail.subtitle", "Use o email abaixo para criar sua conta e acessar o conteúdo")}
          </p>
        </div>

        <Card className="p-6 shadow-card border border-border">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {t("auth.fullName")}
              </Label>
              <Input
                id="signup-name"
                type="text"
                placeholder={t("auth.fullNamePlaceholder")}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("auth.email")}
              </Label>
              <Input
                id="signup-email"
                type="email"
                required
                readOnly
                className="bg-muted cursor-not-allowed opacity-80"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t("auth.confirmEmail", "Confirme seu email")}
              </Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t("auth.confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("signupFromEmail.createAccount", "Criar minha conta")}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/auth")} className="text-sm text-muted-foreground">
              {t("signupFromEmail.alreadyRegistered", "Já tem conta? Faça login")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupFromEmail;
