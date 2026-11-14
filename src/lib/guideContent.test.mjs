import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildQuizPrompt,
  DEFAULT_QUESTION_COUNTS,
  MAX_QUESTION_COUNT,
  quizPrompt,
  sampleQuiz,
} from './guideContent.ts';
import { parseQuiz } from './parser.ts';

test('sample quiz parses as single, true/false, and multi-select', () => {
  const expectedTypes = ['single', 'tf', 'multi'];

  assert.deepEqual(parseQuiz(sampleQuiz).map((question) => question.type), expectedTypes);
});

test('generated prompt requires exactly the requested question counts and output format', () => {
  assert.match(quizPrompt, /Create exactly 10 quiz questions/);
  assert.match(quizPrompt, /- 5 single-answer questions\n- 3 true\/false questions\n- 2 multi-select questions/);
  assert.match(quizPrompt, /Put the whole output inside a single plain-text code block/);
  assert.match(quizPrompt, /BEFORE YOU ANSWER, CHECK SILENTLY THAT:/);
  assert.doesNotMatch(quizPrompt, /prompt-count-|Move at least one slider/);
});

test('generated prompt uses independently requested counts, including 30 MCQs and zero other types', () => {
  const prompt = buildQuizPrompt(30, 0, 0);

  assert.match(prompt, /Create exactly 30 quiz questions/);
  assert.match(prompt, /- 30 single-answer questions\n- 0 true\/false questions\n- 0 multi-select questions/);
  assert.match(prompt, /Total: exactly 30, numbered 1 to 30\./);
  assert.match(prompt, /Put the whole output inside a single plain-text code block/);
});

test('generated prompt supports any mix of question types while preserving default counts', () => {
  const prompt = buildQuizPrompt(0, 7, 4);

  assert.match(prompt, /- 0 single-answer questions\n- 7 true\/false questions\n- 4 multi-select questions/);
  assert.match(prompt, /Create exactly 11 quiz questions/);
  assert.match(prompt, /numbered 1 to 11/);
  assert.deepEqual(DEFAULT_QUESTION_COUNTS, { single: 5, trueFalse: 3, multi: 2 });
});

test('generated prompt rejects invalid counts, empty quizzes, and totals over 30', () => {
  assert.throws(() => buildQuizPrompt(0, 0, 0), RangeError);
  assert.throws(() => buildQuizPrompt(-1, 1, 0), RangeError);
  assert.throws(() => buildQuizPrompt(1.5, 0, 0), RangeError);
  assert.throws(() => buildQuizPrompt(31, 0, 0), RangeError);
  assert.equal(MAX_QUESTION_COUNT, 30);
});
