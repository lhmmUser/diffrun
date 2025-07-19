"use client";

import React from "react";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full text-gray-900 bg-white px-4 sm:px-6 lg:px-8 py-16 font-poppins"
    >
      <div className="max-w-5xl px-4 sm:px-6 lg:px-8 py-16 mx-auto">

        <h1 className="text-4xl sm:text-5xl font-extrabold font-libre mb-10 text-left tracking-tight">Privacy Policy</h1>

        <p className="mb-8 text-base sm:text-lg leading-relaxed">
          At <strong>Diffrun</strong>, your privacy matters to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our platform to create personalized storybooks for children.
        </p>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">1. Information We Collect</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Child’s name and gender</li>
            <li>Uploaded images of the child (if provided)</li>
            <li>Parent or guardian's email address</li>
            <li>Order details including delivery and payment status (via Shopify or PayPal)</li>
            <li>IP address and location (for compliance purposes)</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">2. How We Use Your Information</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To generate and personalize the storybook and illustrations</li>
            <li>To process your order and provide delivery updates</li>
            <li>To ensure secure payment and fraud prevention</li>
            <li>To improve user experience, design, and performance</li>
            <li>To comply with legal and regulatory requirements</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">3. Legal Basis for Processing</h2>
          <p>
            We process your personal data based on your consent, our legitimate interests in providing a seamless experience, and in some cases, to fulfill contractual obligations related to your order.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">4. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill your order and provide after-sales support. After that, data may be anonymized and used solely for analytics or improvement of our services.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">5. Sharing with Third Parties</h2>
          <p>
            We only share your information with trusted partners such as:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Payment processors (e.g., PayPal, Razorpay)</li>
            <li>Order fulfillment platforms (e.g., Shopify)</li>
            <li>Cloud hosting and image generation services</li>
          </ul>
          <p>
            These services are bound by strict confidentiality and data security standards.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">6. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Access your personal data</li>
            <li>Request correction or deletion</li>
            <li>Withdraw consent at any time</li>
            <li>Raise concerns with a data protection authority</li>
          </ul>
          <p>
            To exercise your rights, contact us at{" "}
            <a
              href="mailto:support@diffrun.com"
              className="underline decoration-[3px] underline-offset-4 text-blue-700 hover:text-blue-900"
            >
              support@diffrun.com
            </a>.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">7. Data Security</h2>
          <p>
            We implement strict security measures including encryption, secure file storage, and limited access to personal data. We never sell or rent your data to third parties.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">8. Children’s Privacy</h2>
          <p>
            Diffrun is intended for parents and guardians. We do not knowingly collect personal data directly from children. All information must be submitted by a consenting adult.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">9. International Data Transfers</h2>
          <p>
            If you are accessing Diffrun from outside India, please note that your data may be transferred to and processed in India or other countries where our infrastructure or partners are located.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">10. Changes to This Policy</h2>
          <p>
            We may revise this Privacy Policy from time to time. Updates will be posted here with a revised “Effective Date.” Please check back regularly.
          </p>
        </section>

        <p className="text-sm mt-12 text-gray-500 text-center">Effective Date: March 7, 2025</p>
      </div>
    </motion.main>
  );
};

export default PrivacyPolicy;