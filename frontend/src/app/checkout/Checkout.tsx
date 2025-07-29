"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Select, { SingleValue } from 'react-select';
import Script from 'next/script';
import { AiOutlineDelete } from 'react-icons/ai';
import { Cards } from "@/data/data";

interface StateOption {
  value: string;
  label: string;
}

declare global {
  interface Window { Razorpay: any; }
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
  LHMM: 99.93,
  SPECIAL10: 10,
  TEST: 99.93,
  COLLAB: 99.93,
  BOOND5: 5,
  SUKHKARMAN5: 5,
  WELCOME5: 5,
  SAM5: 5
};

const DEFAULT_COUNTRY = "IN";
const ALLOWED_COUNTRIES = ["US", "UK", "CA", "IN", "AU", "NZ"];
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const getFixedPriceByCountry = (
  countryCode: string,
  bookStyle: "hardcover" | "paperback",
  bookKey: string
): { price: string; shipping: string; taxes: string } => {
  const country = ALLOWED_COUNTRIES.includes(countryCode) ? countryCode : DEFAULT_COUNTRY;
  const selectedBook = Cards.find((b) => b.bookKey === bookKey);
  return selectedBook?.prices?.[country]?.[bookStyle] || { price: "", shipping: "", taxes: "" };
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];
const stateOptions: StateOption[] = INDIAN_STATES.map((state) => ({ value: state, label: state }));

export default function Checkout() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";

  const [formData, setFormData] = useState<FormData>({
    email: "", firstName: "", lastName: "", address: "",
    apartment: "", city: "", state: "", pincode: "", contact: ""
  });

  const [bookStyle, setBookStyle] = useState<"hardcover" | "paperback" | null>(null);
  const [bookKey, setBookKey] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    const fetchJobDetails = async () => {
      const urlBookId = searchParams.get("book_id");
      if (!jobId) return;

      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        const data = await response.json();

        if (data.book_style === "hardcover" || data.book_style === "paperback") {
          setBookStyle(data.book_style);
        } else {
          setBookStyle("paperback");
        }

        if (data.phone_number) {
          const raw = data.phone_number.toString().replace(/^(\+91|91)/, '').trim();
          setFormData((prev) => ({ ...prev, contact: raw }));
        }

        if (data.book_id) {
          setBookKey(data.book_id);
        } else if (urlBookId) {
          setBookKey(urlBookId);
        }

      } catch (err) {
        console.error("Error fetching job status:", err);
        setBookStyle("paperback");

        if (urlBookId) {
          setBookKey(urlBookId);
        }
      }
    };

    fetchJobDetails();
  }, [jobId, searchParams]);

  const {
    price, shipping, taxes, numericPrice, numericShipping, numericTaxes
  } = useMemo(() => {
    if (!bookStyle || !bookKey) return {
      price: "", shipping: "", taxes: "",
      numericPrice: 0, numericShipping: 0, numericTaxes: 0
    };
    const { price, shipping, taxes } = getFixedPriceByCountry("IN", bookStyle, bookKey);
    return {
      price, shipping, taxes,
      numericPrice: extractNumericValue(price),
      numericShipping: extractNumericValue(shipping),
      numericTaxes: extractNumericValue(taxes)
    };
  }, [bookStyle, bookKey]);

  const discountPercentage = VALID_COUPONS[appliedCoupon] || 0;
  const discountAmount = numericPrice * (discountPercentage / 100);
  const finalAmount = numericPrice - discountAmount;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await res.json();

    const rzp = new window.Razorpay({
      key: data.razorpay_key,
      amount: data.amount,
      currency: data.currency,
      name: "Diffrun",
      description: "Personalised Storybook",
      order_id: data.order_id,
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.contact
      },
      handler: async function (response: any) {
        await fetch(`${apiBaseUrl}/verify-razorpay`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...response, job_id: jobId, actual_price: numericPrice, discount_percentage: discountPercentage, discount_amount: discountAmount, shipping_price: numericShipping, taxes: numericTaxes, final_amount: finalAmount, discount_code: appliedCoupon })
        });
        const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
        window.location.href = `${frontendUrl}/confirmation?${new URLSearchParams(window.location.search).toString()}`;
      }
    });

    rzp.open();
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.address) newErrors.address = "Address is required.";
    if (!formData.city) newErrors.city = "City is required.";
    if (!formData.state) newErrors.state = "State is required.";
    if (!formData.pincode) {
      newErrors.pincode = "PIN code is required.";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit PIN code.";
    }

    if (!formData.contact) {
      newErrors.contact = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(formData.contact)) {
      newErrors.contact = "Please enter a valid 10-digit number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (!bookStyle || !bookKey) {
    return <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg font-semibold">Loading checkout...</p>
    </div>;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="h-full flex flex-col lg:flex-row bg-gray-100 py-6 px-4 sm:px-10 md:px-30 lg:px-60">

        <div className="w-full lg:w-2/3 bg-white p-6 rounded-md shadow-md mr-0 lg:mr-6">

          <h2 className="text-lg font-libre font-medium mb-2">Contact Information</h2>
          <div className="mb-4">
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full"
              placeholder="Email*"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <h2 className="text-lg font-libre font-medium mb-2">Shipping Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded w-full"
                placeholder="First Name*"
              />
              {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded w-full"
                placeholder="Last Name*"
              />
              {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="mb-4">
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full"
              placeholder="Address Line 1*"
            />
            {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
          </div>

          <div className="mb-4">
            <input
              name="apartment"
              value={formData.apartment}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full"
              placeholder="Address Line 2 ( Optional )"
            />
          </div>

          <div className="mb-4">
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full"
              placeholder="City*"
            />
            {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <Select<StateOption>
                instanceId="state-select"
                options={stateOptions}
                value={stateOptions.find(opt => opt.value === formData.state)}
                onChange={(selected: SingleValue<StateOption>) => {
                  setFormData((prev) => ({ ...prev, state: selected?.value || "" }));
                }}
                isSearchable
                placeholder="Select State*"
              />
              {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
            </div>
            <div>
              <input
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded w-full"
                placeholder="PIN Code*"
              />
              {errors.pincode && <p className="text-red-400 text-sm mt-1">{errors.pincode}</p>}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex">
              <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l bg-gray-50">
                <img
                  src="/global/india.png"
                  alt="India Flag"
                  className="w-5 h-4 object-contain mr-1"
                  loading="lazy"
                />
                <span className="mx-2 mr-4 md:mt-1 font-medium text-sm">+91</span>
              </div>
              <input
                name="contact"
                value={formData.contact}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, '');
                  setFormData((prev) => ({ ...prev, contact: numeric }));
                }}
                className="border border-gray-300 p-2 rounded-r w-full"
                placeholder="Enter 10-digit mobile number*"
                maxLength={10}
              />
            </div>
            {errors.contact && <p className="text-red-400 text-sm mt-1">{errors.contact}</p>}
          </div>

          <h2 className="text-lg font-libre font-medium mb-2 mt-8">Shipping Method</h2>
          <div className="p-3 rounded mb-6 shadow-md">Standard - FREE</div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-libre font-medium">Payment</h2>
            <div className="">
              <p className="font-poppins text-gray-600 text-sm">All transactions are secure and encrypted.</p>
              <button onClick={handlePayment} className="bg-[#5784ba] text-white px-8 py-3 rounded-xl hover:cursor-pointer mt-4 ">Pay Now</button>
            </div>
          </div>

        </div>

        <div className="w-full lg:w-1/3 bg-white p-6 rounded-md shadow-md">
          <div className="flex flex-col items-start justify-center space-y-6 mb-4">

            <img src="/all-books.jpg" alt="Book" className="w-40 h-auto rounded object-cover" />
            <div className="text-left">
              <h3 className="font-libre font-medium text-xl">
                {bookStyle.charAt(0).toUpperCase() + bookStyle.slice(1)} Storybook
              </h3>
              <p className="text-lg font-poppins">₹{finalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex mb-4">
            <input
              value={discountCode}
              placeholder="Discount Code"
              onChange={(e) => setDiscountCode(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full mr-2"
            />
            <button
              disabled={!discountCode}
              onClick={applyDiscount}
              className="py-2 px-4 rounded-xl hover:cursor-pointer bg-[#5784ba] text-white"
            >
              Apply
            </button>
          </div>

          {message && (
            <div className="w-full text-blue-600 bg-blue-50 px-4 py-2 rounded text-sm mb-2">
              {message}
            </div>
          )}

          {appliedCoupon && (
            <div className="flex items-center w-full bg-blue-50 font-poppins font-medium text-blue-800 px-3 py-2 rounded mb-4">
              {appliedCoupon}
              <button
                onClick={() => setAppliedCoupon("")}
                className="ml-4 bg-gray-200 text-gray-700 rounded-full p-1 hover:bg-gray-300 transition-colors"
              >
                <AiOutlineDelete size={12} />
              </button>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{numericPrice}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- ₹{discountAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{numericShipping}</span></div>
            <div className="flex justify-between"><span>Taxes</span><span>₹{numericTaxes}</span></div>
            <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>₹{finalAmount.toFixed(2)}</span></div>
          </div>

          <div className="block lg:hidden mt-6">
            <button onClick={handlePayment} className="bg-[#5784ba] text-white w-full py-3 rounded-sm mt-4">Pay Now</button>
          </div>
        </div>

      </div>
    </>
  );
}