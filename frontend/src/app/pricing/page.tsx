import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="pricing-container">
      <h1>💰 Price of the Books</h1>
      <div className="pricing-cards">
        <div className="pricing-card">
          <div className="country-flag">🇮🇳 India</div>
          <ul>
            <li>Paperback – ₹1,450 📄</li>
            <li>Hardcover – ₹1,950 📘</li>
          </ul>
          <p className="shipping">Shipping included 🎯</p>
        </div>

        <div className="pricing-card">
          <div className="country-flag">🇺🇸 United States</div>
          <ul>
            <li>Paperback – $19.32 📖</li>
            <li>Hardcover – $26.33 📘</li>
          </ul>
          <p className="shipping">Shipping: $7.99 🚚</p>
        </div>

        <div className="pricing-card">
          <div className="country-flag">🇬🇧 United Kingdom</div>
          <ul>
            <li>Paperback – £14.27 📖</li>
            <li>Hardcover – £19.46 📘</li>
          </ul>
          <p className="shipping">Shipping: £4.99 🚚</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;