import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Brain, Shield, Upload, MessageSquare, Download, Zap, Users, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import logoImage from "@/assets/logo.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const features = [
    {
      icon: Upload,
      title: "Smart Document Upload",
      description: "Upload PDF, DOCX, or TXT files with automatic text extraction and processing"
    },
    {
      icon: Brain,
      title: "AI-Powered Simplification",
      description: "Transform complex legal jargon into plain English using advanced AI"
    },
    {
      icon: MessageSquare,
      title: "Interactive Q&A Chat",
      description: "Ask questions about your documents and get instant, accurate answers"
    },
        {
          icon: Shield,
          title: "Legal Term Highlighting",
          description: "Important legal terms are color-coded by severity level for easy identification"
        },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your documents are encrypted and stored securely with enterprise-grade security"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get document summaries and answers in seconds, not hours"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Small Business Owner",
      content: "LegalEase saved me thousands in legal fees. I can now understand contracts without calling my lawyer every time."
    },
    {
      name: "Marcus Rodriguez",
      role: "Startup Founder",
      content: "Finally, a tool that makes legal documents accessible. The AI explanations are incredibly accurate and helpful."
    },
    {
      name: "Dr. Emily Watson",
      role: "Healthcare Administrator",
      content: "Perfect for reviewing compliance documents. The chat feature helps me understand complex regulations instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <img src={logoImage} alt="LegalEase AI Logo" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-bold text-foreground">LegalEase AI</span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button onClick={onGetStarted} className="legal-gradient">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              Make Legal Documents
              <span className="legal-gradient bg-clip-text text-transparent"> Simple</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-balance">
              Transform complex legal jargon into plain English with AI-powered document simplification. 
              Upload, understand, and chat with your legal documents in seconds.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="legal-gradient text-lg px-8 py-6 shadow-glow"
            >
              Start Simplifying Documents
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </motion.div>

          {/* Hero Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-law-gold">10,000+</div>
              <div className="text-muted-foreground">Documents Simplified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-law-gold">99.9%</div>
              <div className="text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-law-gold">5 Sec</div>
              <div className="text-muted-foreground">Average Processing</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Everything you need to understand and work with legal documents efficiently
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="legal-card h-full hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 legal-gradient rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Get from complex legal document to clear understanding in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload Document",
                description: "Simply drag and drop your legal document or browse to upload PDF, DOCX, or TXT files"
              },
              {
                step: "02", 
                title: "AI Processing",
                description: "Our advanced AI analyzes your document and creates a simplified, easy-to-understand summary"
              },
              {
                step: "03",
                title: "Chat & Export",
                description: "Ask questions about your document and export the simplified version for future reference"
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="h-16 w-16 legal-gradient rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-balance">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 gradient-subtle">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Join thousands of satisfied users who have simplified their legal workflows
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="legal-card h-full">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Simplify Your Legal Documents?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Start your free trial today and experience the power of AI-driven legal document simplification
            </p>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="legal-gradient text-lg px-8 py-6 shadow-glow"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src={logoImage} alt="LegalEase AI Logo" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold">LegalEase AI</span>
            </div>
            <div className="text-muted-foreground">
              © 2024 LegalEase. Making legal documents accessible to everyone.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};