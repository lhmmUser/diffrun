"use client";

import { motion } from 'framer-motion';

export default function Approved() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full flex justify-center items-center bg-gray-100 h-[80vh] px-4"
    >
      <div className="max-w-lg w-full p-8 text-center">

        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">
          Storybook is now being printed! ✨
        </h1>

        <p className="text-gray-700 mb-4 leading-relaxed">
          Great news! The storybook has been finalized and sent for printing.
        </p>

        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
          Please allow us 7–8 working days as all books are custom made to order.
        </h3>

        {/* Optional info block */}
        {/* <p className="mt-4 text-sm text-gray-500">
          Our system automatically finalizes the book 12 hours after payment to avoid delays in printing.
        </p> */}
      </div>
    </motion.div>
  );
}