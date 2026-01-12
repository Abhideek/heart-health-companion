import { supabase } from '@/integrations/supabase/client';

/**
 * Links a patient user account to existing patient records.
 * Called when a patient signs up - if their email matches any patient records
 * created by doctors, those records are linked to the new user account.
 */
export async function linkPatientAccount(userId: string, email: string): Promise<{
  linked: boolean;
  count: number;
  error?: string;
}> {
  try {
    // Find patient records matching this email that aren't already linked
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, doctor_id')
      .eq('email', email.toLowerCase())
      .is('patient_user_id', null);

    if (fetchError) {
      console.error('Error fetching patient records:', fetchError);
      return { linked: false, count: 0, error: fetchError.message };
    }

    if (!patients || patients.length === 0) {
      return { linked: false, count: 0 };
    }

    // Link all matching patient records to this user
    const { error: updateError } = await supabase
      .from('patients')
      .update({ patient_user_id: userId })
      .eq('email', email.toLowerCase())
      .is('patient_user_id', null);

    if (updateError) {
      console.error('Error linking patient records:', updateError);
      return { linked: false, count: 0, error: updateError.message };
    }

    return { linked: true, count: patients.length };
  } catch (error) {
    console.error('Error in linkPatientAccount:', error);
    return { linked: false, count: 0, error: 'Unexpected error linking account' };
  }
}

/**
 * Checks if a patient email already has linked records
 */
export async function checkPatientRecords(email: string): Promise<{
  hasRecords: boolean;
  count: number;
}> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error checking patient records:', error);
      return { hasRecords: false, count: 0 };
    }

    return { hasRecords: data && data.length > 0, count: data?.length || 0 };
  } catch {
    return { hasRecords: false, count: 0 };
  }
}
