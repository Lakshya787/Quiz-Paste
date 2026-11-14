import type { QuizResult } from '@/types/quiz';

export const STORE_KEY = 'quizpaste_results';
export function getHistory(): QuizResult[] {
  try {
    const value = window.localStorage.getItem(STORE_KEY);
    return value ? JSON.parse(value) as QuizResult[] : [];
  } catch { return []; }
}
export function saveHistory(history: QuizResult[]): void {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(history)); } catch { /* Storage may be unavailable. */ }
}
