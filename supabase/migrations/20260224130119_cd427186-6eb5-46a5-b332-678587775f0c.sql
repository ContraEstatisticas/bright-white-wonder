
-- Tabela paddle_geral: armazena todos os eventos recebidos do Paddle
CREATE TABLE IF NOT EXISTS public.paddle_geral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT,
  notification_id TEXT,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único em event_id e índice em event_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_paddle_geral_event_id ON public.paddle_geral (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_paddle_geral_event_type ON public.paddle_geral (event_type);

-- RLS
ALTER TABLE public.paddle_geral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view paddle_geral"
ON public.paddle_geral
FOR SELECT
USING (is_admin());

-- Tabela paddle_customer: armazena dados dos clientes Paddle
CREATE TABLE IF NOT EXISTS public.paddle_customer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  locale TEXT,
  status TEXT,
  marketing_consent BOOLEAN,
  custom_data JSONB,
  import_meta JSONB,
  created_at_paddle TIMESTAMP WITH TIME ZONE,
  updated_at_paddle TIMESTAMP WITH TIME ZONE,
  last_event_id TEXT,
  last_notification_id TEXT,
  last_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_paddle_customer_email ON public.paddle_customer (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_paddle_customer_customer_id ON public.paddle_customer (customer_id);

-- RLS
ALTER TABLE public.paddle_customer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view paddle_customer"
ON public.paddle_customer
FOR SELECT
USING (is_admin());

-- Trigger updated_at
CREATE TRIGGER update_paddle_customer_updated_at
BEFORE UPDATE ON public.paddle_customer
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
