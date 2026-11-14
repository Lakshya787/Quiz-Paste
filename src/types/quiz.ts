export type QuestionType = 'single' | 'tf' | 'multi';
export interface Question { text: string; type: QuestionType; options: string[]; corrects: number[]; }
export type Verdict = 'correct' | 'partial' | 'wrong' | 'unanswered';
export type Answer = number | number[] | undefined;
export interface SavedQuestion extends Question { correct: number; chosen: number | number[]; }
export interface QuizResult {
  id: number; name: string; date: string; score: number; correct: number; partial: number;
  wrong: number; unanswered: number; total: number; pass: boolean; questions: SavedQuestion[];
}
export interface QuizSession { name: string; questions: Question[]; }
