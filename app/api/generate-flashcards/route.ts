// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';


export const runtime = 'nodejs';
export const maxDuration = 60;

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

    contents.push({
      text: `You are an expert educator creating an exhaustive study deck from the uploaded document.

    GOAL
    Extract the most critical testable facts from the document. 
    CRITICAL LIMIT: Generate a MAXIMUM of 40 flashcards. Prioritize the most important concepts. 
    If the document is short, generate only what is necessary.

    PROCESS (follow internally before answering)
    1. Scan the document section by section (every heading, subheading, paragraph, bullet, table, figure caption, footnote, sidebar, and summary box).
    2. For each section, list every distinct fact it contains: terms, definitions, names, dates, numbers, formulas, laws/principles, steps/processes, classifications, causes/effects, comparisons, examples, exceptions, and acronyms.
    3. Turn EACH distinct fact into its own flashcard. One fact = one card. Never merge multiple facts into one card.
    4. After drafting, re-scan the document and add cards for anything you skipped.

    COVERAGE RULES
    - Generate roughly 1 card for every 2–3 sentences of substantive content. Longer documents must produce proportionally more cards. Do NOT stop at a small round number.
    - Do NOT skip a section because it seems minor, repetitive, or introductory.
    - Include items from lists and tables individually (e.g., if a list has 7 items, make cards that test each item).
    - Include "reverse" cards where useful (definition -> term AND term -> definition) for important concepts.
    - Include numbers, dates, names, formulas, and acronym expansions exactly as written in the document.
    - Do NOT invent facts that are not in the document. Only use information from the document.
    - Avoid duplicate cards, but do not drop a fact just because it is related to another.

    QUESTION STYLE
    - Clear, self-contained, and unambiguous (a student must understand it without seeing the document).
    - Ask for an exact term, name, value, or definition.
    - Do not write questions like "According to the text..." or "In the document...".

    ANSWER STYLE
    - Direct and concise (a word, a short phrase, or one short sentence).

    DISTRACTORS
    - For EACH question, provide EXACTLY 3 plausible but INCORRECT options.
    - Distractors must be the same type/format as the correct answer (e.g., if the answer is a date, all options are dates; if a term, all are closely related terms from the same topic).
    - Prefer distractors drawn from related concepts in the document, common misconceptions, or near-miss values.
    - Never use joke answers, obviously wrong answers, or "All of the above / None of the above".
    - A distractor must never be also correct.

    OUTPUT FORMAT
    Return ONLY a valid raw JSON array. No markdown, no code fences, no commentary before or after.
    [
      {
        "question": "What term describes the process by which plants convert sunlight into chemical energy?",
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