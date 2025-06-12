import { GeminiClient } from './GeminiClient';

export const executeCodeAI = async (code: string, input: string, language: string): Promise<string> => {
  const prompt = `
You are a code executor.

Language: ${language}

Code:
${code}

Execute with input:
${input}

Only return output produced. If any error occurs, return "Runtime Error: <error>". NO explanation.
`;

  const response = await GeminiClient.send(prompt);
  return response.trim();
};
