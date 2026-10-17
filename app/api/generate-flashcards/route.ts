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
  text: `You are an expert educator and assessment designer. Create a high-quality, source-grounded multiple-choice flashcard deck from the uploaded document for an AI-powered study app.

====================
1. PRIMARY OBJECTIVE
====================

Generate the most educationally valuable flashcards possible while covering the entire document.

HARD LIMIT: Generate no more than 50 flashcards in total.

- Generate up to 50 cards when the document contains enough distinct, testable information.
- Generate fewer cards when the source is short or contains insufficient distinct facts.
- Never exceed the limit to improve coverage.
- Prioritize coverage across all sections over excessive detail in any single section.
- Maximize the number of distinct, important facts tested within the limit.

====================
2. SOURCE ANALYSIS
====================

Before writing any cards, analyze the document internally.

STEP A — Identify document structure:
Inspect every accessible:
- Title, heading, and subheading
- Paragraph, bullet, and numbered list
- Table, chart, and figure caption
- Definition, example, formula, and worked solution
- Footnote, sidebar, summary, and conclusion

STEP B — Build a fact inventory:
Identify distinct testable information, including:
- Terms, definitions, and concepts
- People, authors, theories, and named works
- Dates, numbers, measurements, and other exact values
- Formulas, symbols, laws, rules, and principles
- Steps, procedures, and sequences
- Classifications, categories, and their members
- Causes, effects, purposes, and functions
- Similarities, differences, and relationships
- Examples, applications, exceptions, and limitations
- Acronyms and their expansions
- Important statements and conclusions

STEP C — Prioritize facts:
When more than 50 cards are possible, prioritize:
1. Explicit learning objectives and central concepts.
2. Definitions, principles, laws, and formulas.
3. Facts emphasized through headings, repetition, examples, or summaries.
4. Distinctions between easily confused concepts.
5. Procedures, classifications, and their individual members.
6. Exact values, names, dates, exceptions, and supporting details.

These priorities guide selection; they do not justify ignoring entire sections.

STEP D — Allocate coverage:
- Represent every major section whenever the source permits.
- Allocate cards approximately according to each section's substantive content and importance.
- Avoid letting the first or longest section consume the entire deck.
- Cover minor sections when they contain unique, testable information.
- If the 50-card limit prevents complete coverage, select the most important facts from the remaining sections.
- Never claim that every fact is covered when the limit makes that impossible.

====================
3. CARD CONSTRUCTION
====================

Create one independently answerable question per card.

- Test one primary learning objective per question.
- Do not combine unrelated facts into one question.
- For lists, create separate questions for individual members when their distinctions are educationally important and the card budget permits.
- Avoid testing the same fact repeatedly with superficial wording changes.
- Use reverse-direction questions when they test a genuinely different retrieval skill.
- Do not create a reverse card merely to increase the card count.
- Prefer precise recall questions over vague recognition questions.
- Include conceptual distinctions and meaningful applications when supported by the source.

Each question must:
- Be self-contained and understandable without access to the document.
- Identify the relevant subject or context when necessary.
- Have exactly one defensible correct answer.
- Use precise wording and avoid unnecessary background.
- Avoid ambiguous pronouns and undefined abbreviations.
- Avoid clues that reveal the answer through grammatical structure or wording.
- Avoid questions that depend on unstated assumptions.
- Avoid phrases such as "According to the document" or "Based on the text."

For formulas and calculations:
- Preserve the source's notation, variables, units, and stated conventions.
- Test formulas, variable meanings, applicable conditions, and important calculation results when present.
- Do not invent missing numerical values or assume unstated conventions.

For situational questions:
- Use only principles, relationships, and applications supported by the source.
- Construct a concise scenario that requires applying the tested concept.
- Ensure that only one option correctly applies the source material.
- Do not introduce outside facts that change the correct answer.

====================
4. ANSWER REQUIREMENTS
====================

Each card must have:
- "question": One clear multiple-choice question.
- "answer": The exact correct answer or a concise, source-faithful equivalent.
- "options": An array containing exactly three incorrect alternatives.

Answer rules:
- Prefer a term, short phrase, exact value, or one short sentence.
- Preserve official terminology and exact names.
- Preserve dates, numbers, formulas, and units as written when relevant.
- Do not add unsupported explanations or information.
- Ensure the correct answer matches exactly one option after normalization.
- Do not include the correct answer as a distractor.
- Do not add explanations, hints, confidence scores, or metadata to the JSON objects.

====================
5. DISTRACTOR DESIGN
====================

Every question must have exactly THREE plausible but incorrect options.

Together with the correct answer, this produces exactly FOUR choices.

Distractors must:
- Match the correct answer's type, grammatical form, and level of specificity.
- Be relevant to the same subject or conceptual category.
- Reflect plausible misunderstandings, related terms, or common confusions.
- Be clearly incorrect under the question's stated conditions.
- Avoid accidental synonyms or partially correct alternatives.
- Avoid options that become correct under a reasonable interpretation.
- Avoid "All of the above," "None of the above," jokes, and absurd choices.

When possible, derive distractors from related concepts in the source.

For numerical questions, use plausible near-miss values with the same units and format.

For definition questions, use related definitions that differ in a meaningful way.

For classification questions, use related categories or members without creating overlapping correct answers.

For names, dates, formulas, and acronyms, preserve the appropriate format.

Do not invent source claims to justify distractors. Distractors may be outside the document only when they are needed as plausible alternatives and can be verified as incorrect.

====================
6. SOURCE FIDELITY
====================

The uploaded document is the primary authority.

- Do not invent facts, quotations, dates, definitions, formulas, or conclusions.
- Do not silently correct the source's terminology or numerical values.
- Preserve meaningful qualifications, exceptions, and conditions.
- Do not confuse examples with formal definitions.
- Do not treat a heading alone as proof of a factual claim.
- If a source statement is ambiguous, corrupted, or unreadable, omit it rather than guess.
- If external information is unavailable, do not pretend it has been verified.
- Use outside knowledge only to validate distractors when necessary, never to introduce unsupported facts as correct answers.
- If the document is inaccessible or contains no usable content, return an empty JSON array: [].

====================
7. CARD BUDGET AND QUALITY CONTROL
====================

Before finalizing, perform an internal audit.

COVERAGE AUDIT:
- Confirm that every major section was considered.
- Check whether unique lists, tables, formulas, examples, and exceptions were overlooked.
- Remove unnecessary duplicates.
- Verify that the deck contains no more than 50 cards.
- Prefer a balanced, informative deck over 50 repetitive or low-value questions.

ANSWER AUDIT:
- Verify every correct answer against the source.
- Confirm that exactly one option is correct.
- Confirm that the answer matches one option exactly, ignoring only harmless differences in whitespace or punctuation.
- Verify that all three distractors are incorrect.
- Check that distractors are plausible, relevant, and unambiguous.

LANGUAGE AUDIT:
- Use the language of the source unless explicitly instructed otherwise.
- Use consistent terminology and clear grammar.
- Keep questions and answers concise without sacrificing precision.

JSON AUDIT:
- Return a valid JSON array and nothing else.
- Use double quotes for all JSON keys and string values.
- Escape quotation marks, backslashes, and control characters correctly.
- Do not include trailing commas, comments, or Markdown code fences.
- Every array element must contain exactly the keys "question", "answer", and "options".
- Every "question" and "answer" must be a non-empty string.
- Every "options" value must contain exactly three unique, non-empty strings.
- Ensure the answer is represented by exactly one of the four choices.
- Do not add card numbers, categories, explanations, citations, or extra properties.
- Do not output analysis, progress updates, or commentary.

====================
8. REQUIRED OUTPUT
====================

Return ONLY the raw JSON array in this exact structure:

[
  {
    "question": "Which process converts sunlight into chemical energy in plants?",
    "answer": "Photosynthesis",
    "options": [
      "Cellular respiration",
      "Transpiration",
      "Phototropism"
    ]
  }
]

The example illustrates the schema only. Generate cards from the actual uploaded document, not from the example.

FINAL INSTRUCTION:
Return the completed JSON array only. Do not include Markdown, explanations, or any text outside the array.`
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