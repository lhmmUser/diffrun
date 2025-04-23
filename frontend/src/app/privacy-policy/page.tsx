"use client";

import React from "react";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full text-gray-900 bg-gray-100 px-4 sm:px-6 lg:px-8 py-16"
    >
    <div className="max-w-3xl px-4 sm:px-6 lg:px-8 py-16 border-4 bg-white mx-auto border-black rounded-[1.5rem] shadow-[8px_8px_0px_rgba(0,0,0,1)]">

      <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 text-center tracking-tight">Privacy Policy</h1>

      <p className="mb-8 text-base sm:text-lg leading-relaxed">
        At <strong>Diffrun</strong>, we deeply value your privacy. This Privacy Policy outlines how we collect, use,
        and protect your personal data when you use our platform to create personalized storybooks.
      </p>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">1. Information We Collect</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Child’s name, gender, and selected story details</li>
          <li>Uploaded images (optional)</li>
          <li>Parent/guardian’s name, email address, and contact number</li>
          <li>Order-related information via Shopify</li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">2. How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>To generate and personalize storybook content and illustrations</li>
          <li>To contact you with updates about your order or storybook status</li>
          <li>To fulfill and ship your order using third-party services (e.g., Shopify)</li>
          <li>To improve our product and user experience</li>
        </ul>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">3. Data Retention</h2>
        <p>
          We retain your data for as long as necessary to fulfill your order and provide customer support. After that,
          we may anonymize your data for analytical purposes.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">4. Third-Party Services</h2>
        <p>
          We integrate with secure third-party platforms like Shopify for payments and order processing. Your payment
          information is not stored by us.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">5. Your Rights</h2>
        <p>
          You can request to access, update, or delete your personal data at any time by contacting us at{' '}
          <a
            href="mailto:support@diffrun.com"
            className="underline decoration-[3px] underline-offset-4 text-blue-700 hover:text-blue-900"
          >
            support@diffrun.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">6. Data Security</h2>
        <p>
          We follow industry best practices to secure your data during transmission and storage, including encryption
          and strict access controls.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">7. Children’s Privacy</h2>
        <p>
          Diffrun is designed with children in mind, but we only collect information from adults (parents/guardians)
          for the purpose of creating personalized content.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. All changes will be reflected on this page with a
          revised effective date.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-l-4 border-black pl-4">9. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, reach out to us at{' '}
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

export default PrivacyPolicy;