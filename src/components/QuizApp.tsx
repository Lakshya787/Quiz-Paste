'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Clock3,
  History,
  Leaf,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

type QuestionType = 'single' | 'tf' | 'multi';
type Section = 'paste' | 'quiz' | 'history';
type ScoreStatus = 'correct' | 'partial' | 'wrong' | 'unanswered';
type Answer = number | Set<number>;

type QuizQuestion = {
  text: string;
  options: string[];
  corrects: number[];
  type: QuestionType;
};

type Quiz = {
  name: string;
  questions: QuizQuestion[];
};

type ReviewQuestion = QuizQuestion & {
  chosen: number | number[];
};

type QuizResult = {
  id: number;
  name: string;
  date: string;
  score: number;
  correct: number;
  partial: number;
  wrong: number;
  unanswered: number;
  total: number;
  pass: boolean;
  questions: ReviewQuestion[];
};

const STORAGE_KEY = 'quizpaste_results';

function finishQuestion(question: Omit<QuizQuestion, 'type'>): QuizQuestion {
  let type: QuestionType = question.corrects.length > 1 ? 'multi' : 'single';
  if (type === 'single' && question.options.length === 2) {
    const options = question.options.map((option) => option.toLowerCase());
    const isTrueFalse = (options[0].startsWith('true') || options[0] === 't')
      && (options[1].startsWith('false') || options[1] === 'f');
    const isFalseTrue = (options[0].startsWith('false') || options[0] === 'f')
      && (options[1].startsWith('true') || options[1] === 't');
    if (isTrueFalse || isFalseTrue) type = 'tf';
  }
  return { ...question, type };
}

function parseQuestions(text: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let current: Omit<QuizQuestion, 'type'> | null = null;

  const saveCurrent = () => {
    if (current && current.options.length >= 2 && current.corrects.length > 0) {
      questions.push(finishQuestion(current));
    }
  };

  for (const line of text.split('\n').map((item) => item.trim()).filter(Boolean)) {
    const questionMatch = line.match(/^\d+[.)]\s*(.+)/);
    if (questionMatch) {
      saveCurrent();
      current = { text: questionMatch[1], options: [], corrects: [] };
      continue;
    }

    const optionMatch = line.match(/^([A-Fa-fTtFf])[.)]\s*(.*)/);
    if (!optionMatch || !current) continue;

    const key = optionMatch[1].toUpperCase();
    let optionText = optionMatch[2].trim();
    const markedAtEnd = /\*\s*$/.test(optionText);
    const markedAtStart = /^\*/.test(optionText);
    const isCorrect = markedAtEnd || markedAtStart;
    if (markedAtEnd) optionText = optionText.replace(/\s*\*\s*$/, '').trim();
    if (markedAtStart) optionText = optionText.replace(/^\*\s*/, '').trim();
    if (!optionText) optionText = key === 'T' ? 'True' : key === 'F' ? 'False' : key;

    if (isCorrect) current.corrects.push(current.options.length);
    current.options.push(optionText);
  }

  saveCurrent();
  return questions;
}

function scoreAnswer(question: QuizQuestion, answer: Answer | undefined): ScoreStatus {
  if (question.type !== 'multi') {
    if (typeof answer !== 'number') return 'unanswered';
    return question.corrects.includes(answer) ? 'correct' : 'wrong';
  }

  if (!(answer instanceof Set) || answer.size === 0) return 'unanswered';
  const correct = new Set(question.corrects);
  const exactlyCorrect = [...correct].every((index) => answer.has(index))
    && [...answer].every((index) => correct.has(index));
  if (exactlyCorrect) return 'correct';
  const selectedSomeCorrect = [...answer].some((index) => correct.has(index));
  const selectedWrong = [...answer].some((index) => !correct.has(index));
  return selectedSomeCorrect && !selectedWrong ? 'partial' : 'wrong';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeResult(value: unknown): QuizResult | null {
  if (!isRecord(value) || !Array.isArray(value.questions)) return null;
  if (
    typeof value.id !== 'number'
    || typeof value.name !== 'string'
    || typeof value.date !== 'string'
    || typeof value.score !== 'number'
    || typeof value.correct !== 'number'
    || typeof value.wrong !== 'number'
  ) return null;

  const questions: ReviewQuestion[] = [];
  for (const item of value.questions) {
    if (!isRecord(item) || typeof item.text !== 'string' || !Array.isArray(item.options)) return null;
    if (!item.options.every((option) => typeof option === 'string')) return null;
    const corrects = Array.isArray(item.corrects)
      ? item.corrects.filter((index): index is number => typeof index === 'number')
      : typeof item.correct === 'number' ? [item.correct] : [];
    const type: QuestionType = item.type === 'tf' || item.type === 'multi' ? item.type : 'single';
    const chosen = Array.isArray(item.chosen)
      ? item.chosen.filter((index): index is number => typeof index === 'number')
      : typeof item.chosen === 'number' ? item.chosen : -1;
    questions.push({ text: item.text, options: item.options, corrects, type, chosen });
  }

  if (!questions.length) return null;
  return {
    id: value.id,
    name: value.name,
    date: value.date,
    score: value.score,
    correct: value.correct,
    partial: typeof value.partial === 'number' ? value.partial : 0,
    wrong: value.wrong,
    unanswered: typeof value.unanswered === 'number' ? value.unanswered : 0,
    total: typeof value.total === 'number' ? value.total : questions.length,
    pass: typeof value.pass === 'boolean' ? value.pass : value.score >= 60,
    questions,
  };
}

function getReviewStatus(question: ReviewQuestion): ScoreStatus {
  if (question.type === 'multi') {
    const chosen = new Set(Array.isArray(question.chosen) ? question.chosen : []);
    if (!chosen.size) return 'unanswered';
    const correct = new Set(question.corrects);
    const exactlyCorrect = [...correct].every((index) => chosen.has(index))
      && [...chosen].every((index) => correct.has(index));
    if (exactlyCorrect) return 'correct';
    const selectedSomeCorrect = [...chosen].some((index) => correct.has(index));
    const selectedWrong = [...chosen].some((index) => !correct.has(index));
    return selectedSomeCorrect && !selectedWrong ? 'partial' : 'wrong';
  }
  if (typeof question.chosen !== 'number' || question.chosen < 0) return 'unanswered';
  return question.corrects.includes(question.chosen) ? 'correct' : 'wrong';
}

function statusLabel(status: ScoreStatus): string {
  if (status === 'correct') return 'Correct';
  if (status === 'partial') return 'Partial credit';
  if (status === 'wrong') return 'Incorrect';
  return 'Skipped';
}

function statusClasses(status: ScoreStatus): string {
  if (status === 'correct') return 'border-leaf/50 bg-wash text-leaf';
  if (status === 'partial') return 'border-earth/60 bg-parchment/70 text-earth';
  if (status === 'wrong') return 'border-spirit/50 bg-spirit/10 text-spirit';
  return 'border-paper-edge/60 bg-paper-light text-quiet';
}

function ReviewList({ questions }: { questions: ReviewQuestion[] }) {
  return (
    <div className="mt-6 grid gap-3">
      {questions.map((question, questionIndex) => {
        const status = getReviewStatus(question);
        const selected = new Set(Array.isArray(question.chosen) ? question.chosen : [question.chosen]);
        return (
          <article key={`${questionIndex}-${question.text}`} className="rounded-organic border border-paper-edge/40 bg-paper-light/75 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="pt-0.5 text-[10px] font-semibold tracking-wide text-quiet">Q{questionIndex + 1}</span>
                <div>
                  <p className="text-sm font-semibold leading-relaxed text-ink">{question.text}</p>
                  <span className="mt-1 inline-flex rounded-full bg-paper-deep/50 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-quiet">
                    {question.type === 'tf' ? 'TRUE / FALSE' : question.type === 'multi' ? 'MULTI-SELECT' : 'SINGLE CHOICE'}
                  </span>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(status)}`}>{statusLabel(status)}</span>
            </div>
            <div className="grid gap-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected.has(optionIndex);
                const isCorrect = question.corrects.includes(optionIndex);
                const optionClass = isCorrect
                  ? question.type === 'multi' && !isSelected
                    ? 'border-earth/55 bg-parchment/70 text-ink'
                    : 'border-leaf/50 bg-wash/70 text-ink'
                  : isSelected
                    ? 'border-spirit/45 bg-spirit/10 text-ink'
                    : 'border-paper-edge/35 bg-paper/50 text-ink-soft';
                return (
                  <div key={`${optionIndex}-${option}`} className={`flex items-center gap-3 rounded-organic-sm border px-3 py-2.5 text-sm ${optionClass}`}>
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current/40 text-[10px]">
                      {isCorrect ? <Check size={12} /> : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="min-w-0 flex-1">{option}</span>
                    {isSelected && !isCorrect && <span className="text-[9px] font-semibold uppercase tracking-wide text-spirit">Your answer</span>}
                    {isCorrect && question.type === 'multi' && !isSelected && <span className="text-[9px] font-semibold uppercase tracking-wide text-earth">Missed</span>}
                    {isCorrect && (question.type !== 'multi' || isSelected) && <span className="text-[9px] font-semibold uppercase tracking-wide text-leaf">Correct</span>}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ResultSummary({ result }: { result: QuizResult }) {
  return (
    <section className="rounded-organic border border-paper-edge/40 bg-paper-light/80 p-6 text-center sm:p-8">
      <p className="text-[10px] font-bold tracking-[.16em] text-quiet uppercase">Your result</p>
      <p className="mt-2 font-hand text-6xl leading-none text-leaf">{result.score}%</p>
      <p className="mt-2 text-sm font-semibold text-ink">{result.pass ? 'Passed' : 'Not quite'} <span className="font-normal text-quiet">— {result.name}</span></p>
      <div className="mt-6 flex flex-wrap justify-center gap-5">
        <div><p className="text-xl font-bold text-leaf">{result.correct}</p><p className="text-[10px] text-quiet">correct</p></div>
        {result.partial > 0 && <div><p className="text-xl font-bold text-earth">{result.partial}</p><p className="text-[10px] text-quiet">partial</p></div>}
        <div><p className="text-xl font-bold text-spirit">{result.wrong}</p><p className="text-[10px] text-quiet">incorrect</p></div>
        <div><p className="text-xl font-bold text-quiet">{result.unanswered}</p><p className="text-[10px] text-quiet">skipped</p></div>
      </div>
    </section>
  );
}

export default function QuizApp() {
  const [section, setSection] = useState<Section>('paste');
  const [input, setInput] = useState('');
  const [quizName, setQuizName] = useState('');
  const [hint, setHint] = useState<QuestionType>('single');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Array<Answer | undefined>>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<QuizResult | null>(null);
  const [toast, setToast] = useState('');

  const parsedQuestions = useMemo(() => parseQuestions(input), [input]);
  const parsedCounts = useMemo(() => parsedQuestions.reduce(
    (counts, question) => ({ ...counts, [question.type]: counts[question.type] + 1 }),
    { single: 0, tf: 0, multi: 0 },
  ), [parsedQuestions]);
  const sectionName = section === 'paste' ? 'Paste questions' : section === 'quiz' ? 'Your quiz' : 'Quiz history';

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          throw new Error('Stored quiz history has an unexpected format.');
        }
        const results = parsed.map(normalizeResult);
        const validResults = results.filter((result): result is QuizResult => result !== null);
        setHistory(validResults);
        if (validResults.length !== parsed.length) {
          setToast('Some saved quiz results could not be read and were skipped.');
        }
      }
    } catch (error) {
      setToast(error instanceof Error ? `Quiz history could not be loaded: ${error.message}` : 'Quiz history could not be loaded.');
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    try {
      const sample = window.sessionStorage.getItem('quizpaste_prefill');
      if (sample === null) return;
      setInput(sample);
      setSection('paste');
      window.sessionStorage.removeItem('quizpaste_prefill');
      setToast('Sample quiz loaded. Check the preview before starting.');
    } catch (error) {
      setToast(error instanceof Error ? `The sample quiz could not be loaded: ${error.message}` : 'The sample quiz could not be loaded.');
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(message: string) {
    setToast(message);
  }

  function updateHistory(nextHistory: QuizResult[]): boolean {
    setHistory(nextHistory);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
      return true;
    } catch (error) {
      showToast(error instanceof Error ? `History could not be saved: ${error.message}` : 'History could not be saved.');
      return false;
    }
  }

  function startQuiz() {
    if (!parsedQuestions.length) {
      showToast('No valid questions found. Check the format and mark each answer with an asterisk.');
      return;
    }
    setQuiz({
      name: quizName.trim() || `Quiz ${new Date().toLocaleString()}`,
      questions: parsedQuestions,
    });
    setAnswers([]);
    setRevealed([]);
    setCurrentQuestion(0);
    setQuizResult(null);
    setSection('quiz');
  }

  function selectOption(optionIndex: number) {
    if (!quiz || revealed[currentQuestion]) return;
    const question = quiz.questions[currentQuestion];
    setAnswers((previous) => {
      const next = [...previous];
      if (question.type === 'multi') {
        const currentAnswer = next[currentQuestion];
        const selected = currentAnswer instanceof Set ? new Set(currentAnswer) : new Set<number>();
        if (selected.has(optionIndex)) selected.delete(optionIndex);
        else selected.add(optionIndex);
        next[currentQuestion] = selected;
      } else {
        next[currentQuestion] = optionIndex;
      }
      return next;
    });
  }

  function markRevealed(index: number) {
    setRevealed((previous) => {
      const next = [...previous];
      next[index] = true;
      return next;
    });
  }

  function checkAnswer() {
    const answer = answers[currentQuestion];
    const answered = answer instanceof Set ? answer.size > 0 : typeof answer === 'number';
    if (!answered) {
      showToast('Choose an answer first, or skip this question.');
      return;
    }
    markRevealed(currentQuestion);
  }

  function finishQuiz() {
    if (!quiz) return;
    const scores = quiz.questions.map((question, index) => scoreAnswer(question, answers[index]));
    const correct = scores.filter((score) => score === 'correct').length;
    const partial = scores.filter((score) => score === 'partial').length;
    const wrong = scores.filter((score) => score === 'wrong').length;
    const unanswered = scores.filter((score) => score === 'unanswered').length;
    const score = Math.round(((correct + partial * 0.5) / quiz.questions.length) * 100);
    const result: QuizResult = {
      id: Date.now(),
      name: quiz.name,
      date: new Date().toISOString(),
      score,
      correct,
      partial,
      wrong,
      unanswered,
      total: quiz.questions.length,
      pass: score >= 60,
      questions: quiz.questions.map((question, index) => {
        const answer = answers[index];
        return {
          ...question,
          chosen: question.type === 'multi'
            ? answer instanceof Set ? [...answer] : []
            : typeof answer === 'number' ? answer : -1,
        };
      }),
    };

    updateHistory([result, ...history]);
    setQuizResult(result);
    setSection('quiz');
  }

  function skipQuestion() {
    if (!quiz) return;
    markRevealed(currentQuestion);
    if (currentQuestion === quiz.questions.length - 1) {
      finishQuiz();
    } else {
      setCurrentQuestion((index) => index + 1);
    }
  }

  function retestResult(result: QuizResult) {
    setQuiz({
      name: result.name,
      questions: result.questions.map(({ text, options, corrects, type }) => ({ text, options, corrects, type })),
    });
    setAnswers([]);
    setRevealed([]);
    setCurrentQuestion(0);
    setQuizResult(null);
    setHistoryDetail(null);
    setSection('quiz');
    showToast(`Retaking: ${result.name}`);
  }

  function deleteResult(id: number) {
    const saved = updateHistory(history.filter((result) => result.id !== id));
    if (historyDetail?.id === id) setHistoryDetail(null);
    if (saved) showToast('Quiz result deleted.');
  }

  function clearHistory() {
    if (!window.confirm('Delete all quiz history?')) return;
    const saved = updateHistory([]);
    setHistoryDetail(null);
    if (saved) showToast('Quiz history cleared.');
  }

  const activeQuestion = quiz?.questions[currentQuestion];
  const activeAnswer = answers[currentQuestion];
  const currentRevealed = revealed[currentQuestion] ?? false;
  const allAnswered = Boolean(quiz?.questions.every((question, index) => {
    const answer = answers[index];
    return question.type === 'multi' ? answer instanceof Set && answer.size > 0 : typeof answer === 'number';
  }));
  const progress = quiz ? Math.round((currentQuestion / quiz.questions.length) * 100) : 0;

  const navigation = [
    { id: 'paste' as const, label: 'Paste questions', icon: <ClipboardList size={17} /> },
    { id: 'quiz' as const, label: 'Quiz', icon: <Sparkles size={17} /> },
    { id: 'history' as const, label: 'History', icon: <History size={17} /> },
  ];

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-leaf/15 bg-paper-light/75 px-5 py-7 backdrop-blur-sm lg:flex">
        <div className="mb-12 flex items-center gap-3">
          <img className="size-10 rounded-organic-sm object-contain" src="/icon.ico" width={40} height={40} alt="" aria-hidden="true" />
          <span><span className="block font-hand text-[23px] font-semibold leading-none tracking-tight">QuizPaste</span><span className="mt-1 block text-[10px] tracking-[.16em] text-quiet uppercase">a quiet quiz studio</span></span>
        </div>
        <p className="mb-3 pl-3 text-[10px] font-semibold tracking-[.17em] text-quiet uppercase">Your worktable</p>
        <nav className="grid gap-1" aria-label="Quiz navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSection(item.id); setHistoryDetail(null); }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-colors ${section === item.id ? 'bg-wash font-semibold text-leaf' : 'text-ink/70 hover:bg-paper-deep/60'}`}
              aria-current={section === item.id ? 'page' : undefined}
            >
              {item.icon}{item.label}
              {item.id === 'history' && <span className="ml-auto text-xs text-quiet">{history.length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-organic border border-paper-edge/45 bg-paper-deep/55 p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-earth/35 text-ink-soft"><Sun size={17} /></div>
          <p className="font-hand text-[20px] italic">Take your time.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-quiet">A little pause can help the answers find you.</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] tracking-wide text-leaf"><span className="size-1.5 rounded-full bg-leaf" /> HISTORY SAVED HERE</div>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-[232px]">
        <header className="flex h-[72px] items-center justify-between border-b border-leaf/10 px-5 sm:px-8 xl:px-12">
          <div className="flex items-center gap-2.5 lg:hidden">
            <img className="size-8 rounded-organic-sm object-contain" src="/icon.ico" width={32} height={32} alt="" aria-hidden="true" />
            <span className="font-hand text-xl font-semibold">QuizPaste</span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-quiet sm:flex"><span>QuizPaste</span><span className="text-paper-edge">/</span><span className="font-medium text-ink">{sectionName}</span></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-1.5 rounded-full bg-wash px-3 py-1.5 text-[11px] text-leaf sm:inline-flex"><span className="size-1.5 rounded-full bg-leaf" />A quiet corner to learn</span>
            <Link href="/guide" className="inline-flex items-center gap-1.5 rounded-full border border-paper-edge/45 px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-wash hover:text-leaf" aria-label="How to use QuizPaste">
              <BookOpen size={15} /> Guide
            </Link>
          </div>
        </header>

        <nav className="grid grid-cols-3 gap-1 border-b border-leaf/10 bg-paper-light/35 px-5 py-2 lg:hidden" aria-label="Quiz navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setSection(item.id); setHistoryDetail(null); }}
              className={`flex items-center justify-center gap-2 rounded-full px-2 py-2.5 text-xs transition-colors ${section === item.id ? 'bg-wash font-semibold text-leaf' : 'text-quiet hover:bg-paper-deep/40'}`}
              aria-current={section === item.id ? 'page' : undefined}
            >
              {item.icon}<span>{item.label === 'Paste questions' ? 'Paste' : item.label}</span>
            </button>
          ))}
        </nav>

        <main className="mx-auto max-w-[1080px] px-5 pb-20 pt-9 sm:px-8 sm:pt-12 xl:px-12">
          {section === 'paste' && (
            <section className="brush-in">
              <div className="mb-8">
                <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-leaf"><Leaf size={14} /> From notes to a moment of discovery</p>
                <h1 className="font-hand text-[clamp(2.8rem,5vw,4.2rem)] leading-[.94] tracking-[-.025em] text-ink">Let’s make a <span className="font-normal italic text-leaf">little quiz.</span></h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-quiet">Paste questions below, mark each correct answer with an asterisk, and begin when you’re ready.</p>
              </div>

              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(250px,.65fr)]">
                <section className="rounded-organic border border-paper-edge/45 bg-paper-light/85 p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-organic-sm bg-wash text-leaf"><ClipboardList size={16} /></span><h2 className="font-hand text-[25px] leading-none">Your question sheet</h2></div>
                    <span className="rounded-full bg-paper-deep/50 px-2.5 py-1 text-[10px] tracking-wide text-quiet">PASTE &amp; PLAY</span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Question format examples">
                    {([
                      ['single', 'MCQ'],
                      ['tf', 'True / False'],
                      ['multi', 'Multi-select'],
                    ] as const).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        role="tab"
                        aria-selected={hint === type}
                        onClick={() => setHint(type)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-colors ${hint === type ? 'border-leaf/55 bg-wash text-leaf' : 'border-paper-edge/45 text-quiet hover:bg-paper-deep/30'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mb-5 rounded-organic-sm border border-paper-edge/40 border-l-[3px] border-l-leaf bg-paper/65 p-4 font-mono text-xs leading-[1.8] text-quiet" role="tabpanel">
                    {hint === 'single' && <><p><strong className="text-leaf">Single correct</strong> — mark the answer with <strong className="text-leaf">*</strong></p><pre className="mt-2 whitespace-pre-wrap">{`1. What is 2+2?\nA) 3\nB) 4 *\nC) 5\nD) 6`}</pre></>}
                    {hint === 'tf' && <><p><strong className="text-leaf">True / False</strong> — use T) and F) options</p><pre className="mt-2 whitespace-pre-wrap">{`2. The sun is a star.\nT) True *\nF) False`}</pre></>}
                    {hint === 'multi' && <><p><strong className="text-leaf">Multiple correct</strong> — mark every answer with <strong className="text-leaf">*</strong></p><pre className="mt-2 whitespace-pre-wrap">{`3. Which are prime numbers?\nA) 2 *\nB) 4\nC) 7 *\nD) 9`}</pre></>}
                  </div>

                  <label htmlFor="question-input" className="mb-2 block text-[11px] font-semibold tracking-[.11em] text-quiet uppercase">Your questions</label>
                  <textarea
                    id="question-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={'Paste questions here. Mix multiple choice, true/false, and multi-select freely...'}
                    className="min-h-[240px] w-full resize-y rounded-organic-sm border border-paper-edge/50 bg-paper p-4 font-mono text-[13px] leading-[1.8] text-ink outline-none transition-colors placeholder:text-quiet/80 focus:border-leaf/70"
                    spellCheck={false}
                  />
                  <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-[11px]">
                    <p aria-live="polite" className={input.trim() ? parsedQuestions.length ? 'text-leaf' : 'text-clay' : 'text-quiet'}>
                      {!input.trim()
                        ? 'Questions will be checked as you paste.'
                        : parsedQuestions.length
                          ? `${parsedQuestions.length} questions parsed: ${[
                            parsedCounts.single ? `${parsedCounts.single} MCQ` : '',
                            parsedCounts.tf ? `${parsedCounts.tf} T/F` : '',
                            parsedCounts.multi ? `${parsedCounts.multi} multi-select` : '',
                          ].filter(Boolean).join(', ')}`
                          : 'No valid questions found. Check the format and mark answers with *.'}
                    </p>
                    <span className="shrink-0 text-quiet">{input.length} characters</span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label htmlFor="quiz-name" className="mb-1.5 block text-[10px] font-semibold tracking-[.11em] text-quiet uppercase">Quiz name <span className="font-normal normal-case">(optional)</span></label>
                      <input
                        id="quiz-name"
                        value={quizName}
                        onChange={(event) => setQuizName(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter') startQuiz(); }}
                        placeholder="A name for this little quiz"
                        className="w-full rounded-organic-sm border border-paper-edge/50 bg-paper px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-quiet/80 focus:border-leaf/70"
                      />
                    </div>
                    <button type="button" onClick={startQuiz} className="flex items-end justify-center gap-2 rounded-organic-sm bg-leaf px-5 py-3 text-sm font-bold text-on-accent transition-colors hover:bg-ink sm:self-end">
                      START <ArrowRight size={16} />
                    </button>
                  </div>
                </section>

                <aside className="rounded-organic border border-paper-edge/40 bg-wash/45 p-5 sm:p-6">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-parchment text-ink-soft"><Sparkles size={17} /></div>
                  <h2 className="font-hand text-[27px] leading-none text-ink">A few gentle rules</h2>
                  <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-quiet">
                    <li><span className="font-semibold text-ink-soft">1. </span>Start each question with a number and a period or parenthesis.</li>
                    <li><span className="font-semibold text-ink-soft">2. </span>Use A–F for choices, or T and F for true/false.</li>
                    <li><span className="font-semibold text-ink-soft">3. </span>Add <code className="rounded bg-paper-light px-1.5 py-0.5 text-leaf">*</code> to every correct choice.</li>
                    <li><span className="font-semibold text-ink-soft">4. </span>Multi-select earns half credit when only correct choices are selected.</li>
                  </ul>
                  <div className="mt-5 border-t border-leaf/15 pt-4 text-xs leading-relaxed text-quiet">
                    <p className="flex items-center gap-2 font-semibold text-leaf"><Clock3 size={14} /> Your results stay on this device.</p>
                    <p className="mt-1.5">No account or network connection is needed.</p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {section === 'quiz' && (
            <section className="brush-in">
              {!quiz && !quizResult && (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-organic border border-dashed border-paper-edge/60 bg-paper-light/45 px-6 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-wash text-leaf"><ClipboardList size={20} /></div>
                  <h1 className="font-hand text-[32px] leading-none text-ink">Your quiz is waiting.</h1>
                  <p className="mt-2 max-w-sm text-sm text-quiet">Paste a few questions first, then come back here to begin.</p>
                  <button type="button" onClick={() => setSection('paste')} className="mt-5 rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink">Paste questions</button>
                </div>
              )}

              {quizResult && (
                <div>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div><p className="mb-2 text-xs font-medium tracking-wide text-leaf">A moment to look back</p><h1 className="font-hand text-[clamp(2.5rem,5vw,3.8rem)] leading-[.94] text-ink">Nicely done.</h1></div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSection('history')} className="rounded-full border border-paper-edge/50 px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-paper-light">View history</button>
                      <button type="button" onClick={() => { setQuizResult(null); setSection('paste'); }} className="flex items-center gap-2 rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink">New quiz <ArrowRight size={14} /></button>
                    </div>
                  </div>
                  <ResultSummary result={quizResult} />
                  <h2 className="mt-8 font-hand text-[29px] leading-none text-ink">A page-by-page look</h2>
                  <ReviewList questions={quizResult.questions} />
                </div>
              )}

              {quiz && !quizResult && activeQuestion && (
                <div>
                  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div><p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-leaf"><Sparkles size={14} /> One question at a time</p><h1 className="font-hand text-[clamp(2.4rem,5vw,3.8rem)] leading-[.94] text-ink">{quiz.name}</h1></div>
                    <span className="rounded-full bg-wash px-3 py-1.5 font-mono text-xs text-leaf">{currentQuestion + 1} / {quiz.questions.length}</span>
                  </div>
                  <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-paper-deep/50"><div className="h-full rounded-full bg-leaf transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>

                  <article className="rounded-organic border border-paper-edge/45 bg-paper-light/85 p-5 sm:p-8">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-wide text-leaf">QUESTION {currentQuestion + 1}</span>
                      <span className="rounded-full bg-sky-wash px-2.5 py-1 text-[9px] font-semibold tracking-wide text-ink-soft">{activeQuestion.type === 'tf' ? 'TRUE / FALSE' : activeQuestion.type === 'multi' ? 'MULTI-SELECT' : 'SINGLE CHOICE'}</span>
                    </div>
                    <h2 className="mb-5 text-lg font-semibold leading-relaxed text-ink sm:text-xl">{activeQuestion.text}</h2>
                    {activeQuestion.type === 'multi' && !currentRevealed && (
                      <p className="mb-3 text-[11px] text-quiet">Select all that apply · {activeQuestion.corrects.length} correct answer{activeQuestion.corrects.length === 1 ? '' : 's'}</p>
                    )}
                    <div className="grid gap-2.5">
                      {activeQuestion.options.map((option, optionIndex) => {
                        const selected = activeQuestion.type === 'multi'
                          ? activeAnswer instanceof Set && activeAnswer.has(optionIndex)
                          : activeAnswer === optionIndex;
                        const correct = activeQuestion.corrects.includes(optionIndex);
                        const selectedWrong = currentRevealed && selected && !correct;
                        let optionState = selected ? 'border-earth/60 bg-parchment/70' : 'border-paper-edge/50 bg-paper/55 hover:border-leaf/45 hover:bg-wash/45';
                        if (currentRevealed && correct && (activeQuestion.type !== 'multi' || selected)) optionState = 'border-leaf/60 bg-wash';
                        else if (currentRevealed && correct && !selected) optionState = 'border-earth/60 bg-earth/15';
                        else if (selectedWrong) optionState = 'border-spirit/60 bg-spirit/10';
                        const indicatorState = selectedWrong
                          ? 'border-spirit bg-spirit text-on-accent'
                          : selected ? 'border-leaf bg-leaf text-on-accent' : 'border-paper-edge text-quiet';
                        return (
                          <button
                            key={`${optionIndex}-${option}`}
                            type="button"
                            onClick={() => selectOption(optionIndex)}
                            disabled={currentRevealed}
                            aria-pressed={selected}
                            className={`flex w-full items-center gap-3 rounded-organic-sm border px-3.5 py-3 text-left text-sm transition-colors disabled:cursor-default ${optionState}`}
                          >
                            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${indicatorState}`}>
                              {selected && activeQuestion.type === 'multi' ? <Check size={13} /> : activeQuestion.type === 'tf' ? optionIndex === 0 ? 'T' : 'F' : String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="min-w-0 flex-1 text-ink">{option}</span>
                            {currentRevealed && correct && (activeQuestion.type !== 'multi' || selected) && <span className="text-[9px] font-semibold uppercase tracking-wide text-leaf">Correct</span>}
                            {currentRevealed && correct && activeQuestion.type === 'multi' && !selected && <span className="text-[9px] font-semibold uppercase tracking-wide text-earth">Missed</span>}
                            {selectedWrong && <span className="text-[9px] font-semibold uppercase tracking-wide text-spirit">Your answer</span>}
                          </button>
                        );
                      })}
                    </div>
                  </article>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={() => setCurrentQuestion((index) => Math.max(0, index - 1))} disabled={currentQuestion === 0} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-quiet transition-colors hover:bg-paper-light disabled:invisible">
                      <ArrowLeft size={14} /> Previous
                    </button>
                    <div className="flex flex-wrap justify-end gap-2">
                      {!currentRevealed && (
                        <>
                          <button type="button" onClick={skipQuestion} className="rounded-full border border-paper-edge/50 px-4 py-2.5 text-xs font-semibold text-quiet hover:bg-paper-light">
                            {currentQuestion === quiz.questions.length - 1 ? 'Skip & finish' : 'Skip question'}
                          </button>
                          <button type="button" onClick={checkAnswer} className="rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink">
                            Check answer <Check size={14} className="ml-1 inline" />
                          </button>
                          {allAnswered && <button type="button" onClick={finishQuiz} className="rounded-full border border-leaf/40 px-4 py-2.5 text-xs font-semibold text-leaf hover:bg-wash">Submit quiz</button>}
                        </>
                      )}
                      {currentRevealed && currentQuestion < quiz.questions.length - 1 && (
                        <button type="button" onClick={() => setCurrentQuestion((index) => index + 1)} className="flex items-center gap-2 rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink">
                          Next question <ArrowRight size={14} />
                        </button>
                      )}
                      {currentRevealed && currentQuestion === quiz.questions.length - 1 && (
                        <button type="button" onClick={finishQuiz} className="flex items-center gap-2 rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink">
                          Finish quiz <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {currentRevealed && <p className="mt-3 text-right text-xs text-leaf" role="status">Answer checked. You can move on when you’re ready.</p>}
                </div>
              )}
            </section>
          )}

          {section === 'history' && (
            <section className="brush-in">
              {historyDetail ? (
                <div>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <button type="button" onClick={() => setHistoryDetail(null)} className="mb-3 inline-flex items-center gap-1.5 text-xs text-quiet hover:text-leaf"><ArrowLeft size={14} /> Back to history</button>
                      <h1 className="font-hand text-[clamp(2.4rem,5vw,3.7rem)] leading-[.94] text-ink">A look back at this quiz.</h1>
                      <p className="mt-2 text-xs text-quiet">{new Date(historyDetail.date).toLocaleString()}</p>
                    </div>
                    <button type="button" onClick={() => retestResult(historyDetail)} className="flex items-center gap-2 rounded-organic-sm bg-leaf px-4 py-2.5 text-xs font-bold text-on-accent hover:bg-ink"><RotateCcw size={14} /> Retake quiz</button>
                  </div>
                  <ResultSummary result={historyDetail} />
                  <ReviewList questions={historyDetail.questions} />
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div><p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-leaf"><History size={14} /> Every try is part of the story</p><h1 className="font-hand text-[clamp(2.8rem,5vw,4.2rem)] leading-[.94] text-ink">Your quiz history.</h1><p className="mt-2 text-sm text-quiet">{history.length} quiz{history.length === 1 ? '' : 'zes'} taken · saved on this device</p></div>
                    {history.length > 0 && <button type="button" onClick={clearHistory} className="flex items-center gap-2 rounded-full border border-clay/45 px-4 py-2.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-clay/10"><Trash2 size={14} /> Clear history</button>}
                  </div>
                  {!historyReady ? (
                    <p className="py-12 text-center text-sm text-quiet">Gathering your saved results...</p>
                  ) : history.length ? (
                    <div className="grid gap-3">
                      {history.map((result) => (
                        <article key={result.id} className="flex flex-wrap items-center gap-4 rounded-organic border border-paper-edge/40 bg-paper-light/80 p-4 sm:p-5">
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-organic-sm bg-wash font-hand text-[25px] text-leaf">{result.score}%</div>
                          <div className="min-w-[160px] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="max-w-full truncate text-sm font-semibold text-ink">{result.name}</h2>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${result.pass ? 'bg-wash text-leaf' : 'bg-clay/15 text-ink-soft'}`}>{result.pass ? 'PASSED' : 'NOT PASSED'}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-quiet">{result.correct} correct · {result.partial} partial · {result.wrong} incorrect · {result.unanswered} skipped · {result.total} questions</p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-quiet"><Clock3 size={11} />{new Date(result.date).toLocaleString()}</p>
                          </div>
                          <div className="flex w-full gap-2 sm:w-auto">
                            <button type="button" onClick={() => setHistoryDetail(result)} className="flex-1 rounded-full border border-paper-edge/50 px-3 py-2 text-[10px] font-semibold text-ink-soft hover:bg-paper sm:flex-none">Review</button>
                            <button type="button" onClick={() => retestResult(result)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-leaf/40 px-3 py-2 text-[10px] font-semibold text-leaf hover:bg-wash sm:flex-none"><RotateCcw size={12} /> Retest</button>
                            <button type="button" onClick={() => deleteResult(result.id)} aria-label={`Delete ${result.name} result`} className="rounded-full border border-paper-edge/50 px-3 py-2 text-quiet hover:border-clay/40 hover:bg-clay/10 hover:text-ink"><Trash2 size={13} /></button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-organic border border-dashed border-paper-edge/60 bg-paper-light/45 text-center">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-wash text-leaf"><History size={19} /></div>
                      <h2 className="font-hand text-[30px] leading-none text-ink">No quizzes taken yet.</h2>
                      <p className="mt-2 max-w-xs text-sm text-quiet">Your results will settle here after your first quiz.</p>
                      <button type="button" onClick={() => setSection('paste')} className="mt-4 text-xs font-semibold text-leaf hover:underline">Paste some questions</button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </main>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-organic-sm border border-paper-edge/40 bg-paper-light px-4 py-3 text-xs text-ink shadow-[0_8px_30px_rgba(47,58,47,.12)]">
          {toast.includes('could not') || toast.includes('could not be') ? <TriangleAlert size={15} className="shrink-0 text-clay" /> : <Check size={15} className="shrink-0 text-leaf" />}
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
