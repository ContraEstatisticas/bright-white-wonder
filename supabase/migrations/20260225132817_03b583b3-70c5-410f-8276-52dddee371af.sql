
-- 1. Atualizar função process_pending_billing_events com caminho Paddle v2
CREATE OR REPLACE FUNCTION public.process_pending_billing_events(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_product_type TEXT;
  v_product_id TEXT;
  v_normalized_email TEXT;
BEGIN
  v_normalized_email := LOWER(RTRIM(p_email, '.'));
  
  FOR v_event IN 
    SELECT * FROM billing_event_logs 
    WHERE LOWER(RTRIM(email, '.')) = v_normalized_email
      AND (status = 'pending' OR status = 'USER_NOT_FOUND')
      AND processed = false
      AND UPPER(event_type) IN (
        'SETTLED', 'STARTING_TRIAL', 'SUBSCRIPTION_SETTLED', 
        'SUBSCRIPTION_TRIAL_STARTED', 'GRANTED',
        'CONVERTION', 'RENEWING', 'RESUMING', 
        'RECOVERING', 'RECOVERING_AUTORENEW',
        'PURCHASE_COMPLETE', 'PURCHASE_APPROVED', 
        'PURCHASE_PROTEST', 'PURCHASE_DELAYED'
      )
    ORDER BY created_at ASC
  LOOP
    -- Extract product_id from payload (multiple provider paths)
    v_product_id := COALESCE(
      v_event.payload->>'product_id',
      v_event.payload->'data'->'product'->>'id',
      v_event.payload->'oneoff'->>'product_id',
      -- Paddle v2: data.items[0].price.product_id
      v_event.payload->'data'->'items'->0->'price'->>'product_id',
      REPLACE(
        v_event.payload->'subscription'->'price_point'->'features'->0->>'ident',
        'product_', ''
      )
    );
    
    -- Look up product type from product_definitions
    SELECT product_type INTO v_product_type 
    FROM product_definitions 
    WHERE product_id = v_product_id;
    
    -- Default to 'base' if not found
    IF v_product_type IS NULL THEN
      v_product_type := 'base';
    END IF;
    
    -- Grant premium access
    INSERT INTO user_premium_access (user_id, is_premium, plan_type, purchased_at, plan_updated_at)
    VALUES (p_user_id, true, 'premium', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET 
      is_premium = true, 
      plan_updated_at = NOW();
    
    -- Grant product access: handle combo type
    IF v_product_type = 'combo_freelancer_ai' THEN
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (p_user_id, COALESCE(v_product_id, 'unknown'), 'freelancer', true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        product_type = 'freelancer',
        granted_at = NOW();
      
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (p_user_id, COALESCE(v_product_id, 'unknown') || '_ai_hub', 'ai_hub', true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        product_type = 'ai_hub',
        granted_at = NOW();
    ELSE
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (p_user_id, COALESCE(v_product_id, 'unknown'), v_product_type, true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        granted_at = NOW();
    END IF;
    
    -- Mark event as processed
    UPDATE billing_event_logs 
    SET processed = true, 
        processed_at = NOW(), 
        status = 'success',
        user_id = p_user_id,
        is_premium_set = true,
        email = v_normalized_email
    WHERE id = v_event.id;
  END LOOP;
END;
$$;

-- 2. Correção retroativa: re-processar billing events Paddle que foram processados com product_id incorreto
DO $$
DECLARE
  rec RECORD;
  v_correct_product_id TEXT;
  v_product_type TEXT;
BEGIN
  FOR rec IN
    SELECT 
      bel.id as event_id,
      bel.user_id,
      bel.email,
      bel.payload->'data'->'items'->0->'price'->>'product_id' as paddle_product_id
    FROM billing_event_logs bel
    WHERE bel.status = 'success'
      AND bel.processed = true
      AND bel.user_id IS NOT NULL
      AND bel.payload->'data'->'items'->0->'price'->>'product_id' IS NOT NULL
  LOOP
    v_correct_product_id := rec.paddle_product_id;
    
    -- Look up product type
    SELECT pd.product_type INTO v_product_type
    FROM product_definitions pd
    WHERE pd.product_id = v_correct_product_id;
    
    -- Skip if product not in definitions
    IF v_product_type IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Handle combo type
    IF v_product_type = 'combo_freelancer_ai' THEN
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (rec.user_id, v_correct_product_id, 'freelancer', true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        product_type = 'freelancer',
        granted_at = NOW();
      
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (rec.user_id, v_correct_product_id || '_ai_hub', 'ai_hub', true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        product_type = 'ai_hub',
        granted_at = NOW();
    ELSE
      INSERT INTO user_product_access (user_id, product_id, product_type, is_active, granted_at)
      VALUES (rec.user_id, v_correct_product_id, v_product_type, true, NOW())
      ON CONFLICT (user_id, product_id) DO UPDATE SET 
        is_active = true, 
        product_type = v_product_type,
        granted_at = NOW();
    END IF;
    
    RAISE NOTICE 'Fixed access for user_id=%, product_id=%, type=%', rec.user_id, v_correct_product_id, v_product_type;
  END LOOP;
END $$;
