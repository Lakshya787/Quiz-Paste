'use client';

import { useState } from 'react';
import {
  buildQuizPrompt,
  DEFAULT_QUESTION_COUNTS,
  MAX_QUESTION_COUNT,
} from '@/lib/guideContent';
import { CopyButton } from './GuideInteractive';
import styles from './PromptGenerator.module.css';

const QUESTION_TYPES = [
  { key: 'single', label: 'MCQ' },
  { key: 'trueFalse', label: 'True / False' },
  { key: 'multi', label: 'Multiple select' },
] as const;

export default function PromptGenerator() {
  const [questionCounts, setQuestionCounts] = useState(DEFAULT_QUESTION_COUNTS);
  const questionCount = questionCounts.single + questionCounts.trueFalse + questionCounts.multi;
  const prompt = buildQuizPrompt(
    questionCounts.single,
    questionCounts.trueFalse,
    questionCounts.multi,
  );

  return (
    <div className={styles.generator}>
      <div className={styles.questionControl}>
        {QUESTION_TYPES.map(({ key, label }) => {
          const otherCount = questionCount - questionCounts[key];
          const minimum = otherCount === 0 ? 1 : 0;
          const maximum = MAX_QUESTION_COUNT - otherCount;
          const inputId = `question-count-${key}`;

          return (
            <div className={styles.questionType} key={key}>
              <label className={styles.questionLabel} htmlFor={inputId}>
                <span>{label}</span>
                <output className={styles.questionCount} htmlFor={inputId}>{questionCounts[key]}</output>
              </label>
              <input
                className={styles.questionSlider}
                id={inputId}
                type="range"
                min={minimum}
                max={maximum}
                step={1}
                value={questionCounts[key]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setQuestionCounts((current) => ({ ...current, [key]: value }));
                }}
                aria-valuetext={`${questionCounts[key]} ${label} ${questionCounts[key] === 1 ? 'question' : 'questions'}`}
              />
            </div>
          );
        })}
        <p className={styles.questionHint}>
          Set each type independently. Total: {questionCount}/{MAX_QUESTION_COUNT} questions.
        </p>
      </div>
      <div className={styles.promptPanel}>
        <div className={styles.promptHeader}>
          <span>Generated prompt</span>
          <CopyButton text={prompt} />
        </div>
        <pre className={styles.prompt} tabIndex={0} aria-label="Generated AI quiz prompt"><code>{prompt}</code></pre>
      </div>
    </div>
  );
}
