import { detectLanguageViaAI, generateTestCasesViaAI, executeCodeViaAI } from '@/utils/ai/codeExecution';
import { generateAreaOfImprovements } from '@/utils/ai/codeInsights';

export async function evaluateCode(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, language: selectedLanguage } = req.body;

    let detectedLanguage = selectedLanguage;

    if (!selectedLanguage) {
      detectedLanguage = await detectLanguageViaAI(code);
      if (!detectedLanguage) {
        return res.status(400).json({ error: 'Could not detect language.' });
      }
    }

    const testCases = await generateTestCasesViaAI(code, detectedLanguage);
    const evaluatedTestCases = [];

    for (const testCase of testCases) {
      const actualOutput = await executeCodeViaAI(code, testCase.input, detectedLanguage);
      const passed = actualOutput === testCase.expectedOutput;
      evaluatedTestCases.push({
        ...testCase,
        actualOutput,
        passed,
      });
    }

    const improvements = await generateAreaOfImprovements({ code, language: detectedLanguage });

    return res.status(200).json({
      testCases: evaluatedTestCases,
      language: detectedLanguage,
      improvements,
    });
  } catch (err) {
    console.error('Evaluation Error:', err);
    return res.status(500).json({ error: 'Evaluation failed.' });
  }
}