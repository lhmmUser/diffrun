'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Approved() {

  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (jobId) {
      fetch(`${apiBaseUrl}/api/update-print-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job_id: jobId }),
      })
        .then((res) => res.json())
        .then((data) => console.log('✅ Print approval updated:', data))
        .catch((err) => console.error('❌ Error updating print approval:', err));
    }
  }, [jobId]);

  return (
    <div className="w-full h-[80vh] bg-white flex items-center justify-center">
      <div className="p-6 text-center text-gray-800 font-sans leading-relaxed">
        <h1 className="text-2xl font-bold mb-6">
          Storybook is now being printed! ✨
        </h1>
        <p className="mb-4">
          Great news! The storybook has been finalized and sent for printing
        </p>
        <h3 className="text-lg font-semibold mb-2">
          Please allow us 7–8 working days as all books are custom made to order.
        </h3>
        <p className="mb-6">
        </p>

        <p className="mb-4">
          In case the approval wasn't submitted manually, our system automatically finalizes the book 12 hours after payment to avoid any delays in printing.
        </p>

        <p className=" text-gray-700">
          Our system will automatically finalize the book 12 hours after payment to avoid delays in printing.
        </p>

      </div>
    </div>
  );
}