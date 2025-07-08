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

  const [phoneNumber, setPhoneNumber] = useState<string>("");
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
        setEmail(data.email || "");
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
  
      if (!phoneNumber.trim() || !username.trim()) {
        setError("Please fill in all fields.");
        return;
      }

      if (!/^[\d\s+-]{10,15}$/.test(phoneNumber)) {
        setError("Please enter a valid phone number (10-15 digits)");
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
        phone_number: phoneNumber.trim(),
        user_name: username,
        email: email
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
    <div className="flex flex-col items-center justify-center h-[80vh] p-6">
  <div className="w-full max-w-md rounded-lg shadow-lg border border-gray-200 p-8 space-y-6">
    <div className="text-center space-y-2">
      <p className="text-gray-500 text-sm font-medium font-poppins">
        You'll recieve the preview link on your email
      </p>
      <h2 className="text-2xl font-light text-gray-800">
        Continue to Purchase
      </h2>
    </div>

    {error && (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )}

    <div className="space-y-4">
      <div>
        
        <input
          type="text"
          id="name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition"
          placeholder="Your Name"
          required
        />
      </div>

      <div>
      
        <input
          type="tel"
          id="phone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-300 focus:border-blue-300 transition"
          placeholder="Phone Number"
          pattern="[\d\s+-]{10,15}"
          required
        />
      </div>
    </div>

    <button
      onClick={handleSubmit}
      disabled={loading || !phoneNumber.trim() || !username.trim()}
      className={`w-full py-3 rounded-md text-white font-medium transition-colors ${
        !phoneNumber.trim() || !username.trim() 
          ? "bg-gray-300 cursor-not-allowed" 
          : "bg-[#5784ba] hover:bg-[#547096]"
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        "Show Purchase Options"
      )}
    </button>

    <button
      onClick={handleBackToPreview}
      className="w-full py-2.5 text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
    >
      Back to book preview
    </button>
  </div>
</div>
  );
};

export default UserDetails;