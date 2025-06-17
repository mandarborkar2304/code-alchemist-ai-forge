import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { Brain, Code, Zap, Shield, Sparkles, Github } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      <HeroSection />
      
      <main className="flex-1">
        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-gradient-primary">Features</span> That Set Us Apart
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-black/20 border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Static Analysis</h3>
                <p className="text-muted-foreground">Get report on your code with our advanced evaluation system that identifies problems and potentials issues.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-black/20 border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
                <p className="text-muted-foreground">
                  With support for 20+ programming languages, including Python for Data Science with PyTorch and TensorFlow libraries, Java, JavaScript, C++, and more.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-black/20 border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,58,237,0.15)]">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
                <p className="text-muted-foreground">
                  Receive immediate results with detailed metrics on code quality, structure, best practices, and optimization suggestions.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Problems Solved Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-background via-background to-purple-950/10">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-gradient-primary">Problems</span> We Solve
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
              {/* Problem 1 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Code Quality Issues</h3>
                  <p className="text-muted-foreground">
                    Identify and fix code quality issues that might lead to bugs, technical debt, and maintenance nightmares. Our tool helps maintain high standards across your entire codebase.
                  </p>
                </div>
              </div>
              
              {/* Problem 2 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Performance Bottlenecks</h3>
                  <p className="text-muted-foreground">
                    Uncover hidden performance issues in your code before they affect your users. Get recommendations for optimization that make your applications run faster and more efficiently.
                  </p>
                </div>
              </div>
              
              {/* Problem 3 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Github className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Inconsistent Coding Standards</h3>
                  <p className="text-muted-foreground">
                    Maintain consistency across your team's code with automated suggestions that align with best practices and your organization's coding standards.
                  </p>
                </div>
              </div>
              
              {/* Problem 4 */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Learning Curve</h3>
                  <p className="text-muted-foreground">
                    Accelerate your learning with AI-powered explanations of complex code structures. Understand what your code does and how to improve it, making it an excellent educational tool.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to <span className="text-gradient-primary">Transform</span> Your Code?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Start analyzing your code now and discover how our intelligent system can help you write better, more efficient, and more maintainable code.
            </p>
            <Button asChild size="lg" className="px-8 py-6 text-lg shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300">
              <Link to="/editor">
                Try Code Analysis Now
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Index;