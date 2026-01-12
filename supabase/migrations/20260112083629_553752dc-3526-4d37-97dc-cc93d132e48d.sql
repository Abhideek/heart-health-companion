-- Add alternative RLS policy for patients to view reports by their email
-- This allows patients to see reports even if their account isn't linked yet
CREATE POLICY "Patients can view their published reports by email" 
ON public.clinical_reports 
FOR SELECT 
USING (
  is_published = true 
  AND patient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);