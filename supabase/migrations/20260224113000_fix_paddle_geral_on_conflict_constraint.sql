-- Compatibility fix for webhook versions that use upsert(onConflict: 'event_id')
-- Partial unique indexes cannot be inferred by ON CONFLICT (event_id) without a predicate.
-- This creates a full unique index so ON CONFLICT works reliably.

DROP INDEX IF EXISTS public.idx_paddle_geral_event_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_paddle_geral_event_id_unique
  ON public.paddle_geral(event_id);
