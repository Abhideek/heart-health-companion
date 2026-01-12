import { z } from 'zod';

// Define valid ranges for clinical data fields based on medical standards
export const clinicalDataRanges = {
  age: { min: 0, max: 120, label: 'Age' },
  trestbps: { min: 50, max: 250, label: 'Resting Blood Pressure' },
  chol: { min: 100, max: 600, label: 'Cholesterol' },
  thalach: { min: 40, max: 220, label: 'Max Heart Rate' },
  oldpeak: { min: 0, max: 10, label: 'ST Depression' },
} as const;

// Zod schema for clinical data validation
export const clinicalDataSchema = z.object({
  age: z.number()
    .min(clinicalDataRanges.age.min, `Age must be at least ${clinicalDataRanges.age.min}`)
    .max(clinicalDataRanges.age.max, `Age must be at most ${clinicalDataRanges.age.max}`),
  sex: z.number().min(0).max(1),
  cp: z.number().min(0).max(3),
  trestbps: z.number()
    .min(clinicalDataRanges.trestbps.min, `Blood pressure must be at least ${clinicalDataRanges.trestbps.min}`)
    .max(clinicalDataRanges.trestbps.max, `Blood pressure must be at most ${clinicalDataRanges.trestbps.max}`),
  chol: z.number()
    .min(clinicalDataRanges.chol.min, `Cholesterol must be at least ${clinicalDataRanges.chol.min}`)
    .max(clinicalDataRanges.chol.max, `Cholesterol must be at most ${clinicalDataRanges.chol.max}`),
  fbs: z.number().min(0).max(1),
  restecg: z.number().min(0).max(2),
  thalach: z.number()
    .min(clinicalDataRanges.thalach.min, `Heart rate must be at least ${clinicalDataRanges.thalach.min}`)
    .max(clinicalDataRanges.thalach.max, `Heart rate must be at most ${clinicalDataRanges.thalach.max}`),
  exang: z.number().min(0).max(1),
  oldpeak: z.number()
    .min(clinicalDataRanges.oldpeak.min, `ST Depression must be at least ${clinicalDataRanges.oldpeak.min}`)
    .max(clinicalDataRanges.oldpeak.max, `ST Depression must be at most ${clinicalDataRanges.oldpeak.max}`),
  slope: z.number().min(0).max(2),
  ca: z.number().min(0).max(3),
  thal: z.number().min(0).max(3),
});

export type ValidatedClinicalData = z.infer<typeof clinicalDataSchema>;

// Validate a single field value
export function validateClinicalField(
  field: keyof typeof clinicalDataRanges,
  value: number
): { valid: boolean; error?: string } {
  const range = clinicalDataRanges[field];
  if (!range) {
    return { valid: true };
  }

  if (isNaN(value)) {
    return { valid: false, error: `${range.label} must be a valid number` };
  }

  if (value < range.min) {
    return { valid: false, error: `${range.label} must be at least ${range.min}` };
  }

  if (value > range.max) {
    return { valid: false, error: `${range.label} must be at most ${range.max}` };
  }

  return { valid: true };
}

// Validate all clinical data before submission
export function validateClinicalData(data: ValidatedClinicalData): {
  valid: boolean;
  errors: string[];
} {
  const result = clinicalDataSchema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(err => err.message);
  return { valid: false, errors };
}

// Parse and validate numeric input with range checking
export function parseNumericInput(
  value: string,
  field: keyof typeof clinicalDataRanges,
  isFloat: boolean = false
): { value: number; error?: string } {
  const range = clinicalDataRanges[field];
  
  // Handle empty input
  if (value === '' || value === null || value === undefined) {
    return { value: range.min, error: `${range.label} is required` };
  }

  const parsed = isFloat ? parseFloat(value) : parseInt(value, 10);
  
  // Handle NaN
  if (isNaN(parsed)) {
    return { value: range.min, error: `${range.label} must be a valid number` };
  }

  // Validate range
  const validation = validateClinicalField(field, parsed);
  if (!validation.valid) {
    // Clamp to valid range
    const clamped = Math.max(range.min, Math.min(range.max, parsed));
    return { value: clamped, error: validation.error };
  }

  return { value: parsed };
}
