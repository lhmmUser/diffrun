"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FAQClient from "../../faq/faq-client";
import { faqData } from "@/data/data";
import { getFixedPriceByCountry } from "@/data/fixedPrices";

const MultiCurrency = () => {
  const searchParams = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<"hardcover" | "paperback" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [locale, setLocale] = useState("IN");

  const jobId = searchParams.get("job_id") || "";
  const name = searchParams.get("name") || "";
  const bookId = searchParams.get("book_id") || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchJobStatus = async () => {
      if (!jobId) return;
      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job status");

        const data = await response.json();
        setPreviewUrl(data.preview_url || "");
        setLocale(data.locale || "IN");
        console.log("🌍 Using locale from DB:", data.locale);
        setLocale(data.locale || "IN");
        if (!data.locale) console.warn("⚠️ No locale in DB, defaulting to IN");
      } catch (err: any) {
        console.error("❌ Error fetching job status:", err.message);
      }
    };

    fetchJobStatus();
  }, [jobId, apiBaseUrl]);

  const handleSelectOption = async (option: "hardcover" | "paperback") => {
    setSelectedOption(option);

    try {
      await fetch(`${apiBaseUrl}/update-book-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          book_style: option,
        }),
      });
      console.log("✅ Book style saved:", option);
    } catch (err) {
      console.error("❌ Failed to save book style:", err);
    }
  };

  const handleCheckout = async () => {
    if (!selectedOption) return;

    const variantId =
      selectedOption === "hardcover" ? "41626628128902" : "41626628161670";

    const payload = {
      book_name: bookId,
      preview_url: previewUrl,
      request_id: jobId,
      variant_id: variantId,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/create_checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8 md:py-10 px-4">
      <section className="w-full max-w-4xl mb-16">
        <div className="border-4 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden">
          <h1 className="text-2xl font-extrabold bg-black text-white py-4 px-6">
            {name.charAt(0).toUpperCase() + name.slice(1)}&apos;s Personalized Storybook
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 p-6">
            <div
              onClick={() => handleSelectOption("hardcover")}
              className={`relative flex flex-col items-start p-4 border-4 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${selectedOption === "hardcover" ? "bg-yellow-200" : "hover:bg-gray-100"
                }`}
            >
              <div className="absolute top-2 right-2 bg-black text-white text-xs px-4 py-2">
                {selectedOption === "hardcover" ? "Selected" : "Popular Choice"}
              </div>
              <img
                src={`/hardcover-${bookId}.jpg`}
                alt="Hardcover Book"
                className="w-full h-48 object-cover mb-4 rounded-md"
              />
              <h2 className="text-xl font-bold text-black mb-2">Hardcover</h2>
              <p className="text-sm text-gray-700 mb-4">
                Durable, premium binding with matte finish.
              </p>
              {(() => {
                const { price } = getFixedPriceByCountry(locale, "hardcover");
                return (
                  <span className="text-lg font-extrabold block mb-1">{price}</span>
                );
              })()}
            </div>

            <div
              onClick={() => handleSelectOption("paperback")}
              className={`relative flex flex-col items-start p-4 border-4 border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${selectedOption === "paperback" ? "bg-yellow-200" : "hover:bg-gray-100"
                }`}
            >
              <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1">
                {selectedOption === "paperback" ? "Selected" : ""}
              </div>
              <img
                src={`/softpaper-${bookId}.jpg`}
                alt="Paperback Book"
                className="w-full h-48 object-cover mb-4 rounded-md"
              />
              <h2 className="text-xl font-bold text-black mb-2">Paperback</h2>
              <p className="text-sm text-gray-700 mb-4">
                Lightweight and portable softcover edition.
              </p>
              {(() => {
                const { price } = getFixedPriceByCountry(locale, "paperback");
                return (
                  <span className="text-lg font-extrabold block mb-1">{price}</span>
                );
              })()}
            </div>
          </div>
          {(() => {
            const { shipping } = getFixedPriceByCountry(locale, "hardcover");
            return (
              <div className="text-center mt-4">
                <p className="text-sm md:text-lg font-semibold text-gray-800">
                  Shipping: {shipping}
                </p>
              </div>
            );
          })()}

          <div className="flex flex-col items-center mt-10 px-6 py-8 space-y-2">
            <button
              onClick={handleCheckout}
              disabled={!selectedOption}
              className={`relative px-8 py-3 text-lg font-bold text-white bg-blue-800 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.2)] transition-all duration-200 active:translate-y-1 active:shadow-none ${!selectedOption
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-800 hover:border-gray-800"
                }`}
            >
              Proceed to Checkout
            </button>
          </div>

          <div className="p-6 border-t-4 border-black text-center">
            <p className="text-sm font-semibold">
              You can still make edits within 12 hours after placing your order
            </p>
            <p className="text-sm mt-2">Printing and shipping may take up to 10 days</p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl bg-gray-100">
        <div className="py-12">
          <FAQClient items={faqData} />
        </div>
      </section>
    </div>
  );
};

export default MultiCurrency;