'use client';

import { useMemo, useState } from 'react';
import { CircleDot, ListChecks, ToggleLeft } from 'lucide-react';
import { buildPrompt, type PromptCounts } from '@/lib/guideContent';
import { CopyButton } from './GuideInteractive';
import styles from './PromptGenerator.module.css';

const controls = [
  { key: 'single', label: 'Single answer (MCQ)', description: 'One correct option', icon: CircleDot },
  { key: 'tf', label: 'True / False', description: 'Choose the accurate statement', icon: ToggleLeft },
  { key: 'multi', label: 'Multi-select', description: 'Two or more correct options', icon: ListChecks },
] as const;

export default function PromptGenerator() {
  const [counts, setCounts] = useState<PromptCounts>({ single: 5, tf: 3, multi: 2 });
  const prompt = useMemo(() => buildPrompt(counts), [counts]);
  const total = counts.single + counts.tf + counts.multi;

  function updateCount(key: keyof PromptCounts, value: number) {
    setCounts((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className={styles.generator}>
      <div className={styles.sliderList}>
        {controls.map(({ key, label, description, icon: Icon }) => {
          const inputId = `prompt-count-${key}`;
          return (
            <div className={styles.sliderRow} key={key}>
              <div className={styles.sliderHeading}>
                <Icon size={17} aria-hidden="true" />
                <div className={styles.sliderLabel}>
                  <label htmlFor={inputId}>{label}</label>
                  <span>{description}</span>
                </div>
                <output className={styles.countBadge} htmlFor={inputId}>{counts[key]}</output>
              </div>
              <input
                className={styles.range}
                id={inputId}
                type="range"
                min={0}
                max={30}
                step={1}
                value={counts[key]}
                onChange={(event) => updateCount(key, Number(event.currentTarget.value))}
              />
            </div>
          );
        })}
      </div>

      <p className={styles.total} aria-live="polite">
        Total: <strong>{total}</strong> {total === 1 ? 'question' : 'questions'}
      </p>

      {total > 0 ? (
        <div className={styles.promptPanel}>
          <div className={styles.promptHeader}>
            <span>Generated prompt</span>
            <CopyButton text={prompt} />
          </div>
          <pre className={styles.prompt} tabIndex={0} aria-label="Generated AI quiz prompt"><code>{prompt}</code></pre>
        </div>
      ) : (
        <p className={styles.emptyPrompt} role="status">Move at least one slider above 0 to generate a prompt.</p>
      )}
    </div>
  );
}
