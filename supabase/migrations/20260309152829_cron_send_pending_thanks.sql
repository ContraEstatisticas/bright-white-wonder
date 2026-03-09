-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if exists (idempotent)
SELECT cron.unschedule('send-pending-thanks-every-10min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-pending-thanks-every-10min'
);

-- Schedule send-pending-thanks every 10 minutes
SELECT cron.schedule(
  'send-pending-thanks-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dqlcxpbfemhzzetwaxsa.supabase.co/functions/v1/send-pending-thanks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbGN4cGJmZW1oenpldHdheHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODUxOTAsImV4cCI6MjA4MDI2MTE5MH0.1EtXopvDYbyAx0AjgKwk7XfUedaPaLbeRiJLvV5sqIo'
    ),
    body := '{}'::jsonb
  );
  $$
);
