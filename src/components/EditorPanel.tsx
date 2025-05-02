
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain, RefreshCw, FilePlus, File } from "lucide-react";
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
  const [fileCounter, setFileCounter] = useState(1);
  
  // Setup initial files based on selected language
  useEffect(() => {
    let newFiles: CodeFile[] = [];
    
    if (selectedLanguage.id === 'web') {
      // Create separate files for HTML, CSS, JS
      newFiles = [
        { id: 'html', name: 'index.html', language: programmingLanguages.find(lang => lang.id === 'html') || selectedLanguage, content: htmlCode },
        { id: 'css', name: 'styles.css', language: programmingLanguages.find(lang => lang.id === 'css') || selectedLanguage, content: cssCode },
        { id: 'js', name: 'script.js', language: programmingLanguages.find(lang => lang.id === 'javascript') || selectedLanguage, content: jsCode }
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
  }, [selectedLanguage.id]);
  
  // Update files when code changes
  useEffect(() => {
    if (selectedLanguage.id !== 'web' && files.length > 0) {
      // Update main file content
      const mainFile = files.find(file => file.id === 'main');
      if (mainFile && mainFile.content !== code) {
        setFiles(prev => prev.map(file => 
          file.id === 'main' ? { ...file, content: code } : file
        ));
      }
    }
  }, [code, selectedLanguage.id]);
  
  // Update html, css, js files when their content changes
  useEffect(() => {
    if (selectedLanguage.id === 'web') {
      // Update html file content
      setFiles(prev => prev.map(file => 
        file.id === 'html' ? { ...file, content: htmlCode } :
        file.id === 'css' ? { ...file, content: cssCode } :
        file.id === 'js' ? { ...file, content: jsCode } : file
      ));
    }
  }, [htmlCode, cssCode, jsCode, selectedLanguage.id]);
  
  // Handle file content changes
  const handleFileContentChange = (fileId: string, newContent: string) => {
    if (selectedLanguage.id === 'web') {
      if (fileId === 'html') {
        setHtmlCode(newContent);
      } else if (fileId === 'css') {
        setCssCode(newContent);
      } else if (fileId === 'js') {
        setJsCode(newContent);
      } else {
        // For additional files in web mode
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, content: newContent } : file
        ));
      }
    } else {
      if (fileId === 'main') {
        setCode(newContent);
      } else {
        // For additional files in non-web mode
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, content: newContent } : file
        ));
      }
    }
  };
  
  // Add a new file
  const handleAddFile = () => {
    const newFileId = `file-${fileCounter}`;
    const newFileName = `new-file-${fileCounter}${selectedLanguage.fileExtension}`;
    
    const newFile: CodeFile = {
      id: newFileId,
      name: newFileName,
      language: selectedLanguage,
      content: ''
    };
    
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
    setFileCounter(prev => prev + 1);
    
    toast({
      title: "File Added",
      description: `Created new file: ${newFileName}`,
    });
  };
  
  // Remove a file
  const handleRemoveFile = (fileId: string) => {
    // Don't remove main file or html/css/js files in web mode
    if (fileId === 'main' || (selectedLanguage.id === 'web' && ['html', 'css', 'js'].includes(fileId))) {
      toast({
        title: "Cannot Remove File",
        description: "This is a required file for the current language.",
        variant: "destructive"
      });
      return;
    }
    
    // Find next active file
    const fileIndex = files.findIndex(file => file.id === fileId);
    let nextActiveId = activeFileId;
    
    if (activeFileId === fileId) {
      if (fileIndex > 0) {
        nextActiveId = files[fileIndex - 1].id;
      } else if (files.length > 1) {
        nextActiveId = files[1].id;
      } else {
        nextActiveId = 'main';
      }
    }
    
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setActiveFileId(nextActiveId);
    
    toast({
      title: "File Removed",
      description: `Removed file: ${files.find(file => file.id === fileId)?.name}`,
    });
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
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={handleAddFile}>
            <FilePlus className="h-3 w-3" />
            Add File
          </Button>
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
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
