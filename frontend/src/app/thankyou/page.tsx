import React from "react";

export default function Thankyou() {
  return (
    <div className="w-full min-h-[80vh] bg-white flex flex-col text-center items-center justify-center px-6 py-20">
      <h1 className="text-3xl font-bold mb-6 text-[#5784BA]">
        Thank you for your order!
      </h1>
      <p className="text-lg text-gray-800 max-w-2xl mb-4">
        Your magical storybook is now ready for your review.
      </p>
      <p className="text-lg text-gray-800 max-w-2xl mb-4">
        You still have <strong>12 hours</strong> to make refinements before the book is sent for printing. If there are any pages you'd like to adjust, you can regenerate specific images directly within the preview.
      </p>
      <p className="text-lg text-gray-800 max-w-2xl mb-4">
        Once you're happy with the final result, please click the <strong>"Approve for printing"</strong> button on the preview page. This step is essential to finalize your book and prepare it for printing.
      </p>
      <p className="text-lg text-gray-800 max-w-2xl">
        Our system automatically finalizes the book <strong>12 hours after payment</strong> to avoid any delays in printing.
      </p>
    </div>
  );
}