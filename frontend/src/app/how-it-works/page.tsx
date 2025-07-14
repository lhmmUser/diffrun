'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Tell us about your child',
      description: 'Share their name, gender, and a few clear photos to get started.',
    },
    {
      number: 2,
      title: 'Smart face recreation',
      description: ' We use advanced AI to create vector embeddings of their face and recreate it on each story page with realistic context.',
    },
    {
      number: 3,
      title: 'Instant sample preview',
      description: 'Get a free preview of the first 10 pages to see how well the personalization works.',
    },
    {
      number: 4,
      title: 'Unlock and refine',
      description: 'Once you make a purchase, the full book is unlocked. You can also fine-tune any face generations as needed.',
    },
    {
      number: 5,
      title: 'Approve for print',
      description: 'Review the complete book and approve it when you’re fully satisfied.',
    },
    {
      number: 6,
      title: 'Delivered to your door',
      description: 'Your storybook is printed on premium 200GSM glossy paper and shipped to your doorstep in about 7 days.',
    }
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white py-10 sm:py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-gray-900 font-libre">
            How It Works
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-poppins">
            A simple guide to getting started and making the most of our platform.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-col-reverse lg:flex-row gap-10 items-center">
     
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full lg:w-1/2"
          >
            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="relative pl-14"
                >
                  <dt className="text-lg sm:text-xl font-medium font-libre text-gray-800">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#5784ba] text-white">
                      {step.number}
                    </div>
                    {step.title}
                  </dt>
                  <dd className="text-sm sm:text-base font-poppins text-gray-600">
                    {step.description}
                  </dd>
                </motion.div>
              ))}
            </div>
            <div className='p-4 mt-8 ml-8'>
              <Link
              href="/books"
              className="px-8 py-2.5 rounded-xl bg-[#5784ba] text-sm sm:text-base font-medium text-white shadow-sm hover:bg-[#4a6f8f] transition-colors"
            >
              Get Started
            </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-sm sm:max-w-md md:max-w-lg aspect-[1/1] rounded-xl overflow-hidden shadow-lg lg:w-1/2"
          >
            <iframe
              className="w-full h-full"
              src="https://youtube.com/embed/eDfK4Xyl69A?si=-xBJa3z3DXsQ2_z3"
              title="Diffrun | How It Works Guide Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </motion.div>
        </div>
        
      </div>
    </motion.section>
  )
}

export default HowItWorks