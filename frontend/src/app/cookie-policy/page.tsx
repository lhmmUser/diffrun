import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-16 text-gray-800 ">
      <h1 className="text-3xl font-medium mb-4 font-libre">Cookie Policy</h1>

      <p className="mb-4">
        At Diffrun, we use cookies to improve your experience, personalize content, and offer you more relevant recommendations. This helps us better understand your preferences and deliver a smoother, more helpful experience across our platform.
      </p>

      <h2 className="text-xl font-medium mb-2 font-libre">What are cookies?</h2>
      <p className="mb-4">
        Cookies are small data files stored on your device when you visit a website. They help the website remember your actions and preferences over time, so you don't have to keep re-entering them whenever you return to the site.
      </p>

      <h2 className="text-xl font-medium mb-2 font-libre">Why we use cookies</h2>
      <ul className="list-disc pl-5 mb-4">
        <li>To improve site performance and user experience</li>
        <li>To remember your preferences and settings</li>
        <li>To provide personalized content and recommendations</li>
        <li>To analyze how our site is used so we can make it better</li>
        <li>To support marketing and advertising efforts tailored to your interests</li>
      </ul>

      <h2 className="text-xl font-medium mb-2 font-libre">Your choices</h2>
      <p className="mb-4">
        You can choose to accept or reject cookies when prompted. You can also manage or disable cookies through your browser settings at any time. Please note that disabling some cookies may affect how certain parts of our site function.
      </p>

      <h2 className="text-xl font-medium mb-2 font-libre">Need help?</h2>
      <p>
        If you have any questions about how we use cookies, feel free to contact us at <a href="mailto:support@diffrun.com" className="text-blue-600 underline">support@diffrun.com</a>.
      </p>
    </div>
  );
};

export default CookiePolicy;