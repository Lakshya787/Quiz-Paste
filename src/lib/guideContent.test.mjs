import assert from 'node:assert/strict';
import test from 'node:test';
import { quizPrompt, sampleQuiz } from './guideContent.ts';
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
