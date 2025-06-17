import { generateAIRecommendations } from "@/utils/ai/codeInsights";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { code, language, analysis } = req.body;
        const result = await generateAIRecommendations(code, language, analysis);
        res.status(200).json(result);
    } catch (err) {
        console.error("AI Recommendation Error:", err);
        res.status(500).json({ error: "Failed to generate recommendations." });
    }
}
