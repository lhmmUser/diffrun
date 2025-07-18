'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { step } from '@/data/data'

const HowItWorks = () => {

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
              {step.map((step, index) => (
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
            className="w-full max-w-lg md:max-w-xl aspect-[1/1] rounded-xl overflow-hidden shadow-lg lg:w-1/2 md:mb-10"
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube-nocookie.com/embed/eDfK4Xyl69A?si=-xBJa3z3DXsQ2_z3"
              title="Diffrun | How It Works Guide Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading='lazy'
            />
          </motion.div>
        </div>
        
      </div>
    </motion.section>
  )
}

export default HowItWorks