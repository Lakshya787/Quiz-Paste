'use client';

import { useState } from 'react';
import { buildQuizPrompt, DEFAULT_QUESTION_COUNT } from '@/lib/guideContent';
import { CopyButton } from './GuideInteractive';
import styles from './PromptGenerator.module.css';

export default function PromptGenerator() {
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const prompt = buildQuizPrompt(questionCount);

  return (
    <div className={styles.generator}>
      <div className={styles.questionControl}>
        <label className={styles.questionLabel} htmlFor="question-count">
          <span>Number of questions</span>
          <output className={styles.questionCount} htmlFor="question-count">{questionCount}</output>
        </label>
        <input
          className={styles.questionSlider}
          id="question-count"
          type="range"
          min={3}
          max={30}
          step={1}
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
          aria-valuetext={`${questionCount} questions`}
        />
        <p className={styles.questionHint}>Choose 3–30 questions. The prompt will include all three question types.</p>
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
