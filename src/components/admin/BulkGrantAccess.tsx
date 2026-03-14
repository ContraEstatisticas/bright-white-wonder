import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle, Loader2, RefreshCw, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CSVEntry {
  email: string;
  products_string: string;
}

interface BatchResult {
  batch_size: number;
  events_inserted: number;
  users_processed_immediately: number;
  users_pending_signup: number;
  skipped_duplicate: number;
  errors?: string[];
}

const BATCH_SIZE = 50;

export const BulkGrantAccess = () => {
  const [entries, setEntries] = useState<CSVEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    totalProcessed: number;
    eventsInserted: number;
    usersImmediate: number;
    usersPending: number;
    duplicatesSkipped: number;
    errors: string[];
  } | null>(null);

  // Reconcile state
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileLog, setReconcileLog] = useState<string[]>([]);

  // Invite state
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [inviteLog, setInviteLog] = useState<string[]>([]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());

      const parsed: CSVEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < 4) continue;

        const email = cols[0]?.trim();
        const productsString = cols.slice(3).join(",").trim();

        if (email && email.includes("@")) {
          parsed.push({ email, products_string: productsString });
        }
      }

      setEntries(parsed);
      setResults(null);
      toast({
        title: `${parsed.length} emails carregados`,
        description: "Clique em 'Processar' para iniciar a importação.",
      });
    };
    reader.readAsText(file);
  }, []);

  const processEntries = async () => {
    if (entries.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const totals = {
      totalProcessed: 0,
      eventsInserted: 0,
      usersImmediate: 0,
      usersPending: 0,
      duplicatesSkipped: 0,
      errors: [] as string[],
    };

    const totalBatches = Math.ceil(entries.length / BATCH_SIZE);

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      try {
        const { data, error } = await supabase.functions.invoke("bulk-grant-access", {
          body: { entries: batch },
        });

        if (error) {
          totals.errors.push(`Batch ${batchNum}: ${error.message}`);
        } else {
          const result = data as BatchResult;
          totals.totalProcessed += result.batch_size;
          totals.eventsInserted += result.events_inserted;
          totals.usersImmediate += result.users_processed_immediately;
          totals.usersPending += result.users_pending_signup;
          totals.duplicatesSkipped += result.skipped_duplicate;
          if (result.errors) {
            totals.errors.push(...result.errors);
          }
        }
      } catch (err: any) {
        totals.errors.push(`Batch ${batchNum}: ${err.message}`);
      }

      setProgress(Math.round((batchNum / totalBatches) * 100));
    }

    setResults(totals);
    setIsProcessing(false);

    toast({
      title: "Importação concluída!",
      description: `${totals.eventsInserted} eventos criados, ${totals.usersImmediate} usuários liberados imediatamente.`,
    });
  };

  // ─── Reconciliar Pendentes ─────────────────────────────────────
  const handleReconcile = async () => {
    setIsReconciling(true);
    setReconcileLog([]);
    let totalProcessed = 0;
    let round = 0;

    try {
      while (true) {
        round++;
        const { data, error } = await supabase.rpc("reconcile_pending_events");

        if (error) {
          setReconcileLog((prev) => [...prev, `❌ Rodada ${round}: ${error.message}`]);
          break;
        }

        const result = data as { processed: number; not_found: number };
        totalProcessed += result.processed;

        setReconcileLog((prev) => [
          ...prev,
          `✅ Rodada ${round}: ${result.processed} processados, ${result.not_found} sem conta`,
        ]);

        if (result.processed === 0) {
          setReconcileLog((prev) => [...prev, `🏁 Concluído! Total: ${totalProcessed} usuários reconciliados.`]);
          break;
        }

        // Delay 2s entre rodadas
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err: any) {
      setReconcileLog((prev) => [...prev, `❌ Erro: ${err.message}`]);
    }

    setIsReconciling(false);
    toast({
      title: "Reconciliação finalizada",
      description: `${totalProcessed} usuários receberam acesso.`,
    });
  };

  // ─── Enviar Convites ───────────────────────────────────────────
  const handleSendInvites = async () => {
    setIsSendingInvites(true);
    setInviteLog([]);

    try {
      // 1. Buscar emails pendentes sem conta
      setInviteLog(["🔍 Buscando emails pendentes sem conta..."]);

      const { data: pendingEmails, error: fetchError } = await supabase
        .from("billing_event_logs")
        .select("email")
        .in("status", ["pending", "USER_NOT_FOUND"])
        .eq("processed", false);

      if (fetchError) {
        setInviteLog((prev) => [...prev, `❌ Erro ao buscar: ${fetchError.message}`]);
        setIsSendingInvites(false);
        return;
      }

      const uniqueEmails = [...new Set((pendingEmails || []).map((e) => e.email.trim().toLowerCase().replace(/\.+$/, "")))];

      setInviteLog((prev) => [...prev, `📧 ${uniqueEmails.length} emails únicos encontrados.`]);

      if (uniqueEmails.length === 0) {
        setInviteLog((prev) => [...prev, "✅ Nenhum email pendente para enviar convite."]);
        setIsSendingInvites(false);
        return;
      }

      let totalSent = 0;
      let totalSkipped = 0;
      const allErrors: string[] = [];

      // 2. Enviar em batches de 50
      for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
        const batch = uniqueEmails.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        setInviteLog((prev) => [...prev, `📨 Enviando batch ${batchNum}... (${batch.length} emails)`]);

        try {
          const { data, error } = await supabase.functions.invoke("send-signup-invite", {
            body: { emails: batch, language: "es" },
          });

          if (error) {
            allErrors.push(`Batch ${batchNum}: ${error.message}`);
            setInviteLog((prev) => [...prev, `❌ Batch ${batchNum}: ${error.message}`]);
          } else {
            totalSent += data.sent;
            totalSkipped += data.skipped;
            if (data.errors?.length) {
              allErrors.push(...data.errors);
            }
            setInviteLog((prev) => [
              ...prev,
              `✅ Batch ${batchNum}: ${data.sent} enviados, ${data.skipped} pulados`,
            ]);
          }
        } catch (err: any) {
          allErrors.push(`Batch ${batchNum}: ${err.message}`);
          setInviteLog((prev) => [...prev, `❌ Batch ${batchNum}: ${err.message}`]);
        }

        // Delay 2s entre batches
        await new Promise((r) => setTimeout(r, 2000));
      }

      setInviteLog((prev) => [
        ...prev,
        `🏁 Concluído! ${totalSent} convites enviados, ${totalSkipped} pulados.${allErrors.length ? ` ${allErrors.length} erros.` : ""}`,
      ]);

      toast({
        title: "Convites enviados!",
        description: `${totalSent} emails enviados, ${totalSkipped} pulados.`,
      });
    } catch (err: any) {
      setInviteLog((prev) => [...prev, `❌ Erro: ${err.message}`]);
    }

    setIsSendingInvites(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── CSV Import Section ─── */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            📦 Importação em Massa de Acessos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload do CSV com emails e produtos para criar billing events e liberar acesso.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary transition-colors">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Selecionar CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

          {entries.length > 0 && (
            <span className="text-sm text-foreground font-medium">
              {entries.length} emails carregados
            </span>
          )}
        </div>

        {entries.length > 0 && !results && (
          <Button onClick={processEntries} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Processar ${entries.length} emails em ${Math.ceil(entries.length / BATCH_SIZE)} batches`
            )}
          </Button>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">{progress}%</p>
          </div>
        )}

        {results && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Resultado da Importação
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Emails processados:</span>
                <p className="font-bold text-foreground">{results.totalProcessed}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Eventos criados:</span>
                <p className="font-bold text-foreground">{results.eventsInserted}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Acesso liberado agora:</span>
                <p className="font-bold text-green-600">{results.usersImmediate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pendentes (sem conta):</span>
                <p className="font-bold text-amber-600">{results.usersPending}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duplicatas ignoradas:</span>
                <p className="font-bold text-muted-foreground">{results.duplicatesSkipped}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {results.errors.length} erros
                </p>
                <div className="mt-1 max-h-32 overflow-y-auto text-xs text-muted-foreground bg-background rounded p-2">
                  {results.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Reconciliar Pendentes ─── */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reconciliar Pendentes
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Processa usuários que já têm conta mas ainda não receberam acesso (billing events pendentes).
            Roda em loop até processar todos.
          </p>
        </div>

        <Button onClick={handleReconcile} disabled={isReconciling} variant="outline" className="w-full sm:w-auto">
          {isReconciling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reconciliando...
            </>
          ) : (
            "Reconciliar Pendentes"
          )}
        </Button>

        {reconcileLog.length > 0 && (
          <div className="max-h-48 overflow-y-auto text-sm bg-muted/50 rounded-lg p-3 space-y-1">
            {reconcileLog.map((line, i) => (
              <p key={i} className="text-foreground">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* ─── Enviar Convites ─── */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Convites de Cadastro
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Envia emails para compradores que nunca criaram conta no app, convidando a se registrar.
            Emails já enviados são ignorados automaticamente.
          </p>
        </div>

        <Button onClick={handleSendInvites} disabled={isSendingInvites} variant="outline" className="w-full sm:w-auto">
          {isSendingInvites ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando convites...
            </>
          ) : (
            "Enviar Convites"
          )}
        </Button>

        {inviteLog.length > 0 && (
          <div className="max-h-48 overflow-y-auto text-sm bg-muted/50 rounded-lg p-3 space-y-1">
            {inviteLog.map((line, i) => (
              <p key={i} className="text-foreground">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
