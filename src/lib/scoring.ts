import type { Answer, Question, QuizResult, QuizSession, Verdict } from '@/types/quiz';

export function scoreQuestion(question: Question, answer: Answer): Verdict {
  if (question.type === 'multi') {
    const selected = Array.isArray(answer) ? answer : [];
    if (!selected.length) return 'unanswered';
    const correct = new Set(question.corrects);
    if (correct.size === selected.length && selected.every((index) => correct.has(index))) return 'correct';
    const hasWrong = selected.some((index) => !correct.has(index));
    return !hasWrong && selected.some((index) => correct.has(index)) ? 'partial' : 'wrong';
  }
  if (typeof answer !== 'number' || answer === -1) return 'unanswered';
  return question.corrects.includes(answer) ? 'correct' : 'wrong';
}

export function computeResult(session: QuizSession, answers: Record<number, Answer>): QuizResult {
  const totals = { correct: 0, partial: 0, wrong: 0, unanswered: 0 };
  session.questions.forEach((question, index) => { totals[scoreQuestion(question, answers[index])] += 1; });
  const total = session.questions.length;
  const score = Math.round(((totals.correct + totals.partial * 0.5) / total) * 100);
  return {
    id: Date.now(), name: session.name, date: new Date().toISOString(), score, ...totals, total, pass: score >= 60,
    questions: session.questions.map((question, index) => ({
      ...question, correct: question.corrects[0] ?? -1,
      chosen: question.type === 'multi' ? (Array.isArray(answers[index]) ? answers[index] as number[] : []) : typeof answers[index] === 'number' ? answers[index] as number : -1,
    })),
  };
}
