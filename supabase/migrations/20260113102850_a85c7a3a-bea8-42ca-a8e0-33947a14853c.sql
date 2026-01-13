-- Drop the insecure email-based policy that allows access via email matching
DROP POLICY IF EXISTS "Patients can view their published reports by email" ON public.clinical_reports;

-- Update the existing patient reports policy to be more robust
-- This uses the secure patient_user_id foreign key relationship
DROP POLICY IF EXISTS "Patients can view their published reports" ON public.clinical_reports;

CREATE POLICY "Patients can view their published reports"
ON public.clinical_reports
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_id 
    AND p.patient_user_id = auth.uid()
  )
);

-- Add a unique constraint to prevent duplicate patient records per doctor
ALTER TABLE public.patients 
ADD CONSTRAINT unique_patient_email_per_doctor UNIQUE (doctor_id, email);