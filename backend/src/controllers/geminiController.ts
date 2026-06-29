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
 * dynamic, highly persuasive event description in clean Markdown using Gemini.
 */
export const generateCopy = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'A detailed prompt or list of concepts is required to write the copy.',
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
      contents: `You are an elite corporate copywriter and persuasive design writer.
Your job is to transform the following raw user prompt or list of details into a beautifully formatted, highly professional, and inspiring event description in clean, structured Markdown.

Make sure to include:
- A compelling summary introduction
- A section title "**What to Expect**"
- A neat, spaced-out bullet list of 3-4 "**Key Takeaways**"
- A final bold call-to-action inviting attendees to secure their passes

Keep the total length within 150-250 words. Maintain a polished, elite, minimalist tone.

Prompt details: "${prompt}"

Your response MUST be the markdown text itself. Do not include any meta-introductions, greetings, or conversational prefixing.`,
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
    console.error('[Gemini Controller] Copy generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate markdown copy with Gemini AI.',
    });
  }
};
