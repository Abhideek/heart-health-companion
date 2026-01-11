import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, FileText, Activity, Heart, Search, Plus, 
  ChevronRight, CheckCircle, AlertTriangle, AlertCircle,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { usePatientData, ClinicalData, Patient } from '@/contexts/PatientDataContext';
import { useToast } from '@/hooks/use-toast';

const initialClinicalData: ClinicalData = {
  age: 55,
  sex: 1,
  cp: 0,
  trestbps: 120,
  chol: 200,
  fbs: 0,
  restecg: 0,
  thalach: 150,
  exang: 0,
  oldpeak: 0,
  slope: 0,
  ca: 0,
  thal: 1,
};

const DoctorDashboard: React.FC = () => {
  const { patients, addReport, publishReport, addPatient, isLoading } = usePatientData();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicalData, setClinicalData] = useState<ClinicalData>(initialClinicalData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ score: number; level: 'low' | 'medium' | 'high' } | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  
  // Add patient form state
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field: keyof ClinicalData, value: number) => {
    setClinicalData(prev => ({ ...prev, [field]: value }));
  };

  const calculateRisk = (): { score: number; level: 'low' | 'medium' | 'high' } => {
    let riskScore = 0;
    riskScore += clinicalData.age > 55 ? 15 : clinicalData.age > 45 ? 10 : 5;
    riskScore += clinicalData.trestbps > 140 ? 20 : clinicalData.trestbps > 120 ? 10 : 0;
    riskScore += clinicalData.chol > 240 ? 20 : clinicalData.chol > 200 ? 10 : 0;
    riskScore += clinicalData.cp * 5;
    riskScore += clinicalData.exang * 15;
    riskScore += clinicalData.thalach < 120 ? 15 : clinicalData.thalach < 150 ? 5 : 0;
    riskScore += clinicalData.oldpeak * 5;
    riskScore += clinicalData.ca * 10;
    
    const normalizedScore = Math.min(Math.round(riskScore), 100);
    const level: 'low' | 'medium' | 'high' = 
      normalizedScore >= 60 ? 'high' : 
      normalizedScore >= 30 ? 'medium' : 'low';
    
    return { score: normalizedScore, level };
  };

  const generateDietPlan = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'high':
        return "DASH Diet - Low Sodium: Focus on fruits, vegetables, whole grains. Limit sodium to 1,500mg daily. Avoid processed foods, red meat, and sugary beverages. Include omega-3 rich fish 2-3 times per week.";
      case 'medium':
        return "Mediterranean Diet Modified: Emphasize whole grains, legumes, and healthy fats. Moderate sodium (2,000mg daily). Include regular physical activity. Limit alcohol and processed foods.";
      default:
        return "Balanced Maintenance Diet: Continue heart-healthy eating habits. Maintain regular exercise. Annual checkups recommended. Focus on variety of fruits, vegetables, lean proteins.";
    }
  };

  const generateRecommendations = (level: 'low' | 'medium' | 'high'): string[] => {
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
  };

  const handleAnalyze = async () => {
    if (!selectedPatient) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = calculateRisk();
    setAnalysisResult(result);
    
    const report = await addReport({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientEmail: selectedPatient.email,
      clinicalData,
      riskScore: result.score,
      riskLevel: result.level,
      dietPlan: generateDietPlan(result.level),
      recommendations: generateRecommendations(result.level),
    });
    
    if (report) {
      setCurrentReportId(report.id);
      toast({
        title: "Analysis Complete",
        description: `Risk assessment saved for ${selectedPatient.name}`,
      });
    }
    
    setIsAnalyzing(false);
  };

  const handlePublish = async () => {
    if (currentReportId) {
      await publishReport(currentReportId);
      toast({
        title: "Report Published",
        description: "Patient can now view their health report",
        variant: "default",
      });
      setAnalysisResult(null);
      setSelectedPatient(null);
      setClinicalData(initialClinicalData);
      setCurrentReportId(null);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatientName || !newPatientEmail) return;
    
    const patient = await addPatient({
      name: newPatientName,
      email: newPatientEmail,
      age: newPatientAge ? parseInt(newPatientAge) : undefined,
    });
    
    if (patient) {
      toast({
        title: "Patient Added",
        description: `${patient.name} has been added to your patient list`,
      });
      setNewPatientName('');
      setNewPatientEmail('');
      setNewPatientAge('');
      setIsAddingPatient(false);
    }
  };

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-warning" />;
      default: return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-success';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Analyze patient heart health and generate reports</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Patient List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Patients
                  </CardTitle>
                  <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Patient</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Name</label>
                          <Input
                            placeholder="Patient name"
                            value={newPatientName}
                            onChange={(e) => setNewPatientName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            placeholder="patient@email.com"
                            value={newPatientEmail}
                            onChange={(e) => setNewPatientEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Age (optional)</label>
                          <Input
                            type="number"
                            placeholder="45"
                            value={newPatientAge}
                            onChange={(e) => setNewPatientAge(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAddPatient} className="w-full">
                          Add Patient
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No patients yet</p>
                        <p className="text-sm">Add your first patient to get started</p>
                      </div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <motion.button
                          key={patient.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setAnalysisResult(null);
                            if (patient.age) {
                              setClinicalData(prev => ({ ...prev, age: patient.age! }));
                            }
                          }}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedPatient?.id === patient.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className={`text-sm ${selectedPatient?.id === patient.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {patient.age ? `Age: ${patient.age} • ` : ''}{patient.email}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                          {patient.riskLevel && (
                            <div className={`mt-2 flex items-center gap-1 text-xs capitalize ${selectedPatient?.id === patient.id ? '' : getRiskColor(patient.riskLevel)}`}>
                              {getRiskIcon(patient.riskLevel)}
                              {patient.riskLevel} Risk
                            </div>
                          )}
                        </motion.button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Clinical Data Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Clinical Data Entry
                </CardTitle>
                <CardDescription>
                  {selectedPatient 
                    ? `Entering data for ${selectedPatient.name}` 
                    : 'Select a patient to begin analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Age</label>
                        <Input
                          type="number"
                          value={clinicalData.age}
                          onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sex</label>
                        <Select
                          value={clinicalData.sex.toString()}
                          onValueChange={(v) => handleInputChange('sex', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Female</SelectItem>
                            <SelectItem value="1">Male</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Chest Pain Type</label>
                        <Select
                          value={clinicalData.cp.toString()}
                          onValueChange={(v) => handleInputChange('cp', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Typical Angina</SelectItem>
                            <SelectItem value="1">Atypical Angina</SelectItem>
                            <SelectItem value="2">Non-anginal Pain</SelectItem>
                            <SelectItem value="3">Asymptomatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resting BP (mmHg)</label>
                        <Input
                          type="number"
                          value={clinicalData.trestbps}
                          onChange={(e) => handleInputChange('trestbps', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cholesterol (mg/dl)</label>
                        <Input
                          type="number"
                          value={clinicalData.chol}
                          onChange={(e) => handleInputChange('chol', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fasting Blood Sugar {'>'} 120</label>
                        <Select
                          value={clinicalData.fbs.toString()}
                          onValueChange={(v) => handleInputChange('fbs', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resting ECG</label>
                        <Select
                          value={clinicalData.restecg.toString()}
                          onValueChange={(v) => handleInputChange('restecg', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Normal</SelectItem>
                            <SelectItem value="1">ST-T Abnormality</SelectItem>
                            <SelectItem value="2">LV Hypertrophy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Heart Rate</label>
                        <Input
                          type="number"
                          value={clinicalData.thalach}
                          onChange={(e) => handleInputChange('thalach', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Exercise Induced Angina</label>
                        <Select
                          value={clinicalData.exang.toString()}
                          onValueChange={(v) => handleInputChange('exang', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">No</SelectItem>
                            <SelectItem value="1">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">ST Depression (Oldpeak)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={clinicalData.oldpeak}
                          onChange={(e) => handleInputChange('oldpeak', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Slope</label>
                        <Select
                          value={clinicalData.slope.toString()}
                          onValueChange={(v) => handleInputChange('slope', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Upsloping</SelectItem>
                            <SelectItem value="1">Flat</SelectItem>
                            <SelectItem value="2">Downsloping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Major Vessels (0-3)</label>
                        <Select
                          value={clinicalData.ca.toString()}
                          onValueChange={(v) => handleInputChange('ca', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="hero"
                        size="lg"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Heart className="h-5 w-5" />
                            Analyze & Submit
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Analysis Result */}
                    <AnimatePresence>
                      {analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Card className={`border-2 ${
                            analysisResult.level === 'high' ? 'border-destructive bg-destructive/5' :
                            analysisResult.level === 'medium' ? 'border-warning bg-warning/5' :
                            'border-success bg-success/5'
                          }`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Risk Analysis Result</h3>
                                {getRiskIcon(analysisResult.level)}
                              </div>
                              
                              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                <div className="text-center p-4 rounded-lg bg-background">
                                  <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                                  <p className={`text-4xl font-bold ${getRiskColor(analysisResult.level)}`}>
                                    {analysisResult.score}%
                                  </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-background">
                                  <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                                  <p className={`text-2xl font-bold capitalize ${getRiskColor(analysisResult.level)}`}>
                                    {analysisResult.level}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="success"
                                size="lg"
                                onClick={handlePublish}
                                className="w-full"
                              >
                                <FileText className="h-5 w-5" />
                                Publish to Patient Portal
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Select a patient from the list to begin entering clinical data for heart disease risk analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
