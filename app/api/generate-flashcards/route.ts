// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Gamitin ang require para maiwasan ang module export error sa Next.js
const pdfParse = require('pdf-parse');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const textInput = formData.get('text') as string;
    const file = formData.get('file') as File | null;

    let extractedText = textInput || '';

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const pdfData = await pdfParse(buffer);
        extractedText += '\n' + pdfData.text;
      } else {
        extractedText += '\n' + buffer.toString('utf-8');
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Walang nahanap na text o file.' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suriin at basahin ang sumusunod na lecture notes/text. Gumawa ng 5 hanggang 15 na pinakamahalagang flashcard Question and Answer pairs batay sa nilalaman nito.\n\nNotes:\n${extractedText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Ang tanong batay sa notes' },
              answer: { type: Type.STRING, description: 'Ang maikli at tumpak na sagot' },
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
    return NextResponse.json({ error: 'Bumagsak ang pagbuo ng flashcards.' }, { status: 500 });
  }
}