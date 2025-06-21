"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface JobData {
  username: string;
  child_name: string;
  email: string;
  preview_url: string;
  paid: boolean;
}

export default function Confirmation() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job data");

        const data = await response.json();

        setJobData({
          username: data.user_name || "",
          child_name: data.name || "",
          email: data.email || "",
          preview_url: data.preview_url || "",
          paid: data.paid || false,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching job data:", err);
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  if (!jobData || !jobData.paid) {
    return (
      <div className="w-full h-[80vh] bg-white flex justify-center items-center">
        <p className="text-lg font-poppins text-red-500">Order not found or payment not completed.</p>
      </div>
    );
  }

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