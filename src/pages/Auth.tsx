import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Mail, Lock, ArrowLeft, User, Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createPendingAccount, createPurchasedAccount } from "@/lib/purchasedSignup";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Determina se é fluxo de compra baseado se existe 'email' na URL
  const isPurchaseFlow = !!searchParams.get("email");

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [isLoginErrorDialogOpen, setIsLoginErrorDialogOpen] = useState(false);
  const [loginErrorType, setLoginErrorType] = useState<"invalid" | "noService" | "unconfirmed">("invalid");
  const [isNoPurchaseDialogOpen, setIsNoPurchaseDialogOpen] = useState(false);
  const [lastPurchaseCheck, setLastPurchaseCheck] = useState<boolean>(false);

  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    // Preenche o email se vier da página de compra
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    // Auto-open reset dialog if redirected from ALREADY_EXISTS
    if (searchParams.get("showReset") === "true" && emailParam) {
      setResetEmail(emailParam);
      setIsResetDialogOpen(true);
    }
  }, [navigate, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: t("common.error"),
        description: t("auth.emailRequired", "Por favor, digite seu e-mail."),
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: resetEmail },
      });

      if (error) throw error;

      toast({
        title: t("auth.emailSent", "E-mail enviado!"),
        description: t("auth.checkEmailReset", "Verifique sua caixa de entrada para redefinir a senha."),
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const normalizedLoginEmail = email.trim().toLowerCase().replace(/\.+$/, "");

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedLoginEmail,
        password,
      });

      if (!rememberMe) {
        localStorage.setItem("clearSessionOnLogout", "true");
      } else {
        localStorage.removeItem("clearSessionOnLogout");
      }

      if (error) {
        const message = String(error.message || "").toLowerCase();
        const isUnconfirmed = message.includes("email not confirmed") || message.includes("not confirmed");

        setLoginErrorType(isUnconfirmed ? "unconfirmed" : "invalid");
        setIsLoginErrorDialogOpen(true);
        return;
      }

      // Reconcilia billing events pendentes no login
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc("process_pending_billing_events", {
            p_user_id: user.id,
            p_email: normalizedLoginEmail,
          });
          console.log("Billing reconciliation on login completed for:", normalizedLoginEmail);
        }
      } catch (rpcErr) {
        console.error("Billing reconciliation on login error:", rpcErr);
      }

      // Premium access is now checked by PremiumGuard on protected pages
      console.log("[Auth] Login successful for:", normalizedLoginEmail);

      const { data: { user } } = await supabase.auth.getUser();
      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.description") + (user?.user_metadata?.full_name || email),
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const performSignup = async (hasPurchase: boolean) => {
    const currentLanguage = navigator.language || i18n.language || "en";
    const signupResult = hasPurchase
      ? await createPurchasedAccount({
        email,
        password,
        fullName: fullName.trim(),
        preferredLanguage: currentLanguage,
      })
      : await createPendingAccount({
      email,
      password,
      fullName: fullName.trim(),
      preferredLanguage: currentLanguage,
    });

    if (!signupResult.ok) {
      setIsLoading(false);
      if (signupResult.code === "ALREADY_EXISTS") {
        toast({
          title: t("auth.signupError"),
          description: t("auth.alreadyExistsResetHint", "Você já tem uma conta! Se não lembra a senha, use a opção 'Esqueceu a senha?' abaixo."),
          variant: "destructive",
        });
        navigate(`/auth?email=${encodeURIComponent(email)}&tab=login&showReset=true`, { replace: true });
        return;
      }

      toast({
        title: t("auth.signupError"),
        description: signupResult.message,
        variant: "destructive",
      });
      return;
    }

    if (!hasPurchase) {
      setIsLoading(false);
      toast({
        title: t("auth.signupSuccess"),
        description: t(
          "auth.pendingAccessMessage",
          "Conta criada com sucesso. O acesso sera liberado automaticamente apos a compra.",
        ),
      });
      navigate(`/auth?email=${encodeURIComponent(email)}&tab=login`, { replace: true });
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setIsLoading(false);
      toast({
        title: t("auth.signupSuccess"),
        description: t("auth.loginTab"),
      });
      navigate(`/auth?email=${encodeURIComponent(email)}&tab=login`, { replace: true });
      return;
    }

    setIsLoading(false);

    toast({
      title: t("auth.signupSuccess"),
      description: t("common.loading"),
    });
    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: t("auth.signupError"),
        description: t("auth.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    // Apenas valida a confirmação de e-mail SE for fluxo de compra
    if (isPurchaseFlow) {
      if (email !== confirmEmail) {
        toast({
          title: t("auth.signupError", "Erro no cadastro"),
          description: t("auth.emailMismatch", "Os e-mails digitados não coincidem."),
          variant: "destructive",
        });
        return;
      }
    }

    if (password !== confirmPassword) {
      toast({
        title: t("auth.loginError"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t("auth.loginError"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: hasPurchase, error: purchaseError } = await supabase
        .rpc("check_purchase_exists" as any, { p_email: email });

      if (purchaseError) {
        console.error("Error checking purchase status:", purchaseError);
        setIsLoading(false);
        toast({
          title: t("auth.signupError"),
          description: t("common.error"),
          variant: "destructive",
        });
        return;
      }

      if (hasPurchase === false) {
        setLastPurchaseCheck(false);
        setIsLoading(false);
        setIsNoPurchaseDialogOpen(true);
        return;
      }

      setLastPurchaseCheck(true);
    } catch (purchaseErr) {
      console.error("Exception checking purchase status:", purchaseErr);
      setIsLoading(false);
      toast({
        title: t("auth.signupError"),
        description: t("common.error"),
        variant: "destructive",
      });
      return;
    }

    await performSignup(true);
  };

  const handleContinueSignup = async () => {
    setIsNoPurchaseDialogOpen(false);
    setIsLoading(true);
    await performSignup(lastPurchaseCheck);
  };

  const loginErrorTitle =
    loginErrorType === "noService"
      ? t("auth.noActiveServiceTitle", "Sem servico ativo")
      : loginErrorType === "unconfirmed"
        ? t("auth.emailNotConfirmedTitle", "Conta criada, mas ainda não ativada")
        : t("auth.invalidLoginTitle");
  const loginErrorDescription =
    loginErrorType === "noService"
      ? t(
        "auth.noActiveServiceDescription",
        "Nao ha servico ativo para este email. Verifique se a compra foi feita com o mesmo email cadastrado."
      )
      : loginErrorType === "unconfirmed"
        ? t(
          "auth.emailNotConfirmedDescription",
          "Detectamos sua conta, mas o email ainda não foi confirmado. Use o botão de redefinir senha para ativar e acessar."
        )
        : t(
          "auth.accountNotFoundDescription",
          "E-mail ou senha incorretos. Verifique os dados ou redefina sua senha."
        );
  const supportEmail = "contact@educly.app";
  const noPurchaseDescription = t(
    "auth.noPurchaseDescription",
    "Nao localizamos uma compra vinculada a este e-mail. Verifique se voce informou o mesmo e-mail usado na compra. Se ainda nao comprou, acesse o link abaixo."
  );
  const loginErrorLines =
    loginErrorType === "noService"
      ? loginErrorDescription
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      : loginErrorType === "unconfirmed"
        ? [
          t("auth.emailNotConfirmedStep1", "A conta foi encontrada para este e-mail."),
          t("auth.emailNotConfirmedStep2", "Toque em 'Esqueceu a senha?' para ativar e definir uma nova senha."),
          t("auth.emailNotConfirmedStep3", `Se continuar com problema, fale com ${supportEmail}`),
        ]
        : [
          t("auth.accountNotFoundStep1"),
          t("auth.accountNotFoundStep2"),
          t("auth.accountNotFoundStep3")
        ];
  const noPurchaseLines = noPurchaseDescription
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background safe-area-inset">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 pt-safe">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md space-y-4 sm:space-y-6 animate-fade-in-up">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back")}
        </Button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("auth.title")}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("landing.title")} <span className="text-primary">{t("landing.subtitle")}</span>
          </h1>
          <p className="text-muted-foreground">{t("auth.description")}</p>
        </div>

        <Card className="p-6 shadow-card border border-border">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-surface">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("auth.loginTab")}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t("auth.signupTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      {t("auth.password")}
                    </Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setResetEmail(email);
                        setIsResetDialogOpen(true);
                      }}
                      type="button"
                    >
                      {t("auth.forgotPassword", "Esqueceu a senha?")}
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
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
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    {t("auth.rememberMe", "Mantenha conectado")}
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("common.loading") : t("auth.loginButton")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
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

                {/* CAMPO DE EMAIL INTELIGENTE */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    // SE FOR COMPRA: Trava o campo e deixa cinza
                    readOnly={isPurchaseFlow}
                    className={isPurchaseFlow ? "bg-muted cursor-not-allowed opacity-80" : ""}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* CAMPO DE CONFIRMAÇÃO: SÓ APARECE SE FOR COMPRA */}
                {isPurchaseFlow && (
                  <div className="space-y-2 animate-fade-in-up">
                    <Label htmlFor="signup-confirm-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {t("auth.confirmEmail", "Confirme seu e-mail")}
                    </Label>
                    <Input
                      id="signup-confirm-email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder", "Digite seu e-mail novamente")}
                      required
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    {t("auth.password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    {t("auth.confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      required
                      minLength={6}
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
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("common.loading") : t("auth.signupButton")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.resetPasswordTitle", "Recuperar Senha")}</DialogTitle>
            <DialogDescription>
              {t("auth.resetPasswordDesc", "Digite seu e-mail para receber um link de redefinição de senha.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("auth.email")}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isResetLoading}>
                {isResetLoading ? t("common.loading") : t("auth.sendResetLink", "Enviar Link")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginErrorDialogOpen} onOpenChange={setIsLoginErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div style={{ height: "15px", width: "100%" }}></div>
            <DialogTitle className="text-base font-semibold leading-snug">
              {loginErrorTitle}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              <ol className="mt-2 space-y-4">
                {loginErrorLines.map((line, index) => {
                  const isLast = index === loginErrorLines.length - 1;
                  const isBreak = index === loginErrorLines.length - 2;

                  return (
                    <li key={index} className="relative pl-8">
                      <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      {!isLast && (
                        <span
                          className={`absolute left-3 top-7 h-full w-px ${isBreak
                            ? "border-l-2 border-dashed border-muted-foreground/40"
                            : "border-l-2 border-solid border-muted-foreground/25"
                            }`}
                        />
                      )}
                      {isBreak && (
                        <span className="absolute left-2.5 top-[2.25rem] h-2 w-2 rounded-full border border-muted-foreground/40 bg-background" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {line.includes(supportEmail) ? (
                          <>
                            {line.split(supportEmail)[0]}
                            <a
                              href={`mailto:${supportEmail}`}
                              className="text-primary underline underline-offset-4"
                            >
                              {supportEmail}
                            </a>
                            {line.split(supportEmail)[1] ?? ""}
                          </>
                        ) : (
                          line
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setResetEmail(email.trim());
                setIsLoginErrorDialogOpen(false);
                setIsResetDialogOpen(true);
              }}
            >
              {t("auth.forgotPassword", "Esqueceu a senha?")}
            </Button>
            <Button
              type="button"
              onClick={() => setIsLoginErrorDialogOpen(false)}
              className="w-full"
            >
              {t("common.ok", "OK")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoPurchaseDialogOpen} onOpenChange={setIsNoPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div style={{ height: "15px", width: "100%" }}></div>
            <DialogTitle className="text-base font-semibold leading-snug">
              {t("auth.noPurchaseTitle", "Compra nao identificada")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              <ol className="mt-2 space-y-4">
                {noPurchaseLines.map((line, index) => {
                  const isLast = index === noPurchaseLines.length - 1;
                  const isBreak = index === noPurchaseLines.length - 2;

                  return (
                    <li key={index} className="relative pl-8">
                      <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      {!isLast && (
                        <span
                          className={`absolute left-3 top-7 h-full w-px ${isBreak
                            ? "border-l-2 border-dashed border-muted-foreground/40"
                            : "border-l-2 border-solid border-muted-foreground/25"
                            }`}
                        />
                      )}
                      {isBreak && (
                        <span className="absolute left-2.5 top-[2.25rem] h-2 w-2 rounded-full border border-muted-foreground/40 bg-background" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {line.includes(supportEmail) ? (
                          <>
                            {line.split(supportEmail)[0]}
                            <a
                              href={`mailto:${supportEmail}`}
                              className="text-primary underline underline-offset-4"
                            >
                              {supportEmail}
                            </a>
                            {line.split(supportEmail)[1] ?? ""}
                          </>
                        ) : (
                          line
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleContinueSignup}
              className="w-full"
            >
              {t("auth.noPurchaseContinue", "Continuar cadastro")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
