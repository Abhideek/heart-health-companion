-- Create a secure function to link patient accounts
-- This runs with SECURITY DEFINER to bypass RLS for the linking operation
CREATE OR REPLACE FUNCTION public.link_patient_account(
  p_user_id UUID,
  p_email TEXT
)
RETURNS JSON AS $$
DECLARE
  linked_count INTEGER;
  result JSON;
BEGIN
  -- Update all patient records matching this email that aren't already linked
  UPDATE public.patients
  SET patient_user_id = p_user_id
  WHERE LOWER(email) = LOWER(p_email)
  AND patient_user_id IS NULL;
  
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  result := json_build_object(
    'linked', linked_count > 0,
    'count', linked_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.link_patient_account(UUID, TEXT) TO authenticated;