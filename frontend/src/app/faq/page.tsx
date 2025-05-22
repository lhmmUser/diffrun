import { Metadata } from 'next'
import FAQClient from './faq-client'
import { faqData } from '@/data/data'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Diffrun',
  description:
    'Find answers to common questions about our photo books, pricing, shipping, and policies.',
}

export default function FAQPage() {
  return <main className='bg-white'>
      <FAQClient items={faqData} />
    </main>
}