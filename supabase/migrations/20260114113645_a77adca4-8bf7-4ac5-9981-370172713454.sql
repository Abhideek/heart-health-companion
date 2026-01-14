-- Drop and recreate the patients view policy with explicit NULL handling for clarity
DROP POLICY IF EXISTS "Doctors can view their patients" ON public.patients;

CREATE POLICY "Doctors can view their patients"
ON public.patients
FOR SELECT
USING (
  auth.uid() = doctor_id 
  OR (patient_user_id IS NOT NULL AND auth.uid() = patient_user_id)
);