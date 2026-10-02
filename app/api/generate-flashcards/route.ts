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
      text: `You are an expert academic tutor. Analyze the material provided above and generate 5 to 15 key Identification-type flashcards.

      STRICT GUIDELINES FOR IDENTIFICATION FLASHCARDS:
      1. QUESTION STYLE: Formulate clear, specific clues or definitions (e.g., "What term refers to...", "Which process describes...", "Who proposed..."). Avoid open-ended or generic questions.
      2. ANSWER STYLE: The answer MUST be a short, precise target term, phrase, name, or concept (strictly 1 to 5 words). Do not include long explanations in the answer field.
      3. COVERAGE: Focus on essential terms, definitions, key figures, dates, formulas, or core principles. Avoid trivial details.
      4. NO DUPLICATES: Ensure each question tests a distinct term.

      OUTPUT FORMAT:
      Return ONLY a valid JSON array of objects. Do not wrap in markdown code blocks like \`\`\`json, and do not add introductory or concluding text.

      [
        {
          "question": "What process do plants use to convert light energy into chemical energy?",
          "answer": "Photosynthesis"
        }
      ]`,
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