import { supabase } from '@/integrations/supabase/client';

/**
 * Links a patient user account to existing patient records.
 * Called when a patient signs up - if their email matches any patient records
 * created by doctors, those records are linked to the new user account.
 * Uses a secure database function to bypass RLS restrictions.
 */
export async function linkPatientAccount(userId: string, email: string): Promise<{
  linked: boolean;
  count: number;
  error?: string;
}> {
  try {
    // Use the secure database function to link patient records
    // This function runs with SECURITY DEFINER to bypass RLS
    const { data, error } = await supabase.rpc('link_patient_account', {
      p_email: email,
      p_user_id: userId
    });

    if (error) {
      console.error('Error linking patient records:', error);
      return { linked: false, count: 0, error: error.message };
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const result = data as { linked?: boolean; count?: number };
      return { 
        linked: result.linked || false, 
        count: result.count || 0 
      };
    }

    return { linked: false, count: 0 };
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
