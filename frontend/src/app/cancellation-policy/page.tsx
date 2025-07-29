import React from 'react';

const CancellationPolicy: React.FC = () => {
  return (
    <div className="h-[80vh] text-gray-800 antialiased">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-900 flex items-center justify-center gap-2 mb-4">
          🚫 Cancellation Policy
        </h1>
        <p className="text-sm text-gray-500 text-center mb-10">Last updated: April 5, 2025</p>

        {/* Policy Sections */}
        <section className="policy-section mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-1 border-gray-200">
            Understanding Our Cancellation Policy
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We understand that plans can change. You may cancel your order{' '}
            <strong className="font-medium text-gray-900">after 12 hours of payment</strong>, provided the book has not yet been sent for printing.
          </p>
        </section>

        <section className="policy-section mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-1 border-gray-200">
            How to Cancel Your Order
          </h2>
          <p className="text-gray-700 leading-relaxed">
            To request a cancellation, please reach out to us via email at{' '}
            <a
              href="mailto:support@diffrun.com"
              className="text-blue-600 hover:underline font-medium"
            >
              support@diffrun.com
            </a>{' '}
            with your order number and a brief reason for cancellation. Our team will review your request and confirm if the book has already entered the printing process.
          </p>
        </section>

        <section className="policy-section mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b pb-1 border-gray-200">
            Refunds
          </h2>
          <p className="text-gray-700 leading-relaxed">
            If your cancellation is approved, a full refund will be issued to your original method of payment. Please allow up to 5–7 business days for the refund to reflect in your account.
          </p>
        </section>

        {/* Contact Section */}
        <section className="policy-contact mt-10 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-700">
            Contact us at{' '}
            <a
              href="mailto:support@diffrun.com"
              className="text-blue-600 hover:underline font-medium"
            >
              support@diffrun.com
            </a>{' '}
            for any questions or assistance regarding cancellations.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CancellationPolicy;