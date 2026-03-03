import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./global.css";
import "./i18n";
import { supabase } from "@/integrations/supabase/client";

const CONFIG = {
  TOKEN: import.meta.env.VITE_TELEGRAM_TOKEN,
  CHAT_ID: import.meta.env.VITE_TELEGRAM_CHAT_ID,
};

// === CACHES (1 chamada por sessão) ===
let cachedGeo: string | null = null;
let cachedUsuario: { email: string | undefined; id: string } | null = null;

// === RATE LIMITING (max 3 alertas por minuto) ===
const alertTimestamps: number[] = [];
const MAX_ALERTS_PER_MINUTE = 3;

const isRateLimited = (): boolean => {
  const now = Date.now();
  // Remove timestamps older than 60s
  while (alertTimestamps.length > 0 && now - alertTimestamps[0] > 60000) {
    alertTimestamps.shift();
  }
  return alertTimestamps.length >= MAX_ALERTS_PER_MINUTE;
};

// === FILTRO DE WARNINGS ===
const IGNORED_PATTERNS = [
  "Warning:",
  "forwardRef",
  "React does not recognize",
  "Invalid DOM property",
  "Each child in a list",
];

const shouldIgnore = (msg: string): boolean => {
  if (typeof msg !== "string") return false;
  return IGNORED_PATTERNS.some((p) => msg.includes(p));
};

// Função para buscar localização via IP (com cache)
const obterLocalizacaoPorIP = async (): Promise<string> => {
  if (cachedGeo) return cachedGeo;
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    cachedGeo = `${data.city}, ${data.region} - ${data.country_name}`;
    return cachedGeo;
  } catch (e) {
    return "Localização Indisponível";
  }
};

const escaparHTML = (str: string) => {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").substring(0, 500);
};

const obterDadosUsuario = async () => {
  if (cachedUsuario) return cachedUsuario;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      cachedUsuario = { email: session.user.email, id: session.user.id };
      return cachedUsuario;
    }
  } catch (e) { return null; }
  return { email: "Visitante", id: "N/A" };
};

const enviarAlertaTelegram = async (dados: any) => {
  // Rate limiting check
  if (isRateLimited()) return;

  const [usuario, geo] = await Promise.all([obterDadosUsuario(), obterLocalizacaoPorIP()]);
  const erroEscapado = escaparHTML(String(dados.mensagem));

  const memoria = (performance as any).memory
      ? `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
      : "N/A";

  const mensagem =
      `🕵️ <b>AGENTE EDUCLY: ALERTA TÉCNICO</b>\n\n` +
      `👤 <b>Cliente:</b> ${usuario?.email}\n` +
      `🆔 <b>ID:</b> <code>${usuario?.id}</code>\n` +
      `📍 <b>Origem:</b> <code>${geo}</code>\n\n` +
      `🛠️ <b>Diag:</b> Anomalia de Execução\n` +
      `📍 <b>Local:</b> ${document.title}\n` +
      `--- <b>DADOS DO AMBIENTE</b> ---\n` +
      `<b>Erro:</b> <code>${erroEscapado}</code>\n` +
      `<b>RAM App:</b> ${memoria}\n` +
      `<b>Nível:</b> ${dados.nivel || "INFO"}`;

  try {
    alertTimestamps.push(Date.now());
    await fetch(`https://api.telegram.org/bot${CONFIG.TOKEN}/sendMessage`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CONFIG.CHAT_ID, text: mensagem, parse_mode: "HTML" }),
    });
  } catch (e) { /* Silêncio */ }
};

// Listeners Globais
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  originalConsoleError.apply(console, args);
  const msg = String(args[0] || "");
  if (shouldIgnore(msg)) return;
  enviarAlertaTelegram({ nivel: "🟠 CONSOLE", mensagem: args[0] });
};

window.onerror = (msg) => {
  enviarAlertaTelegram({ nivel: "🔴 CRÍTICO", mensagem: msg });
  return false;
};

window.onunhandledrejection = (event) => {
  enviarAlertaTelegram({ nivel: "🔴 PROMESSA", mensagem: event.reason?.message || event.reason });
};
createRoot(document.getElementById("root")!).render(<App />);