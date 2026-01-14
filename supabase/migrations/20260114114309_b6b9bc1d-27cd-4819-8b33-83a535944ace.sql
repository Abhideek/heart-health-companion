-- Drop the old function signature first
DROP FUNCTION IF EXISTS public.link_patient_account(text, uuid);

-- Create the secure version that uses auth.uid() internally
CREATE OR REPLACE FUNCTION public.link_patient_account(p_email text)
RETURNS json
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
  calling_user_id uuid;
  calling_user_email text;
BEGIN
  -- Get the authenticated user's ID
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get the authenticated user's email from auth.users
  SELECT email INTO calling_user_email 
  FROM auth.users 
  WHERE id = calling_user_id;
  
  -- Only allow linking if the provided email matches the authenticated user's email
  IF LOWER(p_email) != LOWER(calling_user_email) THEN
    RAISE EXCEPTION 'Cannot link records for a different email address';
  END IF;
  
  -- Update patient records - only link unlinked records matching this email
  UPDATE public.patients
  SET patient_user_id = calling_user_id, updated_at = now()
  WHERE LOWER(email) = LOWER(p_email)
    AND patient_user_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'linked', updated_count > 0,
    'count', updated_count
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.link_patient_account(text) TO authenticated;