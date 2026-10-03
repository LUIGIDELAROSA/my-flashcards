// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. Check if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY! Make sure it is added to Vercel Environment Variables and the project is redeployed.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const formData = await req.formData();
    const textInput = formData.get('text') as string;
    const file = formData.get('file') as File | null;

    const contents: any[] = [];

    // 2. If a PDF / Text File is uploaded: Direct Base64 conversion
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf',
        },
      });
    }

    // 3. If text notes are provided
    if (textInput && textInput.trim()) {
      contents.push({ text: `Notes/Text:\n${textInput}` });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'No text or file provided.' }, { status: 400 });
    }

    // Direct instruction for Gemini
    contents.push({
      text: `Analyze and review the uploaded document thoroughly.

      Goal:
      Create a comprehensive set of flashcard Question and Answer pairs covering ALL major topics, key terms, definitions, principles, formulas, dates, and core concepts.

      Formatting & Style Instructions:
      1. Question Style: Formulate clear questions that ask for exact terms, names, or definitions.
      2. Answer Style: Keep the correct answer direct and concise.
      3. Distractors (Multiple Choice): For EACH question, generate exactly 3 plausible but INCORRECT options. These distractors must be highly related to the question to make the multiple-choice challenging. Do not use silly or obviously wrong answers.
      4. Quantity & Depth: Cover the ENTIRE document thoroughly.

      Return ONLY a valid raw JSON array of objects structured as follows:
      [
        {
          "question": "What term describes the process by which plants convert sunlight into energy?",
          "answer": "Photosynthesis",
          "options": ["Cellular Respiration", "Phototropism", "Transpiration"]
        }
      ]`
    });

    // 4. Call Gemini API using gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 3 plausible but incorrect choices related to the question'
              },
            },
            required: ['question', 'answer', 'options'],
          },
        },
      },
    });

    const generatedCards = JSON.parse(response.text || '[]');

    return NextResponse.json({ success: true, cards: generatedCards });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);

    const errorMessage = error.message || error.toString() || '';

    // Catch 429 Quota Exceeded / Rate Limits
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('Quota exceeded') ||
      errorMessage.includes('RESOURCE_EXHAUSTED')
    ) {
      return NextResponse.json(
        { error: 'Daily AI generation limit reached. Please try again in a few hours or create a new API Key.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: errorMessage || 'Flashcard generation failed.' },
      { status: 500 }
    );
  }
}