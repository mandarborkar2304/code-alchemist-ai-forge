import Groq from 'groq-sdk';
import { TestCase } from "@/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',  // You can use ENV variable for security
});

const SUPPORTED_LANGUAGES = [
  'C', 'C++', 'C#', 'Java', 'PHP', 'Python', 'Python 3', 'Scala',
  'R', 'BASH', 'Perl', 'Ruby', 'Javascript', 'Swift', 'Node.js',
  'Go', 'Lua', 'Rust', 'Java19', 'Dart', 'Kotlin', 'TypeScript'
];

// Main function to run entire pipeline
export async function fullCodeEvaluationPipeline(code: string, language?: string): Promise<TestCase[]> {
  const detectedLanguage = language || await detectLanguageViaAI(code);
  if (!SUPPORTED_LANGUAGES.includes(detectedLanguage)) {
    throw new Error(`Unsupported language: ${detectedLanguage}`);
  }

  const testCases = await generateTestCasesViaAI(code, detectedLanguage);
  const executedCases: TestCase[] = [];

  for (const testCase of testCases) {
    const actualOutput = await executeCodeViaAI(code, detectedLanguage, testCase.input);
    const passed = normalize(actualOutput) === normalize(testCase.expectedOutput);
    executedCases.push({ ...testCase, actualOutput, passed });
  }

  return executedCases;
}

// Language Detection
export async function detectLanguageViaAI(code: string): Promise<string> {
  const systemPrompt = `
You are an advanced AI that detects programming languages.

Supported Languages: ${SUPPORTED_LANGUAGES.join(', ')}.

Analyze the following code and reply with ONLY the exact language name from supported list.
If uncertain, choose the most probable one.

Code:
${code}
`;

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{ role: "system", content: systemPrompt }],
  });

  return response.choices[0]?.message?.content?.trim() || 'Unknown';
}

// Test Case Generation
export async function generateTestCasesViaAI(code: string, language: string): Promise<TestCase[]> {
  const prompt = `
You are an AI test case generator.

For the following ${language} code, generate 3 test cases: 
1 simple, 1 edge case, and 1 corner case.

For each test case, return JSON format like:
{"input": "your_input", "expectedOutput": "expected_output"}

Code:
${code}

Output:
`;

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{ role: "system", content: prompt }],
  });

  const rawOutput = response.choices[0]?.message?.content?.trim();
  
  try {
    const jsonMatches = rawOutput?.match(/\{[\s\S]*\}/g);
    const testCases = jsonMatches?.map(str => JSON.parse(str)) as TestCase[];

    return testCases.filter(tc => tc.input && tc.expectedOutput);
  } catch (err) {
    console.error("AI Test Case JSON Parsing Error:", err);
    return [];
  }
}

// Dry-Run Code Execution (AI-Simulated)
export async function executeCodeViaAI(code: string, language: string, input: string): Promise<string> {
  const executionPrompt = `
You are an AI code dry-runner.

Simulate executing the following ${language} code with provided input and return only the output.

- Do not explain.
- Do not show code.
- Only give the simulated output.

Code:
${code}

Input:
${input}

Output:
`;

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{ role: "system", content: executionPrompt }],
  });

  return response.choices[0]?.message?.content?.trim() || 'Execution Failed';
}

// Normalizer for static output evaluation
function normalize(output: string): string {
  return output.replace(/\s+/g, '').toLowerCase();
}
