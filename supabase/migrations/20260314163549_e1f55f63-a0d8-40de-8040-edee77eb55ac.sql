
-- 1. Fix process_pending_billing_events: base purchases should NOT set is_premium = true
CREATE OR REPLACE FUNCTION public.process_pending_billing_events(p_user_id uuid, p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        'CONVERTION', 'RENEWING', 'RESUMING', 'RECOVERING', 'RECOVERING_AUTORENEW',
        'PURCHASE_COMPLETE', 'PURCHASE_APPROVED', 'PURCHASE_PROTEST', 'PURCHASE_DELAYED',
        'SUBSCRIPTION_CANCELLATION', 'PAUSING',
        'CANCELED', 'CANCELED_ADVANCED',
        'REFUNDED', 'REFUNDED_ADVANCED',
        'CHARGEBACK', 'CHARGEBACK_ADVANCED',
        'OVERDUE', 'EXPIRED'
      )
    ORDER BY created_at ASC
  LOOP
    v_product_id := COALESCE(
      v_event.payload->>'product_id',
      v_event.payload->'data'->'product'->>'id',
      v_event.payload->'oneoff'->>'product_id',
      v_event.payload->'data'->'items'->0->'price'->>'product_id',
      REPLACE(
        v_event.payload->'subscription'->'price_point'->'features'->0->>'ident',
        'product_', ''
      )
    );
    
    SELECT product_type INTO v_product_type 
    FROM product_definitions 
    WHERE product_id = v_product_id;
    
    IF v_product_type IS NULL THEN
      v_product_type := 'base';
    END IF;
    
    IF UPPER(v_event.event_type) IN (
        'SUBSCRIPTION_CANCELLATION', 'PAUSING',
        'CANCELED', 'CANCELED_ADVANCED',
        'REFUNDED', 'REFUNDED_ADVANCED',
        'CHARGEBACK', 'CHARGEBACK_ADVANCED',
        'OVERDUE', 'EXPIRED'
    ) THEN
        
        IF v_product_type = 'combo_freelancer_ai' THEN
          UPDATE user_product_access 
          SET is_active = false
          WHERE user_id = p_user_id AND product_id IN (v_product_id, COALESCE(v_product_id, 'unknown') || '_ai_hub');
        ELSE
          UPDATE user_product_access 
          SET is_active = false
          WHERE user_id = p_user_id AND product_id = COALESCE(v_product_id, 'unknown');
        END IF;

        UPDATE user_premium_access 
        SET is_premium = false, plan_updated_at = NOW()
        WHERE user_id = p_user_id 
          AND NOT EXISTS (
            SELECT 1 FROM user_product_access 
            WHERE user_id = p_user_id AND is_active = true
          );

    ELSE
        -- COMPRA/APROVAÇÃO: only set is_premium=true for non-base products
        IF v_product_type IN ('freelancer', 'ai_hub', 'combo_freelancer_ai') THEN
          INSERT INTO user_premium_access (user_id, is_premium, plan_type, purchased_at, plan_updated_at)
          VALUES (p_user_id, true, 'premium', NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE SET 
            is_premium = true, 
            plan_updated_at = NOW();
        ELSE
          -- base: create record but is_premium = false
          INSERT INTO user_premium_access (user_id, is_premium, plan_type, purchased_at, plan_updated_at)
          VALUES (p_user_id, false, v_product_type, NOW(), NOW())
          ON CONFLICT (user_id) DO UPDATE SET 
            plan_updated_at = NOW();
        END IF;
        
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

    END IF;
    
    UPDATE billing_event_logs 
    SET processed = true, 
        processed_at = NOW(), 
        status = 'success',
        user_id = p_user_id,
        is_premium_set = CASE WHEN v_product_type IN ('freelancer', 'ai_hub', 'combo_freelancer_ai') THEN true ELSE false END,
        email = v_normalized_email
    WHERE id = v_event.id;
  END LOOP;
END;
$function$;

-- 2. Fix existing base-only users that were incorrectly marked as is_premium=true
UPDATE user_premium_access upa
SET is_premium = false, plan_updated_at = NOW()
WHERE upa.is_premium = true
  AND NOT EXISTS (
    SELECT 1 FROM user_product_access up
    WHERE up.user_id = upa.user_id
      AND up.is_active = true
      AND up.product_type IN ('freelancer', 'ai_hub')
  )
  AND NOT EXISTS (
    SELECT 1 FROM premium_whitelist pw
    WHERE LOWER(pw.email) = (SELECT LOWER(email) FROM auth.users WHERE id = upa.user_id)
  );
