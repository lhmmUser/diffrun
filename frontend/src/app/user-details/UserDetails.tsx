"use client";

import React, { useState } from "react";
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
  const previewUrl = searchParams.get("preview_url") || "";
  const bookId = searchParams.get("book_id") || "";

  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      if (!email.trim() || !username.trim()) {
        setError("Please fill in all fields.");
        return;
      }

      setLoading(true);

      const payload = {
        job_id: jobId,
        name,
        gender,
        preview_url: previewUrl,
        email,
        user_name: username,
      };

      const response = await fetch("http://127.0.0.1:8000/save-user-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save user details.");
      }

      setSuccessMessage("Your details have been saved successfully!");

      router.push(
        `/purchase?job_id=${encodeURIComponent(jobId)}&name=${encodeURIComponent(name)}&gender=${encodeURIComponent(gender)}&book_id=${encodeURIComponent(bookId)}&preview_url=${encodeURIComponent(previewUrl)}`
      );
    } catch (err: any) {
      console.error("Error saving user details:", err.message);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPreview = () => {
    router.push(
      `/preview?job_id=${encodeURIComponent(jobId)}&name=${encodeURIComponent(name)}&gender=${encodeURIComponent(gender)}&book_id=${encodeURIComponent(bookId)}&preview_url=${encodeURIComponent(previewUrl)}`
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
          <p className="text-sm text-gray-600 font-mono">
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
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold py-3 rounded-none shadow-[8px_8px_0px_rgba(0,0,0,0.9)]"
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