"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const Comic: React.FC = () => {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const runCombinedWorkflow = async () => {
      if (!jobId) {
        setError("Missing job ID.");
        setLoading(false);
        return;
      }
  
      try {
        const res = await fetch("http://localhost:8000/run-combined-workflow", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ job_id: jobId }),
        });
  
        if (!res.ok) throw new Error("Failed to start combined workflow");
      } catch (err: any) {
        console.error("Failed to run combined workflow:", err.message);
        setError("An error occurred while generating your comic.");
        setLoading(false);
        return;
      }

      try {
        const pollForImage = async (retries = 10) => {
          for (let i = 0; i < retries; i++) {
            const response = await fetch(`http://localhost:8000/get-combined-image?job_id=${jobId}`);
            if (response.ok) {
              const data = await response.json();
              setImage(data.image);
              setLoading(false);
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
  
          throw new Error("Timeout waiting for combined image");
        };
  
        await pollForImage();
      } catch (err: any) {
        console.error("Error fetching collage image:", err.message);
        setError("Could not retrieve your comic collage.");
        setLoading(false);
      }
    };
  
    runCombinedWorkflow();
  }, [jobId]);  

  const handleGeneratePdf = async () => {
    if (!jobId) return;

    setPdfLoading(true);
    setPdfError(null);

    try {

      const response = await fetch(`http://localhost:8000/generate-comic-pdf?job_id=${jobId}`);

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comic-collage.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setPdfError("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-indigo-600 mb-6">
        Your Comic
      </h1>

      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
          <p className="text-gray-600">Generating your comic collage...</p>
        </div>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : image ? (
        <div className="w-full max-w-4xl shadow-lg rounded-xl overflow-hidden border bg-white">
          <img src={image} alt="Your Comic Collage" className="w-full object-contain" />
          <div className="p-4 border-t border-gray-100">
              <button
                aria-label="Download PDF"
                onClick={handleGeneratePdf}
                disabled={pdfLoading}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 relative"
              >
                {pdfLoading && (
                  <div className="absolute left-0 top-0 h-full w-2 bg-purple-500 animate-pulse" />
                )}
                <span className="relative z-10">
                  {pdfLoading ? "Generating PDF..." : "Download PDF"}
                </span>
              </button>
              {pdfError && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  {pdfError}
                </p>
              )}
            </div>
        </div>
      ) : (
        <p className="text-gray-600">No image found.</p>
      )}
    </main>
  );
};

export default Comic;