'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const HowItWorks = () => {
  const steps = [
  {
    number: 1,
    title: 'Upload Child’s Photos',
    description: 'Easily upload your child’s photos which will be used to create personalized storybooks.',
    image: '/images/how-it-works-1.jpg',
  },
  {
    number: 2,
    title: 'Advanced Face Detection & Analysis',
    description: 'We analyze facial landmarks, head orientation, and identity embeddings to accurately map your child’s face onto storybook characters.',
    image: '/images/how-it-works-2.jpg',
  },
  {
    number: 3,
    title: 'AI Image Generation with ComfyUI',
    description: 'Using advanced AI workflows on our own servers, we seamlessly blend your child’s face into fantasy scenes — creating unique, high-quality storybook pages.',
    image: '/images/how-it-works-3.jpg',
  },
  {
    number: 4,
    title: 'Privacy-First Processing',
    description: 'All processing is done locally on our servers without any external API. Uploaded images are automatically deleted after 3 days. Your child’s images are never used for model training.',
    image: '/images/how-it-works-4.jpg',
  }
];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white py-16"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900">How It Works</h1>
          <p className="mt-4 text-lg text-gray-600">A simple guide to getting started and making the most of our platform.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-8"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#5784ba] text-white flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src="/blog1.jpg"
              alt="How it works visual"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-semibold text-gray-900">Ready to get started?</h2>
          <p className="mt-2 text-gray-600">Join thousands of users who are already transforming their workflow.</p>
          <Link
            href="/books"
            className="mt-6 inline-block bg-[#5784ba] text-white px-6 py-3 rounded-md hover:bg-[#4a6f8f] transition-colors"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default HowItWorks