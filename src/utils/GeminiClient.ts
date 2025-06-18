import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


export const GeminiClient = {
  send: async (prompt: string): Promise<string> => {
    const model = GEMINI_API_KEY.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  }
};
