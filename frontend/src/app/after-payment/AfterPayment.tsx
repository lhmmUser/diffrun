'use client';

import { useEffect, useState, Suspense } from 'react';

interface AfterPaymentDetails {
  _id: string;
  job_id: string;
  username: string;
  child_name: string;
  preview_url: string;
  book_name?: string;
  email?: string;
}

function Content() {
  const [details, setDetails] = useState<AfterPaymentDetails | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const jobId = new URLSearchParams(window.location.search).get("job_id");
    if (jobId) {
      fetch(`${apiBaseUrl}/after-payment/${jobId}`)
        .then(res => res.json())
        .then(data => {
          setDetails(data);
        })
        .catch(console.error);
    }
  }, []);

  if (!details) return <p>Loading...</p>;

  return (
   <div className="w-full flex justify-center mt-24 mb-24">
  <div className="p-6 text-center text-gray-800 font-sans leading-relaxed">
    <h1 className="text-2xl font-bold mb-6">You are just one step away! ✨</h1>

    <p className="mb-4">
    
    </p>

    <h3 className="text-lg font-semibold mb-2">You have received an email with the link to refine and approve your storybook for printing.</h3>

    <p className="mb-6">
      
    </p>

    <p className="mb-4">
      You still have <b>12 hours</b> to make refinements before the book is sent for printing.
    </p>

    <p className=" text-gray-600">
      Our system will automatically finalize the book 12 hours after payment to avoid delays in printing.
    </p>
  </div>
</div>

  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading after-payment page...</p>}>
      <Content />
    </Suspense>
  );
}
