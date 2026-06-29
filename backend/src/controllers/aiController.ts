/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize the official @google/genai client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Controller endpoint to convert short organizer prompt into a
 * curated, beautifully written event description using Gemini AI.
 */
export const generateDescription = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'A short topic or prompt is required to generate an event description.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured on the server. Please verify settings.',
      });
    }

    // Call Gemini 2.5 Flash model as requested by the user
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an elite, professional copywriter specializing in corporate conferences, tech workshops, executive summits, and cultural events. 
Convert the following brief topic or prompt into a professional, engaging, and comprehensive event description.

Provide structured paragraphs, include a brief list of "Key Takeaways" or "What to Expect" using bullet points, and maintain a polished and inspiring tone. 
Keep the description within 120-250 words.

Prompt: "${prompt}"

Your response MUST only be the description itself. Do not include titles, markdown headers like '#' or '##', or any pleasantries.`,
    });

    const generatedText = response.text;

    if (!generatedText) {
      throw new Error('No content returned from Gemini model.');
    }

    return res.json({
      success: true,
      description: generatedText.trim(),
    });
  } catch (error: any) {
    console.error('[AI Controller] Description generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate description with Gemini AI.',
    });
  }
};
