import { GeminiClient } from './GeminiClient';

export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  executionDetails?: string;
}

export const generateTestCases = async (code: string, language: string): Promise<TestCase[]> => {
  const prompt = `
You are an expert Test Case Generator.

Analyze this ${language} code and generate 3 test cases:
1. Simple
2. Edge
3. Corner

Code:
${code}

Return response strictly as valid JSON:

[
  { "input": "...", "expectedOutput": "..." },
  { "input": "...", "expectedOutput": "..." },
  { "input": "...", "expectedOutput": "..." }
]

NO explanations. Only valid JSON.
`;

  const response = await GeminiClient.send(prompt);
  const testCases = JSON.parse(response);
  return testCases.map((tc: any) => ({ ...tc, actualOutput: '', passed: false }));
};
