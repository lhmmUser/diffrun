"use client";

import React from "react";
import { motion } from "framer-motion";
import { useForm, SubmitHandler } from "react-hook-form";
import { useInView as useIntersectionObserver } from "react-intersection-observer";

type FormData = {
  name: string;
  email: string;
  message: string;
};

const Contact: React.FC = () => {
  const { ref, inView } = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("Form Data Submitted:", data);
    alert("Thank you for reaching out! We'll get back to you soon.");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gray-100 text-black font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold font-mono text-center mb-8 text-[#333]"
        >
          Let's Talk!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl font-serif text-center mb-12 text-[#555]"
        >
          Have questions or want to collaborate? We'd love to hear from you!
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
     
          <motion.div
            ref={ref}
            initial={{ x: -100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 p-6 bg-white rounded-lg shadow-[8px_8px_0_black] border-4 border-black"
            >
              <h2 className="text-3xl font-bold font-mono text-[#333] mb-4">
                Get in Touch
              </h2>

              <div>
                <label htmlFor="name" className="block text-lg font-bold mb-2 text-[#333]">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className="w-full px-4 py-3 rounded-md border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FF6B6B]"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1 font-bold">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-lg font-bold mb-2 text-[#333]">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full px-4 py-3 rounded-md border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FF6B6B]"
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1 font-bold">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-lg font-bold mb-2 text-[#333]">
                  Your Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  {...register("message", { required: "Message is required" })}
                  className="w-full px-4 py-3 rounded-md border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FF6B6B]"
                  placeholder="Tell us about your project..."
                ></textarea>
                {errors.message && (
                  <p className="text-red-600 text-sm mt-1 font-bold">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="bg-[#fa6666] text-white px-8 py-4 text-lg font-bold rounded-[10px] shadow-[4px_4px_0_black] hover:shadow-[6px_6px_0_black] transition-all duration-200 w-full"
              >
                Send Message →
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="order-1 md:order-2 space-y-6 text-center md:text-left"
          >
            <h2 className="text-3xl font-bold text-[#333] mb-4">Contact Us</h2>
            <div className="space-y-4">
             
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-2xl font-bold text-[#333]">📞</span>
                <span className="text-lg font-bold text-[#555]">+91 8954124805</span>
              </div>
            
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-2xl font-bold text-[#333]">✉️</span>
                <span className="text-lg font-bold text-[#555]">support@diffrun.com</span>
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-2xl font-bold text-[#333]">📍</span>
                <span className="text-lg font-bold text-[#555]">Bengaluru, India</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;