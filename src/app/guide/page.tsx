import type { Metadata } from 'next';
import { GuideContent } from '@/components/guide/GuideContent';

export const metadata: Metadata = {
  title: 'How to use · quizpaste',
  description: 'Learn how to turn your study material into a quizpaste quiz with an AI prompt, clear question formats, and helpful scoring.',
};

export default function GuidePage() {
  return <GuideContent />;
}
