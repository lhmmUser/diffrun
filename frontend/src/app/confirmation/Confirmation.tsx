"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer: any[];
  }
}

interface JobData {
  username: string;
  child_name: string;
  email: string;
  preview_url: string;
  paid: boolean;
  job_id: string;
  dlv_purchase_event_fired?: boolean;
  value?: number;
  currency?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  gender?: string;
}

export default function Confirmation() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [jobData, setJobData] = useState<JobData | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const fetchJobData = async () => {
      console.log("🔍 Fetching job data for jobId:", jobId);

      if (!jobId) {
        console.error("❌ jobId missing in URL.");
        setStatus("error");
        return;
      }

      try {
        const res = await fetch(`${apiBaseUrl}/api/order-status/${jobId}`);
        const data = await res.json();

        console.log("📦 Response from /api/order-status:", data);

        if (!res.ok || !data.value || !data.job_id) {
          console.warn("⚠️ Invalid response structure or unpaid order.");
          setStatus("error");
        } else {
          setJobData({
            username: data.username || "",
            child_name: data.name || "",
            email: data.email || "",
            preview_url: data.preview_url || "",
            paid: true,
            job_id: data.job_id,
            dlv_purchase_event_fired: data.dlv_purchase_event_fired,
            value: data.value,
            currency: data.currency,
            city: data.city,
            country: data.country,
            postal_code: data.postal_code,
            gender: data.gender
          });

          setStatus("success");
          console.log("✅ Job data loaded and set to state");

          if (!data.dlv_purchase_event_fired && data.job_id) {
            console.log("📤 Firing GTM 'purchase_ready' event");

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "purchase_ready",
              transaction_id: data.job_id,
              value: data.value,
              currency: data.currency,
              city: data.city,
              country: data.country,
              postal_code: data.postal_code,
              gender: data.gender
            });

            console.log("✅ GTM push complete. Sending POST to mark event fired...");

            await fetch(`${apiBaseUrl}/api/mark-dlv-purchase-event-fired`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ job_id: data.job_id })
            });

            console.log("✅ Purchase event marked as fired in backend.");
          } else {
            console.log("⚠️ GTM event already fired or jobId missing");
          }
        }
      } catch (err) {
        console.error("❌ Error fetching job data:", err);
        setStatus("error");
      }
    };

    fetchJobData();
  }, [jobId, apiBaseUrl]);

  if (status === "loading") {
    console.log("⌛ Still loading...");
    return (
      <div className="w-full h-[80vh] bg-white flex justify-center items-center">
        <p className="text-lg font-poppins text-gray-500">Loading your order details...</p>
      </div>
    );
  }

  if (status === "error" || !jobData) {
    console.log("❌ Order not found or invalid");
    return (
      <div className="w-full h-[80vh] bg-white flex justify-center items-center">
        <p className="text-lg font-poppins text-red-500">Order not found or payment not completed.</p>
      </div>
    );
  }

  console.log("🎉 Rendering confirmation UI for job:", jobData.job_id);

  return (
    <div className="w-full min-h-[80vh] bg-white flex flex-col text-center items-center py-20">
      <div className="max-w-3xl bg-gray-100 shadow-md rounded-md p-8 overflow-hidden px-2">
        <p className="mb-6 font-poppins">
          Thank you for your order! <strong>{jobData.child_name}</strong>'s magical storybook is now ready for your review. ✨
        </p>

        <p className="mb-6 font-poppins">
          You still have 12 hours to make refinements before the book is sent for printing. If there are any pages you'd like to adjust, you can regenerate specific images directly within the preview.
        </p>

        <p className="mb-6 font-poppins">
          Once you're happy with the final result, please click the <strong>"Approve for printing"</strong> button on the preview page. This step is essential to finalize your book and prepare it for printing.
        </p>

        <h3 className="text-lg font-bold mb-6">📖 Preview & Refine Your Book:</h3>

        <a
          href={jobData.preview_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-[#5784ba] text-white font-medium mb-6 hover:bg-transparent hover:border hover:border-black hover:text-black cursor-pointer"
        >
          View & Refine Storybook
        </a>

        <p className="mb-4 font-poppins">
          Our system automatically finalizes the book <strong>12 hours after payment</strong> to avoid any delays in printing.
        </p>
      </div>
    </div>
  );
}