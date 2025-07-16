"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FAQClient from "../faq/faq-client";
import { faqData } from '@/data/data';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Cards } from "@/data/data";
import { FaTrash } from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const currencyMap: { [countryCode: string]: string } = {
  US: "USD",
  UK: "GBP",
  IN: "INR",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
};

const DEFAULT_COUNTRY = "IN";
const ALLOWED_COUNTRIES = ["US", "UK", "CA", "IN", "AU", "NZ"];

const discountCodes: { [code: string]: number } = {
  LHMM: 99,
};

const Purchase = () => {
  const searchParams = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<"hardcover" | "paperback" | null>(null);
  const jobId = searchParams.get("job_id") || "";
  const name = searchParams.get("name") || "";
  const bookId = searchParams.get("book_id") || "";
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [couponInput, setCouponInput] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>(DEFAULT_COUNTRY);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const currency = currencyMap[locale] || currencyMap[DEFAULT_COUNTRY];

  const getFixedPriceByCountry = (
    countryCode: string,
    bookStyle: "hardcover" | "paperback"
  ): { price: string; shipping: string; taxes: string } => {
    const country = ALLOWED_COUNTRIES.includes(countryCode) ? countryCode : DEFAULT_COUNTRY;
    const selectedBook = Cards.find((b) => b.bookKey === bookId);
    return (
      selectedBook?.prices?.[country]?.[bookStyle] || {
        price: "",
        shipping: "",
        taxes: "",
      }
    );
  };

  const calculateFinalAmount = (
    basePrice: string,
    shipping: string,
    discountPercentage: number
  ) => {
    const currencyMatch = basePrice.trim().match(/[^0-9.,\s]+/);
    const currency = currencyMatch ? currencyMatch[0] : "";

    const numericBase = parseFloat(basePrice.replace(/[^\d.]/g, ""));
    const numericShipping = parseFloat(shipping.replace(/[^\d.]/g, ""));

    const discount = (numericBase * discountPercentage) / 100;
    const discountedPrice =  (numericBase * (100 -  discountPercentage)) / 100;
    const total = numericBase + numericShipping - discount;

    return {
      currency,
      base: numericBase,
      shipping: numericShipping,
      discount,
      total: total.toFixed(2),
      discountPrice: discountedPrice
    };
  };

  const { price, shipping } = getFixedPriceByCountry(locale, selectedOption || "paperback");

  const discountPercentage = appliedCoupon === "LHMM" ? 99 : 0;

  const finalAmount = calculateFinalAmount(price, shipping, discountPercentage);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID as string,
    currency: currency,
    components: "buttons",
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId) return;
      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        const data = await response.json();
        setPreviewUrl(data.preview_url || "");
        setLocale(data.locale || DEFAULT_COUNTRY);
      } catch (err) {
        console.error("Error fetching preview:", err);
      }
    };
    fetchData();
  }, [jobId]);

  const handleSelectOption = async (option: "hardcover" | "paperback") => {
    setSelectedOption(option);
    try {
      await fetch(`${apiBaseUrl}/update-book-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, book_style: option }),
      });
    } catch (err) {
      console.error("Error saving book style:", err);
    }
  };

  const handleCheckoutShopify = async () => {
    if (!selectedOption) return;
    const variantId = selectedOption === "hardcover" ? "41626628128902" : "41626628161670";

    const payload = {
      book_name: bookId,
      preview_url: previewUrl,
      request_id: jobId,
      variant_id: variantId,
      selected_option: selectedOption,
      price: finalAmount.total,
      shipping: finalAmount.shipping.toString(),
      locale,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/create_checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleApply = () => {
    const code = couponInput.trim().toUpperCase();
    if (discountCodes[code]) {
      setAppliedCoupon(code);
    } else {
      alert("Invalid coupon code");
    }
    setCouponInput("");
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
  };

  const handleCheckoutRZP = () => {
      if (!selectedOption) return;

    const currentParams = new URLSearchParams(window.location.search);
    window.location.href = `/checkout?${currentParams.toString()}`;
  }

  return (
    <div className="flex flex-col items-center min-h-screen mt-10">
      {/* Book selection */}
      <section className="w-full max-w-4xl mb-16 px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl font-libre font-medium text-gray-800 py-4 px-1">
          {name.charAt(0).toUpperCase() + name.slice(1)}&apos;s Personalized Storybook
        </h1>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          {(["paperback", "hardcover"] as const).map((format) => {
            const { price } = getFixedPriceByCountry(locale, format);
            return (
              <div
                key={format}
                onClick={() => handleSelectOption(format)}
                className={`relative flex flex-col items-start p-4 shadow-lg cursor-pointer ${selectedOption === format ? "bg-[#f7f6cf]" : "hover:bg-gray-100"}`}
              >
                <div className="absolute top-2 right-2 bg-[#5784ba] text-white text-xs px-4 py-2">
                  {selectedOption === format ? "Selected" : ""}
                </div>
                <img
                  src={`/${format === "hardcover" ? "hardcover" : "softpaper"}-${bookId}.jpg`}
                  alt={`Diffrun book - ${format}`}
                  className="w-auto h-48 object-cover mb-4"
                />
                <h2 className="text-xl font-poppins font-medium text-black capitalize">{format}</h2>
                <p className="text-sm text-gray-700 mb-2">
                  {format === "hardcover" ? "Durable, premium binding with matte finish." : "Lightweight and portable softcover edition."}
                </p>
                <span className="text-lg font-bold">{price}</span>
              </div>
            );
          })}
        </div>

        {/* Checkout */}
        <div className="mt-12 max-w-xs mx-auto">
          {locale === "IN" ? (
            <button
              onClick={handleCheckoutRZP}
              disabled={!selectedOption}
              className="px-8 py-3 text-lg font-medium text-white bg-[#5784BA] rounded-xl hover:cursor-pointer"
            >
              Proceed to Checkout
            </button>
          ) : (
            <>
            <div className="flex flex-col justify-center items-center mx-auto w-full max-w-sm mt-10 bg-[#fce4ec] px-6 py-4 shadow-md text-gray-800 space-y-2">
          {appliedCoupon && (
            <p className="text-sm font-poppins text-gray-700">
              <span className="text-base">Discount Applied: -{finalAmount.currency}{finalAmount.discount.toFixed(2)}</span>
            </p>
          )}
          {appliedCoupon && (
          <p className="text-base font-poppins text-gray-700">Discounted Price: ${finalAmount.discountPrice}</p>
           )}
          <p className="text-base font-poppins">
            Shipping: <span className="text-base">{finalAmount.currency}{finalAmount.shipping.toFixed(2)}</span>
          </p>


          <hr className="w-full border-t my-3 border-gray-400" />

          <p className="text-lg font-poppins text-black">
            Total: {finalAmount.currency}{finalAmount.total}
          </p>
        </div>

        {/* Discount + Summary */}
        <div className="py-2 w-full">
          <div
            className="max-w-xs mx-auto flex justify-center items-center cursor-pointer gap-2"
            onClick={() => setShowCouponInput(!showCouponInput)}
          >
            <h3 className="text-sm font-medium font-poppins text-blue-900">Have a coupon code?</h3>
            {showCouponInput ? (
              <FiChevronUp className="text-xl text-indigo-800" />
            ) : (
              <FiChevronDown className="text-xl text-indigo-800" />
            )}
          </div>

          {showCouponInput && (
            <div className="w-60 mx-auto mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter coupon code"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm mb-2"
              />
              <button
                onClick={handleApply}
                className="w-full bg-[#5784ba] text-white py-1 rounded-md hover:bg-[#456ca0] transition"
              >
                Apply Coupon
              </button>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-sm text-gray-800 mt-3 bg-white p-2 rounded-md shadow">
                  <span>
                    Coupon applied: <strong>{appliedCoupon}</strong>
                  </span>
                  <FaTrash
                    onClick={handleRemove}
                    className="cursor-pointer text-[#5784ba] hover:text-[#5784ba]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
            <PayPalScriptProvider options={initialOptions}>
              <PayPalButtons
                style={{ shape: "pill", layout: "vertical", color: "gold", label: "paypal" }}
                createOrder={async () => {
                  if (!selectedOption) return;
                  const res = await fetch(`${apiBaseUrl}/api/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      cart: [{
                        id: `${bookId}_${selectedOption}`,
                        name: `${bookId}_${selectedOption}`,
                        quantity: 1,
                        price: finalAmount.discountPrice.toFixed(2),
                      }],
                      shipping: finalAmount.shipping.toFixed(2),
                      currency,
                      locale,
                      preview_url: previewUrl,
                      request_id: jobId,
                    }),
                  });
                  const order = await res.json();
                  return order.id;
                }}
                onApprove={async (data) => {
                  await new Promise((r) => setTimeout(r, 1500));
                  await fetch(`${apiBaseUrl}/api/paypal/store-capture`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_id: data.orderID, job_id: jobId }),
                  });
                  window.location.href = `/confirmation?job_id=${jobId}`;
                }}
              />
            </PayPalScriptProvider>
            </>
          )}
        </div>

        <div className="mr-20 py-6 text-center text-sm text-gray-600">You can still make edits within 12 hours after ordering.</div>
      </section>

      <section className="w-full max-w-5xl px-4">
        <FAQClient items={faqData} />
      </section>
    </div>
  );
};

export default Purchase;