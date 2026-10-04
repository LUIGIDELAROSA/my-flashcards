// app/api/generate-flashcards/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';
export const maxDuration = 300; // i-adjust ayon sa Vercel plan mo

const MODEL = 'gemini-3.8-flash'; // siguraduhing valid ang model name na ito sa account mo
const MAX_PASSES = 3;
const MIN_NEW_CARDS_TO_CONTINUE = 5;

type Card = { question: string; answer: string; options: string[] };

const BASE_PROMPT = `You are an expert educator creating an exhaustive study deck from the uploaded document.

GOAL
Extract EVERY testable fact from the document so that a student who masters all the flashcards has effectively mastered the entire document. Missing a topic is a failure. When in doubt, include it.

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
]`;

const norm = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

// Kung naputol ang JSON, subukang i-salvage ang kumpletong objects
function safeParse(text: string): any[] {
  try {
    return JSON.parse(text);
  } catch {
    const lastObjEnd = text.lastIndexOf('}');
    if (lastObjEnd === -1) return [];
    try {
      return JSON.parse(text.slice(0, lastObjEnd + 1).replace(/,\s*$/, '') + ']');
    } catch {
      return [];
    }
  }
}

function isValid(c: any): c is Card {
  if (!c || typeof c.question !== 'string' || typeof c.answer !== 'string') return false;
  if (!Array.isArray(c.options) || c.options.length !== 3) return false;
  const answerN = norm(c.answer);
  const opts = c.options.map((o: unknown) => norm(String(o)));
  if (opts.some((o: string) => !o || o === answerN)) return false; // tamang sagot sa distractors
  if (new Set(opts).size !== 3) return false; // duplicate options
  return c.question.trim().length > 0 && c.answer.trim().length > 0;
}

export async function POST(req: Request) {
  try {
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

    const sourceParts: any[] = [];

    if (file) {
      const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64');
      sourceParts.push({
        inlineData: { data: base64Data, mimeType: file.type || 'application/pdf' },
      });
    }
    if (textInput && textInput.trim()) {
      sourceParts.push({ text: `Notes/Text:\n${textInput}` });
    }
    if (sourceParts.length === 0) {
      return NextResponse.json({ error: 'No text or file provided.' }, { status: 400 });
    }

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 3 plausible but incorrect choices related to the question',
          },
        },
        required: ['question', 'answer', 'options'],
      },
    };

    const allCards: Card[] = [];
    const seen = new Set<string>();

    for (let pass = 0; pass < MAX_PASSES; pass++) {
      let promptText = BASE_PROMPT;

      if (pass > 0) {
        const covered = allCards.map((c, i) => `${i + 1}. ${c.question}`).join('\n');
        promptText += `

ALREADY COVERED (do NOT repeat these questions or test the same facts):
${covered}

TASK FOR THIS PASS
Re-scan the ENTIRE document again. Generate cards ONLY for facts, terms, numbers, list items, table rows, and details that are NOT yet covered above. Look especially at: later sections, tables, footnotes, examples, exceptions, and minor details. If truly everything is already covered, return [].`;
      }

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [...sourceParts, { text: promptText }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const batch = safeParse(response.text || '[]');
      let added = 0;

      for (const c of batch) {
        if (!isValid(c)) continue;
        const key = norm(c.question);
        if (seen.has(key)) continue;
        seen.add(key);
        allCards.push({
          question: c.question.trim(),
          answer: c.answer.trim(),
          options: c.options.map((o) => o.trim()),
        });
        added++;
      }

      // Kung konti na lang ang bago, halos kumpleto na
      if (pass > 0 && added < MIN_NEW_CARDS_TO_CONTINUE) break;
    }

    return NextResponse.json({ success: true, cards: allCards });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    const errorMessage = error.message || error.toString() || '';

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