import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRANSLATIONS: Record<string, Record<string, string>> = {
  pt: {
    subject_single: '🎉 Bem-vindo à Educly!',
    subject_multi: '🎉 Bem-vindo à Educly! Seus pacotes estão prontos!',
    badge: 'Acesso Liberado',
    heroTitle: 'Bem-vindo à Educly! 🎉',
    heroSubtitle: 'Você deu o primeiro passo para dominar a Inteligência Artificial e transformar sua carreira para sempre.',
    heroSubtitleMulti: 'Parabéns! Você garantiu acesso completo aos nossos melhores pacotes!',
    successTitle: 'Conta ativa e pronta!',
    successBody: 'Sua conta foi criada com o e-mail <strong>{email}</strong>. Você já pode acessar e começar agora mesmo.',
    sectionLabel: 'O QUE VOCÊ VAI APRENDER',
    feature1: 'ChatGPT, Claude e outras IAs',
    feature2: 'Imagens incríveis com IA',
    feature3: 'Automatizar tarefas do dia a dia',
    feature4: 'Ganhar dinheiro com IA',
    cta: 'Acessar Minha Conta',
    ctaNote: 'Bons estudos!',
    team: 'Equipe Educly',
    rights: 'Todos os direitos reservados.',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Uso',
    product_base: '✅ Desafio de IA - 28 Dias',
    product_freelancer: '✅ Hub Freelancer - Carreira com IA',
    product_ai_hub: '✅ Hub de Assistentes IA',
    product_combo_freelancer_ai: '✅ Combo Freelancer + Assistentes IA',
    productsTitle: '📦 Seus pacotes:',
  },
  en: {
    subject_single: '🎉 Welcome to Educly!',
    subject_multi: '🎉 Welcome to Educly! Your packages are ready!',
    badge: 'Access Granted',
    heroTitle: 'Welcome to Educly! 🎉',
    heroSubtitle: 'You have taken the first step to master Artificial Intelligence and transform your career forever.',
    heroSubtitleMulti: 'Congratulations! You have secured full access to our best packages!',
    successTitle: 'Account active and ready!',
    successBody: 'Your account was created with <strong>{email}</strong>. You can access and start right now.',
    sectionLabel: 'WHAT YOU WILL LEARN',
    feature1: 'ChatGPT, Claude and other AIs',
    feature2: 'Create amazing images with AI',
    feature3: 'Automate daily tasks',
    feature4: 'Earn money with AI',
    cta: 'Access My Account',
    ctaNote: 'Happy learning!',
    team: 'Educly Team',
    rights: 'All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    product_base: '✅ AI Challenge - 28 Days',
    product_freelancer: '✅ Freelancer Hub - AI Career',
    product_ai_hub: '✅ AI Assistants Hub',
    product_combo_freelancer_ai: '✅ Freelancer + AI Assistants Combo',
    productsTitle: '📦 Your packages:',
  },
  es: {
    subject_single: '🎉 ¡Bienvenido a Educly!',
    subject_multi: '🎉 ¡Bienvenido a Educly! ¡Tus paquetes están listos!',
    badge: 'Acceso Liberado',
    heroTitle: '¡Bienvenido a Educly! 🎉',
    heroSubtitle: 'Has dado el primer paso para dominar la Inteligencia Artificial y transformar tu carrera para siempre.',
    heroSubtitleMulti: '¡Felicitaciones! Has asegurado acceso completo a nuestros mejores paquetes.',
    successTitle: '¡Cuenta activa y lista!',
    successBody: 'Tu cuenta fue creada con el correo <strong>{email}</strong>. Ya puedes acceder y comenzar ahora mismo.',
    sectionLabel: 'LO QUE APRENDERÁS',
    feature1: 'ChatGPT, Claude y otras IAs',
    feature2: 'Imágenes increíbles con IA',
    feature3: 'Automatizar tareas diarias',
    feature4: 'Ganar dinero con IA',
    cta: 'Acceder a Mi Cuenta',
    ctaNote: '¡Buen aprendizaje!',
    team: 'Equipo Educly',
    rights: 'Todos los derechos reservados.',
    privacy: 'Política de Privacidad',
    terms: 'Términos de Uso',
    product_base: '✅ Desafío de IA - 28 Días',
    product_freelancer: '✅ Hub Freelancer - Carrera con IA',
    product_ai_hub: '✅ Hub de Asistentes IA',
    product_combo_freelancer_ai: '✅ Combo Freelancer + Asistentes IA',
    productsTitle: '📦 Tus paquetes:',
  },
  fr: {
    subject_single: '🎉 Bienvenue chez Educly !',
    subject_multi: '🎉 Bienvenue chez Educly ! Vos forfaits sont prêts !',
    badge: 'Accès Libéré',
    heroTitle: 'Bienvenue chez Educly ! 🎉',
    heroSubtitle: "Vous avez fait le premier pas pour maîtriser l'IA et transformer votre carrière.",
    heroSubtitleMulti: "Félicitations ! Vous avez sécurisé l'accès complet à nos meilleurs forfaits !",
    successTitle: 'Compte actif et prêt !',
    successBody: 'Votre compte a été créé avec <strong>{email}</strong>. Vous pouvez commencer dès maintenant.',
    sectionLabel: 'CE QUE VOUS ALLEZ APPRENDRE',
    feature1: "ChatGPT, Claude et d'autres IAs",
    feature2: "Créer des images incroyables avec l'IA",
    feature3: 'Automatiser les tâches quotidiennes',
    feature4: "Gagner de l'argent avec l'IA",
    cta: 'Accéder à Mon Compte',
    ctaNote: 'Bon apprentissage !',
    team: 'Équipe Educly',
    rights: 'Tous droits réservés.',
    privacy: 'Politique de Confidentialité',
    terms: "Conditions d'Utilisation",
    product_base: '✅ Défi IA - 28 Jours',
    product_freelancer: '✅ Hub Freelancer - Carrière IA',
    product_ai_hub: '✅ Hub Assistants IA',
    product_combo_freelancer_ai: '✅ Combo Freelancer + Assistants IA',
    productsTitle: '📦 Vos forfaits :',
  },
  de: {
    subject_single: '🎉 Willkommen bei Educly!',
    subject_multi: '🎉 Willkommen bei Educly! Ihre Pakete sind bereit!',
    badge: 'Zugang Freigeschaltet',
    heroTitle: 'Willkommen bei Educly! 🎉',
    heroSubtitle: 'Sie haben den ersten Schritt gemacht, um KI zu meistern und Ihre Karriere zu transformieren.',
    heroSubtitleMulti: 'Herzlichen Glückwunsch! Sie haben vollen Zugang zu unseren besten Paketen gesichert!',
    successTitle: 'Konto aktiv und bereit!',
    successBody: 'Ihr Konto wurde mit <strong>{email}</strong> erstellt. Sie können jetzt sofort loslegen.',
    sectionLabel: 'WAS SIE LERNEN WERDEN',
    feature1: 'ChatGPT, Claude und andere KIs',
    feature2: 'Erstaunliche Bilder mit KI erstellen',
    feature3: 'Tägliche Aufgaben automatisieren',
    feature4: 'Geld mit KI verdienen',
    cta: 'Auf Mein Konto Zugreifen',
    ctaNote: 'Viel Erfolg beim Lernen!',
    team: 'Educly Team',
    rights: 'Alle Rechte vorbehalten.',
    privacy: 'Datenschutzrichtlinie',
    terms: 'Nutzungsbedingungen',
    product_base: '✅ KI-Challenge - 28 Tage',
    product_freelancer: '✅ Freelancer Hub - KI-Karriere',
    product_ai_hub: '✅ KI-Assistenten Hub',
    product_combo_freelancer_ai: '✅ Combo Freelancer + KI-Assistenten',
    productsTitle: '📦 Ihre Pakete:',
  },
  it: {
    subject_single: '🎉 Benvenuto su Educly!',
    subject_multi: '🎉 Benvenuto su Educly! I tuoi pacchetti sono pronti!',
    badge: 'Accesso Sbloccato',
    heroTitle: 'Benvenuto su Educly! 🎉',
    heroSubtitle: "Hai fatto il primo passo per padroneggiare l'IA e trasformare la tua carriera.",
    heroSubtitleMulti: "Congratulazioni! Hai ottenuto l'accesso completo ai nostri migliori pacchetti!",
    successTitle: 'Account attivo e pronto!',
    successBody: 'Il tuo account è stato creato con <strong>{email}</strong>. Puoi iniziare subito.',
    sectionLabel: 'COSA IMPARERAI',
    feature1: 'ChatGPT, Claude e altre IA',
    feature2: "Creare immagini incredibili con l'IA",
    feature3: 'Automatizzare le attività quotidiane',
    feature4: "Guadagnare con l'IA",
    cta: 'Accedi al Mio Account',
    ctaNote: 'Buon apprendimento!',
    team: 'Team Educly',
    rights: 'Tutti i diritti riservati.',
    privacy: 'Politica sulla Privacy',
    terms: 'Termini di Utilizzo',
    product_base: '✅ Sfida IA - 28 Giorni',
    product_freelancer: '✅ Hub Freelancer - Carriera IA',
    product_ai_hub: '✅ Hub Assistenti IA',
    product_combo_freelancer_ai: '✅ Combo Freelancer + Assistenti IA',
    productsTitle: '📦 I tuoi pacchetti:',
  },
  ru: {
    subject_single: '🎉 Добро пожаловать в Educly!',
    subject_multi: '🎉 Добро пожаловать в Educly! Ваши пакеты готовы!',
    badge: 'Доступ Открыт',
    heroTitle: 'Добро пожаловать в Educly! 🎉',
    heroSubtitle: 'Вы сделали первый шаг к освоению ИИ и преобразованию своей карьеры.',
    heroSubtitleMulti: 'Поздравляем! Вы получили полный доступ к нашим лучшим пакетам!',
    successTitle: 'Аккаунт активен и готов!',
    successBody: 'Ваш аккаунт создан с <strong>{email}</strong>. Вы можете начать прямо сейчас.',
    sectionLabel: 'ЧТО ВЫ УЗНАЕТЕ',
    feature1: 'ChatGPT, Claude и другие ИИ',
    feature2: 'Создавать потрясающие изображения с ИИ',
    feature3: 'Автоматизировать повседневные задачи',
    feature4: 'Зарабатывать деньги с ИИ',
    cta: 'Войти в Мой Аккаунт',
    ctaNote: 'Успешного обучения!',
    team: 'Команда Educly',
    rights: 'Все права защищены.',
    privacy: 'Политика Конфиденциальности',
    terms: 'Условия Использования',
    product_base: '✅ ИИ-Вызов - 28 Дней',
    product_freelancer: '✅ Хаб Фрилансера - Карьера с ИИ',
    product_ai_hub: '✅ Хаб ИИ-Ассистентов',
    product_combo_freelancer_ai: '✅ Комбо Фрилансер + ИИ-Ассистенты',
    productsTitle: '📦 Ваши пакеты:',
  },
};

function tr(lang: string, key: string): string {
  const n = lang.toLowerCase().split('-')[0];
  return TRANSLATIONS[n]?.[key] || TRANSLATIONS['en']?.[key] || '';
}

function getProductLabel(productType: string, lang: string): string {
  const key = `product_${productType}`;
  return tr(lang, key) || `✅ ${productType}`;
}

function getUnifiedEmailHtml(userName: string, userEmail: string, lang: string, products: { product_type: string }[]): string {
  const isMulti = products.length > 1;
  const uniqueTypes = [...new Set(products.map(p => p.product_type))];
  const ctaUrl = `https://educly.app/cadastro?email=${encodeURIComponent(userEmail)}&lang=${lang}`;
  const subtitle = isMulti ? tr(lang, 'heroSubtitleMulti') : tr(lang, 'heroSubtitle');
  const successBodyText = tr(lang, 'successBody').replace('{email}', userEmail);

  let productsSection = '';
  if (isMulti) {
    const items = uniqueTypes.map(pt => `<tr><td style="padding:8px 0;font-size:16px;color:#374151;">${getProductLabel(pt, lang)}</td></tr>`).join('');
    productsSection = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4ff;border-radius:8px;border-left:4px solid #6366f1;margin-bottom:20px;"><tr><td style="padding:20px;"><p style="margin:0 0 12px;font-weight:700;font-size:15px;color:#1a1a2e;">🚀 ${tr(lang, 'productsTitle')}</p><table role="presentation" cellpadding="0" cellspacing="0" border="0">${items}</table></td></tr></table>`;
  }

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#0f0c29 0%,#1a1060 50%,#24243e 100%);"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:48px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 40%,#2563eb 100%);border-radius:20px 20px 0 0;padding:44px 40px 36px;text-align:center;"><img src="https://educly.app/logo-educly.png" width="140" height="46" alt="Educly" style="filter:brightness(0) invert(1);opacity:0.95;margin-bottom:28px;"/><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;"><tr><td style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:600;color:#bfdbfe;letter-spacing:0.5px;text-transform:uppercase;">✦ ${tr(lang,'badge')}</td></tr></table><h1 style="font-size:32px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 14px;">${tr(lang,'heroTitle').replace('Educly!','Educly,')} ${userName}!</h1><p style="font-size:15px;color:#bfdbfe;line-height:1.7;max-width:420px;margin:0 auto;">${subtitle}</p></td></tr><tr><td style="background:#ffffff;padding:40px 40px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;border:1px solid #a7f3d0;margin-bottom:28px;"><tr><td style="padding:18px 22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:28px;height:28px;background:#10b981;border-radius:50%;text-align:center;vertical-align:top;color:#fff;font-size:14px;font-weight:700;line-height:28px;padding-right:12px;">✓</td><td style="font-size:14px;color:#065f46;line-height:1.6;"><strong style="display:block;margin-bottom:2px;font-size:15px;">${tr(lang,'successTitle')}</strong>${successBodyText}</td></tr></table></td></tr></table>${productsSection}<p style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6366f1;margin:0 0 14px;">${tr(lang,'sectionLabel')}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;"><tr><td width="50%" style="padding:0 6px 12px 0;vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;color:#374151;font-weight:500;line-height:1.4;"><span style="font-size:20px;margin-right:8px;">🤖</span>${tr(lang,'feature1')}</td></tr></table></td><td width="50%" style="padding:0 0 12px 6px;vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;color:#374151;font-weight:500;line-height:1.4;"><span style="font-size:20px;margin-right:8px;">🎨</span>${tr(lang,'feature2')}</td></tr></table></td></tr><tr><td width="50%" style="padding:0 6px 0 0;vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;color:#374151;font-weight:500;line-height:1.4;"><span style="font-size:20px;margin-right:8px;">⚡</span>${tr(lang,'feature3')}</td></tr></table></td><td width="50%" style="padding:0 0 0 6px;vertical-align:top;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;color:#374151;font-weight:500;line-height:1.4;"><span style="font-size:20px;margin-right:8px;">💰</span>${tr(lang,'feature4')}</td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px;"><tr><td style="text-align:center;"><a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:12px;">${tr(lang,'cta')}</a></td></tr><tr><td style="text-align:center;padding-top:10px;font-size:12px;color:#9ca3af;">${tr(lang,'ctaNote')} &nbsp;·&nbsp; <strong>${tr(lang,'team')}</strong></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:12px;border:1px solid #f0f0f0;margin-top:24px;"><tr><td style="padding:20px 24px;"><p style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#9ca3af;text-align:center;margin:0 0 14px;">Suporte / Soporte / Support</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;">🇧🇷 Ficou com dúvidas? <a href="mailto:contact@educly.app" style="color:#4f46e5;text-decoration:none;font-weight:600;">contact@educly.app</a></td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;">🇪🇸 ¿Tienes dudas? <a href="mailto:contact@educly.app" style="color:#4f46e5;text-decoration:none;font-weight:600;">contact@educly.app</a></td></tr><tr><td style="padding:10px 0;font-size:13px;color:#6b7280;">🇫🇷 Vous avez des questions? <a href="mailto:contact@educly.app" style="color:#4f46e5;text-decoration:none;font-weight:600;">contact@educly.app</a></td></tr></table></td></tr></table></td></tr><tr><td style="background:#0f172a;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;"><p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 6px;">Educly</p><p style="font-size:12px;color:#475569;line-height:1.8;margin:0;">© 2025 Educly. ${tr(lang,'rights')}<br/><a href="https://educly.app/politica-privacidade" style="color:#6366f1;text-decoration:none;">${tr(lang,'privacy')}</a> &nbsp;·&nbsp; <a href="https://educly.app/termos-uso" style="color:#6366f1;text-decoration:none;">${tr(lang,'terms')}</a></p></td></tr></table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { data: pendingGroups, error: fetchError } = await supabase
      .from('pending_thank_you_emails')
      .select('*')
      .eq('sent', false)
      .lte('send_after', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) throw new Error(fetchError.message);

    if (!pendingGroups || pendingGroups.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: corsHeaders });
    }

    const emailGroups: Record<string, typeof pendingGroups> = {};
    for (const row of pendingGroups) {
      const email = row.email.toLowerCase().trim();
      if (!emailGroups[email]) emailGroups[email] = [];
      emailGroups[email].push(row);
    }

    let processed = 0;
    const results: { email: string; products: number; status: string }[] = [];

    for (const [email, rows] of Object.entries(emailGroups)) {
      try {
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient_email', email)
          .eq('email_type', 'welcome')
          .maybeSingle();

        if (existingLog) {
          const ids = rows.map(r => r.id);
          await supabase.from('pending_thank_you_emails').update({ sent: true, sent_at: new Date().toISOString() }).in('id', ids);
          results.push({ email, products: rows.length, status: 'skipped_already_sent' });
          continue;
        }

        const buyerName = rows[0].buyer_name || 'Aluno';
        const lang = (rows[0].language || 'es').toLowerCase().split('-')[0];
        const products = rows.map(r => ({ product_type: r.product_type || 'base' }));
        const isMulti = products.length > 1;

        const subject = isMulti ? tr(lang, 'subject_multi') : tr(lang, 'subject_single');
        const html = getUnifiedEmailHtml(buyerName, email, lang, products);

        const apiKey = Deno.env.get("RESEND_API_KEY");
        if (!apiKey) throw new Error("RESEND_API_KEY not configured");
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "Educly <noreply@educly.app>", to: [email], subject, html }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Resend error: ${res.status} - ${err}`);
        }

        await supabase.from('email_logs').insert({
          recipient_email: email, email_type: 'welcome', subject, status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: { products_count: products.length, product_types: products.map(p => p.product_type) },
        });

        const ids = rows.map(r => r.id);
        await supabase.from('pending_thank_you_emails').update({ sent: true, sent_at: new Date().toISOString() }).in('id', ids);

        processed++;
        results.push({ email, products: products.length, status: 'sent' });

        if (Object.keys(emailGroups).length > 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (emailError) {
        console.error(`[send-pending-thanks] Error sending to ${email}:`, emailError);
        results.push({ email, products: rows.length, status: 'error' });
      }
    }

    return new Response(JSON.stringify({ processed, results }), { headers: corsHeaders });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-pending-thanks] Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: corsHeaders });
  }
});
