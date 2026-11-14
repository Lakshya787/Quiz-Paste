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

export const DEFAULT_QUESTION_COUNT = 10;

function getQuestionBreakdown(total: number) {
  const weights = [5, 3, 2];
  const counts = [1, 1, 1];
  const remaining = total - counts.length;
  const remainders = weights.map((weight, index) => {
    const weightedCount = (remaining * weight) / 10;
    const wholeCount = Math.floor(weightedCount);
    counts[index] += wholeCount;
    return { index, remainder: weightedCount - wholeCount };
  });
  const unassigned = total - counts.reduce((sum, count) => sum + count, 0);

  remainders
    .sort((left, right) => right.remainder - left.remainder)
    .slice(0, unassigned)
    .forEach(({ index }) => {
      counts[index] += 1;
    });

  return counts;
}

export function buildQuizPrompt(questionCount: number) {
  if (!Number.isInteger(questionCount) || questionCount < 3) {
    throw new RangeError('The quiz must contain at least 3 questions.');
  }

  const [singleCount, trueFalseCount, multiCount] = getQuestionBreakdown(questionCount);
  const questionWord = (count: number) => count === 1 ? 'question' : 'questions';
  return `You are an expert exam writer. Create exactly ${questionCount} quiz questions from the study material I have attached.

QUESTION BREAKDOWN
- ${singleCount} single-answer ${questionWord(singleCount)}
- ${trueFalseCount} true/false ${questionWord(trueFalseCount)}
- ${multiCount} multi-select ${questionWord(multiCount)}
Total: exactly ${questionCount}, numbered 1 to ${questionCount}. Mix the question types in a random order.

SOURCE RULES
- Use ONLY the attached material. Do not add facts, examples, numbers or definitions from anywhere else.
- Spread the questions across the whole material (different topics and sections). No two questions may test the same fact.
- Prefer questions that test understanding (definitions, causes and effects, comparisons, steps in a process, formulas, key terms) over trivia such as page numbers, author names or formatting.
- Every question must stand on its own. Never write "according to the text", "the passage", "the document", "the slide", "the figure" or otherwise refer to the attachment. Put any needed context inside the question itself.
- Write in the same language as the material.
- If the material contains images, charts or tables, use their labelled content, but make sure each question can be read and answered as plain text.

QUESTION TYPE RULES
Single-answer (MCQ):
- Exactly four options labelled A), B), C) and D), with exactly ONE correct option.
- Wrong options must be plausible, on-topic, and similar in length and style to the correct one. No joke or obviously absurd options.
- Never use "All of the above", "None of the above" or "Both A and B".
- Spread the correct answer evenly across A, B, C and D. Do not favour one letter.

True/False:
- The question line is a clear declarative statement (not a question) that is either entirely true or entirely false according to the material.
- The options are exactly "T) True" and "F) False", in that order, with exactly ONE marked correct.
- Keep a balanced mix of true and false statements. Avoid giveaway words such as "always" or "never" unless the material uses them.

Multi-select:
- Four or five options labelled A) to D), or A) to E).
- TWO or more options are correct (usually two or three) and at least one option is incorrect. Never mark every option as correct.
- Word the question so that several answers are expected (for example "Which of the following ...?"). Do not add "(select all that apply)".

OUTPUT FORMAT (strict, because an app reads this text automatically)
- Number the questions continuously: 1., 2., 3., and so on (number, period, space).
- Write each question on ONE line. Write each option on its own line as: letter, closing parenthesis, space, option text. Example: B) Option text
- Never split a question or an option across several lines.
- Put a space and then * at the very end of EVERY correct option line. Never use the * character anywhere else.
- Mark exactly ONE correct option for single-answer and true/false questions.
- Mark TWO or more correct options for multi-select questions.
- Leave one blank line between questions.
- Do not include headings, explanations, answer keys, hints, bold, italics, bullet points or any other markdown formatting.
- Do not write any introduction or closing sentence.
- Put the whole output inside a single plain-text code block so the formatting survives copying. Write nothing outside that block.

FORMAT EXAMPLE
1. What is 2+2?
A) 3
B) 4 *
C) 5
D) 6

2. The sun is a star.
T) True *
F) False

3. Which of the following are prime numbers?
A) 2 *
B) 4
C) 7 *
D) 9

BEFORE YOU ANSWER, CHECK SILENTLY THAT:
- there are exactly ${questionCount} questions, numbered 1 to ${questionCount}
- the counts per type match: ${singleCount} single-answer, ${trueFalseCount} true/false, ${multiCount} multi-select
- every single-answer and true/false question has exactly one option ending in *
- every multi-select question has two or more options ending in *, and at least one without
- no * appears anywhere except at the end of a correct option line
- the output contains only the questions`;
}

export const quizPrompt = buildQuizPrompt(DEFAULT_QUESTION_COUNT);
