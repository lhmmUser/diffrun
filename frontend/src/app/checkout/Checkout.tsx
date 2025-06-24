"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Select, { SingleValue } from 'react-select';
import Script from 'next/script';

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
  discount_code: string;
}

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
    discount_code: "",
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [finalAmount, setFinalAmount] = useState<number>(1450);
  const [message, setMessage] = useState<string>("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCouponChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDiscountCode(e.target.value);
  };

  const applyDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      const discount = VALID_COUPONS[code];
      const discountedPrice = 1450 - 1450 * (discount / 100);
      setFinalAmount(discountedPrice);
      setAppliedCoupon(code);
      setDiscountCode("");
      setMessage("");
    } else {
      setMessage("No coupon code found");
    }
  };

  const removeDiscount = () => {
    setFinalAmount(1450);
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
      final_amount: finalAmount,
      job_id: jobId
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
            job_id: jobId
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

  const inputStyle = "border border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-1 focus:outline-none focus:ring-offset-0 p-2 rounded w-full transition duration-150";


  function renderInput(name: keyof FormData, label: string) {
    return (
      <div className="mb-6">
        <label className="block mb-1 font-medium font-poppins capitalize" htmlFor={name}>
          {label}
        </label>
        <input
          id={name}
          name={name}
          type={name === "email" ? "email" : name === "pincode" || name === "contact" ? "tel" : "text"}
          value={formData[name]}
          onChange={handleChange}
          className={inputStyle}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="h-full flex flex-col md:flex-row bg-gray-100 py-10 text-gray-800 px-10">
        <div className="w-full md:w-2/3 bg-white p-6 rounded-md shadow-md mr-4">

          <h2 className="text-lg font-semibold mb-1">Contact</h2>
          {renderInput("email", "Email")}

          <h2 className="text-lg font-semibold mb-1">Delivery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("firstName", "First Name")}
            {renderInput("lastName", "Last Name")}
          </div>
          {renderInput("address", "Address")}
          {renderInput("apartment", "Apartment, suite, etc.")}
          <div className="grid grid-cols-3 gap-4">
            {renderInput("city", "City")}

            <div className="my-1">
              <label htmlFor="">State</label>
              <Select<StateOption>
                instanceId="state-select"
                options={stateOptions}
                value={stateOptions.find(opt => opt.value === formData.state)}
                onChange={(selectedOption: SingleValue<StateOption>) =>
                  setFormData((prev) => ({ ...prev, state: selectedOption?.value || "" }))
                }
                placeholder="Select State"
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
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
            <button
              onClick={handlePayment}
              className="bg-[#5784ba] text-white px-8 py-3 rounded-full mt-4 cursor-pointer">
              Pay Now
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3 bg-white p-8 rounded-md shadow-md">
          <div className="flex items-center mb-4">
            <img src="/all-books.jpg" alt="Book" width={120} height={120} className="rounded mr-4 object-cover" />
            <div>
              <h3 className="font-semibold">Personalised Storybook</h3>
              <p>Paperback</p>
              <p className="line-through text-gray-800 text-sm">₹1450</p>
              <p className="text-xl font-bold">₹{finalAmount}</p>
            </div>
          </div>

          <div className="mb-4 flex items-center space-x-2">
            <input value={discountCode} placeholder="Discount Code" onChange={handleCouponChange} className={inputStyle + " mb-0"} />
            <button
              onClick={applyDiscount}
              className={`py-2 px-6 rounded-full transition duration-150 ${discountCode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
            >
              Apply
            </button>
          </div>

          {message && <p className="text-red-500 mb-2">{message}</p>}

          {appliedCoupon && (
            <div className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded mb-4 w-fit">
              {appliedCoupon}
              <button onClick={removeDiscount} className="ml-2 text-red-500 font-bold">×</button>
            </div>
          )}

          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₹{finalAmount}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>FREE</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{finalAmount}</span>
          </div>

          <div className="text-sm text-green-600 mt-2">TOTAL SAVINGS ₹{1450 - finalAmount}</div>
        </div>
      </div>
    </>
  );
}