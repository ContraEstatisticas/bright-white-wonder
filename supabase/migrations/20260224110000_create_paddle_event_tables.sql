CREATE TABLE public.paddle_geral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  notification_id TEXT,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_paddle_geral_event_id
  ON public.paddle_geral(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX idx_paddle_geral_event_type
  ON public.paddle_geral(event_type);

CREATE TABLE public.paddle_customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  locale TEXT,
  status TEXT,
  marketing_consent BOOLEAN,
  custom_data JSONB,
  import_meta JSONB,
  created_at_paddle TIMESTAMPTZ,
  updated_at_paddle TIMESTAMPTZ,
  last_event_id TEXT,
  last_notification_id TEXT,
  last_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paddle_customer_email
  ON public.paddle_customer(LOWER(email));

CREATE INDEX idx_paddle_customer_customer_id
  ON public.paddle_customer(customer_id);

ALTER TABLE public.paddle_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paddle_customer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view paddle_geral"
  ON public.paddle_geral
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can view paddle_customer"
  ON public.paddle_customer
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS set_paddle_customer_updated_at ON public.paddle_customer;
CREATE TRIGGER set_paddle_customer_updated_at
  BEFORE UPDATE ON public.paddle_customer
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
