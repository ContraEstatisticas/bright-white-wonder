-- ============================================================================
-- TABELA e FUNÇÃO: api_rate_limits
-- Implementa rate limit global configurável por endpoint (Deno/Frontend)
-- ============================================================================

-- Tabela genérica para rastreamento de uso baseado em janelas fixas (fixed window)
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    identifier text NOT NULL,        -- Pode ser IP do usuário, user_id real ou email
    endpoint text NOT NULL,          -- Nome do endpoint ou serviço (ex: 'assistentes-chat')
    window_start timestamptz NOT NULL, -- O início da janela do limitador
    request_count integer NOT NULL DEFAULT 1,
    
    PRIMARY KEY (identifier, endpoint, window_start)
);

-- Habilitar RLS e permitir anon e authenticated
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to api_rate_limits from functions/auth"
  ON public.api_rate_limits
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Função Postgres para checar o rate limit e incrementar em operação atômica de banco
-- Uma só requisição DB para checar se passou ou incrementa de volta
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier text,
    p_endpoint text,
    p_max_requests integer,
    p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start timestamptz;
    v_current_count integer;
BEGIN
    -- Determina o início da janela atual "arredondando" pelo tamanho da janela configurada
    -- Isso garante performance e menos registros soltos 
    v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

    -- Insere o registro para a janela ou pega o count atual (Upsert)
    INSERT INTO public.api_rate_limits (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = api_rate_limits.request_count + 1
    RETURNING request_count INTO v_current_count;

    -- Se o limite foi desrespeitado, retorna false
    IF v_current_count > p_max_requests THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

-- Função auxiliar que limpa chaves de rate limit expiradas via cron e manutenção diária
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Limpa tudo mais antigo de 24h para não encavalar
    DELETE FROM public.api_rate_limits 
    WHERE window_start < now() - interval '24 hours';
END;
$$;
