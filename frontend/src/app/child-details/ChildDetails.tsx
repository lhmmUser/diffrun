"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FcPrivacy } from "react-icons/fc";

interface ImageFile {
  file: File;
  preview: string;
}

const Form: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobType = searchParams.get("job_type") || "story";
  const bookId = searchParams.get("book_id") || "story1";
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === "development") {
        console.log("🧹 Cleaning up image previews");
      }
      images.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  const handleFileProcessing = async (file: File): Promise<ImageFile | null> => {
    if (process.env.NODE_ENV === "development") {
      console.info(`🔍 Processing file: ${file.name} (${file.type})`);
    }

    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        console.info(`📌 Converting HEIC to JPEG: ${file.name}`);

        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });

        if (!convertedBlob) throw new Error("HEIC conversion failed");

        const convertedFile = new File(
          [convertedBlob as Blob],
          file.name.replace(/\.heic$/i, ".jpg"),
          { type: "image/jpeg" }
        );

        console.log("✅ HEIC converted successfully:", convertedFile);

        return { file: convertedFile, preview: URL.createObjectURL(convertedFile) };
      } catch (err) {
        console.error("❌ HEIC conversion failed:", err);
        setError("HEIC conversion failed. Please try another image.");
        return null;
      }
    }

    console.log(`✅ Supported format detected: ${file.name}`);

    return { file, preview: URL.createObjectURL(file) };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (process.env.NODE_ENV === "development") {
        console.info("📦 Files dropped:", acceptedFiles);
      }

      if (images.length + acceptedFiles.length > 3) {
        console.warn("⚠️ Too many images uploaded");
        setError("You can upload a maximum of 3 images.");
        return;
      }

      setError(null);
      const processedImages = await Promise.all(acceptedFiles.map(handleFileProcessing));
      const validImages = processedImages.filter((img): img is ImageFile => img !== null);

      setImages((prev) => [...prev, ...validImages].slice(0, 3));
    },
    [images]
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    maxFiles: 3,
    onDrop,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !gender) {
      console.warn("⚠️ Missing form fields");
      setError("Please fill all fields.");
      return;
    }

    if (images.length === 0) {
      console.warn("⚠️ No images uploaded");
      setError("Please upload at least 1 image.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim().charAt(0).toUpperCase() + name.trim().slice(1));
      formData.append("gender", gender.toLowerCase());
      formData.append("job_type", jobType);
      images.forEach(({ file }) => formData.append("images", file));

      console.log("📤 Sending form data to /store-user-details");

      const storeResponse = await fetch("http://127.0.0.1:8000/store-user-details", {
        method: "POST",
        body: formData,
      });

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.detail || "Failed to upload images");
      }

      const data = await storeResponse.json();

      console.log("✅ User details stored:", data);
      console.log("📤 Triggering workflow execution");

      const workflowResponse = await fetch("http://127.0.0.1:8000/execute-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          job_id: data.job_id,
          name: name.trim(),
          gender: gender.toLowerCase(),
          job_type: jobType,
          book_id: bookId
        }).toString(),
      });

      if (!workflowResponse.ok) {
        const errorText = await workflowResponse.text();
        throw new Error(`Failed to start workflow: ${errorText}`);
      }

      console.log("🔁 Redirecting to preview in 1.5s");

      setTimeout(() => {
        router.push(
          `/preview?job_id=${data.job_id}&job_type=${jobType}&name=${encodeURIComponent(name)}&gender=${gender}&book_id=${bookId}&approve=false&paid=false`
        );
      }, 1500);

    } catch (error: any) {
      console.error("❌ Submission error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-white py-12 px-4 sm:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-black leading-tight mb-4">
          Fill out the form to get started
        </h2>
        <p className="text-xl text-gray-700">
          Let's create something magical together ✨
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.8)] max-w-lg w-full space-y-8 border-2 border-black"
      >
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-lg font-semibold text-black"
          >
            First Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="block w-full px-4 py-3 text-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black bg-gray-100 rounded-sm placeholder-gray-500"
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-semibold text-black">
            Select Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            disabled={loading}
            className="block w-full px-4 py-3 text-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black bg-gray-100 rounded-sm appearance-none"
          >
            <option value="">Select</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-black">
            Upload Images
          </label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-black p-6 rounded-lg text-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
          >
            <input {...getInputProps()} />
            <p className="text-black font-medium">
              Drag & drop up to 3 images or <span className="underline">browse files</span>
            </p>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative border-2 border-black rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.8)]"
                >
                  <img
                    src={img.preview}
                    alt="preview"
                    className="w-full h-24 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute top-1 right-1 bg-black text-white text-sm rounded-full px-2 py-1 shadow-lg"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-2 border-black p-4 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
          <ul className="list-none pl-5 text-black space-y-2">
            <li>👤 Only one person in the photo</li>
            <li>😊 Images where the face is clearly visible</li>
            <li>🚫 Avoid wearing sunglasses or hats</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={!name || !gender || images.length < 1 || images.length > 3 || loading}
          className={`w-full py-3 text-lg font-bold bg-indigo-500 text-white border-2 border-black rounded-sm shadow-[4px_4px_0px_rgba(0,0,0,0.8)] transition-all duration-200 ${loading ? "cursor-not-allowed" : "hover:bg-indigo-600"
            }`}
        >
          {loading ? "Processing..." : "Preview your book"}
        </button>

        <p className="text-gray-800 text-center font-bold flex items-center justify-center gap-2">
          <span>We follow strict data privacy standards</span>
          <FcPrivacy className="text-xl" />
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 border-2 border-black p-4 rounded-lg mt-4 shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
            {error}
          </div>
        )}
      </form>
    </main>
  );
};

export default Form;