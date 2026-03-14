import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RotateCcw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatPremiumGate } from "@/components/chat/ChatPremiumGate";
import { AssistantsTutorial } from "@/components/onboarding";
import { ProductGuard } from "@/components/ProductGuard";
import { MobileNav } from "@/components/MobileNav";
import { AIModelSelector, AI_MODELS } from "@/components/assistentes/AIModelSelector";
import { AISidebar } from "@/components/assistentes/AISidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import nanobananaLogo from "@/assets/ai-logos/nanobanana.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DAILY_MESSAGE_LIMIT = 50;
const DAILY_IMAGE_LIMIT = 10;

const AssistentesContent = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { isPremium, isLoading: premiumLoading, checkoutUrl } = usePremiumAccess();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<"chat" | "creative">("chat");
  const [activeModel, setActiveModel] = useState("chatgpt");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usageToday, setUsageToday] = useState(0);
  const [imagesUsed, setImagesUsed] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAiType = mode === "creative" ? "nanobanana" : activeModel;

  // Get logo for current AI
  const getCurrentLogo = () => {
    if (mode === "creative") return nanobananaLogo;
    const model = AI_MODELS.find((m) => m.id === activeModel);
    return model?.logoSrc || AI_MODELS[0].logoSrc;
  };

  // Auth check + usage fetch
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("ai_hub_usage")
        .select("messages_today, images_today")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (data) {
        setUsageToday(data.messages_today);
        setImagesUsed(data.images_today);
      }
    };
    init();
  }, [navigate]);

  // Set greeting when model/mode changes
  useEffect(() => {
    if (!isPremium) return;
    const greetingKey = `assistants.${currentAiType}.greeting`;
    setMessages([{ id: "greeting", role: "assistant", content: t(greetingKey) }]);
  }, [isPremium, currentAiType, t, i18n.language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModelChange = (modelId: string) => {
    setActiveModel(modelId);
  };

  const handleModeChange = (newMode: "chat" | "creative") => {
    setMode(newMode);
    setSidebarOpen(false);
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: t("chat.error.notLoggedIn"), variant: "destructive" });
        return;
      }

      const apiMessages = messages
        .filter((m) => m.id !== "greeting")
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistentes-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: apiMessages, aiType: currentAiType, language: i18n.language }),
        }
      );

      if (!response.ok) {
        let errorMsg = t("chat.error.sendError");
        try { const err = await response.json(); if (err?.error) errorMsg = err.error; } catch { }
        if (response.status === 429) errorMsg = t("assistants.rateLimit.message");
        toast({ title: errorMsg, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Image response (nanobanana)
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        if (data.type === "creative") {
          const content = data.imageUrl ? `${data.text}\n\n[IMAGE:${data.imageUrl}]` : data.text;
          setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content }]);
          setImagesUsed((p) => p + 1);
          setIsLoading(false);
          return;
        }
      }

      // Stream text
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: "" }]);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const last = newMessages[newMessages.length - 1];
                  if (last?.role === "assistant") last.content = assistantContent;
                  return newMessages;
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }

      setUsageToday((p) => p + 1);

      // Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (user && assistantContent) {
        await supabase.from("chat_messages").insert([
          { user_id: user.id, role: "user", content: userMessage.content, ai_assistant_type: currentAiType },
          { user_id: user.id, role: "assistant", content: assistantContent, ai_assistant_type: currentAiType },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({ title: t("chat.error.sendError"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const greetingKey = `assistants.${currentAiType}.greeting`;
    setMessages([{ id: "greeting", role: "assistant", content: t(greetingKey) }]);
  };

  if (premiumLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-background safe-area-inset">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>
          <ChatPremiumGate />
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <AISidebar
      mode={mode}
      onModeChange={handleModeChange}
      usageToday={usageToday}
      imagesUsed={imagesUsed}
      messageLimit={DAILY_MESSAGE_LIMIT}
      imageLimit={DAILY_IMAGE_LIMIT}
    />
  );

  const currentName = mode === "creative"
    ? t("assistants.nanobanana.name")
    : t(AI_MODELS.find((m) => m.id === activeModel)?.nameKey || "assistants.chatgpt.name");

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      <AssistantsTutorial />

      {/* Desktop sidebar */}
      {!isMobile && sidebarContent}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-10 px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile hamburger */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="w-4 h-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[220px]">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              )}

              {/* Model selector or creative label */}
              {mode === "chat" ? (
                <AIModelSelector activeModel={activeModel} onSelect={handleModelChange} />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl overflow-hidden p-1 bg-amber-500/10">
                    <img src={nanobananaLogo} alt="NanoBanana" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{t("assistants.nanobanana.name")}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Usage pill */}
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full hidden sm:block">
                {mode === "creative"
                  ? `🎨 ${imagesUsed}/${DAILY_IMAGE_LIMIT}`
                  : `💬 ${usageToday}/${DAILY_MESSAGE_LIMIT}`}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                avatarUrl={message.role === "assistant" ? getCurrentLogo() : undefined}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-muted p-1">
                  <img src={getCurrentLogo()} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 border-t border-border bg-background px-3 py-3 pb-safe">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder={
                mode === "creative"
                  ? t("assistants.nanobanana.greeting").slice(0, 50) + "..."
                  : t("assistants.inputPlaceholder")
              }
            />
          </div>
        </div>
      </div>

      {!isMobile && <div className="pb-0" />}
      {isMobile && <MobileNav />}
    </div>
  );
};

const Assistentes = () => {
  return (
    <ProductGuard productType="ai_hub" mode="overlay">
      <AssistentesContent />
    </ProductGuard>
  );
};

export default Assistentes;
