
import { Sparkles, Zap, Code, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-purple-900/20 z-0" />
      
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }}/>
      </div>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 md:py-28 lg:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-blur animate-fade-in mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Intelligent Code Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient-primary">Transform</span> Your Code
          </h1>
          
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Elevate your programming with Advanced Static code analysis, refactoring suggestions,
            and quality improvement recommendations that help you write better code, faster.
          </p>
          
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button asChild size="lg" className="px-8 py-6 text-lg shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300">
              <Link to="/editor">
                Start Analyzing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
              <Code className="h-4 w-4 text-primary" />
              <span>20+ Languages</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant Feedback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
