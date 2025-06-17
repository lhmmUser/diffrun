"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FAQClient from "../faq/faq-client";
import { faqData } from '@/data/data';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Purchase = () => {
  const searchParams = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<"hardcover" | "paperback" | null>(null);

  const jobId = searchParams.get("job_id") || "";
  const name = searchParams.get("name") || "";
  const bookId = searchParams.get("book_id") || "";
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [message, setMessage] = useState("");
  const [locale, setLocale] = useState<string>("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const initialOptions = {
    clientId: "AQf86J_3Vmxd9fe9O62DwTyUhzqawY54ZR3zkcNKiV5SnRbn0YG_qPf2JOEa_I9vntx1UWE6oXNDSHxU",
    currency: "USD",
    components: "buttons",
    enableFunding: "venmo",
    disableFunding: "",
    buyerCountry: "US",
    dataPageType: "product-details",
    dataSdkIntegrationSource: "developer-studio",
  };

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!jobId) return;
      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch preview URL");

        const data = await response.json();
        setPreviewUrl(data.preview_url || "");
        setLocale(data.locale || "");
      } catch (err: any) {
        console.error("❌ Error fetching preview URL:", err.message);
      }
    };

    fetchPreviewUrl();
  }, [jobId]);

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
    <div className="flex flex-col items-center min-h-screen mt-10">

      <section className="w-full max-w-4xl mb-16 px-4 md:px-0">
        <div className="">
          <h1 className="text-2xl md:text-3xl font-libre font-medium text-gray-800 py-4 px-1">
            {name.charAt(0).toUpperCase() + name.slice(1)}&apos;s Personalized Storybook
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">

            <div
              onClick={() => handleSelectOption("hardcover")}
              className={`relative flex flex-col items-start p-4 shadow-lg cursor-pointer ${selectedOption === "hardcover" ? "bg-[#f7f6cf]" : "hover:bg-gray-100"
                }`}
            >
              <div className="absolute top-2 right-2 bg-[#5784ba] text-white text-xs px-4 py-2">
                {selectedOption === "hardcover" ? "Selected" : ""}
              </div>
              <img
                src={`/hardcover-${bookId}.jpg`}
                alt="Diffrun personalized books - hardcover book"
                className="w-auto h-48 object-cover mb-4"
              />
              <h2 className="text-xl font-poppins font-medium text-black">Hardcover</h2>
              <p className="text-sm text-gray-700 font-poppins mb-2">
                Durable, premium binding with matte finish.
              </p>
              <span className="text-lg font-poppins font-bold">₹ 1950</span>
            </div>

            <div
              onClick={() => handleSelectOption("paperback")}
              className={`relative flex flex-col items-start p-4 shadow-lg cursor-pointer ${selectedOption === "paperback" ? "bg-[#f7f6cf]" : "hover:bg-gray-100"
                }`}
            >
              <div className="absolute top-2 right-2 bg-[#5784ba] text-white text-xs px-2 py-1">
                {selectedOption === "paperback" ? "Selected" : ""}
              </div>
              <img
                src={`/softpaper-${bookId}.jpg`}
                alt="Diffrun personalized books - paperback book"
                className="w-auto h-48 object-cover mb-4"
              />
              <h2 className="text-xl font-poppins font-medium text-black">Paperback</h2>
              <p className="text-sm text-gray-700 font-poppins mb-2">
                Lightweight and portable softcover edition.
              </p>
              <span className="text-lg font-poppins font-bold">₹ 1450</span>
            </div>
          </div>

          <div className="flex flex-col gap-12 justify-center items-center px-6 py-10">
            {locale === "IN" ? (
              <>
                <div className="w-full text-center bg-[#f4cfdf] text-gray-800 text-sm font-poppins font-medium py-2 mt-6">
                  Free Shipping All Across India
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={!selectedOption}
                  className={`relative px-8 py-3 text-lg font-poppins font-medium text-white bg-[#5784BA] ${!selectedOption
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer"
                    }`}
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <PayPalScriptProvider options={initialOptions}>
                <PayPalButtons
                  style={{
                    shape: "pill",
                    layout: "vertical",
                    color: "gold",
                    label: "paypal",
                  }}
                  createOrder={async () => {
                    try {
                      const response = await fetch("/api/orders", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        // use the "body" param to optionally pass additional order information
                        // like product ids and quantities
                        body: JSON.stringify({
                          cart: [
                            {
                              id: selectedOption,
                              quantity: 1,
                            },
                          ],
                        }),
                      });

                      const orderData = await response.json();

                      if (orderData.id) {
                        return orderData.id;
                      } else {
                        const errorDetail = orderData?.details?.[0];
                        const errorMessage = errorDetail
                          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                          : JSON.stringify(orderData);

                        throw new Error(errorMessage);
                      }
                    } catch (error) {
                      console.error(error);
                      setMessage(
                        `Could not initiate PayPal Checkout...${error}`
                      );
                    }
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      const response = await fetch(
                        `/api/orders/${data.orderID}/capture`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      const orderData = await response.json();
                      // Three cases to handle:
                      //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                      //   (2) Other non-recoverable errors -> Show a failure message
                      //   (3) Successful transaction -> Show confirmation or thank you message

                      const errorDetail = orderData?.details?.[0];

                      if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                        // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                        // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                        return actions.restart();
                      } else if (errorDetail) {
                        // (2) Other non-recoverable errors -> Show a failure message
                        throw new Error(
                          `${errorDetail.description} (${orderData.debug_id})`
                        );
                      } else {
                        // (3) Successful transaction -> Show confirmation or thank you message
                        // Or go to another URL:  actions.redirect('thank_you.html');
                        const transaction =
                          orderData.purchase_units[0].payments
                            .captures[0];
                        setMessage(
                          `Transaction ${transaction.status}: ${transaction.id}. See console for all available details`
                        );
                        console.log(
                          "Capture result",
                          orderData,
                          JSON.stringify(orderData, null, 2)
                        );
                      }
                    } catch (error) {
                      console.error(error);
                      setMessage(
                        `Sorry, your transaction could not be processed...${error}`
                      );
                    }
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>


          <div className="p-6 text-center">
            <p className="text-sm font-semibold">
              You can still make edits within 12 hours after placing your order
            </p>
            <p className="text-sm mt-2">
              Printing and shipping may take up to 10 days
            </p>
          </div>

        </div>
      </section>

      <section className="w-full max-w-4xl">
        <div className="py-12">
          <FAQClient items={faqData} />
        </div>
      </section>
    </div>
  );
};

export default Purchase;