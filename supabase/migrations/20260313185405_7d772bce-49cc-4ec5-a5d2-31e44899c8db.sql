CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$;