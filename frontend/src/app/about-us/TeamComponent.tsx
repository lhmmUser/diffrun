"use client"

import { motion } from "framer-motion"
import { teamMembers } from "@/data/team"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

export default function TeamComponent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <motion.div initial="hidden" animate="visible" variants={headerVariants} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="text-blue-600 text-sm md:text-base font-medium tracking-wide uppercase">Our Team</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Meet our Team
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-600 mb-8"
          >
            Passionate. Proactive. Expert.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            Diffrun is a personalized children’s book brand that transforms your child into the star of their own story.
            From thrilling space missions to inspiring future careers and alphabet adventures, every book is custom-made with your child’s name, personality, and dreams at the center. Designed to spark joy, boost confidence, and create lasting memories, Diffrun books are more than stories—they're keepsakes.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3 },
              }}
              className="text-center group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="relative mb-6 mx-auto w-32 h-32 sm:w-36 sm:h-36"
              >
                <div className="absolute rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={`Diffrun personalized books - ${member.name}`}
                  className="w-full h-full rounded-full object-cover border-4 border-gray-100 group-hover:border-gray-200 transition-all duration-300 shadow-md"
                />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-black transition-colors duration-300"
              >
                {member.name}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="text-gray-600 text-sm font-medium group-hover:text-gray-800 transition-colors duration-300"
              >
                {member.role}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}