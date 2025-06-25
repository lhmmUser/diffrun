'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { blogPosts } from '@/data/blog'

const Blogs = () => {
  
  return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="py-12 bg-white"
      >
        <div className="container px-4 md:px-14 mx-auto max-w-9xl">
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-2xl md:text-4xl text-left font-play font-bold text-gray-900">Blog Posts</h1>
            <p className="mt-4 text-sm md:text-lg text-left text-gray-600">Explore articles and tutorials about our products and services.</p>
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="shadow-md overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <img src={post.image} alt={post.title} width={400} height={250} className="w-full h-48 object-cover" />
                <div className="p-4 text-left">
                  <h2 className="text-xl font-libre font-medium text-gray-900">{post.title}</h2>
                  <p className="mt-2 text-gray-600 font-poppins font-medium">{post.excerpt}</p>
                  {/* <Link href={post.url} className="mt-4 inline-block text-blue-600 hover:underline">
                    Read More
                  </Link> */}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        </motion.section>
  )
}

export default Blogs