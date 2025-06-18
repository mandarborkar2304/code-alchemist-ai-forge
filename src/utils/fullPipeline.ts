import { detectCodeLanguage } from './languageDetection';
import { generateTestCases } from './testCaseGeneration';
import { generateMLTestCases } from './mlEnhancedTestGenerator';
import { executeCodeAI } from './codeExecution';
import { TestCase } from './testCaseGeneration';

export const evaluateCode = async (code: string): Promise<TestCase[]> => {
  const language = detectCodeLanguage(code);
  if (!language) throw new Error("Language detection failed.");

  const testCases: TestCase[] =
    language === 'Python with ML' || language === 'R'
      ? await generateMLTestCases(code, language)
      : await generateTestCases(code, language);

  for (const testCase of testCases) {
    const actualOutput = await executeCodeAI(code, testCase.input, language);
    testCase.actualOutput = actualOutput;
    testCase.passed = actualOutput === testCase.expectedOutput;
  }

  return testCases;
};