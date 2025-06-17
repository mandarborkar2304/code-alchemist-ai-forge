import { useEffect, useState } from "react";
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, Brain, Zap, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIRecommendationsProps {
  analysis: CodeAnalysis;
  language: string;
  code: string;
  onApplyCorrection: (code: string) => void;
}

const AIRecommendations = ({ analysis, language, code, onApplyCorrection }: AIRecommendationsProps) => {
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string>("");
  const [bestPractices, setBestPractices] = useState<string[]>([]);
  const [correctedCode, setCorrectedCode] = useState<string>("");

  useEffect(() => {
    async function fetchAI() {
      setLoading(true);
      try {
        const response = await fetch("/api/generateAIRecommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, analysis }),
        });

        const aiOutput = await response.json();
        setAiSuggestions(aiOutput.aiSuggestions);
        setBestPractices(aiOutput.bestPractices);
        setCorrectedCode(aiOutput.correctedCode);
      } catch (err) {
        console.error("Failed to fetch AI recommendations", err);
      }
      setLoading(false);
    }
    fetchAI();
  }, [code, language, analysis]);

  const handleApplyCorrection = () => {
    if (correctedCode) {
      onApplyCorrection(correctedCode);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{aiSuggestions}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {bestPractices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              {language.charAt(0).toUpperCase() + language.slice(1)} Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bestPractices.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded border">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {correctedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Suggested Code Improvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI has generated improved code based on the detected issues.
            </p>
            <Button onClick={handleApplyCorrection} size="sm" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Suggested Improvements
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendations;