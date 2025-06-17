import React from 'react';

const CancellationPolicy: React.FC = () => {
  return (
    <div className="policy-container">
      <h1>🚫 Cancellation Policy</h1>
      <p className="last-updated">Last updated: April 5, 2025</p>

      <section className="policy-section">
        <h2>Understanding Our Cancellation Policy</h2>
        <p>
          We understand that plans can change. You may cancel your order <strong>after 12 hours of payment</strong>, provided the book has not yet been sent for printing.
        </p>
      </section>

      <section className="policy-section">
        <h2>How to Cancel Your Order</h2>
        <p>
          To request a cancellation, please reach out to us via email at{' '}
          <a href="mailto:support@example.com" className="email-link">
            support@example.com
          </a>{' '}
          with your order number and a brief reason for cancellation. Our team will review your request and confirm if the book has already entered the printing process.
        </p>
      </section>

      <section className="policy-section">
        <h2>Refunds</h2>
        <p>
          If your cancellation is approved, a full refund will be issued to your original method of payment. Please allow up to 5–7 business days for the refund to reflect in your account.
        </p>
      </section>

      <section className="policy-contact">
        <h3>Need Help?</h3>
        <p>
          Contact us at{' '}
          <a href="mailto:support@example.com" className="email-link">
            support@example.com
          </a>{' '}
          for any questions or assistance regarding cancellations.
        </p>
      </section>
    </div>
  );
};

export default CancellationPolicy;