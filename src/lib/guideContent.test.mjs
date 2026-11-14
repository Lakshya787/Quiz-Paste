import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuizPrompt, quizPrompt, sampleQuiz } from './guideContent.ts';
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

test('generated prompt updates totals and keeps all question types for custom counts', () => {
  for (const questionCount of [3, 4, 17, 30]) {
    const prompt = buildQuizPrompt(questionCount);
    const [, singleCount, trueFalseCount, multiCount] = prompt.match(
      /- (\d+) single-answer questions\n- (\d+) true\/false questions\n- (\d+) multi-select questions/,
    );

    assert.equal(Number(singleCount) + Number(trueFalseCount) + Number(multiCount), questionCount);
    assert.ok(Number(singleCount) >= 1);
    assert.ok(Number(trueFalseCount) >= 1);
    assert.ok(Number(multiCount) >= 1);
    assert.match(prompt, new RegExp(`Create exactly ${questionCount} quiz questions`));
    assert.match(prompt, new RegExp(`numbered 1 to ${questionCount}`));
  }
});

test('generated prompt rejects counts below the minimum needed for each question type', () => {
  assert.throws(() => buildQuizPrompt(2), RangeError);
});
