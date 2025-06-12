import { GeminiClient } from './GeminiClient';
import { TestCase } from './testCaseGeneration';

export const generateMLTestCases = async (code: string, language: string): Promise<TestCase[]> => {
  const prompt = `
You are an ML Dataset Generator.

Given the following ${language} ML code:
${code}

Tasks:
- Detect training data structure.
- Generate 3 synthetic datasets (small, medium, large).
- Prepare test inputs & expected predictions.

Output strictly as valid JSON:

[
  { "input": "...", "expectedOutput": "..." },
  { "input": "...", "expectedOutput": "..." },
  { "input": "...", "expectedOutput": "..." }
]

No extra text. Strict JSON.
`;

  const response = await GeminiClient.send(prompt);
  const testCases = JSON.parse(response);
  return testCases.map((tc: any) => ({ ...tc, actualOutput: '', passed: false }));
};
