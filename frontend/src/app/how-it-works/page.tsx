'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Upload Child’s Photos',
      description: 'Easily upload your child’s photos which will be used to create personalized storybooks.',
    },
    {
      number: 2,
      title: 'Advanced Face Detection & Analysis',
      description: 'We analyze facial landmarks, head orientation, and identity embeddings to accurately map your child’s face onto storybook characters.',
    },
    {
      number: 3,
      title: 'AI Image Generation with ComfyUI',
      description: 'Using advanced AI workflows on our own servers, we seamlessly blend your child’s face into fantasy scenes — creating unique, high-quality storybook pages.',
    },
    {
      number: 4,
      title: 'Privacy-First Processing',
      description: 'All processing is done locally on our servers without any external API. Uploaded images are automatically deleted after 3 days. Your child\'s images are never used for model training.',
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
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 font-libre">
            How It Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 font-poppins">
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
            <div className="flex flex-col gap-8">
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
                  <dd className="mt-2 text-sm sm:text-base font-poppins text-gray-600">
                    {step.description}
                  </dd>
                </motion.div>
              ))}
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

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-xl sm:text-2xl font-semibold font-libre text-gray-900">
            Ready to get started?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 font-poppins">
            Join thousands of users who are already transforming their workflow.
          </p>
          <div className="mt-6">
            <Link
              href="/books"
              className="inline-flex items-center rounded-xl bg-[#5784ba] px-6 sm:px-8 py-3 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-[#4a6f8f] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
        
      </div>
    </motion.section>
  )
}

export default HowItWorks