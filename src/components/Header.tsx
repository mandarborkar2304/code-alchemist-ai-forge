
import { CodeSquare } from "lucide-react";
import LanguageVersions from "@/components/LanguageVersions";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CodeSquare className="h-7 w-7 text-primary animate-pulse-glow" />
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-gradient-primary">Code</span>Alchemist
          </h1>
          <p className="text-sm text-muted-foreground ml-4">by Mandar Borkar</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageVersions />
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs border-primary/20 hover:border-primary/50 bg-background"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            New Project
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
