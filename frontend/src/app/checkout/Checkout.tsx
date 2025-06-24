"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Select, { SingleValue } from 'react-select';
import Script from 'next/script';
import { getFixedPriceByCountry } from "@/data/fixedPrices";

interface StateOption {
  value: string;
  label: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pincode: string;
  contact: string;
}

const extractNumericValue = (value: string): number => {
  return parseFloat(value.replace(/[^\d.]/g, ''));
};

const VALID_COUPONS: Record<string, number> = {
  LHMM: 99.91,
  NEWUSER: 50,
  SPECIAL50: 50,
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const stateOptions: StateOption[] = INDIAN_STATES.map((state) => ({ value: state, label: state }));

export default function Checkout() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";

  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    contact: "",
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Default book style (hardcoded for now; later you can make this dynamic)
  const bookStyle: "paperback" | "hardcover" = "paperback";

  // Pricing pulled from fixedPrices file
  const { price, shipping, taxes } = getFixedPriceByCountry("IN", bookStyle);
  const numericPrice = extractNumericValue(price);
  const numericShipping = extractNumericValue(shipping);
  const numericTaxes = extractNumericValue(taxes);

  const discountPercentage = VALID_COUPONS[appliedCoupon] || 0;
  const discountAmount = numericPrice * (discountPercentage / 100);
  const finalAmount = numericPrice - discountAmount;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCouponChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value);
  };

  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon(code);
      setDiscountCode("");
      setMessage("");
    } else {
      setMessage("No coupon code found");
    }
  };

  const removeDiscount = () => {
    setAppliedCoupon("");
    setMessage("");
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.state || !formData.pincode || !formData.contact) {
      setError("Please fill all mandatory fields.");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!phoneRegex.test(formData.contact)) {
      setError("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!pincodeRegex.test(formData.pincode)) {
      setError("Please enter a valid 6-digit Indian PIN code.");
      return false;
    }
    setError("");
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      contact: formData.contact,
      address1: formData.address,
      address2: formData.apartment,
      city: formData.city,
      province: formData.state,
      zip: formData.pincode,
      discount_code: appliedCoupon,
      job_id: jobId,
      actual_price: numericPrice,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      shipping_price: numericShipping,
      taxes: numericTaxes,
      final_amount: finalAmount
    };

    const res = await fetch(`${apiBaseUrl}/create-order-razorpay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    const options = {
      key: data.razorpay_key,
      amount: data.amount,
      currency: data.currency,
      name: "Diffrun",
      description: "Personalised Storybook",
      order_id: data.order_id,
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.contact,
      },
      handler: async function (response: any) {
        await fetch(`${apiBaseUrl}/verify-razorpay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            job_id: jobId,
            actual_price: numericPrice,
            discount_percentage: discountPercentage,
            discount_amount: discountAmount,
            shipping_price: numericShipping,
            taxes: numericTaxes,
            final_amount: finalAmount
          }),
        });

        setTimeout(() => {
          const currentParams = new URLSearchParams(window.location.search);
          window.location.href = `/confirmation?${currentParams.toString()}`;
        }, 3000);
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="h-full flex flex-col md:flex-row bg-gray-100 py-4 text-gray-800 px-4 sm:px-10 md:px-30 lg:px-40">

        <div className="w-full lg:w-2/3 bg-white p-6 rounded-md shadow-md mr-4">
          <h2 className="text-lg font-semibold mb-1">Contact</h2>
          {renderInput("email", "Email")}
          <h2 className="text-lg font-semibold mb-1">Delivery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("firstName", "First Name")}
            {renderInput("lastName", "Last Name")}
          </div>
          {renderInput("address", "Address Line 1")}
          {renderInput("apartment", "Address Line 2")}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
            {renderInput("city", "City")}
            <div className="my-1">
              <label>State</label>
              <Select<StateOption>
                instanceId="state-select"
                options={stateOptions}
                value={stateOptions.find(opt => opt.value === formData.state)}
                onChange={(selectedOption: SingleValue<StateOption>) =>
                  setFormData((prev) => ({ ...prev, state: selectedOption?.value || "" }))
                }
                placeholder="Select State"
                isSearchable
              />
            </div>
            {renderInput("pincode", "PIN Code")}
          </div>
          {renderInput("contact", "Phone")}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <h2 className="text-lg font-semibold mt-6 mb-1">Shipping Method</h2>
          <div className="border p-3 rounded mb-6 bg-gray-50">Standard - FREE</div>

          <h2 className="text-lg font-semibold mb-1">Payment</h2>
          <div className="border p-4 rounded bg-gray-50 mb-6">
            <p>All transactions are secure and encrypted.</p>
            <button onClick={handlePayment} className="bg-[#5784ba] text-white px-8 py-3 rounded-full mt-4 cursor-pointer">
              Pay Now
            </button>
          </div>
        </div>

        <div className="w-full lg:w-1/3 bg-white p-4 sm:p-6 lg:p-8 rounded-md shadow-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
            <img src="/all-books.jpg" alt="Book" className="w-32 h-auto rounded mb-4 sm:mb-0 sm:mr-6 object-cover" />
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-lg sm:text-xl">Personalised Storybook</h3>
              <p className="text-sm text-gray-700 mb-1">Paperback</p>
              <p className="line-through text-gray-800 text-sm">{price}</p>
              <p className="text-xl font-bold text-black">₹{finalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <input
              value={discountCode}
              placeholder="Discount Code"
              onChange={handleCouponChange}
              className="border border-gray-300 p-2 rounded w-full"
            />
            <button
              onClick={applyDiscount}
              className="w-full sm:w-auto py-2 px-6 rounded-full bg-blue-500 text-white"
            >
              Apply
            </button>
          </div>

          {message && <p className="text-red-500 mb-2 text-sm">{message}</p>}

          {appliedCoupon && (
            <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded mb-4 w-fit mx-auto sm:mx-0">
              {appliedCoupon}
              <button onClick={removeDiscount} className="ml-2 text-red-500 font-bold">×</button>
            </div>
          )}

          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{numericPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>- ₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{numericShipping}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>₹{numericTaxes}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );

  function renderInput(name: keyof FormData, label: string) {
    return (
      <div className="mb-6">
        <label className="block mb-1 font-medium">{label}</label>
        <input
          id={name}
          name={name}
          type={name === "email" ? "email" : name === "pincode" || name === "contact" ? "tel" : "text"}
          value={formData[name]}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded w-full"
        />
      </div>
    );
  }
}