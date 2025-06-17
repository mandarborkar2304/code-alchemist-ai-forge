import { CodeAnalysis, Improvement } from '@/types';
import groqClient from '@/lib/groqClient';

// Generates AI-powered code recommendations (insights, best practices, corrected code)
export async function generateAIRecommendations(code: string, language: string, analysis: CodeAnalysis) {
  const systemPrompt = `
You are a senior software code reviewer.

Based on:
- The provided code,
- Detected language: ${language},
- Code metrics: violations: ${JSON.stringify(analysis.violations)}, metrics: ${JSON.stringify(analysis.metrics)}, complexity: ${JSON.stringify(analysis.complexityAnalysis)},

Generate:
1. AI Insights (high-level markdown summary of key issues).
2. Best Practices (language-specific actionable items).
3. Suggested Code Improvements (corrected code if possible).

Return response as valid JSON format:

{
  "aiSuggestions": "...", 
  "bestPractices": [ "...", "...", ... ], 
  "correctedCode": "..."
}

Important rules:
- Be precise.
- Use markdown formatting inside aiSuggestions.
- Only suggest valid improvements.
- If correctedCode cannot be generated, return empty string.
`;

  const userPrompt = `Code:\n${code}`;

  const chat = await groqClient.chat.completions.create({
    model: process.env.GROQ_MODEL!,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
  });

  const raw = chat.choices?.[0]?.message?.content?.trim() ?? '';

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing AI recommendation output:', err, raw);
    return {
      aiSuggestions: 'No suggestions generated.',
      bestPractices: [],
      correctedCode: ''
    };
  }
}

// Generates AI-powered area of improvements (criticality, categories, impact)
export async function generateAreaOfImprovements({
  code,
  language,
}: {
  code: string;
  language: string;
}): Promise<Improvement[]> {
  const prompt = `
You are a senior software architect. Given the following code in ${language}, analyze it and generate a list of 5 areas of improvements.

For each improvement include:
- type (critical, high, medium, low)
- category (like Performance, Maintainability, Code Quality, etc)
- title
- description
- impact

Respond ONLY in pure JSON array, e.g.:

[
  {
    "type": "critical",
    "category": "Performance",
    "title": "Optimize Nested Loops",
    "description": "Detected nested loops with O(n^2) complexity.",
    "impact": "Improves execution speed for large datasets."
  },
  ...
]

Code:
\`\`\`${language}
${code}
\`\`\`
`;

  const chatCompletion = await groqClient.chat.completions.create({
    model: process.env.GROQ_MODEL!,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  });

  const response = chatCompletion.choices[0]?.message.content || '';

  try {
    const parsed: Improvement[] = JSON.parse(response);
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error, response);
    return [];
  }
}