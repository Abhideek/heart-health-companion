import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClinicalData {
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

/**
 * Heart Disease Risk Prediction
 * Based on UCI Heart Disease dataset factors with weighted scoring
 * This implements a clinically-informed risk calculation algorithm
 */
function calculateHeartDiseaseRisk(data: ClinicalData): { 
  riskPercentage: number; 
  predictionClass: number;
  predictionText: string;
  riskLevel: 'low' | 'medium' | 'high';
} {
  let riskScore = 0;
  const maxScore = 100;

  // Age factor (0-15 points)
  if (data.age >= 65) riskScore += 15;
  else if (data.age >= 55) riskScore += 12;
  else if (data.age >= 45) riskScore += 8;
  else if (data.age >= 35) riskScore += 4;

  // Sex factor - Males have higher risk (0-5 points)
  if (data.sex === 1) riskScore += 5;

  // Chest Pain Type (0-12 points)
  // 0=Typical Angina, 1=Atypical, 2=Non-anginal, 3=Asymptomatic
  riskScore += data.cp * 4;

  // Resting Blood Pressure (0-15 points)
  if (data.trestbps >= 180) riskScore += 15;
  else if (data.trestbps >= 160) riskScore += 12;
  else if (data.trestbps >= 140) riskScore += 8;
  else if (data.trestbps >= 120) riskScore += 4;

  // Cholesterol (0-15 points)
  if (data.chol >= 300) riskScore += 15;
  else if (data.chol >= 260) riskScore += 12;
  else if (data.chol >= 240) riskScore += 8;
  else if (data.chol >= 200) riskScore += 4;

  // Fasting Blood Sugar > 120 mg/dl (0-5 points)
  if (data.fbs === 1) riskScore += 5;

  // Resting ECG (0-6 points)
  riskScore += data.restecg * 3;

  // Max Heart Rate Achieved - Lower is worse (0-10 points)
  if (data.thalach < 100) riskScore += 10;
  else if (data.thalach < 120) riskScore += 7;
  else if (data.thalach < 140) riskScore += 4;
  else if (data.thalach < 160) riskScore += 2;

  // Exercise Induced Angina (0-10 points)
  if (data.exang === 1) riskScore += 10;

  // ST Depression (oldpeak) - 0-10 points
  const oldpeakScore = Math.min(data.oldpeak * 2.5, 10);
  riskScore += oldpeakScore;

  // Slope of ST segment (0-6 points)
  riskScore += data.slope * 3;

  // Number of major vessels colored by fluoroscopy (0-12 points)
  riskScore += data.ca * 4;

  // Thalassemia (0-9 points)
  // 0=Normal, 1=Fixed Defect, 2=Reversible Defect
  riskScore += data.thal * 3;

  // Normalize to 0-100
  const normalizedScore = Math.min(Math.round(riskScore), maxScore);
  
  // Determine risk level and prediction
  let predictionClass: number;
  let predictionText: string;
  let riskLevel: 'low' | 'medium' | 'high';

  if (normalizedScore >= 60) {
    predictionClass = 1;
    predictionText = "High Probability of Heart Disease";
    riskLevel = 'high';
  } else if (normalizedScore >= 35) {
    predictionClass = 1;
    predictionText = "Moderate Risk of Heart Disease";
    riskLevel = 'medium';
  } else {
    predictionClass = 0;
    predictionText = "Low Probability of Heart Disease";
    riskLevel = 'low';
  }

  console.log(`Risk calculation: score=${normalizedScore}, level=${riskLevel}`);

  return {
    riskPercentage: normalizedScore / 100,
    predictionClass,
    predictionText,
    riskLevel
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ClinicalData = await req.json();
    console.log("Received prediction request:", JSON.stringify(data));

    // Validate required fields
    const requiredFields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'];
    for (const field of requiredFields) {
      if (data[field as keyof ClinicalData] === undefined) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const result = calculateHeartDiseaseRisk(data);

    console.log("Prediction result:", JSON.stringify(result));

    return new Response(
      JSON.stringify({
        prediction_text: result.predictionText,
        risk_percentage: result.riskPercentage,
        prediction_class: result.predictionClass,
        risk_level: result.riskLevel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Prediction failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
