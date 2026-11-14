import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPrompt, sampleQuiz } from './guideContent.ts';
import { parseQuiz } from './parser.ts';

test('sample quiz and generated prompt examples parse as single, true/false, and multi-select', () => {
  const expectedTypes = ['single', 'tf', 'multi'];
  const generatedPrompt = buildPrompt({ single: 5, tf: 3, multi: 2 });
  const exampleMarker = 'Format example for the selected question types:\n';
  const example = generatedPrompt.slice(generatedPrompt.indexOf(exampleMarker) + exampleMarker.length);

  assert.deepEqual(parseQuiz(sampleQuiz).map((question) => question.type), expectedTypes);
  assert.deepEqual(parseQuiz(example).map((question) => question.type), expectedTypes);
});
