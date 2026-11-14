export interface PromptCounts {
  single: number;
  tf: number;
  multi: number;
}

export const singleExample = `1. What is 2+2?
A) 3
B) 4 *
C) 5
D) 6`;

export const trueFalseExample = `2. The sun is a star.
T) True *
F) False`;

export const multiExample = `3. Which are prime numbers?
A) 2 *
B) 4
C) 7 *
D) 9`;

export const sampleQuiz = `${singleExample}\n\n${trueFalseExample}\n\n${multiExample}`;

const exampleByType = [
  { type: 'single' as const, text: singleExample },
  { type: 'tf' as const, text: trueFalseExample },
  { type: 'multi' as const, text: multiExample },
];

export function buildPrompt(counts: PromptCounts): string {
  const total = counts.single + counts.tf + counts.multi;
  if (total === 0) return '';

  const breakdown = [
    counts.single > 0 && `${counts.single} single-answer ${counts.single === 1 ? 'question' : 'questions'}`,
    counts.tf > 0 && `${counts.tf} true/false ${counts.tf === 1 ? 'question' : 'questions'}`,
    counts.multi > 0 && `${counts.multi} multi-select ${counts.multi === 1 ? 'question' : 'questions'}`,
  ].filter((item): item is string => Boolean(item));

  const selectedExamples = exampleByType
    .filter(({ type }) => counts[type] > 0)
    .map(({ text }, index) => text.replace(/^\d+[.)]/, `${index + 1}.`))
    .join('\n\n');

  return [
    `Create exactly ${total} quiz ${total === 1 ? 'question' : 'questions'} using the attached study material.`,
    `Question breakdown: ${breakdown.join(', ')}.`,
    '',
    'Using ONLY the attached material, write the requested questions and do not add facts from elsewhere.',
    '',
    'Question type rules:',
    '- Single-answer (MCQ): provide exactly four options labeled A), B), C), and D), with exactly ONE correct answer.',
    '- True/False: provide exactly T) True and F) False, with exactly ONE correct answer.',
    '- Multi-select: provide four or five options labeled A) through E), with TWO or more correct answers.',
    '',
    'Format rules:',
    '- Number questions continuously as 1., 2., 3., and so on.',
    '- Put each question and each option on its own line.',
    '- Put * at the end of every correct option line.',
    '- Mark exactly one correct option for single-answer and true/false questions.',
    '- Mark two or more correct options for multi-select questions.',
    '- Mix the requested question types randomly.',
    '- Do not include explanations, headings, markdown, or bold text.',
    '- Output ONLY the questions.',
    '',
    'Format example for the selected question types:',
    selectedExamples,
  ].join('\n');
}
