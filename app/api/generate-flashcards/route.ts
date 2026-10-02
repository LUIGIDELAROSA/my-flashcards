// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. I-check kung nababasa ba ang GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Kulang sa GEMINI_API_KEY! Siguraduhing na-add ito sa Vercel Environment Variables at na-redeploy ang project.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const formData = await req.formData();
    const textInput = formData.get('text') as string;
    const file = formData.get('file') as File | null;

    const contents: any[] = [];

    // 2. Kapag may in-upload na PDF / Text File: Direct Base64 conversion
    // Hindi na kailangan ng pdf-parse, direktang binabasa ng Gemini 2.5 Flash ang PDF!
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

    // 3. Kapag may in-input na Text Notes
    if (textInput && textInput.trim()) {
      contents.push({ text: `Notes/Text:\n${textInput}` });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'Walang nahanap na text o file.' }, { status: 400 });
    }

    // Direct Instruction sa Gemini
    contents.push({
      text: 'Suriin at basahin ang file/notes sa itaas. Gumawa ng 5 hanggang 15 na pinakamahalagang flashcard Question and Answer pairs batay sa nilalaman nito.',
    });

    // 4. Call Gemini API gamit ang Structured JSON Schema
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
    // Ibalik ang eksaktong mensahe ng error para hindi lang generic "500" ang lumabas
    return NextResponse.json(
      { error: error.message || error.toString() || 'Bumagsak ang pagbuo ng flashcards.' },
      { status: 500 }
    );
  }
}