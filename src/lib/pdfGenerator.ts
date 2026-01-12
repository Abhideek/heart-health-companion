import jsPDF from 'jspdf';
import { PatientReport } from '@/contexts/PatientDataContext';

const COLORS = {
  primary: [30, 58, 138] as [number, number, number],     // Deep blue
  secondary: [20, 184, 166] as [number, number, number],  // Teal
  destructive: [239, 68, 68] as [number, number, number], // Red
  warning: [234, 179, 8] as [number, number, number],     // Yellow
  success: [34, 197, 94] as [number, number, number],     // Green
  text: [31, 41, 55] as [number, number, number],         // Dark gray
  muted: [107, 114, 128] as [number, number, number],     // Gray
};

function getRiskColor(level: 'low' | 'medium' | 'high'): [number, number, number] {
  switch (level) {
    case 'high': return COLORS.destructive;
    case 'medium': return COLORS.warning;
    default: return COLORS.success;
  }
}

function getSexLabel(sex: number): string {
  return sex === 1 ? 'Male' : 'Female';
}

function getChestPainLabel(cp: number): string {
  const labels = ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'];
  return labels[cp] || 'Unknown';
}

function getRestECGLabel(restecg: number): string {
  const labels = ['Normal', 'ST-T Abnormality', 'LV Hypertrophy'];
  return labels[restecg] || 'Unknown';
}

function getSlopeLabel(slope: number): string {
  const labels = ['Upsloping', 'Flat', 'Downsloping'];
  return labels[slope] || 'Unknown';
}

export function generatePatientReportPDF(report: PatientReport): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header with logo
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CardioCare', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Heart Health Assessment', 20, 33);
  
  // Report date on header right
  doc.setFontSize(10);
  const dateStr = report.publishedAt 
    ? new Date(report.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Report Date: ${dateStr}`, pageWidth - 20, 25, { align: 'right' });
  
  yPos = 55;

  // Patient Info Section
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${report.patientName}`, 20, yPos);
  doc.text(`Email: ${report.patientEmail}`, pageWidth / 2, yPos);
  yPos += 8;
  doc.text(`Age: ${report.clinicalData.age} years`, 20, yPos);
  doc.text(`Sex: ${getSexLabel(report.clinicalData.sex)}`, pageWidth / 2, yPos);
  yPos += 15;

  // Risk Assessment Box
  const riskColor = getRiskColor(report.riskLevel);
  doc.setFillColor(...riskColor);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Heart Disease Risk Assessment', 30, yPos + 12);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${report.riskScore}%`, 30, yPos + 28);
  
  doc.setFontSize(18);
  doc.text(`${report.riskLevel.toUpperCase()} RISK`, pageWidth - 30, yPos + 22, { align: 'right' });
  
  yPos += 50;

  // Clinical Data Section
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Clinical Data', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);

  const clinicalData = [
    ['Resting Blood Pressure', `${report.clinicalData.trestbps} mmHg`],
    ['Cholesterol', `${report.clinicalData.chol} mg/dl`],
    ['Fasting Blood Sugar > 120', report.clinicalData.fbs === 1 ? 'Yes' : 'No'],
    ['Resting ECG', getRestECGLabel(report.clinicalData.restecg)],
    ['Max Heart Rate', `${report.clinicalData.thalach} bpm`],
    ['Exercise Induced Angina', report.clinicalData.exang === 1 ? 'Yes' : 'No'],
    ['Chest Pain Type', getChestPainLabel(report.clinicalData.cp)],
    ['ST Depression (Oldpeak)', report.clinicalData.oldpeak.toFixed(1)],
    ['Slope', getSlopeLabel(report.clinicalData.slope)],
    ['Major Vessels (CA)', report.clinicalData.ca.toString()],
  ];

  const colWidth = (pageWidth - 40) / 2;
  clinicalData.forEach((item, index) => {
    const col = index % 2;
    const x = 20 + col * colWidth;
    
    if (col === 0 && index > 0) yPos += 7;
    
    doc.setTextColor(...COLORS.muted);
    doc.text(item[0] + ':', x, yPos);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(item[1], x + 55, yPos);
    doc.setFont('helvetica', 'normal');
  });

  yPos += 20;

  // Diet Plan Section
  doc.setTextColor(...COLORS.secondary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Personalized Diet Plan', 20, yPos);
  yPos += 8;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const dietLines = doc.splitTextToSize(report.dietPlan, pageWidth - 40);
  doc.text(dietLines, 20, yPos);
  yPos += dietLines.length * 5 + 10;

  // Recommendations Section
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Doctor's Recommendations", 20, yPos);
  yPos += 8;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  report.recommendations.forEach((rec, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`• ${rec}`, 25, yPos);
    yPos += 6;
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, footerY - 5, pageWidth, 20, 'F');
  
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.text('This report is generated by CardioCare AI Health Platform. For medical advice, please consult your healthcare provider.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Report ID: ${report.id}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Save the PDF
  doc.save(`CardioCare_Report_${report.patientName.replace(/\s+/g, '_')}_${dateStr.replace(/,?\s+/g, '_')}.pdf`);
}
