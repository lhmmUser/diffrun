'use client'

import { JSX, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type FAQItem = {
  id: string
  question: string
  answer: string | JSX.Element
}

export default function FAQClient({ items }: { items: FAQItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <main className="bg-white py-0 sm:py-10 md:py-20">
      <div className="mx-auto max-w-7xl px-3 md:px-0 space-y-8">
        <div className="text-left pb-6">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-medium tracking-tight text-gray-800 font-libre">
            Frequently Asked Questions
          </h1>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl shadow-md transition-shadow duration-300 bg-white"
            >
              <button
                className={`w-full text-left px-6 py-4 focus:outline-none`}
                onClick={() => setActiveId(activeId === item.id ? null : item.id)}
                aria-expanded={activeId === item.id}
                aria-controls={`faq-answer-${item.id}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-900 font-poppins">{item.question}</span>
                  <motion.svg
                    className="w-5 h-5 text-gray-800"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    animate={{ rotate: activeId === item.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                </div>
              </button>
              <AnimatePresence>
                {activeId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="overflow-hidden"
                  >
                    <div
                      id={`faq-answer-${item.id}`}
                      className="p-6 pt-2 text-gray-700 text-left font-poppins"
                    >
                      {typeof item.answer === 'string' ? (
                        <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                      ) : (
                        item.answer
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="bg-[#f7f6cf] p-6 text-center rounded-lg space-y-4 shadow-md mb-6">
          <h2 className="text-xl font-libre text-gray-800">Still need help?</h2>
          <p className="text-sm sm:text-base text-gray-700 font-poppins">
            Have a question or need assistance with your order? Just respond to our emails{' '}
            <Link
              href="mailto:support@diffrun.com"
              className="underline text-[#5784ba] transition-colors"
              rel="noopener noreferrer"
            >
              support@diffrun.com
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}