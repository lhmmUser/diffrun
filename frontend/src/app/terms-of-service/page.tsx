"use client";

import React from "react";
import { motion } from "framer-motion";

const TermsOfService = () => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full px-4 sm:px-6 lg:px-8 py-10 bg-gray-100" 
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-gray-900 bg-white border-4 border-black rounded-[1.5rem] shadow-[8px_8px_0px_rgba(0,0,0,1)]">

      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-center tracking-tight">Terms of Service</h1>

      <p className="mb-8 text-base sm:text-lg leading-relaxed">
        Welcome to <strong>Diffrun</strong>! These Terms of Service govern your access to and use of our platform, where you can create personalized storybooks featuring your child.
      </p>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">1. Acceptance of Terms</h2>
        <p>
          By using our platform, you agree to comply with these Terms. If you do not agree, please do not use Diffrun.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">2. Storybook Creation</h2>
        <p>
          You are responsible for providing accurate details (e.g., name, gender, images) when creating a personalized storybook. Content is generated using AI and may be subject to minor variations.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">3. Order & Payment</h2>
        <p>
          Orders are processed through Shopify. Prices are listed in your local currency where applicable. Your payment is securely handled by third-party providers.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">4. Approval & Delivery</h2>
        <p>
          After payment, you can preview and refine your storybook. If no manual approval is submitted within 12 hours, your book will be auto-approved for printing. Delivery is estimated within 7–8 working days.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">5. Refunds & Modifications</h2>
        <p>
          Since each storybook is made-to-order and personalized, we do not offer refunds once an order has been approved or auto-approved. Please review carefully before submitting.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">6. Intellectual Property</h2>
        <p>
          All generated illustrations and text remain the intellectual property of Diffrun and may not be resold or redistributed without permission.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">7. User Conduct</h2>
        <p>
          You agree not to use Diffrun for any unlawful or harmful activity, including but not limited to uploading offensive or infringing content.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">8. Updates to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of Diffrun constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">9. Contact Us</h2>
        <p>
          If you have any questions about these Terms, email us at{' '}
          <a
            href="mailto:support@diffrun.com"
            className="underline decoration-[3px] underline-offset-4 text-blue-700 hover:text-blue-900"
          >
            support@diffrun.com
          </a>
          .
        </p>
      </section>

      <p className="text-sm mt-12 text-gray-500 text-center">Effective Date: April 9, 2025</p>
      </div>
    </motion.main>
  );
};

export default TermsOfService;