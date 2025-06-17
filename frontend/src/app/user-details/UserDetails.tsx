"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const UserDetails: React.FC = () => {

  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const jobId = searchParams.get("job_id") || "";
  const name = searchParams.get("name") || "";
  const gender = searchParams.get("gender") || "";
  const bookId = searchParams.get("book_id") || "";
  const selected = searchParams.get("selected") || "";

  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(`${apiBaseUrl}/get-job-status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch preview URL from server");

        const data = await response.json();
        console.log("🔗 Preview URL fetched:", data.preview_url);
        setPreviewUrl(data.preview_url || "");
      } catch (err: any) {
        console.error("⚠️ Error fetching preview URL:", err.message);
        setError("Unable to fetch preview URL.");
      }
    };

    fetchPreviewUrl();
  }, [jobId]);

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
  
      if (!email.trim() || !username.trim()) {
        setError("Please fill in all fields.");
        return;
      }
  
      setLoading(true);
  
      const safePreviewUrl = previewUrl?.startsWith("http")
  ? previewUrl
  : `${window.location.origin}/preview?job_id=${jobId}&job_type=story&name=${name}&gender=${gender}&book_id=${bookId}&selected=${selected}`;
  
      const payload = {
        job_id: jobId,
        name,
        gender,
        preview_url: safePreviewUrl,
        email,
        user_name: username,
      };
  
      const response = await fetch(`${apiBaseUrl}/save-user-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to save user details.");
      }
  
      const data = await response.json();
      const freshPreviewUrl = data.preview_url;
      const savedName = data.name;
      const savedUsername = data.user_name;
      const savedEmail = data.email;
  
      setSuccessMessage("Your details have been saved successfully!");

      if (freshPreviewUrl && savedEmail && savedUsername && savedName) {
        await fetch(`${apiBaseUrl}/preview-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: savedEmail,
            username: savedUsername,
            name: savedName,
            preview_url: freshPreviewUrl,
          }),
        });
      } else {
        console.warn("⚠️ Missing data for preview email. Skipping email send.");
      }
  
      router.push(
        `/purchase?job_id=${encodeURIComponent(jobId)}&name=${encodeURIComponent(name)}&gender=${encodeURIComponent(gender)}&book_id=${encodeURIComponent(bookId)}&selected=${selected}`
      );
  
    } catch (err: any) {
      console.error("Error saving user details or sending email:", err.message);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };  

  const handleBackToPreview = () => {
    router.push(
      `/preview?job_id=${encodeURIComponent(jobId)}&name=${encodeURIComponent(name)}&gender=${encodeURIComponent(gender)}&book_id=${encodeURIComponent(bookId)}&selected=${selected}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-[90vh] bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white border border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,0.9)] rounded-none p-8 space-y-8">
        <h2 className="text-gray-900 text-2xl font-bold text-center">
          Get Your Book Preview & Price
        </h2>

        {error && (
          <p className="text-red-600 text-sm font-medium text-center">{error}</p>
        )}

        <div className="w-full space-y-1 text-left">
          <label htmlFor="email" className="block text-black font-bold tracking-wide">
            Email
          </label>
          <p className="text-sm text-gray-600 font-poppins">
            Preview link will be sent to this email
          </p>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-900 rounded-none focus:border-indigo-500"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="block text-black font-bold tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-900 rounded-none focus:border-indigo-500"
            required
            placeholder="John Doe"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !username.trim()}
          className={`w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-3 rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.9)] transition-opacity ${!email.trim() || !username.trim() ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
        >
          {loading ? "Saving..." : "Save Preview & Show Price"}
        </button>
      </div>
      <button
        onClick={handleBackToPreview}
        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-colors duration-200 text-white font-semibold py-3 px-4 mt-12 rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.9)]"
      >
        Back to Preview
      </button>
    </div>
  );
};

export default UserDetails;