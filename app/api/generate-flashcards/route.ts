// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY! Make sure it is added to Vercel Environment Variables.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const formData = await req.formData();
    const textInput = formData.get('text') as string;
    const file = formData.get('file') as File | null;

    const contents: any[] = [];

    // PDF & Text File handling
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          // 💡 Dito natin inilagay sa loob ng POST para hindi mag-error sa build/module evaluation
          // @ts-ignore
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(buffer);
          contents.push({ text: `Document Content (PDF):\n${pdfData.text}` });
        } catch (pdfError) {
          console.error('Error parsing PDF:', pdfError);
          return NextResponse.json({ error: 'Failed to extract text from the PDF file.' }, { status: 400 });
        }
      } else {
        const textContent = buffer.toString('utf-8');
        contents.push({ text: `Document Content:\n${textContent}` });
      }
    }

    if (textInput && textInput.trim()) {
      contents.push({ text: `Notes/Text:\n${textInput}` });
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'No text or file provided.' }, { status: 400 });
    }

    contents.push({
      text: `You are an expert educator creating an exhaustive, high-yield study deck from the uploaded document.

    GOAL
    Extract the most critical testable facts from the document and generate flashcards with clear context explanations.
    CRITICAL LIMIT: Generate a MAXIMUM of 50 flashcards. Prioritize high-yield, core concepts.
    If the document is short, generate only what is necessary.

    PROCESS (follow internally before answering)
    1. Scan the document section by section (every heading, subheading, paragraph, bullet, table, figure caption, footnote, sidebar, and summary box).
    2. For each section, list every distinct fact it contains: terms, definitions, names, dates, numbers, formulas, laws/principles, steps/processes, classifications, causes/effects, comparisons, examples, exceptions, and acronyms.
    3. Turn EACH distinct fact into its own flashcard. One fact = one card. Never merge multiple facts into one card.
    4. Provide a brief, single-sentence EXPLANATION for why the answer is correct to reinforce learning and context.
    5. After drafting, re-scan the document and add cards for anything crucial you skipped.

    COVERAGE & QUALITY RULES
    - Generate roughly 1 card for every 2–3 sentences of substantive content. Longer documents must produce proportionally more cards.
    - Include items from lists and tables individually (e.g., if a list has 7 items, make cards testing key items).
    - Include numbers, dates, names, formulas, and acronym expansions exactly as written in the document.
    - Avoid duplicate cards, but do not drop a fact just because it is related to another.
    - Strict Adherence: Do NOT invent facts outside the document.

    QUESTION & ANSWER STYLE
    - Questions: Clear, self-contained, and unambiguous (understandable without seeing the text). Never use phrases like "According to the text...".
    - Answers: Direct, clear, and concise (a word, a short phrase, or one key value).
    - Explanation: Exactly ONE concise sentence explaining *why* the answer is correct or providing helpful learning context.

    DISTRACTORS (OPTIONS)
    - For EACH question, provide EXACTLY 3 plausible but INCORRECT options.
    - Distractors must match the format/category of the correct answer (e.g., if the answer is a date, all options are realistic dates from the same context).
    - Prefer distractors drawn from related concepts in the document or common misconceptions.
    - Never use joke answers, obviously wrong choices, or "All/None of the above".

    OUTPUT FORMAT
    Return ONLY a valid raw JSON array. Do not wrap in markdown or code blocks (\`\`\`json). No introductory or closing text.
    [
      {
        "question": "What process do plants use to convert sunlight into chemical energy?",
        "answer": "Photosynthesis",
        "options": ["Cellular Respiration", "Phototropism", "Transpiration"],
        "explanation": "Photosynthesis captures light energy using chlorophyll to produce glucose and oxygen from carbon dioxide and water."
      }
    ]`
    });

    // 5. Call Gemini API using gemini-1.5-flash (Stable model)
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