import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, FileText, Salad, Shield, Zap, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

const features = [
  {
    icon: Activity,
    title: 'Clinical Data Entry',
    description: 'Comprehensive input forms for all UCI Heart Dataset parameters including ECG, blood pressure, and cholesterol levels.'
  },
  {
    icon: Zap,
    title: 'AI Risk Calculation',
    description: 'Advanced machine learning algorithms analyze clinical data to provide accurate heart disease risk predictions.'
  },
  {
    icon: FileText,
    title: 'Patient Reports',
    description: 'Patients can securely access their risk analysis reports, clinical summaries, and downloadable PDFs.'
  },
  {
    icon: Salad,
    title: 'AI Diet Plans',
    description: 'Personalized nutrition recommendations generated based on individual risk profiles and health goals.'
  }
];

const stats = [
  { value: '98%', label: 'Prediction Accuracy' },
  { value: '50K+', label: 'Patients Analyzed' },
  { value: '500+', label: 'Healthcare Partners' },
  { value: '24/7', label: 'AI Support' }
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent mb-6"
            >
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">HIPAA Compliant & Secure</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Advanced AI Heart Disease
              <br />
              <span className="text-gradient">Prediction Platform</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Empowering healthcare professionals with AI-driven insights and providing patients 
              with personalized health recommendations for better cardiac care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/login?role=doctor">
                <Button variant="hero" size="xl">
                  Doctor Portal
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login?role=patient">
                <Button variant="heroOutline" size="xl">
                  Patient Access
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Animated Heart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative h-32 w-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Heart className="h-16 w-16 text-primary-foreground animate-heartbeat" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Comprehensive Heart Health Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything doctors and patients need for proactive cardiac care management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card hover:shadow-medium transition-shadow duration-300 border-border">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-primary p-8 sm:p-12 text-center border-0">
              <CardContent className="p-0">
                <Users className="h-12 w-12 text-primary-foreground/80 mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                  Ready to Transform Cardiac Care?
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                  Join thousands of healthcare providers using AI-powered predictions 
                  to improve patient outcomes.
                </p>
                <Link to="/signup">
                  <Button 
                    size="xl" 
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  >
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">CardioCare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CardioCare. AI-Powered Heart Health Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
