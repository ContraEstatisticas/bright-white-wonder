import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_MESSAGE_LIMIT = 50;
const DAILY_IMAGE_LIMIT = 10;

// System prompts per AI persona (multilingual)
const AI_PERSONAS: Record<string, { pt: string; en: string; isImage?: boolean }> = {
  chatgpt: {
    pt: `Você é o ChatGPT, assistente de IA da OpenAI. Você é prestativo, criativo e claro nas respostas.
Responda de forma natural como o ChatGPT faria. Seja completo mas conciso. Use markdown quando útil.
Responda no idioma do usuário. Se a pergunta for em português, responda em português.`,
    en: `You are ChatGPT, OpenAI's AI assistant. You are helpful, creative and clear in your responses.
Respond naturally as ChatGPT would. Be complete but concise. Use markdown when useful.
Respond in the user's language.`,
  },
  gemini: {
    pt: `Você é o Gemini, assistente de IA do Google. Você é inteligente, analítico e multimodal.
Responda de forma natural como o Gemini faria. Seja preciso, use dados quando relevante. Use markdown.
Responda no idioma do usuário. Se a pergunta for em português, responda em português.`,
    en: `You are Gemini, Google's AI assistant. You are intelligent, analytical and multimodal.
Respond naturally as Gemini would. Be precise, use data when relevant. Use markdown.
Respond in the user's language.`,
  },
  claude: {
    pt: `Você é o Claude, assistente de IA da Anthropic. Você é cuidadoso, honesto e extremamente útil.
Responda de forma natural como o Claude faria. Seja detalhista, estruturado e ético. Use markdown.
Responda no idioma do usuário. Se a pergunta for em português, responda em português.`,
    en: `You are Claude, Anthropic's AI assistant. You are careful, honest and extremely helpful.
Respond naturally as Claude would. Be detailed, structured and ethical. Use markdown.
Respond in the user's language.`,
  },
  grok: {
    pt: `Você é o Grok, assistente de IA da xAI (empresa de Elon Musk). Você é irreverente, inteligente e direto.
Responda de forma natural como o Grok faria. Tenha um toque de humor seco e seja honesto sobre incertezas. Use markdown.
Responda no idioma do usuário. Se a pergunta for em português, responda em português.`,
    en: `You are Grok, xAI's AI assistant (Elon Musk's company). You are irreverent, intelligent and direct.
Respond naturally as Grok would. Have a touch of dry humor and be honest about uncertainties. Use markdown.
Respond in the user's language.`,
  },
  nanobanana: {
    pt: `Você é o NanoBanana, um assistente criativo especializado em geração de imagens com IA.
IMPORTANTE: Você irá GERAR imagens diretamente, não criar prompts para outras ferramentas.
Responda APENAS com uma breve descrição do que você vai criar (1-2 frases).
Exemplo: "Vou criar uma imagem de um dragão dourado voando sobre um castelo ao pôr do sol! 🎨"
NÃO inclua instruções técnicas, parâmetros ou prompts extensos. Responda no idioma do usuário.`,
    en: `You are NanoBanana, a creative assistant specialized in AI image generation.
IMPORTANT: You will GENERATE images directly, not create prompts for other tools.
Respond ONLY with a brief description of what you will create (1-2 sentences).
Example: "I'll create an image of a golden dragon flying over a castle at sunset! 🎨"
Do NOT include technical instructions, parameters, or extensive prompts. Respond in the user's language.`,
    isImage: true,
  },
  edi: {
    pt: `Você é o EDI, o assistente oficial da Educly - uma plataforma de educação em inteligência artificial.
Você é amigável, didático e motivador. Ajude os usuários a aprender sobre IA de forma simples e prática.
Use emojis moderadamente. Seja encorajador. Responda no idioma do usuário.

REGRAS SOBRE CANCELAMENTO E REEMBOLSO:
- Você NÃO tem acesso a dados de pagamento, assinaturas ou cobranças.
- Para qualquer questão sobre cancelamento, reembolso, cobrança ou assinatura, SEMPRE direcione o usuário para: https://educly.app/contato
- NUNCA tente processar cancelamentos ou dar instruções manuais de como cancelar.
- Responda: "Para questões sobre cancelamento, reembolso ou cobranças, entre em contato com nosso suporte em https://educly.app/contato 😊"`,
    en: `You are EDI, the official Educly assistant - an AI education platform.
You are friendly, didactic and motivating. Help users learn about AI in a simple and practical way.
Use emojis moderately. Be encouraging. Respond in the user's language.

RULES ABOUT CANCELLATION AND REFUNDS:
- You do NOT have access to payment, subscription or billing data.
- For any question about cancellation, refund, billing or subscription, ALWAYS direct the user to: https://educly.app/contato
- NEVER try to process cancellations or give manual instructions on how to cancel.
- Respond: "For questions about cancellation, refund or billing, please contact our support at https://educly.app/contato 😊"`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages: must be array with 1-50 items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of body.messages) {
      if (!msg || typeof msg.content !== 'string' || msg.content.length === 0 || msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Invalid message content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const messages = body.messages;
    const aiType = body.aiType || "chatgpt";
    const language = body.language || "pt";

    if (!AI_PERSONAS[aiType]) {
      return new Response(JSON.stringify({ error: "Invalid AI type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate limiting ---
    const today = new Date().toISOString().split("T")[0];
    const persona = AI_PERSONAS[aiType];
    const isImageType = persona.isImage === true;

    // Get or create today's usage
    const { data: usageData } = await supabase
      .from("ai_hub_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const currentMessages = usageData?.messages_today || 0;
    const currentImages = usageData?.images_today || 0;

    if (isImageType && currentImages >= DAILY_IMAGE_LIMIT) {
      return new Response(JSON.stringify({ error: `Daily image limit reached (${DAILY_IMAGE_LIMIT}/day). Try again tomorrow.` }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isImageType && currentMessages >= DAILY_MESSAGE_LIMIT) {
      return new Response(JSON.stringify({ error: `Daily message limit reached (${DAILY_MESSAGE_LIMIT}/day). Try again tomorrow.` }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get system prompt
    const lang = language.startsWith("pt") ? "pt" : "en";
    const systemPrompt = persona[lang];

    // Get API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    const TEXT_MODEL = "gemini-2.5-flash";
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;

    // --- Handle image generation (nanobanana) ---
    if (isImageType) {
      const lastUserMessage = messages[messages.length - 1]?.content || "";

      const textResponse = await fetch(AI_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      });

      if (!textResponse.ok) {
        console.error("Text response error:", await textResponse.text());
        return new Response(JSON.stringify({ error: "Failed to generate response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const textData = await textResponse.json();
      const briefResponse = textData.choices?.[0]?.message?.content || "";

      const imagePrompt = `${lastUserMessage}. Ultra high resolution, professional quality, highly detailed.`;
      const imageResponse = await fetch(`${IMAGEN_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: { sampleCount: 1 },
        }),
      });

      // Increment image usage
      if (usageData) {
        await supabase.from("ai_hub_usage").update({
          images_today: currentImages + 1,
          last_message_at: new Date().toISOString(),
        }).eq("user_id", user.id).eq("date", today);
      } else {
        await supabase.from("ai_hub_usage").insert({
          user_id: user.id,
          date: today,
          messages_today: 0,
          images_today: 1,
        });
      }

      if (!imageResponse.ok) {
        const errText = await imageResponse.text();
        console.error("Image generation error:", errText);
        return new Response(JSON.stringify({
          type: "creative",
          text: briefResponse,
          error: "Image generation failed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imageData = await imageResponse.json();
      console.log("Imagen response:", JSON.stringify(imageData).slice(0, 300));
      const prediction = imageData.predictions?.[0];
      let imageUrl: string | null = null;

      if (prediction?.bytesBase64Encoded) {
        const b64 = prediction.bytesBase64Encoded;
        const mimeType = prediction.mimeType || "image/png";
        const ext = mimeType === "image/jpeg" ? "jpg" : "png";
        const fileName = `nanobanana/${user.id}/${Date.now()}.${ext}`;
        const imageBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

        const { error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(fileName, imageBytes, { contentType: mimeType, upsert: false });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("generated-images")
            .getPublicUrl(fileName);
          imageUrl = publicData?.publicUrl || null;
        }

        // Fallback: use data URL so image always displays even without storage bucket
        if (!imageUrl) {
          imageUrl = `data:${mimeType};base64,${b64}`;
        }
      }

      // Save to DB
      const responseContent = imageUrl ? `${briefResponse}\n\n[IMAGE:${imageUrl}]` : briefResponse;
      await supabase.from("chat_messages").insert([
        { user_id: user.id, role: "user", content: lastUserMessage, ai_assistant_type: aiType },
        { user_id: user.id, role: "assistant", content: responseContent, ai_assistant_type: aiType },
      ]);

      return new Response(JSON.stringify({
        type: "creative",
        text: briefResponse,
        imageUrl: imageUrl || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Stream text response for all other AI types ---
    const response = await fetch(AI_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Insufficient credits. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment message usage
    if (usageData) {
      await supabase.from("ai_hub_usage").update({
        messages_today: currentMessages + 1,
        last_message_at: new Date().toISOString(),
      }).eq("user_id", user.id).eq("date", today);
    } else {
      await supabase.from("ai_hub_usage").insert({
        user_id: user.id,
        date: today,
        messages_today: 1,
        images_today: 0,
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("assistentes-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});