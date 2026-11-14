'use client';

import { quizPrompt } from '@/lib/guideContent';
import { CopyButton } from './GuideInteractive';
import styles from './PromptGenerator.module.css';

export default function PromptGenerator() {
  return (
    <div className={styles.generator}>
      <div className={styles.promptPanel}>
        <div className={styles.promptHeader}>
          <span>Generated prompt</span>
          <CopyButton text={quizPrompt} />
        </div>
        <pre className={styles.prompt} tabIndex={0} aria-label="Generated AI quiz prompt"><code>{quizPrompt}</code></pre>
      </div>
    </div>
  );
}
