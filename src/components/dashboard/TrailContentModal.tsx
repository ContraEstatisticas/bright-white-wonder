import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// AI logos
import chatgptLogo from "@/assets/ai-logos/chatgpt.png";
import claudeLogo from "@/assets/ai-logos/claude.png";
import deepseekLogo from "@/assets/ai-logos/deepseek.png";
import geminiLogo from "@/assets/ai-logos/gemini.png";
import copilotLogo from "@/assets/ai-logos/copilot.png";
import grokLogo from "@/assets/ai-logos/grok.png";
import perplexityLogo from "@/assets/ai-logos/perplexity.png";
import manusLogo from "@/assets/ai-logos/manus.png";
import lovableLogo from "@/assets/ai-logos/lovable.png";
import nanobananaLogo from "@/assets/ai-logos/nanobanana.png";
import leonardoLogo from "@/assets/ai-logos/leonardo.png";
import midjourneyLogo from "@/assets/ai-logos/midjourney.png";
import captionsLogo from "@/assets/ai-logos/captions.png";
import elevenlabsLogo from "@/assets/ai-logos/elevenlabs.png";
import veoLogo from "@/assets/ai-logos/veo.png";

interface TrailContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AI_ITEMS = [
  {
    name: "ChatGPT",
    logo: chatgptLogo,
    color: "#10a37f",
    days: "Dias 1–4",
    category: "Escrita & Chat",
    description: "O assistente mais popular do mundo. Aprenda a usá-lo do zero ao avançado.",
  },
  {
    name: "Claude",
    logo: claudeLogo,
    color: "#8b5cf6",
    days: "Dias 5–6",
    category: "Análise & Redação",
    description: "Ideal para textos longos, análise de documentos e raciocínio detalhado.",
  },
  {
    name: "DeepSeek",
    logo: deepseekLogo,
    color: "#1e3a8a",
    days: "Dias 7–8",
    category: "Programação",
    description: "IA poderosa para código e análise técnica com custo zero.",
  },
  {
    name: "Gemini",
    logo: geminiLogo,
    color: "#4285f4",
    days: "Dias 9–10",
    category: "Multimodal",
    description: "A IA do Google: imagens, documentos, buscas e integração com G Suite.",
  },
  {
    name: "Copilot",
    logo: copilotLogo,
    color: "#0078d4",
    days: "Dias 11–12",
    category: "Produtividade",
    description: "IA da Microsoft integrada ao Word, Excel, Teams e Windows.",
  },
  {
    name: "Grok",
    logo: grokLogo,
    color: "#374151",
    days: "Dias 13–14",
    category: "Análise & Pesquisa",
    description: "IA do X (Twitter) com acesso em tempo real a notícias e conversas.",
  },
  {
    name: "Perplexity",
    logo: perplexityLogo,
    color: "#1fb8cd",
    days: "Dias 15–16",
    category: "Pesquisa com IA",
    description: "Buscador impulsionado por IA que cita fontes e responde com precisão.",
  },
  {
    name: "Manus",
    logo: manusLogo,
    color: "#ff6b35",
    days: "Dias 17–18",
    category: "Agente Autônomo",
    description: "Agente de IA que executa tarefas complexas de forma independente.",
  },
  {
    name: "Lovable",
    logo: lovableLogo,
    color: "#6366f1",
    days: "Dias 19–20",
    category: "Criação de Apps",
    description: "Crie aplicativos completos em minutos apenas descrevendo o que quer.",
  },
  {
    name: "NanoBanana",
    logo: nanobananaLogo,
    color: "#f59e0b",
    days: "Dia 21",
    category: "IA Brasileira",
    description: "A IA nacional: treinada para o contexto e o português do Brasil.",
  },
  {
    name: "LeonardoAI",
    logo: leonardoLogo,
    color: "#7c3aed",
    days: "Dia 22",
    category: "Imagens com IA",
    description: "Gere imagens profissionais e assets visuais para qualquer projeto.",
  },
  {
    name: "MidJourney",
    logo: midjourneyLogo,
    color: "#6b7280",
    days: "Dia 23",
    category: "Arte com IA",
    description: "A ferramenta preferida de designers para criar arte e conceitos visuais.",
  },
  {
    name: "Captions",
    logo: captionsLogo,
    color: "#ec4899",
    days: "Dia 24",
    category: "Vídeo & Reels",
    description: "Edite e crie vídeos curtos com IA — legendas, cortes e efeitos automáticos.",
  },
  {
    name: "ElevenLabs",
    logo: elevenlabsLogo,
    color: "#f97316",
    days: "Dia 25",
    category: "Voz & Narração",
    description: "Clone vozes, crie narrações e produza áudios hiper-realistas com IA.",
  },
  {
    name: "VEO",
    logo: veoLogo,
    color: "#ea4335",
    days: "Dias 26–28",
    category: "Vídeo com IA",
    description: "A IA de vídeo do Google: transforme texto e imagens em vídeos cinematográficos.",
  },
];

export function TrailContentModal({ open, onOpenChange }: TrailContentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            🤖 O que você vai aprender nas trilhas
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
            28 dias · 15 IAs · do básico ao avançado
          </p>
        </DialogHeader>

        {/* Scrollable grid */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AI_ITEMS.map((ai) => (
              <div
                key={ai.name}
                className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Color accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: ai.color }}
                />

                {/* Logo + days row */}
                <div className="flex items-center justify-between mt-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ backgroundColor: `${ai.color}18` }}
                  >
                    <img
                      src={ai.logo}
                      alt={ai.name}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {ai.days}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {ai.name}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] mt-0.5 px-1.5 py-0 h-4 border-0 rounded-md font-medium"
                    style={{ backgroundColor: `${ai.color}18`, color: ai.color }}
                  >
                    {ai.category}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 dark:text-muted-foreground leading-snug">
                  {ai.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            🎯 Ao completar as trilhas você terá domínio prático das IAs mais usadas no mercado
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
