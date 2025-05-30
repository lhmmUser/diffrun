"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FcPrivacy } from "react-icons/fc";
import Link from "next/link";
import { motion } from "framer-motion";
import { containerVariants, headingVariants, subHeadingVariants, loadingContainerVariants } from "@/types";
import { TypingAnimation } from "@/components/animated/typing-animation";
import { FaExpandAlt } from "react-icons/fa";

interface ImageFile {
  file: File;
  preview: string;
}

interface LoadingBarProps {
  progress: number;
}

const TypingCycle: React.FC = () => {
  const texts = [
    "Good things take a few seconds... Great images take a little longer!",
    "Hold tight — we’re crafting your one-of-a-kind storybook!",
    "Almost there... the magic is unfolding just for you.",
    "Personalizing every page with love and a sprinkle of wonder",
    "Your hero's journey is coming to life — one pixel at a time.",
    "Illustrating your imagination... this won't take long.",
    "Summoning storybook magic — your adventure is about to begin!",
    "Turning your memories into magical moments...",
    "Fairy-tale engines are running — we’re nearly done!",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
      setCycleKey((k) => k + 1);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [cycleKey]);

  return (
    <TypingAnimation
      key={cycleKey}
      className="text-left text-base sm:text-lg text-[#454545] italic w-full"
      duration={100}
      delay={0}
    >
      {texts[currentIndex]}
    </TypingAnimation>
  );
};

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => (
  <div className="w-full sm:w-2/3 h-3 bg-gray-300 rounded-full overflow-hidden">
    <div
      className="h-full bg-green-500 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

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
  const [showContent, setShowContent] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [redirectData, setRedirectData] = useState<{
    jobId: string;
    jobType: string;
    name: string;
    gender: string;
    bookId: string;
  } | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
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
      setError("Please fill all fields.");
      return;
    }
    if (images.length === 0) {
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
      formData.append("book_id", bookId);
      images.forEach(({ file }) => formData.append("images", file));
      console.log("📤 Sending form data to /store-user-details");

      const storeResponse = await fetch(`${apiBaseUrl}/store-user-details`, {
        method: "POST",
        body: formData,
      });
      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.detail || "Failed to upload images");
      }

      const data = await storeResponse.json();
      const redirectPayload = {
        jobId: data.job_id,
        jobType,
        name,
        gender,
        bookId,
      };
      setRedirectData(redirectPayload);

      console.log("✅ User details stored:", data);
      console.log("📤 Triggering workflow execution");

      const workflowResponse = await fetch(`${apiBaseUrl}/execute-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          job_id: data.job_id,
          name: name.trim(),
          gender: gender.toLowerCase(),
          job_type: jobType,
          book_id: bookId,
        }).toString(),
      });
      if (!workflowResponse.ok) {
        const errorText = await workflowResponse.text();
        throw new Error(`Failed to start workflow: ${errorText}`);
      }
      console.log("✅ Workflow started successfully");

      setShowContent(false);
      setLoadingProgress(0);

      let progress = 0;
      const duration = 65000;
      const startTime = Date.now();

      const step = () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = duration - elapsed;
        const remainingProgress = 100 - progress;

        if (remainingProgress <= 0 || remainingTime <= 0) {
          setLoadingProgress(100);
          router.push(
            `/preview?job_id=${redirectPayload.jobId}&job_type=${redirectPayload.jobType}&name=${encodeURIComponent(redirectPayload.name)}&gender=${redirectPayload.gender}&book_id=${redirectPayload.bookId}&approve=false&paid=false`
          );
          return;
        }

        const increment = Math.min(remainingProgress, Math.floor(Math.random() * 4) + 1);
        progress += increment;
        setLoadingProgress(progress);

        const stepsLeft = Math.ceil(remainingProgress / 2);
        const avgDelay = remainingTime / stepsLeft;
        const jitteredDelay = avgDelay * (0.5 + Math.random());

        setTimeout(step, jitteredDelay);
      };

      step();
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingProgress === 100 && redirectData) {
      router.push(
        `/preview?job_id=${redirectData.jobId}&job_type=${redirectData.jobType}&name=${encodeURIComponent(redirectData.name)}&gender=${redirectData.gender}&book_id=${redirectData.bookId}&approve=false&paid=false`
      );
    }
  }, [loadingProgress, redirectData, router]);

  return (
    <main className="w-full min-h-screen flex flex-col items-center bg-white py-12 px-4 sm:px-8">
      {showContent ? (
        <>
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-black leading-tight">
              Let's start personalizing
            </h2>
          </div>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.8)] max-w-lg w-full space-y-8 border-2 border-black"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="block text-lg font-semibold text-black">
                Child's First Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="block w-full px-4 py-3 text-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black bg-gray-100 rounded-sm placeholder-gray-500"
                placeholder="Enter child's first name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-black">Select Gender</label>
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
              <label className="block text-lg font-semibold text-black">Upload Images</label>
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

            {/* <ul className="list-none pl-5 text-black space-y-2">
                <li>👤 Only one person in the photo</li>
                <li>😊 Images where the face is clearly visible</li>
                <li>🚫 Avoid wearing sunglasses or hats</li>
              </ul> */}
            <div className="relative w-full">
              <img
                src="/instructions.jpg"
                alt="Instructions"
                className="border-2 p-4 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.8)] w-full"
              />
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="absolute top-2 right-2 text-white bg-black p-2 rounded-full hover:bg-gray-800"
                aria-label="Expand instructions"
              >
                <FaExpandAlt />
              </button>
            </div>

            <div className="flex items-start gap-2 text-gray-800 font-bold">
              <input
                type="checkbox"
                id="confirmation"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                disabled={loading}
                className="mt-1 h-5 w-5 text-indigo-600 border-2 border-black rounded"
              />
              <label htmlFor="confirmation" className="text-sm leading-5">
                I confirm that I am at least 18 years old and have obtained consent from the child's parent or guardian to share this information for the purpose of creating a personalized storybook, in accordance with the <Link className="underline" href="/privacy-policy">Privacy Policy</Link>.
              </label>
            </div>
            <button
              type="submit"
              disabled={
                !name || !gender || images.length < 1 || images.length > 3 || loading || !isConfirmed
              }
              title={
                !name || !gender || images.length < 1 || images.length > 3 || !isConfirmed
                  ? "Fill all details and confirm consent to continue"
                  : ""
              }
              className={`w-full py-3 text-lg font-bold border-2 border-black rounded-sm shadow-[4px_4px_0px_rgba(0,0,0,0.8)] transition-all duration-200 ${!name || !gender || images.length < 1 || images.length > 3 || !isConfirmed
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
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
        </>
      ) : (
        <motion.div
          className="w-full min-h-screen flex flex-col items-center gap-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-2xl sm:text-4xl font-bold mb-2 text-blue-900"
            variants={headingVariants}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}'s Book Preview
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl font-medium text-[#454545] inline-block mt-2"
            variants={subHeadingVariants}
          >
            Creating storybook magic...
          </motion.p>

          <motion.div
            className="w-full flex flex-col items-center justify-center space-y-3 mt-10"
            variants={loadingContainerVariants}
          >
            <LoadingBar progress={loadingProgress} />
            <p className="text-sm text-black font-bold tracking-wide">
              Progress: {loadingProgress}%
            </p>
          </motion.div>

          <motion.div
            className="mt-10 italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <TypingCycle />
          </motion.div>
          <div className="my-20">
            <div className="elfsight-app-29870a34-63ec-4b12-8726-598d2c8c614c" data-elfsight-app-lazy></div>
          </div>
        </motion.div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
          <div className="bg-white p-4 rounded-lg max-w-3xl w-full relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white bg-gray-700 hover:bg-gray-800 p-2 rounded-xl"
              aria-label="Close expanded image"
            >
              ✕
            </button>
            <img
              src="/instructions.jpg"
              alt="Expanded Instructions"
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default Form;