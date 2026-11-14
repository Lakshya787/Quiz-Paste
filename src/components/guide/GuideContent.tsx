import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDot,
  ClipboardPaste,
  Eye,
  FileUp,
  ListChecks,
  RotateCcw,
  SlidersHorizontal,
  ToggleLeft,
  Trash2,
  X,
} from 'lucide-react';
import { multiExample, singleExample, trueFalseExample } from '@/lib/guideContent';
import { CopyButton, LoadSampleButton } from './GuideInteractive';
import PromptGenerator from './PromptGenerator';
import styles from './Guide.module.css';

export function GuideSection({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}><span className={styles.sectionIcon}>{icon}</span>{title}</h2>
      {children}
    </section>
  );
}

export function StepCard({
  number,
  icon,
  title,
  children,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className={styles.stepCard}>
      <span className={styles.stepNumber} aria-hidden="true">{number}</span>
      <span className={styles.stepIcon} aria-hidden="true">{icon}</span>
      <div className={styles.stepBody}>
        <h3 className={styles.stepTitle}>{title}</h3>
        {children}
      </div>
    </article>
  );
}

export function CodeBlock({
  label,
  badge,
  kind,
  text,
}: {
  label: string;
  badge: string;
  kind: 'single' | 'tf' | 'multi';
  text: string;
}) {
  const badgeClass = kind === 'single' ? styles.singleBadge : kind === 'tf' ? styles.tfBadge : styles.multiBadge;
  return (
    <article className={styles.codeCard}>
      <div className={styles.codeHeader}>
        <span className={`${styles.typeBadge} ${badgeClass}`}>{badge}</span>
        <span className={styles.codeLabel}>{label}</span>
        <CopyButton text={text} />
      </div>
      <pre className={styles.codeText}><code>{text}</code></pre>
    </article>
  );
}

export function Callout({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className={styles.callout}>
      <div className={styles.calloutTitle}>{icon}<strong>{title}</strong></div>
      <p className={styles.calloutText}>{children}</p>
    </aside>
  );
}

export function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className={styles.faqItem}>
      <summary className={styles.faqSummary}>
        {question}
        <ChevronDown className={styles.faqChevron} size={16} aria-hidden="true" />
      </summary>
      <p className={styles.faqAnswer}>{children}</p>
    </details>
  );
}

export function GuideContent() {
  return (
    <main id="top" className={styles.guide}>
      <header className={styles.topNav}>
        <Link className={styles.brand} href="/">
          <img src="/icon.ico" width={28} height={28} alt="" aria-hidden="true" />
          <span>QuizPaste</span>
        </Link>
        <Link className={styles.backLink} href="/"><ArrowLeft size={15} /> Back to app</Link>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>A FIELD GUIDE FOR YOUR NEXT STUDY SESSION</p>
        <h1 className={styles.heroTitle}>How to use QuizPaste</h1>
        <p className={styles.tagline}>// upload notes → ask an AI → paste → quiz</p>
        <p className={styles.intro}>Turn any study material into a quiz in under a minute. Everything stays in your browser.</p>
      </section>

      <nav className={styles.toc} aria-label="On this page">
        <a className={styles.tocLink} href="#generate">Generate a quiz</a>
        <a className={styles.tocLink} href="#format">Question format</a>
        <a className={styles.tocLink} href="#scoring">Scoring</a>
        <a className={styles.tocLink} href="#history">History</a>
        <a className={styles.tocLink} href="#faq">FAQ</a>
      </nav>

      <GuideSection id="generate" icon={<SlidersHorizontal size={19} />} title="Generate a quiz from your material">
        <p className={styles.sectionText}>Use any AI chat that accepts file uploads. Set the mix and number of questions, then give the AI the generated prompt.</p>
        <div className={styles.stepList}>
          <StepCard number={1} icon={<FileUp size={18} />} title="Upload your study material to any LLM">
            <p className={styles.stepDescription}>Open ChatGPT, Claude, Gemini, or another AI chat. Upload your notes, PDF, slides, or photos of textbook pages.</p>
          </StepCard>
          <StepCard number={2} icon={<SlidersHorizontal size={18} />} title="Choose your quiz, then paste this prompt">
            <p className={styles.stepDescription}>Set the number of questions for each type. Copy the prompt and send it in the same chat as your uploaded material.</p>
            <div className={styles.stepContent}><PromptGenerator /></div>
          </StepCard>
          <StepCard number={3} icon={<ClipboardPaste size={18} />} title="Paste the result into QuizPaste">
            <p className={styles.stepDescription}>Copy the AI&apos;s questions, open the Paste tab, and paste them in. Check that the green preview shows the number of questions you requested, then press <strong>START</strong>.</p>
          </StepCard>
        </div>
      </GuideSection>

      <GuideSection id="format" icon={<ClipboardPaste size={19} />} title="The question format">
        <p className={styles.sectionText}>Each question needs a number, at least two options, and at least one correct option marked with an asterisk.</p>
        <ol className={styles.rules}>
          <li>Start questions with a number, followed by a period or parenthesis: <code>1.</code> or <code>1)</code>.</li>
          <li>Put each option on its own line and label choices <code>A)</code> through <code>F)</code>.</li>
          <li>Put <code>*</code> at the end of every correct option. One asterisk makes a single-answer question; two or more make a multi-select question with partial credit.</li>
          <li>Use only <code>T)</code> and <code>F)</code> options for true/false questions.</li>
          <li>Blank lines are ignored.</li>
        </ol>
        <div className={styles.codeGrid}>
          <CodeBlock kind="single" badge="SINGLE" label="One correct answer" text={singleExample} />
          <CodeBlock kind="tf" badge="TRUE / FALSE" label="Two statements" text={trueFalseExample.replace(/^2\./, '1.')} />
          <CodeBlock kind="multi" badge="MULTI-SELECT" label="More than one correct answer" text={multiExample.replace(/^3\./, '1.')} />
        </div>
        <div className={styles.loadPanel}>
          <p className={styles.loadText}>Want to try it first? Load a sample with one question of each type into the Paste tab.</p>
          <LoadSampleButton />
        </div>
      </GuideSection>

      <GuideSection icon={<CircleCheck size={19} />} title="Taking the quiz">
        <div className={styles.infoRows}>
          <div className={styles.infoRow}><Check className={styles.infoIcon} size={17} /><span><strong>Select an answer and press CHECK.</strong> Correct answers are marked green, incorrect selections red, and correct answers you missed orange.</span></div>
          <div className={styles.infoRow}><ArrowRight className={styles.infoIcon} size={17} /><span><strong>Navigate at your pace.</strong> Move between questions, then submit when you are ready to see your result and review.</span></div>
          <div className={styles.infoRow}><ListChecks className={styles.infoIcon} size={17} /><span><strong>For multi-select, choose every answer that applies.</strong> Selecting only some correct options and no incorrect ones earns partial credit.</span></div>
        </div>
      </GuideSection>

      <GuideSection id="scoring" icon={<CircleDot size={19} />} title="Scoring">
        <div className={styles.scoreChips}>
          <span className={`${styles.scoreChip} ${styles.scoreCorrect}`}>Correct = 1</span>
          <span className={`${styles.scoreChip} ${styles.scorePartial}`}>Partial = ½</span>
          <span className={`${styles.scoreChip} ${styles.scoreWrong}`}>Wrong / Skipped = 0</span>
        </div>
        <p className={styles.formula}>Score % = (correct + ½ × partial) ÷ total × 100</p>
        <p className={styles.workedExample}>7 correct, 2 partial, 1 wrong out of 10 → (7 + 1) / 10 = 80%</p>
        <p className={styles.sectionText}>A score of <strong>60% or above is a PASS.</strong></p>
      </GuideSection>

      <GuideSection id="history" icon={<Eye size={19} />} title="Your history">
        <div className={styles.infoRows}>
          <div className={styles.infoRow}><Eye className={styles.infoIcon} size={17} /><span><strong>Review</strong> a past result and revisit each question and answer.</span></div>
          <div className={styles.infoRow}><RotateCcw className={styles.infoIcon} size={17} /><span><strong>Retest</strong> yourself on the same questions with fresh answers.</span></div>
          <div className={styles.infoRow}><Trash2 className={styles.infoIcon} size={17} /><span><strong>Delete one result or clear history</strong> whenever you like.</span></div>
        </div>
        <p className={styles.sectionText}>Quiz history is saved only in this browser on this device. It is not synced or uploaded.</p>
      </GuideSection>

      <GuideSection icon={<AlertTriangle size={19} />} title="Common mistakes">
        <div className={styles.mistakes}>
          <div className={styles.mistake}><span className={styles.badExample}>What is 2+2?</span><X className={styles.badExample} size={15} /><span className={styles.goodExample}>1. What is 2+2?</span></div>
          <div className={styles.mistake}><span className={styles.badExample}>B) 4</span><X className={styles.badExample} size={15} /><span className={styles.goodExample}>B) 4 *</span></div>
          <div className={styles.mistake}><span className={styles.badExample}>Q1: What is 2+2? / 1 - What is 2+2?</span><X className={styles.badExample} size={15} /><span className={styles.goodExample}>1. What is 2+2?</span></div>
          <div className={styles.mistake}><span className={styles.badExample}>A) 2  B) 3 *</span><X className={styles.badExample} size={15} /><span className={styles.goodExample}>A) 2<br />B) 3 *</span></div>
        </div>
        <Callout icon={<AlertTriangle size={15} />} title="Check the preview count">
          Questions with fewer than two options or no correct answer are skipped silently. Always check the preview count before starting.
        </Callout>
      </GuideSection>

      <GuideSection id="faq" icon={<ChevronDown size={19} />} title="Frequently asked questions">
        <div className={styles.faqList}>
          <FaqItem question="Is my data uploaded anywhere?">QuizPaste does not upload your notes. Results are saved in localStorage in this browser; you choose what material to upload directly to your AI provider.</FaqItem>
          <FaqItem question="Which AI should I use?">Any AI chat that accepts file uploads works, including ChatGPT, Claude, Gemini, or another service you prefer.</FaqItem>
          <FaqItem question="Can I mix question types?">Yes. The prompt generator can request single-answer, true/false, and multi-select questions in the same quiz.</FaqItem>
          <FaqItem question="Can I edit questions after starting?">Not in the active quiz. Return to Paste, edit the questions, and start again.</FaqItem>
          <FaqItem question="How many options can a question have?">Use two to six options labeled A) through F). True/false questions use T) and F).</FaqItem>
          <FaqItem question="Why was a question skipped?">Check the Common mistakes section and the preview count. Questions need at least two options and one marked correct answer.</FaqItem>
          <FaqItem question="What if the AI adds explanations or markdown?">Delete the extra text or run the prompt again. The prompt asks the AI to return only questions in the required plain-text format.</FaqItem>
        </div>
      </GuideSection>

      <footer className={styles.footerCta}>
        <p className={styles.footerText}>A small step closer to knowing it by heart.</p>
        <Link className={styles.startButton} href="/"><span>Start a quiz</span><ArrowRight size={17} /></Link>
        <a className={styles.backTop} href="#top">Back to top <ArrowUp size={14} /></a>
      </footer>
    </main>
  );
}
