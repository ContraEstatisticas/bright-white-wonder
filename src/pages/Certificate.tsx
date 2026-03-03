import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, Trophy, RefreshCw } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useState } from "react";
import i18n from '@/i18n';

const CANVAS_W = 1456;
const CANVAS_H = 816;

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}

function drawRoundedPill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const r = h / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// Mapeamento de carga horária por ferramenta (dados técnicos, não traduzíveis)
const toolHours: Record<string, number> = {
  chatgpt: 32,
  claude: 24,
  gemini: 24,
  deepseek: 24,
  elevenlabs: 32,
  lovable: 32,
  captions: 24,
  nanobanana: 32,
};

const toolSpecialization: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  elevenlabs: 'ElevenLabs',
  lovable: 'Lovable',
  captions: 'Captions AI',
  nanobanana: 'NanoBanana',
};

const Certificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // refreshKey força a regeneração do canvas quando você editar os valores
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: certificate, isLoading } = useQuery({
    queryKey: ['certificate', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_certificates')
        .select('*, challenges(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (!certificate || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = new Image();
    bg.crossOrigin = "anonymous";
    bg.src = "/images/certificado-template.png";

    bg.onload = () => {
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

      const navy = '#1e3a5f';
      const lineColor = '#c8ced5';
      const challengeName = certificate.challenges?.name || certificate.tool_slug;
      const studentName = certificate.user_full_name || 'Aluno';
      const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;
      const earnedDate = new Date(certificate.earned_at).toLocaleDateString(locale);

      // Content area boundaries
      const contentLeft = 100;
      const contentRight = 1080;
      const contentCenter = (contentLeft + contentRight) / 2;

      // ─── Title ───
      ctx.fillStyle = navy;
      ctx.font = 'Bold 60px Sequel Sans, serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('certificate.canvas.title'), 756, 127);

      // ─── Student Name ───
      ctx.font = '40px Sequel Sans, serif';
      ctx.fillStyle = navy;
      ctx.textAlign = 'center';
      ctx.fillText(studentName, 749, 210);

      // ─── "Completed course" ───
      ctx.textAlign = 'left';
      ctx.font = '16px Sequel Sans, sans-serif';
      ctx.fillStyle = navy;
      ctx.fillText(t('certificate.canvas.completedCourse'), contentLeft, 280);

      // ─── Specialization ───
      const specName = toolSpecialization[certificate.tool_slug] || challengeName;
      ctx.font = 'bold 28px Sequel Sans, serif';
      ctx.fillStyle = navy;
      ctx.fillText(t('certificate.canvas.specialization', { tool: specName }), contentLeft, 320);

      // ─── Level badge ───
      const badgeText = t('certificate.canvas.levelJunior');
      ctx.font = 'bold 30px Sequel Sans, sans-serif';
      const badgeTW = ctx.measureText(badgeText).width;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, 420 / 2, 370);

      // ─── Description paragraph ───
      const hours = toolHours[certificate.tool_slug] || 28;
      const toolDescKey = `certificate.canvas.toolDescription.${certificate.tool_slug}`;
      const toolDesc = i18n.exists(toolDescKey) ? t(toolDescKey) : t('certificate.canvas.toolDescription.default');
      const desc = t('certificate.canvas.formationDescription', { tool: specName, hours, description: toolDesc });

      ctx.textAlign = 'left';
      ctx.font = '20px Sequel Sans, sans-serif';
      ctx.fillStyle = navy;
      wrapText(ctx, desc, contentLeft, 440, 890, 30);

      // ─── City & Date ───
      ctx.font = '16px Sequel Sans, sans-serif';
      ctx.fillStyle = navy;
      ctx.textAlign = 'left';
      ctx.fillText(t('certificate.canvas.city'), contentLeft + 5, 575);
      ctx.textAlign = 'right';
      ctx.fillText(`${t('certificate.canvas.completionDate')} ${earnedDate}`, contentRight, 580);

      // ─── Signature area ───
      ctx.font = 'italic 34px Yustine Signature, serif';
      ctx.fillStyle = navy;
      ctx.textAlign = 'center';
      const sigCenter = (750 + contentRight) / 2;
      ctx.fillText("Sidney Júnior", 1010, 645);

      // Instructor label
      ctx.font = '16px Sequel Sans, sans-serif';
      ctx.fillStyle = navy;
      ctx.textAlign = 'center';
      ctx.fillText(t('certificate.canvas.instructorLabel'), 1000, 690);
      ctx.fillText(t('certificate.canvas.organization'), 1020, 710);

      setImageUrl(canvas.toDataURL('image/png'));
    };
  }, [certificate, t, refreshKey]);

  const handleDownload = () => {
    if (!imageUrl || !certificate) return;
    const link = document.createElement('a');
    link.download = `certificado-${certificate.tool_slug}-${certificate.id}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!imageUrl || !certificate) return;
    if (navigator.share) {
      try {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], `certificado-${certificate.tool_slug}.png`, { type: 'image/png' });
        await navigator.share({
          title: t('certificate.shareTitle'),
          text: t('certificate.shareText', { challenge: certificate.challenges?.name }),
          files: [file]
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('certificate.notFound')}</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 safe-area-inset">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex-1">{t('certificate.myCertificate')}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRefreshKey(k => k + 1)}
            title="Regenerar certificado"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </header>

        <div className="bg-card rounded-2xl shadow-lg overflow-hidden mb-6">
          {imageUrl ? (
            <img src={imageUrl} alt={t('certificate.title')} className="w-full h-auto" />
          ) : (
            <div className="aspect-[1456/816] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">{t('certificate.generating')}</div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <Button onClick={handleDownload} className="flex-1 h-14 text-lg font-semibold" size="lg">
            <Download className="w-5 h-5 mr-2" />
            {t('certificate.download')}
          </Button>
          {navigator.share && (
            <Button onClick={handleShare} variant="outline" className="h-14 px-6" size="lg">
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-muted-foreground">{t('certificate.congratsMessage')}</p>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
