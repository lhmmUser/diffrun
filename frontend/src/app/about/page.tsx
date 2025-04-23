"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";

const About: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-[#FFF9E6] text-black font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1"
          >
            <h1 className="text-[56px] md:text-[72px] font-bold mb-6 leading-tight tracking-tight">
              <span className="border-b-4 border-black pb-2">Transform</span>{" "}
              Your Photos into <br />
              <span className="text-[#8c0000] bg-[#ffdede] px-3 py-1">Interactive Storybooks</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-medium tracking-wide">
              Candyman turns your memories into magical, interactive experiences
              with AI-powered storytelling.
            </p>
            <Link href="/books">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-black text-white px-8 py-4 text-lg font-bold rounded-[30px] shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] transition-all duration-200"
              >
                Get Started →
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            ref={ref}
            initial={{ x: 100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="order-1 md:order-2 mb-8 md:mb-0"
          >
            <img
              src="/about.png"
              alt="Candyman interface mockup"
              width={1000}
              height={1000}
              className="w-full md:w-auto h-auto ml-0 lg:ml-20"
            />
          </motion.div>
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#232323] tracking-tighter"
          >
            Why Choose Diffrun?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((feature) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + feature * 0.2 }}
                className="p-6 bg-[#FFF9E6] rounded-2xl border-2 border-black shadow-[8px_8px_0_black]"
              >
                <div className="w-16 h-16 bg-[#ff8989] rounded-full flex items-center justify-center mb-4 mx-auto shadow-[6px_6px_0_black]">
                  {feature === 1 && "📸"}
                  {feature === 2 && "🧠"}
                  {feature === 3 && "📚"}
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-wide">
                  {feature === 1 && "Turn Photos into Stories"}
                  {feature === 2 && "AI-Powered Creativity"}
                  {feature === 3 && "Order Printed Books"}
                </h3>
                <p className="text-lg font-medium tracking-wide">
                  {feature === 1 && "Upload photos, get magical storybooks"}
                  {feature === 2 && "Advanced AI creates unique narratives"}
                  {feature === 3 && "Beautiful printed copies delivered"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-black text-white text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter"
        >
          Ready to Create Magic?
        </motion.h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#FFD700] text-black px-10 py-5 text-xl font-bold rounded-[30px] shadow-[8px_8px_0_black] mt-4 border-2 border-black"
        >
          <Link href="/">
            Upload Your First Photo
          </Link>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default About;