
import { useState } from "react";
import { Check, ChevronDown, Code } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgrammingLanguage } from "@/types";

interface LanguageSelectorProps {
  languages: ProgrammingLanguage[];
  selected: ProgrammingLanguage;
  onSelect: (language: ProgrammingLanguage) => void;
}

export function LanguageSelector({ languages = [], selected, onSelect }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ensure we have a valid languages array
  const validLanguages = Array.isArray(languages) ? languages : [];
  
  // Filter languages based on search query
  const filteredLanguages = validLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-muted text-foreground border-primary/20 hover:border-primary/50"
        >
          <div className="flex items-center gap-2">
            <Code size={18} className="text-primary" />
            {selected?.name || "Select language"}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-background border border-border">
        <Command className="bg-transparent">
          <CommandInput 
            placeholder="Search language..." 
            className="h-9" 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredLanguages.length === 0 ? (
              <CommandEmpty>No languages found.</CommandEmpty>
            ) : (
              <CommandGroup className="max-h-64 overflow-y-auto scrollbar-thin">
                {filteredLanguages.map((language) => (
                  <CommandItem
                    key={language.id}
                    value={language.name}
                    onSelect={() => {
                      onSelect(language);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-2 aria-selected:bg-accent"
                  >
                    <Code size={16} className="text-primary" />
                    {language.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selected?.id === language.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
