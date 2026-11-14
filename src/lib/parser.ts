import type { Question, QuestionType } from '@/types/quiz';

interface DraftQuestion { text: string; options: string[]; corrects: number[]; }

function finalizeQuestion(question: DraftQuestion): Question {
  let type: QuestionType = 'single';
  if (question.corrects.length > 1) type = 'multi';
  else if (question.options.length === 2) {
    const options = question.options.map((option) => option.toLowerCase());
    const isTrue = (value: string) => value.startsWith('true') || value === 't';
    const isFalse = (value: string) => value.startsWith('false') || value === 'f';
    if ((isTrue(options[0]) && isFalse(options[1])) || (isFalse(options[0]) && isTrue(options[1]))) type = 'tf';
  }
  return { ...question, type };
}

export function parseQuiz(text: string): Question[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const questions: Question[] = [];
  let current: DraftQuestion | undefined;
  for (const line of lines) {
    const questionMatch = line.match(/^(\d+)[.)]\s*(.+)/);
    if (questionMatch) {
      if (current) questions.push(finalizeQuestion(current));
      current = { text: questionMatch[2], options: [], corrects: [] };
      continue;
    }
    const optionMatch = line.match(/^([A-Fa-fTtFf])[.)]\s*(.*)/);
    if (!optionMatch || !current) continue;
    const key = optionMatch[1].toUpperCase();
    let optionText = optionMatch[2].trim();
    const markedAtEnd = /\*\s*$/.test(optionText);
    const markedAfterKey = /^[A-FTtFf][.)]\s*\*/.test(line);
    if (markedAtEnd || markedAfterKey) {
      optionText = optionText.replace(/\s*\*\s*$/, '').trim();
      if (markedAfterKey) optionText = optionText.replace(/^\*\s*/, '').trim();
      if (!optionText) optionText = line.match(/^[A-FTtFf][.)]\s*\*\s*(.*)/)?.[1].trim() ?? '';
      current.corrects.push(current.options.length);
    }
    if (!optionText) optionText = key === 'T' ? 'True' : key === 'F' ? 'False' : key;
    current.options.push(optionText);
  }
  if (current) questions.push(finalizeQuestion(current));
  return questions.filter((question) => question.options.length >= 2 && question.corrects.length >= 1);
}
