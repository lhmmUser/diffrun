"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';

interface FormData {
    email: string;
    name: string;
}

const EmailPreview: React.FC = () => {
    const [formState, setFormState] = useState<"form" | "thankYou">("form");
    const [formData, setFormData] = useState<FormData>({ email: "", name: "" });
    const searchParams = useSearchParams();
    const job_id = searchParams.get("job_id") || "";
    const name = searchParams.get("name") || "";
    const gender = searchParams.get("gender") || "";
    const job_type = searchParams.get("job_type") || "";
    const book_id = searchParams.get("book_id") || "";
    const selected = searchParams.get("selected") || "";
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
      
        const preview_url = `https://diffrun.com/preview?job_id=${job_id}&paid=false&approved=false&selected=${selected}&job_type=${job_type}&book_id=${book_id}&name=${name}&gender=${gender}`;
      
        try {
          const res = await fetch(`${apiBaseUrl}/send-mail`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: formData.name,
              name,
              email: formData.email,
              preview_url,
            }),
          });
      
          if (!res.ok) throw new Error("Failed to send email");
      
          setFormState("thankYou");
        } catch (error) {
          console.error("Email send error:", error);
          alert("Failed to send email. Please try again.");
        }
      };      

    return (
        <section className="py-10 h-[80vh] flex items-center justify-center px-4 bg-gray-100">
            <AnimatePresence mode="wait">
                {formState === "form" && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-lg p-6 sm:p-10 bg-white border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-black uppercase tracking-tight mb-10 text-center">
                            Request Email Preview
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="YOUR NAME"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                                className="p-4 border-[3px] border-black bg-gradient-to-r from-yellow-100 to-white text-black placeholder-black font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                            <input
                                type="email"
                                placeholder="YOUR EMAIL"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                required
                                className="p-4 border-[3px] border-black bg-gradient-to-r from-pink-100 to-white text-black placeholder-black font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                            <button
                                type="submit"
                                className="p-4 bg-black text-white uppercase font-bold text-lg border-[3px] border-black hover:bg-white hover:text-black transition-all duration-200 active:translate-y-1"
                            >
                                Submit
                            </button>
                        </form>
                    </motion.div>
                )}

                {formState === "thankYou" && (
                    <motion.div
                        key="thankYou"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-lg p-6 sm:p-10 bg-white border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all text-center"
                    >
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-green-700 uppercase mb-4">
                            Thank You!
                        </h2>
                        <p className="text-black font-medium mb-2">
                            We've received your request.
                        </p>
                        <p className="text-gray-700 mb-6">
                            You'll get your preview soon. Meanwhile, check out more stories:
                        </p>
                        <Link href="/" className="block w-full p-4 bg-black text-white text-lg uppercase font-bold border-[3px] border-black hover:bg-white hover:text-black transition-all duration-200 active:translate-y-1" passHref>
                            Go to Home Page
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default EmailPreview;