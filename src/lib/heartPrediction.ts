import { supabase } from '@/integrations/supabase/client';

export interface ClinicalDataInput {
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

export interface PredictionResult {
  prediction_text: string;
  risk_percentage: number;
  prediction_class: number;
  risk_level: 'low' | 'medium' | 'high';
}

/**
 * Calls the heart disease prediction edge function
 * Returns AI-powered risk assessment based on clinical data
 */
export async function predictHeartDisease(data: ClinicalDataInput): Promise<PredictionResult> {
  console.log('Calling prediction endpoint with data:', data);

  const { data: result, error } = await supabase.functions.invoke('predict', {
    body: data
  });

  if (error) {
    console.error('Prediction error:', error);
    throw new Error(error.message || 'Failed to get prediction');
  }

  console.log('Prediction result:', result);

  return {
    prediction_text: result.prediction_text,
    risk_percentage: result.risk_percentage,
    prediction_class: result.prediction_class,
    risk_level: result.risk_level
  };
}

/**
 * Generates diet plan based on risk level
 */
export function generateDietPlan(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return "DASH Diet - Low Sodium: Focus on fruits, vegetables, whole grains. Limit sodium to 1,500mg daily. Avoid processed foods, red meat, and sugary beverages. Include omega-3 rich fish 2-3 times per week.";
    case 'medium':
      return "Mediterranean Diet Modified: Emphasize whole grains, legumes, and healthy fats. Moderate sodium (2,000mg daily). Include regular physical activity. Limit alcohol and processed foods.";
    default:
      return "Balanced Maintenance Diet: Continue heart-healthy eating habits. Maintain regular exercise. Annual checkups recommended. Focus on variety of fruits, vegetables, lean proteins.";
  }
}

/**
 * Generates clinical recommendations based on risk level
 */
export function generateRecommendations(level: 'low' | 'medium' | 'high'): string[] {
  const base = [
    "Schedule follow-up in 6 months",
    "Continue monitoring blood pressure",
    "Maintain healthy weight"
  ];
  
  if (level === 'high') {
    return [
      "Urgent: Schedule cardiology consultation",
      "Start cardiac rehabilitation program",
      "Daily blood pressure monitoring required",
      "Consider stress testing",
      ...base
    ];
  }
  
  if (level === 'medium') {
    return [
      "Lifestyle modifications recommended",
      "Consider starting statin therapy",
      "Increase physical activity to 150min/week",
      ...base
    ];
  }
  
  return base;
}
