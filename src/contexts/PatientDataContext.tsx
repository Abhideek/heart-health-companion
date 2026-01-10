import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addReport: (report: Omit<PatientReport, 'id' | 'createdAt'>) => void;
  publishReport: (reportId: string) => void;
  getPatientReports: (patientEmail: string) => PatientReport[];
  getLatestReport: (patientEmail: string) => PatientReport | null;
}

const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

const mockPatients: Patient[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com', age: 58, lastVisit: '2024-01-15', riskLevel: 'medium' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@email.com', age: 45, lastVisit: '2024-01-18', riskLevel: 'low' },
  { id: '3', name: 'Michael Brown', email: 'mbrown@email.com', age: 62, lastVisit: '2024-01-20', riskLevel: 'high' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@email.com', age: 51, lastVisit: '2024-01-22', riskLevel: 'medium' },
];

export const PatientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients] = useState<Patient[]>(mockPatients);
  const [reports, setReports] = useState<PatientReport[]>(() => {
    const stored = localStorage.getItem('cardiocare_reports');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cardiocare_reports', JSON.stringify(reports));
  }, [reports]);

  const addReport = (reportData: Omit<PatientReport, 'id' | 'createdAt'>) => {
    const newReport: PatientReport = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
  };

  const publishReport = (reportId: string) => {
    setReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? { ...report, publishedAt: new Date().toISOString() }
          : report
      )
    );
  };

  const getPatientReports = (patientEmail: string) => {
    return reports.filter(r => r.patientEmail === patientEmail && r.publishedAt);
  };

  const getLatestReport = (patientEmail: string) => {
    const patientReports = getPatientReports(patientEmail);
    return patientReports.length > 0 ? patientReports[0] : null;
  };

  return (
    <PatientDataContext.Provider value={{ patients, reports, addReport, publishReport, getPatientReports, getLatestReport }}>
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
