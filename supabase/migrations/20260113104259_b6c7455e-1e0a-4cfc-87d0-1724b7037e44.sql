-- Drop and recreate the link_patient_account function with VOLATILE
DROP FUNCTION IF EXISTS public.link_patient_account(uuid, text);
DROP FUNCTION IF EXISTS public.link_patient_account(text, uuid);

CREATE OR REPLACE FUNCTION public.link_patient_account(p_email text, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Update all patient records matching this email where patient_user_id is NULL
  UPDATE public.patients
  SET patient_user_id = p_user_id, updated_at = now()
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
GRANT EXECUTE ON FUNCTION public.link_patient_account(text, uuid) TO authenticated;

-- Also fix the clinical_reports RLS policy to properly check patient_user_id via patients table
DROP POLICY IF EXISTS "Patients can view their published reports" ON public.clinical_reports;

CREATE POLICY "Patients can view their published reports"
ON public.clinical_reports
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = clinical_reports.patient_id
      AND p.patient_user_id = auth.uid()
  )
);