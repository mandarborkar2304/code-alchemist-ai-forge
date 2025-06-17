
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageVersion {
  language: string;
  version: string;
}

const languageVersions: LanguageVersion[] = [
  { language: "Bash", version: "5.1.8" },
  { language: "C", version: "11.3.0" },
  { language: "C++", version: "11.3.0" },
  { language: "C#", version: "10.0" },
  { language: "Dart", version: "2.19.6" },
  { language: "Go", version: "1.20.3" },
  { language: "HTML/CSS/JS", version: "ECMAScript 2022" },
  { language: "Java", version: "17.0.6" },
  { language: "Java 19", version: "19.0.2" },
  { language: "Kotlin", version: "1.8.20" },
  { language: "Lua", version: "5.4.4" },
  { language: "Node.js", version: "18.15.0" },
  { language: "Objective-C", version: "14.0.0" },
  { language: "Perl", version: "5.34.1" },
  { language: "PHP", version: "8.2.5" },
  { language: "Python", version: "3.9.16" },
  { language: "Python 3", version: "3.11.3" },
  { language: "Python with ML", version: "3.10.11" },
  { language: "R", version: "4.2.3" },
];

const LanguageVersions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Language Versions <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-1 gap-1 p-2">
          {languageVersions.map((lang) => (
            <DropdownMenuItem key={lang.language} className="grid grid-cols-2 cursor-default">
              <span className="font-medium">{lang.language}</span>
              <span className="text-muted-foreground text-right">{lang.version}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageVersions;
