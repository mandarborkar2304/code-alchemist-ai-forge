
import { Sparkles, Zap, Code } from "lucide-react";

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
      <div className="container relative z-10 mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-blur animate-fade-in mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Intelligent Code Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient-primary">Transform</span> Your Code
          </h1>
          
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Elevate your programming with AI-powered code analysis, refactoring suggestions,
            and quality improvement recommendations.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
              <Code className="h-4 w-4 text-primary" />
              <span>50+ Languages</span>
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
