import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      
      // Skip header
      const parsed: CSVEntry[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < 4) continue;
        
        const email = cols[0]?.trim();
        // Products are in column 4 (index 3), but could contain commas within product names
        // The format is: Email, Nome, Plataforma, Produtos Comprados
        // Products like "Educly, Educly Premium" have commas, so we join from index 3 onwards
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

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          📦 Importação em Massa de Acessos
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload do CSV com emails e produtos para criar billing events e liberar acesso.
        </p>
      </div>

      {/* Upload */}
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

      {/* Process button */}
      {entries.length > 0 && !results && (
        <Button
          onClick={processEntries}
          disabled={isProcessing}
          className="w-full sm:w-auto"
        >
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

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      {/* Results */}
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
  );
};
