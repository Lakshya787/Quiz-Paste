import type { Metadata } from 'next';
import { GuideContent } from '@/components/guide/GuideContent';

export const metadata: Metadata = {
  title: 'How to use · QuizPaste',
  description: 'Learn how to turn your study material into a QuizPaste quiz with an AI prompt, clear question formats, and helpful scoring.',
};

export default function GuidePage() {
  return <GuideContent />;
}
