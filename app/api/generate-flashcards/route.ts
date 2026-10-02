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
      Create a comprehensive set of Identification-style flashcard Question and Answer pairs covering ALL major topics, key terms, definitions, principles, formulas, dates, and core concepts in the text. Ensure exhaustive coverage so no important topic or detail is omitted.

      Formatting & Style Instructions:
      1. Question Style (Identification):
        - Formulate questions that ask for exact terms, names, processes, or definitions (e.g., "What term refers to...", "What process is defined as...", "Who developed...").
      2. Answer Style:
        - Keep answers direct, precise, and concise (exact terms, short phrases, or single words). Avoid long explanatory paragraphs.
      3. Quantity & Depth:
        - Generate as many flashcard pairs as necessary to cover the ENTIRE document thoroughly without leaving out any key concepts.

      Return ONLY a valid raw JSON array of objects without markdown formatting or introductory text, structured as follows:
      [
        {
          "question": "What term describes the process by which plants convert sunlight into energy?",
          "answer": "Photosynthesis"
        }
      ]`
    });

    // 4. Call Gemini API using Structured JSON Schema
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
              question: { type: Type.STRING, description: 'The question based on the notes' },
              answer: { type: Type.STRING, description: 'The concise and accurate answer' },
            },
            required: ['question', 'answer'],
          },
        },
      },
    });

    const generatedCards = JSON.parse(response.text || '[]');

    return NextResponse.json({ success: true, cards: generatedCards });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    // Return the exact error message so it is not just a generic "500"
    return NextResponse.json(
      { error: error.message || error.toString() || 'Flashcard generation failed.' },
      { status: 500 }
    );
  }
}