import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-2xl sm:text-5xl font-extrabold text-gray-800 mb-4 flex items-center justify-center gap-3">
          <span>💰</span> Price of the Books
        </h1>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Choose your region to see pricing in local currency. All prices include tax.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {/* India Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-gray-100">
            <div className="country-flag text-5xl mb-4">🇮🇳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">India</h2>
            <ul className="space-y-3 mb-6 text-left text-gray-700">
              <li className="flex items-center gap-2">
                <span>📄</span>
                <span>Paperback – <span className="font-semibold">₹1,450</span></span>
              </li>
              <li className="flex items-center gap-2">
                <span>📘</span>
                <span>Hardcover – <span className="font-semibold">₹1,950</span></span>
              </li>
            </ul>
            <p className="text-green-600 font-medium text-sm flex items-center justify-center gap-1">
              <span>🎯</span> Shipping included
            </p>
          </div>

          {/* United States Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-gray-100">
            <div className="country-flag text-5xl mb-4">🇺🇸</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">United States</h2>
            <ul className="space-y-3 mb-6 text-left text-gray-700">
              <li className="flex items-center gap-2">
                <span>📖</span>
                <span>Paperback – <span className="font-semibold">$19.32</span></span>
              </li>
              <li className="flex items-center gap-2">
                <span>📘</span>
                <span>Hardcover – <span className="font-semibold">$26.33</span></span>
              </li>
            </ul>
            <p className="text-orange-600 font-medium text-sm flex items-center justify-center gap-1">
              <span>🚚</span> Shipping: $7.99
            </p>
          </div>

          {/* United Kingdom Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-gray-100">
            <div className="country-flag text-5xl mb-4">🇬🇧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">United Kingdom</h2>
            <ul className="space-y-3 mb-6 text-left text-gray-700">
              <li className="flex items-center gap-2">
                <span>📖</span>
                <span>Paperback – <span className="font-semibold">£14.27</span></span>
              </li>
              <li className="flex items-center gap-2">
                <span>📘</span>
                <span>Hardcover – <span className="font-semibold">£19.46</span></span>
              </li>
            </ul>
            <p className="text-orange-600 font-medium text-sm flex items-center justify-center gap-1">
              <span>🚚</span> Shipping: £4.99
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;