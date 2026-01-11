import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface ClinicalData {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
}

export interface PatientReport {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  clinicalData: ClinicalData;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  dietPlan: string;
  recommendations: string[];
  createdAt: string;
  publishedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  age?: number;
  lastVisit?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface PatientDataContextType {
  patients: Patient[];
  reports: PatientReport[];
  isLoading: boolean;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient | null>;
  addReport: (report: Omit<PatientReport, 'id' | 'createdAt'>) => Promise<PatientReport | null>;
  publishReport: (reportId: string) => Promise<void>;
  getPatientReports: (patientEmail: string) => PatientReport[];
  getLatestReport: (patientEmail: string) => PatientReport | null;
  refreshData: () => Promise<void>;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

export const PatientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    if (!user || user.role !== 'doctor') return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', user.id)
        .order('last_visit', { ascending: false });

      if (error) throw error;

      // Get latest report for each patient to determine risk level
      const patientsWithRisk: Patient[] = await Promise.all(
        (data || []).map(async (p) => {
          const { data: latestReport } = await supabase
            .from('clinical_reports')
            .select('risk_level')
            .eq('patient_id', p.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: p.id,
            name: p.name,
            email: p.email,
            age: p.age || undefined,
            lastVisit: p.last_visit || undefined,
            riskLevel: latestReport?.risk_level as 'low' | 'medium' | 'high' | undefined,
          };
        })
      );

      setPatients(patientsWithRisk);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }, [user]);

  const fetchReports = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('clinical_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role === 'doctor') {
        query = query.eq('doctor_id', user.id);
      } else {
        // Patients see only published reports
        query = query.eq('patient_email', user.email).eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedReports: PatientReport[] = (data || []).map((r) => ({
        id: r.id,
        patientId: r.patient_id,
        patientName: r.patient_name,
        patientEmail: r.patient_email,
        clinicalData: {
          age: r.age,
          sex: r.sex,
          cp: r.cp,
          trestbps: r.trestbps,
          chol: r.chol,
          fbs: r.fbs,
          restecg: r.restecg,
          thalach: r.thalach,
          exang: r.exang,
          oldpeak: Number(r.oldpeak),
          slope: r.slope,
          ca: r.ca,
          thal: r.thal,
        },
        riskScore: r.risk_score,
        riskLevel: r.risk_level as 'low' | 'medium' | 'high',
        dietPlan: r.diet_plan || '',
        recommendations: r.recommendations || [],
        createdAt: r.created_at,
        publishedAt: r.published_at || undefined,
      }));

      setReports(mappedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPatients(), fetchReports()]);
    setIsLoading(false);
  }, [fetchPatients, fetchReports]);

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    } else {
      setPatients([]);
      setReports([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, refreshData]);

  const addPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient | null> => {
    if (!user || user.role !== 'doctor') return null;

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          doctor_id: user.id,
          name: patientData.name,
          email: patientData.email,
          age: patientData.age,
          last_visit: patientData.lastVisit || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newPatient: Patient = {
        id: data.id,
        name: data.name,
        email: data.email,
        age: data.age || undefined,
        lastVisit: data.last_visit || undefined,
      };

      setPatients(prev => [newPatient, ...prev]);
      return newPatient;
    } catch (error) {
      console.error('Error adding patient:', error);
      return null;
    }
  };

  const addReport = async (reportData: Omit<PatientReport, 'id' | 'createdAt'>): Promise<PatientReport | null> => {
    if (!user || user.role !== 'doctor') return null;

    try {
      const { data, error } = await supabase
        .from('clinical_reports')
        .insert({
          patient_id: reportData.patientId,
          doctor_id: user.id,
          patient_email: reportData.patientEmail,
          patient_name: reportData.patientName,
          age: reportData.clinicalData.age,
          sex: reportData.clinicalData.sex,
          cp: reportData.clinicalData.cp,
          trestbps: reportData.clinicalData.trestbps,
          chol: reportData.clinicalData.chol,
          fbs: reportData.clinicalData.fbs,
          restecg: reportData.clinicalData.restecg,
          thalach: reportData.clinicalData.thalach,
          exang: reportData.clinicalData.exang,
          oldpeak: reportData.clinicalData.oldpeak,
          slope: reportData.clinicalData.slope,
          ca: reportData.clinicalData.ca,
          thal: reportData.clinicalData.thal,
          risk_score: reportData.riskScore,
          risk_level: reportData.riskLevel,
          diet_plan: reportData.dietPlan,
          recommendations: reportData.recommendations,
        })
        .select()
        .single();

      if (error) throw error;

      const newReport: PatientReport = {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patient_name,
        patientEmail: data.patient_email,
        clinicalData: reportData.clinicalData,
        riskScore: data.risk_score,
        riskLevel: data.risk_level as 'low' | 'medium' | 'high',
        dietPlan: data.diet_plan || '',
        recommendations: data.recommendations || [],
        createdAt: data.created_at,
      };

      setReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (error) {
      console.error('Error adding report:', error);
      return null;
    }
  };

  const publishReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('clinical_reports')
        .update({ 
          is_published: true, 
          published_at: new Date().toISOString() 
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, publishedAt: new Date().toISOString() }
            : report
        )
      );
    } catch (error) {
      console.error('Error publishing report:', error);
    }
  };

  const getPatientReports = (patientEmail: string) => {
    return reports.filter(r => r.patientEmail === patientEmail && r.publishedAt);
  };

  const getLatestReport = (patientEmail: string) => {
    const patientReports = getPatientReports(patientEmail);
    return patientReports.length > 0 ? patientReports[0] : null;
  };

  return (
    <PatientDataContext.Provider value={{ 
      patients, 
      reports, 
      isLoading,
      addPatient,
      addReport, 
      publishReport, 
      getPatientReports, 
      getLatestReport,
      refreshData 
    }}>
      {children}
    </PatientDataContext.Provider>
  );
};

export const usePatientData = () => {
  const context = useContext(PatientDataContext);
  if (!context) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
};
