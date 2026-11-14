'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FlaskConical } from 'lucide-react';
import { sampleQuiz } from '@/lib/guideContent';
import styles from './Guide.module.css';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function copy() {
    setError('');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        try {
          field.select();
          if (!document.execCommand('copy')) throw new Error('The browser did not allow copying.');
        } finally {
          field.remove();
        }
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      setCopied(false);
      setError(copyError instanceof Error ? copyError.message : 'Copying is not available in this browser.');
    }
  }

  return (
    <div className={styles.copyControl}>
      <button className={styles.copyButton} type="button" onClick={copy} aria-label={copied ? 'Copied to clipboard' : 'Copy text'}>
        <span aria-live="polite" className={styles.copyButtonContent}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </span>
      </button>
      {error && <span className={styles.copyError} role="alert">{error}</span>}
    </div>
  );
}

export function LoadSampleButton() {
  const router = useRouter();
  const [error, setError] = useState('');

  function load() {
    setError('');
    try {
      window.sessionStorage.setItem('quizpaste_prefill', sampleQuiz);
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : 'Session storage is unavailable.');
      return;
    }
    router.push('/');
  }

  return (
    <div>
      <button className={styles.loadButton} type="button" onClick={load}>
        <FlaskConical size={16} /> Load sample quiz
      </button>
      {error && <p className={styles.loadError} role="alert">Could not load the sample quiz: {error}</p>}
    </div>
  );
}
