import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createPurchasedAccount } from "@/lib/purchasedSignup";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

const isValidEmail = (email: string) => {
  if (!email) return false;
  if (email.includes('%') || email.includes('{{') || email.includes('{')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const SignupFromEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const rawEmailParam = searchParams.get("email") || "";
  const emailParam = isValidEmail(rawEmailParam) ? rawEmailParam : "";
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

        // If purchase exists, check if user already has an account
        if (purchaseExists) {
          const { data: userExists } = await supabase.rpc("check_user_exists_by_email" as any, { p_email: emailParam });
          if (userExists) {
            setHasAccount(true);
            setCheckingAccount(false);
            return;
          }
        }
      } catch {
        setHasPurchase(null);
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

    const currentLanguage = langParam || navigator.language || i18n.language || "en";
    const signupResult = await createPurchasedAccount({
      email,
      password,
      fullName: fullName.trim(),
      preferredLanguage: currentLanguage,
    });

    if (!signupResult.ok) {
      setIsLoading(false);
      if (signupResult.code === "ALREADY_EXISTS") {
        setHasAccount(true);
        return;
      }
      toast({ title: t("auth.signupError"), description: signupResult.message, variant: "destructive" });
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setIsLoading(false);
      toast({ title: t("auth.signupSuccess"), description: t("auth.loginTab") });
      navigate(`/auth?email=${encodeURIComponent(email)}&tab=login`, { replace: true });
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

  // No email or invalid email (e.g. unresolved template %email%)
  if (!emailParam) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="absolute top-4 right-4 z-50"><LanguageSelector /></div>
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <h2 className="text-xl font-bold text-foreground">{t("signupFromEmail.invalidLink", "Link inválido")}</h2>
          <p className="text-muted-foreground">
            {t("signupFromEmail.useEmailLink", "Use o link enviado no seu email de compra.")}
          </p>
          {rawEmailParam && !isValidEmail(rawEmailParam) && (
            <p className="text-sm text-destructive">
              {t("signupFromEmail.invalidEmail", "O email no link não é válido. Verifique o link original.")}
            </p>
          )}
          <div className="space-y-2">
            <Button onClick={() => navigate("/auth")} className="w-full" size="lg">{t("auth.loginTab")}</Button>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:contact@educly.app">{t("signupFromEmail.contactSupport", "Contatar suporte")}</a>
            </Button>
          </div>
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
          <Button onClick={() => navigate(`/auth?email=${encodeURIComponent(emailParam)}&tab=login`)} className="w-full" size="lg">
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
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:contact@educly.app">
                {t("signupFromEmail.contactSupport", "Contatar suporte")}
              </a>
            </Button>
            <Button onClick={() => navigate("/auth")} variant="ghost" className="w-full">
              {t("auth.loginTab")}
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
