-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('doctor', 'patient');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clinical_reports table
CREATE TABLE public.clinical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  sex INTEGER NOT NULL,
  cp INTEGER NOT NULL,
  trestbps INTEGER NOT NULL,
  chol INTEGER NOT NULL,
  fbs INTEGER NOT NULL,
  restecg INTEGER NOT NULL,
  thalach INTEGER NOT NULL,
  exang INTEGER NOT NULL,
  oldpeak DECIMAL(3,1) NOT NULL,
  slope INTEGER NOT NULL,
  ca INTEGER NOT NULL,
  thal INTEGER NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  diet_plan TEXT,
  recommendations TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.app_role;
  user_name TEXT;
BEGIN
  -- Determine role based on email domain
  IF NEW.email LIKE '%@hospital.com' THEN
    user_role := 'doctor';
  ELSE
    user_role := 'patient';
  END IF;
  
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_name);
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for patients
CREATE POLICY "Doctors can view their patients"
  ON public.patients FOR SELECT
  USING (auth.uid() = doctor_id OR auth.uid() = patient_user_id);

CREATE POLICY "Doctors can create patients"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = doctor_id AND public.has_role('doctor'));

CREATE POLICY "Doctors can update their patients"
  ON public.patients FOR UPDATE
  USING (auth.uid() = doctor_id AND public.has_role('doctor'));

CREATE POLICY "Doctors can delete their patients"
  ON public.patients FOR DELETE
  USING (auth.uid() = doctor_id AND public.has_role('doctor'));

-- RLS Policies for clinical_reports
CREATE POLICY "Doctors can view reports they created"
  ON public.clinical_reports FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their published reports"
  ON public.clinical_reports FOR SELECT
  USING (
    is_published = true AND 
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.patient_user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can create reports"
  ON public.clinical_reports FOR INSERT
  WITH CHECK (auth.uid() = doctor_id AND public.has_role('doctor'));

CREATE POLICY "Doctors can update their reports"
  ON public.clinical_reports FOR UPDATE
  USING (auth.uid() = doctor_id AND public.has_role('doctor'));

CREATE POLICY "Doctors can delete their reports"
  ON public.clinical_reports FOR DELETE
  USING (auth.uid() = doctor_id AND public.has_role('doctor'));