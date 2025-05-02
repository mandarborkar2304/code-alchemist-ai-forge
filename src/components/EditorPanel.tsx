
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain, RefreshCw, FilePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { programmingLanguages } from "@/data/languages";
import { detectCodeLanguage } from "@/utils/codeExecution";
import { useToast } from "@/hooks/use-toast";
import { CodeAnalysis } from "@/types";
import TabsCodeEditor, { CodeFile } from "@/components/TabsCodeEditor";

interface EditorPanelProps {
  code: string;
  setCode: (code: string) => void;
  selectedLanguage: ProgrammingLanguage;
  setSelectedLanguage: (language: ProgrammingLanguage) => void;
  isAnalyzing: boolean;
  onAnalyzeCode: () => void;
  htmlCode: string;
  setHtmlCode: (html: string) => void;
  cssCode: string;
  setCssCode: (css: string) => void;
  jsCode: string;
  setJsCode: (js: string) => void;
  onReset: () => void;
  analysisResults: CodeAnalysis | null;
}

const EditorPanel = ({
  code,
  setCode,
  selectedLanguage,
  setSelectedLanguage,
  isAnalyzing,
  onAnalyzeCode,
  htmlCode,
  setHtmlCode,
  cssCode,
  setCssCode,
  jsCode,
  setJsCode,
  onReset,
  analysisResults
}: EditorPanelProps) => {
  const { toast } = useToast();
  const [hasLanguageMismatch, setHasLanguageMismatch] = useState(false);
  
  // Create files array for tabs editor
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('');
  
  // Setup initial files based on selected language
  useEffect(() => {
    let newFiles: CodeFile[] = [];
    
    if (selectedLanguage.id === 'web') {
      // Create separate files for HTML, CSS, JS
      newFiles = [
        { id: 'html', name: 'index.html', language: programmingLanguages.find(lang => lang.id === 'web')!, content: htmlCode },
        { id: 'css', name: 'styles.css', language: programmingLanguages.find(lang => lang.id === 'web')!, content: cssCode },
        { id: 'js', name: 'script.js', language: programmingLanguages.find(lang => lang.id === 'web')!, content: jsCode }
      ];
      setActiveFileId('html');
    } else {
      // Create a single file for the selected language
      const fileName = `main${selectedLanguage.fileExtension}`;
      newFiles = [
        { id: 'main', name: fileName, language: selectedLanguage, content: code }
      ];
      setActiveFileId('main');
    }
    
    setFiles(newFiles);
  }, [selectedLanguage.id, code, htmlCode, cssCode, jsCode]);
  
  // Handle file content changes
  const handleFileContentChange = (fileId: string, newContent: string) => {
    if (selectedLanguage.id === 'web') {
      if (fileId === 'html') {
        setHtmlCode(newContent);
      } else if (fileId === 'css') {
        setCssCode(newContent);
      } else if (fileId === 'js') {
        setJsCode(newContent);
      }
    } else {
      setCode(newContent);
    }
    
    // Update files state
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, content: newContent } : file
    ));
  };

  useEffect(() => {
    if (code.trim() && selectedLanguage.id !== 'web') {
      const detectedLang = detectCodeLanguage(code);
      if (detectedLang && detectedLang !== selectedLanguage.id) {
        setHasLanguageMismatch(true);
        toast({
          title: "Language Mismatch Detected",
          description: `Selected compiler is ${selectedLanguage.name}, but code appears to be ${detectedLang}. Please verify your input.`,
          variant: "destructive"
        });
      } else {
        setHasLanguageMismatch(false);
      }
    }
  }, [code, selectedLanguage, toast]);

  const handleAnalyzeClick = () => {
    if (hasLanguageMismatch) {
      toast({
        title: "Cannot Analyze Code",
        description: "Please resolve the language mismatch before analyzing.",
        variant: "destructive"
      });
      return;
    }
    onAnalyzeCode();
  };

  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
    setHasLanguageMismatch(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex items-center">
            <Code className="h-5 w-5 mr-2 text-primary" />
            Code Editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-42">
            <LanguageSelector languages={programmingLanguages} selected={selectedLanguage} onSelect={handleLanguageChange} />
          </div>
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={onReset}>
            <RefreshCw className="h-3 w-3" />
            Reset
          </Button>
          <Button variant="default" size="sm" disabled={isAnalyzing || hasLanguageMismatch} onClick={handleAnalyzeClick} className="gap-1 h-8 mx-[8px]">
            {isAnalyzing ? <>
                <span className="animate-spin h-3 w-3 border-2 border-t-transparent border-r-transparent rounded-full"></span>
                Analyzing
              </> : <>
                <Brain className="h-3 w-3" />
                Analyze
              </>}
          </Button>
        </div>
      </div>
      <Separator className="bg-border mb-4" />
      <div className="flex-1 min-h-0 h-[calc(100vh-8rem)]">
        <TabsCodeEditor 
          files={files}
          activeFileId={activeFileId}
          onActiveFileChange={setActiveFileId}
          onFileContentChange={handleFileContentChange}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
