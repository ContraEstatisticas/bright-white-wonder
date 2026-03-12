-- ============================================================================
-- TABELA: webhook_failure_logs
-- Sistema de retentativa automática de webhooks com log de erros
-- ============================================================================

-- 1. Criar tabela de log de falhas de webhook
CREATE TABLE IF NOT EXISTS public.webhook_failure_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação do webhook
  webhook_source text NOT NULL,              -- 'paddle-webhook' | 'primer-webhook'
  event_type text,                            -- tipo do evento original (ex: 'transaction.paid')
  event_id text,                              -- ID do evento do provedor (para dedup)
  
  -- Payload original (permite replay)
  raw_payload jsonb NOT NULL,
  request_headers jsonb,                      -- headers originais (sem secrets)
  
  -- Informações de erro
  error_message text NOT NULL,
  error_stack text,
  http_status_returned integer,               -- status HTTP que foi retornado
  
  -- Controle de retry
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  next_retry_at timestamptz,                  -- quando tentar novamente
  status text NOT NULL DEFAULT 'pending',     -- 'pending' | 'retrying' | 'success' | 'exhausted' | 'manual'
  
  -- Resultado do retry
  last_retry_at timestamptz,
  last_retry_error text,
  resolved_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.webhook_failure_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (service role has full access by default)
CREATE POLICY "Admin read webhook_failure_logs"
  ON public.webhook_failure_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- 3. Índices para performance
CREATE INDEX idx_webhook_failure_logs_status 
  ON public.webhook_failure_logs(status) 
  WHERE status IN ('pending', 'retrying');

CREATE INDEX idx_webhook_failure_logs_next_retry 
  ON public.webhook_failure_logs(next_retry_at) 
  WHERE status IN ('pending', 'retrying');

CREATE INDEX idx_webhook_failure_logs_source 
  ON public.webhook_failure_logs(webhook_source, created_at DESC);

CREATE INDEX idx_webhook_failure_logs_event_id 
  ON public.webhook_failure_logs(event_id) 
  WHERE event_id IS NOT NULL;

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_webhook_failure_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_webhook_failure_updated_at
  BEFORE UPDATE ON public.webhook_failure_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_failure_updated_at();

-- 5. Função para calcular o próximo retry com backoff exponencial
-- Intervalos: 30s, 2min, 8min, 30min, 2h
CREATE OR REPLACE FUNCTION calculate_next_retry_at(current_retry_count integer)
RETURNS timestamptz AS $$
BEGIN
  RETURN now() + (POWER(4, LEAST(current_retry_count, 4)) * 30 || ' seconds')::interval;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
